package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"technical-test/case-study-1/backend/internal/model"
)

type OrderRepository struct {
	DB *sql.DB
}

func NewOrderRepository(db *sql.DB) *OrderRepository {
	return &OrderRepository{
		DB: db,
	}
}

func (r *OrderRepository) GetAll() ([]model.Order, error) {
	query := `
		SELECT
			id,
			order_number,
			client_id,
			technician_id,
			description,
			status,
			version,
			created_at,
			updated_at
		FROM orders
		ORDER BY created_at DESC
	`

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []model.Order

	for rows.Next() {
		var order model.Order

		err := rows.Scan(
			&order.ID,
			&order.OrderNumber,
			&order.ClientID,
			&order.TechnicianID,
			&order.Description,
			&order.Status,
			&order.Version,
			&order.CreatedAt,
			&order.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		orders = append(orders, order)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return orders, nil
}
func (r *OrderRepository) BeginTx(ctx context.Context) (*sql.Tx, error) {
	return r.DB.BeginTx(ctx, nil)
}

func (r *OrderRepository) Create(ctx context.Context, tx *sql.Tx, order *model.Order) (uint64, error) {
	query := `
		INSERT INTO orders (order_number, client_id, technician_id, description, status, version, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	res, err := tx.ExecContext(ctx, query,
		order.OrderNumber,
		order.ClientID,
		order.TechnicianID,
		order.Description,
		order.Status,
		order.Version,
		order.CreatedAt,
		order.UpdatedAt,
	)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	return uint64(id), nil
}

func (r *OrderRepository) CreateHistory(ctx context.Context, tx *sql.Tx, history *model.OrderStatusHistory) error {
	query := `
		INSERT INTO order_status_histories (order_id, status, created_at)
		VALUES (?, ?, ?)
	`
	res, err := tx.ExecContext(ctx, query, history.OrderID, history.Status, history.CreatedAt)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err == nil {
		history.ID = uint64(id)
	}

	return nil
}

func (r *OrderRepository) GetByID(ctx context.Context, id uint64) (*model.Order, error) {
	query := `
		SELECT
			id,
			order_number,
			client_id,
			technician_id,
			description,
			status,
			version,
			created_at,
			updated_at
		FROM orders
		WHERE id = ?
	`

	var order model.Order
	err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&order.ID,
		&order.OrderNumber,
		&order.ClientID,
		&order.TechnicianID,
		&order.Description,
		&order.Status,
		&order.Version,
		&order.CreatedAt,
		&order.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &order, nil
}

func (r *OrderRepository) GetHistoryByOrderID(ctx context.Context, orderID uint64) ([]model.OrderStatusHistory, error) {
	query := `
		SELECT
			id,
			order_id,
			status,
			created_at
		FROM order_status_histories
		WHERE order_id = ?
		ORDER BY created_at ASC, id ASC
	`

	rows, err := r.DB.QueryContext(ctx, query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	histories := make([]model.OrderStatusHistory, 0)

	for rows.Next() {
		var h model.OrderStatusHistory
		if err := rows.Scan(&h.ID, &h.OrderID, &h.Status, &h.CreatedAt); err != nil {
			return nil, err
		}
		histories = append(histories, h)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return histories, nil
}

func (r *OrderRepository) GetByIDWithTx(ctx context.Context, tx *sql.Tx, id uint64) (*model.Order, error) {
	query := `
		SELECT
			id,
			order_number,
			client_id,
			technician_id,
			description,
			status,
			version,
			created_at,
			updated_at
		FROM orders
		WHERE id = ?
		FOR UPDATE
	`

	var order model.Order
	err := tx.QueryRowContext(ctx, query, id).Scan(
		&order.ID,
		&order.OrderNumber,
		&order.ClientID,
		&order.TechnicianID,
		&order.Description,
		&order.Status,
		&order.Version,
		&order.CreatedAt,
		&order.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &order, nil
}

func (r *OrderRepository) UpdateStatusWithTx(ctx context.Context, tx *sql.Tx, id uint64, newStatus string, currentVersion uint, updatedAt time.Time) (bool, error) {
	query := `
		UPDATE orders
		SET status = ?, version = version + 1, updated_at = ?
		WHERE id = ? AND version = ?
	`

	res, err := tx.ExecContext(ctx, query, newStatus, updatedAt, id, currentVersion)
	if err != nil {
		return false, err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return false, err
	}

	return rowsAffected > 0, nil
}
