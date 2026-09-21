package main

import "github.com/gin-gonic/gin"

func main() {
	router := gin.Default()

	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Backend is running",
		})
	})

	router.Run(":8080")
}