package handler

import (
	"errors"
	"net/http"
	"strconv"

	"technical-test/case-study-1/backend/internal/realtime"
	"technical-test/case-study-1/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	OrderService *service.OrderService
	Hub          *realtime.Hub
}

func NewOrderHandler(orderService *service.OrderService, hub *realtime.Hub) *OrderHandler {
	return &OrderHandler{
		OrderService: orderService,
		Hub:          hub,
	}
}

func (h *OrderHandler) GetOrders(c *gin.Context) {
	var technicianID *uint64
	if techStr := c.Query("technician_id"); techStr != "" {
		if parsed, err := strconv.ParseUint(techStr, 10, 64); err == nil {
			technicianID = &parsed
		}
	}

	var clientID *uint64
	if clientStr := c.Query("client_id"); clientStr != "" {
		if parsed, err := strconv.ParseUint(clientStr, 10, 64); err == nil {
			clientID = &parsed
		}
	}

	orders, err := h.OrderService.GetAllOrders(technicianID, clientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal mengambil data orders",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": orders,
	})
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var input service.CreateOrderInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Validation error",
			"error":   "Format request payload tidak valid",
		})
		return
	}

	order, err := h.OrderService.CreateOrder(c.Request.Context(), input)
	if err != nil {
		if errors.Is(err, service.ErrValidation) {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Validation error",
				"error":   "order_number dan description wajib diisi",
			})
			return
		}
		if errors.Is(err, service.ErrDuplicateOrderNumber) {
			c.JSON(http.StatusConflict, gin.H{
				"message": "Order number sudah terdaftar",
				"error":   "order_number '" + input.OrderNumber + "' sudah ada",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal membuat order",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Order berhasil dibuat",
		"data":    order,
	})
}

func (h *OrderHandler) GetOrderByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "ID order tidak valid",
			"error":   "ID harus berupa angka integer positif",
		})
		return
	}

	var technicianID *uint64
	if techStr := c.Query("technician_id"); techStr != "" {
		if parsed, err := strconv.ParseUint(techStr, 10, 64); err == nil {
			technicianID = &parsed
		}
	}

	var clientID *uint64
	if clientStr := c.Query("client_id"); clientStr != "" {
		if parsed, err := strconv.ParseUint(clientStr, 10, 64); err == nil {
			clientID = &parsed
		}
	}

	orderDetail, err := h.OrderService.GetOrderByID(c.Request.Context(), id, technicianID, clientID)
	if err != nil {
		if errors.Is(err, service.ErrOrderNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"message": "Order tidak ditemukan",
				"error":   "Order dengan ID " + idParam + " tidak ditemukan",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal mengambil detail order",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": orderDetail,
	})
}

func (h *OrderHandler) UpdateStatus(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "ID order tidak valid",
			"error":   "ID harus berupa angka integer positif",
		})
		return
	}

	var input service.UpdateStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Validation error",
			"error":   "Format payload tidak valid",
		})
		return
	}

	updatedOrder, err := h.OrderService.UpdateOrderStatus(c.Request.Context(), id, input)
	if err != nil {
		if errors.Is(err, service.ErrValidation) {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Validation error",
				"error":   "Status wajib diisi dan harus valid ('TO DO', 'IN PROGRESS', 'DONE', 'CANCELLED')",
			})
			return
		}
		if errors.Is(err, service.ErrOrderNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"message": "Order tidak ditemukan",
				"error":   "Order dengan ID " + idParam + " tidak ditemukan",
			})
			return
		}
		if errors.Is(err, service.ErrInvalidStatusTransition) {
			c.JSON(http.StatusConflict, gin.H{
				"message": "Transisi status tidak diperbolehkan",
				"error":   "Transisi ke status '" + input.Status + "' tidak diizinkan",
			})
			return
		}
		if errors.Is(err, service.ErrOptimisticLockConflict) {
			c.JSON(http.StatusConflict, gin.H{
				"message": "Optimistic locking conflict",
				"error":   "Data order telah diperbarui oleh proses lain",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal memperbarui status order",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Status order berhasil diperbarui",
		"data":    updatedOrder,
	})
}

func (h *OrderHandler) CancelOrder(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "ID order tidak valid",
			"error":   "ID harus berupa angka integer positif",
		})
		return
	}

	cancelledOrder, err := h.OrderService.CancelOrder(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrOrderNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"message": "Order tidak ditemukan",
				"error":   "Order dengan ID " + idParam + " tidak ditemukan",
			})
			return
		}
		if errors.Is(err, service.ErrInvalidStatusTransition) {
			c.JSON(http.StatusConflict, gin.H{
				"message": "Order tidak dapat dibatalkan",
				"error":   "Order yang sudah DONE atau CANCELLED tidak dapat dibatalkan",
			})
			return
		}
		if errors.Is(err, service.ErrOptimisticLockConflict) {
			c.JSON(http.StatusConflict, gin.H{
				"message": "Optimistic locking conflict",
				"error":   "Data order telah diperbarui oleh proses lain",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal membatalkan order",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Order berhasil dibatalkan",
		"data":    cancelledOrder,
	})
}

func (h *OrderHandler) StreamEvents(c *gin.Context) {
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")

	if h.Hub == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "SSE Hub belum diinisialisasi",
		})
		return
	}

	clientChan := make(realtime.Client, 10)
	h.Hub.RegisterClient(clientChan)
	defer h.Hub.UnregisterClient(clientChan)

	c.Writer.Flush()

	clientGone := c.Request.Context().Done()

	for {
		select {
		case <-clientGone:
			return
		case msg, ok := <-clientChan:
			if !ok {
				return
			}
			_, err := c.Writer.WriteString(msg)
			if err != nil {
				return
			}
			c.Writer.Flush()
		}
	}
}

func (h *OrderHandler) AssignTechnician(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "ID order tidak valid",
			"error":   "ID harus berupa angka integer positif",
		})
		return
	}

	var input service.AssignTechnicianInput
	if err := c.ShouldBindJSON(&input); err != nil || input.TechnicianID == nil || *input.TechnicianID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Validation error",
			"error":   "technician_id wajib diisi dan harus berupa angka valid",
		})
		return
	}

	updatedOrder, err := h.OrderService.AssignTechnician(c.Request.Context(), id, input)
	if err != nil {
		if errors.Is(err, service.ErrValidation) || errors.Is(err, service.ErrUserNotTechnician) {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Validation error",
				"error":   err.Error(),
			})
			return
		}
		if errors.Is(err, service.ErrOrderNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"message": "Order tidak ditemukan",
				"error":   "Order dengan ID " + idParam + " tidak ditemukan",
			})
			return
		}
		if errors.Is(err, service.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"message": "Teknisi tidak ditemukan",
				"error":   "User teknisi dengan ID tersebut tidak ditemukan",
			})
			return
		}
		if errors.Is(err, service.ErrCannotAssignStatus) {
			c.JSON(http.StatusConflict, gin.H{
				"message": "Assignment tidak dapat dilakukan",
				"error":   "Penugasan teknisi hanya dapat dilakukan pada order berstatus TO DO",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal menugaskan teknisi",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Teknisi berhasil ditugaskan",
		"data":    updatedOrder,
	})
}
