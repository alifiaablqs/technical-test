package realtime

import (
	"encoding/json"
	"fmt"
	"sync"
)

type OrderUpdatedEvent struct {
	OrderID      uint64  `json:"order_id"`
	TechnicianID *uint64 `json:"technician_id"`
	ClientID     *uint64 `json:"client_id"`
	Status       string  `json:"status"`
	Version      uint    `json:"version"`
}

type Client chan string

type Hub struct {
	mu         sync.RWMutex
	clients    map[Client]bool
	register   chan Client
	unregister chan Client
	broadcast  chan OrderUpdatedEvent
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[Client]bool),
		register:   make(chan Client, 10),
		unregister: make(chan Client, 10),
		broadcast:  make(chan OrderUpdatedEvent, 256),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client)
			}
			h.mu.Unlock()

		case event := <-h.broadcast:
			payload, err := json.Marshal(event)
			if err != nil {
				continue
			}

			msg := fmt.Sprintf("event: order.updated\ndata: %s\n\n", string(payload))

			h.mu.RLock()
			for client := range h.clients {
				select {
				case client <- msg:
				default:
					// Drop if client buffer full to prevent blocking Hub
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) RegisterClient(client Client) {
	h.register <- client
}

func (h *Hub) UnregisterClient(client Client) {
	h.unregister <- client
}

func (h *Hub) BroadcastOrderUpdated(event OrderUpdatedEvent) {
	h.broadcast <- event
}

func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
