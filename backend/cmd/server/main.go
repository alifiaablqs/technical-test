package main

import (
	"fmt"
	"net/http"

	"technical-test/case-study-1/backend/config"
	"technical-test/case-study-1/backend/internal/handler"
	"technical-test/case-study-1/backend/internal/repository"
	"technical-test/case-study-1/backend/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	// Connect database
	db := config.ConnectDB()
	defer db.Close()

	// Initialize layers
	orderRepository := repository.NewOrderRepository(db)
	orderService := service.NewOrderService(orderRepository)
	orderHandler := handler.NewOrderHandler(orderService)

	// Initialize Gin
	r := gin.Default()

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Backend is running",
		})
	})

	// Order routes
	r.GET("/api/orders", orderHandler.GetOrders)
	r.GET("/api/orders/:id", orderHandler.GetOrderByID)
	r.POST("/api/orders", orderHandler.CreateOrder)
	r.PATCH("/api/orders/:id/status", orderHandler.UpdateStatus)
	r.POST("/api/orders/:id/cancel", orderHandler.CancelOrder)

	fmt.Println("Server running on http://localhost:8080")

	if err := r.Run(":8080"); err != nil {
		panic(err)
	}
}
