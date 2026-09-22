package service_test

import (
	"testing"

	"technical-test/case-study-1/backend/internal/service"
)

func TestIsValidStatusTransition(t *testing.T) {
	tests := []struct {
		current string
		next    string
		want    bool
	}{
		{"TO DO", "IN PROGRESS", true},
		{"TO DO", "CANCELLED", true},
		{"TO DO", "DONE", false},
		{"IN PROGRESS", "DONE", true},
		{"IN PROGRESS", "CANCELLED", true},
		{"IN PROGRESS", "TO DO", false},
		{"DONE", "TO DO", false},
		{"CANCELLED", "IN PROGRESS", false},
	}

	for _, tt := range tests {
		got := service.IsValidStatusTransition(tt.current, tt.next)
		if got != tt.want {
			t.Errorf("IsValidStatusTransition(%q, %q) = %v, want %v", tt.current, tt.next, got, tt.want)
		}
	}
}
