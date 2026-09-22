package handler

import (
	"errors"
	"net/http"

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
