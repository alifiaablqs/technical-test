package service

import (
	"errors"
	"technical-test/case-study-1/backend/internal/model"
	"technical-test/case-study-1/backend/internal/repository"
)

var (
	ErrInvalidStatusTransition = errors.New("invalid status transition")
)

type OrderService struct {
	OrderRepository *repository.OrderRepository
}

func NewOrderService(orderRepository *repository.OrderRepository) *OrderService {
	return &OrderService{
		OrderRepository: orderRepository,
	}
}

func (s *OrderService) GetAllOrders() ([]model.Order, error) {
	return s.OrderRepository.GetAll()
}

func IsValidStatusTransition(currentStatus string, newStatus string) bool {
	switch currentStatus {
	case "TO DO":
		return newStatus == "IN PROGRESS" || newStatus == "CANCELLED"

	case "IN PROGRESS":
		return newStatus == "DONE" || newStatus == "CANCELLED"

	case "DONE":
		return false

	case "CANCELLED":
		return false

	default:
		return false
	}
}