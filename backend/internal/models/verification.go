package models

import (
	"time"
)

// EmailVerification represents email verification tokens
type EmailVerification struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint      `json:"user_id" gorm:"not null;index"`
	Token     string    `json:"token" gorm:"not null;unique;size:64;index"`
	Email     string    `json:"email" gorm:"not null;size:255"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null;index"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// IsExpired checks if the verification token has expired
func (ev *EmailVerification) IsExpired() bool {
	return time.Now().UTC().After(ev.ExpiresAt)
}

// IsUsed checks if the verification token has been used
func (ev *EmailVerification) IsUsed() bool {
	return ev.UsedAt != nil
}

// IsValid checks if the token is valid (not expired and not used)
func (ev *EmailVerification) IsValid() bool {
	return !ev.IsExpired() && !ev.IsUsed()
}

// TableName specifies the table name for EmailVerification
func (EmailVerification) TableName() string {
	return "email_verifications"
}