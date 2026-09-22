package handler_test

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"technical-test/case-study-1/backend/internal/handler"
	"technical-test/case-study-1/backend/internal/service"

	"github.com/gin-gonic/gin"
)

func TestUpdateStatusValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	svc := &service.OrderService{}
	h := handler.NewOrderHandler(svc)

	r := gin.New()
	r.PATCH("/api/orders/:id/status", h.UpdateStatus)

	t.Run("Invalid Order ID returns 400", func(t *testing.T) {
		req, _ := http.NewRequest("PATCH", "/api/orders/invalid-id/status", bytes.NewBufferString(`{"status":"IN PROGRESS"}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", w.Code)
		}
	})

	t.Run("Invalid Status string returns 400", func(t *testing.T) {
		req, _ := http.NewRequest("PATCH", "/api/orders/1/status", bytes.NewBufferString(`{"status":"INVALID_STATUS"}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", w.Code)
		}
	})
}

