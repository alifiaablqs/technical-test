package handler

import (
	"errors"
	"net/http"
	"strconv"

	"technical-test/case-study-1/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	OrderService *service.OrderService
}

func NewOrderHandler(orderService *service.OrderService) *OrderHandler {
	return &OrderHandler{
		OrderService: orderService,
	}
}

func (h *OrderHandler) GetOrders(c *gin.Context) {
	orders, err := h.OrderService.GetAllOrders()
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

	orderDetail, err := h.OrderService.GetOrderByID(c.Request.Context(), id)
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
