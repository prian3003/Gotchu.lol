package models

import (
	"time"
	"gorm.io/gorm"
)

// PaymentStatus represents the status of a payment
type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusCompleted PaymentStatus = "completed"
	PaymentStatusExpired   PaymentStatus = "expired"
	PaymentStatusCancelled PaymentStatus = "cancelled"
	PaymentStatusFailed    PaymentStatus = "failed"
	PaymentStatusRefunded  PaymentStatus = "refunded"
)

// PremiumPlan represents available premium plans
type PremiumPlan string

const (
	PlanFree     PremiumPlan = "free"
	PlanPremium  PremiumPlan = "premium"
)

// Payment represents a payment transaction with OxaPay
type Payment struct {
	ID              uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID          uint      `json:"user_id" gorm:"not null;index"`
	PlanID          string    `json:"plan_id" gorm:"not null;size:50"`
	OrderID         *string   `json:"order_id,omitempty" gorm:"size:255;unique"`
	Amount          float64   `json:"amount" gorm:"not null"`
	Currency        string    `json:"currency" gorm:"not null;size:10"`
	Status          string    `json:"status" gorm:"not null;size:50;default:'pending'"`
	PaymentMethod   string    `json:"payment_method" gorm:"not null;size:50;default:'oxapay'"`
	ExternalID      string    `json:"external_id" gorm:"not null;size:255;index"` // OxaPay TrackID
	TransactionHash *string   `json:"transaction_hash,omitempty" gorm:"size:255"`
	ExternalData    *string   `json:"external_data,omitempty" gorm:"type:json"` // Additional payment data
	CreatedAt       time.Time `json:"created_at" gorm:"autoCreateTime;index"`
	UpdatedAt       time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	CompletedAt     *time.Time `json:"completed_at,omitempty"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// TableName specifies the table name for Payment
func (Payment) TableName() string {
	return "payments"
}

// BeforeCreate hook
func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	return nil
}

// BeforeUpdate hook
func (p *Payment) BeforeUpdate(tx *gorm.DB) error {
	p.UpdatedAt = time.Now()
	return nil
}

// PricingPlan represents a pricing plan structure
type PricingPlan struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Price       float64  `json:"price"`
	Currency    string   `json:"currency"`
	Interval    string   `json:"interval"` // "lifetime", "month", "year"
	Features    []string `json:"features"`
}

// PaymentHistory represents payment history for users
type PaymentHistory struct {
	ID            uint       `json:"id"`
	PaymentID     uint       `json:"payment_id"`
	Status        string     `json:"status"`
	StatusMessage string     `json:"status_message,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`

	// Relationships
	Payment Payment `json:"payment,omitempty" gorm:"foreignKey:PaymentID"`
}

// TableName specifies the table name for PaymentHistory
func (PaymentHistory) TableName() string {
	return "payment_history"
}

// PaymentWebhook represents webhook logs from OxaPay
type PaymentWebhook struct {
	ID         uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	PaymentID  *uint     `json:"payment_id,omitempty" gorm:"index"`
	TrackID    int64     `json:"track_id" gorm:"not null;index"`
	Status     string    `json:"status" gorm:"not null;size:50"`
	Amount     string    `json:"amount" gorm:"not null;size:50"`
	Currency   string    `json:"currency" gorm:"not null;size:10"`
	RawData    string    `json:"raw_data" gorm:"type:text"`
	Processed  bool      `json:"processed" gorm:"default:false"`
	ProcessedAt *time.Time `json:"processed_at,omitempty"`
	CreatedAt  time.Time `json:"created_at" gorm:"autoCreateTime;index"`

	// Relationships  
	Payment *Payment `json:"payment,omitempty" gorm:"foreignKey:PaymentID"`
}

// TableName specifies the table name for PaymentWebhook
func (PaymentWebhook) TableName() string {
	return "payment_webhooks"
}

// IsCompleted checks if payment is completed
func (p *Payment) IsCompleted() bool {
	return p.Status == string(PaymentStatusCompleted)
}

// IsPending checks if payment is pending
func (p *Payment) IsPending() bool {
	return p.Status == string(PaymentStatusPending)
}

// IsExpired checks if payment is expired
func (p *Payment) IsExpired() bool {
	return p.Status == string(PaymentStatusExpired)
}

// GetStatusDisplayName returns user-friendly status name
func (p *Payment) GetStatusDisplayName() string {
	switch p.Status {
	case string(PaymentStatusPending):
		return "Waiting for Payment"
	case string(PaymentStatusCompleted):
		return "Payment Completed"
	case string(PaymentStatusExpired):
		return "Payment Expired"
	case string(PaymentStatusCancelled):
		return "Payment Cancelled"
	case string(PaymentStatusFailed):
		return "Payment Failed"
	case string(PaymentStatusRefunded):
		return "Payment Refunded"
	default:
		return "Unknown Status"
	}
}