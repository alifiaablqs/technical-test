package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"technical-test/case-study-1/backend/internal/model"
	"technical-test/case-study-1/backend/internal/repository"

	"github.com/go-sql-driver/mysql"
)

var (
	ErrInvalidStatusTransition = errors.New("invalid status transition")
	ErrDuplicateOrderNumber    = errors.New("order number already exists")
	ErrValidation              = errors.New("order_number and description are required")
)

type CreateOrderInput struct {
	OrderNumber string  `json:"order_number"`
	ClientID    *uint64 `json:"client_id"`
	Description string  `json:"description"`
}

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

func (s *OrderService) CreateOrder(ctx context.Context, input CreateOrderInput) (*model.Order, error) {
	orderNumber := strings.TrimSpace(input.OrderNumber)
	description := strings.TrimSpace(input.Description)

	if orderNumber == "" || description == "" {
		return nil, ErrValidation
	}

	tx, err := s.OrderRepository.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	now := time.Now()
	order := &model.Order{
		OrderNumber:  orderNumber,
		ClientID:     input.ClientID,
		TechnicianID: nil,
		Description:  description,
		Status:       "TO DO",
		Version:      1,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	id, err := s.OrderRepository.Create(ctx, tx, order)
	if err != nil {
		var mysqlErr *mysql.MySQLError
		if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
			return nil, ErrDuplicateOrderNumber
		}
		if strings.Contains(err.Error(), "1062") || strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return nil, ErrDuplicateOrderNumber
		}
		return nil, err
	}
	order.ID = id

	history := &model.OrderStatusHistory{
		OrderID:   order.ID,
		Status:    "TO DO",
		CreatedAt: now,
	}

	if err := s.OrderRepository.CreateHistory(ctx, tx, history); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return order, nil
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
