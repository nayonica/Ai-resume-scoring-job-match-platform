package models

import (
	"time"
)

type User struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	FullName     string    `json:"fullName" gorm:"not null"`
	Email        string    `json:"email" gorm:"unique;not null;index"`
	PasswordHash string    `json:"-" gorm:"not null"`
	CreatedAt    time.Time `json:"createdAt"`
}
