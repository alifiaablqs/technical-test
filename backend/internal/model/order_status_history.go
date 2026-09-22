package model

import "time"

type OrderStatusHistory struct {
	ID        uint64    `json:"id"`
	OrderID   uint64    `json:"order_id"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}
