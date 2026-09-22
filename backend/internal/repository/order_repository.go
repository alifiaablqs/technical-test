package repository

import (
	"context"
	"database/sql"
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
