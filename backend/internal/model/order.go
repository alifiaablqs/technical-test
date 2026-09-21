package model

import "time"

type Order struct {
	ID           uint64    `json:"id"`
	OrderNumber  string    `json:"order_number"`
	ClientID     *uint64   `json:"client_id"`
	TechnicianID *uint64   `json:"technician_id"`
	Description  string    `json:"description"`
	Status       string    `json:"status"`
	Version      uint      `json:"version"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}