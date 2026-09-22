package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"technical-test/case-study-1/backend/internal/model"
	"technical-test/case-study-1/backend/internal/realtime"
	"technical-test/case-study-1/backend/internal/repository"

	"github.com/go-sql-driver/mysql"
)

var (
	ErrInvalidStatusTransition = errors.New("invalid status transition")
	ErrDuplicateOrderNumber    = errors.New("order number already exists")
	ErrValidation              = errors.New("validation error: required field missing or invalid")
	ErrOrderNotFound           = errors.New("order not found")
	ErrOptimisticLockConflict  = errors.New("optimistic locking conflict: order was updated by another process")
	ErrUserNotFound            = errors.New("user not found")
	ErrUserNotTechnician       = errors.New("selected user is not a technician")
	ErrCannotAssignStatus      = errors.New("cannot assign technician to an order that is not in TO DO status")
)

type CreateOrderInput struct {
	OrderNumber string  `json:"order_number"`
	ClientID    *uint64 `json:"client_id"`
	Description string  `json:"description"`
}

type UpdateStatusInput struct {
	Status string `json:"status"`
}

type AssignTechnicianInput struct {
	TechnicianID *uint64 `json:"technician_id"`
}

type OrderDetailResponse struct {
	model.Order
	History []model.OrderStatusHistory `json:"history"`
}

type OrderService struct {
	OrderRepository *repository.OrderRepository
	UserRepository  *repository.UserRepository
	Hub             *realtime.Hub
}

func NewOrderService(orderRepository *repository.OrderRepository, userRepository *repository.UserRepository, hub *realtime.Hub) *OrderService {
	return &OrderService{
		OrderRepository: orderRepository,
		UserRepository:  userRepository,
		Hub:             hub,
	}
}

func (s *OrderService) GetAllOrders(technicianID *uint64, clientID *uint64) ([]model.Order, error) {
	return s.OrderRepository.GetAll(technicianID, clientID)
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

	if s.Hub != nil {
		s.Hub.BroadcastOrderUpdated(realtime.OrderUpdatedEvent{
			OrderID:      order.ID,
			TechnicianID: order.TechnicianID,
			ClientID:     order.ClientID,
			Status:       order.Status,
			Version:      order.Version,
		})
	}

	return order, nil
}

func (s *OrderService) GetOrderByID(ctx context.Context, id uint64, technicianID *uint64, clientID *uint64) (*OrderDetailResponse, error) {
	order, err := s.OrderRepository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, ErrOrderNotFound
	}

	if technicianID != nil {
		if order.TechnicianID == nil || *order.TechnicianID != *technicianID {
			return nil, ErrOrderNotFound
		}
	}

	if clientID != nil {
		if order.ClientID == nil || *order.ClientID != *clientID {
			return nil, ErrOrderNotFound
		}
	}

	history, err := s.OrderRepository.GetHistoryByOrderID(ctx, id)
	if err != nil {
		return nil, err
	}
	if history == nil {
		history = make([]model.OrderStatusHistory, 0)
	}

	return &OrderDetailResponse{
		Order:   *order,
		History: history,
	}, nil
}

func (s *OrderService) UpdateOrderStatus(ctx context.Context, id uint64, input UpdateStatusInput) (*model.Order, error) {
	newStatus := strings.TrimSpace(input.Status)
	if newStatus == "" {
		return nil, ErrValidation
	}

	validStatuses := map[string]bool{
		"TO DO":       true,
		"IN PROGRESS": true,
		"DONE":        true,
		"CANCELLED":   true,
	}

	if !validStatuses[newStatus] {
		return nil, ErrValidation
	}

	tx, err := s.OrderRepository.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 1. Read current order with FOR UPDATE inside tx
	order, err := s.OrderRepository.GetByIDWithTx(ctx, tx, id)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, ErrOrderNotFound
	}

	// 2. Validate status transition
	if !IsValidStatusTransition(order.Status, newStatus) {
		return nil, ErrInvalidStatusTransition
	}

	now := time.Now()

	// 3. Update status + version using optimistic locking
	updated, err := s.OrderRepository.UpdateStatusWithTx(ctx, tx, id, newStatus, order.Version, now)
	if err != nil {
		return nil, err
	}
	if !updated {
		return nil, ErrOptimisticLockConflict
	}

	// 4. Create history record in order_status_histories
	history := &model.OrderStatusHistory{
		OrderID:   id,
		Status:    newStatus,
		CreatedAt: now,
	}
	if err := s.OrderRepository.CreateHistory(ctx, tx, history); err != nil {
		return nil, err
	}

	// 5. Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	order.Status = newStatus
	order.Version += 1
	order.UpdatedAt = now

	// Broadcast SSE event ONLY AFTER transaction COMMIT succeeds
	if s.Hub != nil {
		s.Hub.BroadcastOrderUpdated(realtime.OrderUpdatedEvent{
			OrderID:      id,
			TechnicianID: order.TechnicianID,
			ClientID:     order.ClientID,
			Status:       newStatus,
			Version:      order.Version,
		})
	}

	return order, nil
}

func (s *OrderService) CancelOrder(ctx context.Context, id uint64) (*model.Order, error) {
	return s.UpdateOrderStatus(ctx, id, UpdateStatusInput{Status: "CANCELLED"})
}

func (s *OrderService) AssignTechnician(ctx context.Context, orderID uint64, input AssignTechnicianInput) (*model.Order, error) {
	if input.TechnicianID == nil || *input.TechnicianID == 0 {
		return nil, ErrValidation
	}

	// 1. Verify user exists & role is TECHNICIAN
	user, err := s.UserRepository.GetByID(ctx, *input.TechnicianID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	if user.Role != "TECHNICIAN" {
		return nil, ErrUserNotTechnician
	}

	tx, err := s.OrderRepository.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 2. Read order inside transaction with FOR UPDATE
	order, err := s.OrderRepository.GetByIDWithTx(ctx, tx, orderID)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, ErrOrderNotFound
	}

	// 3. Business rule: Assignment only allowed on TO DO status
	if order.Status != "TO DO" {
		return nil, ErrCannotAssignStatus
	}

	now := time.Now()

	// 4. Update technician_id in database
	if err := s.OrderRepository.AssignTechnicianWithTx(ctx, tx, orderID, *input.TechnicianID, now); err != nil {
		return nil, err
	}

	// 5. Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	order.TechnicianID = input.TechnicianID
	order.UpdatedAt = now

	// Broadcast SSE event AFTER transaction COMMIT succeeds
	if s.Hub != nil {
		s.Hub.BroadcastOrderUpdated(realtime.OrderUpdatedEvent{
			OrderID:      orderID,
			TechnicianID: order.TechnicianID,
			ClientID:     order.ClientID,
			Status:       order.Status,
			Version:      order.Version,
		})
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
