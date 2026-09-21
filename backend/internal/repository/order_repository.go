package repository

import (
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