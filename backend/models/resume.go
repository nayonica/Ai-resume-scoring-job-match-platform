package models

import (
	"time"
)

type Resume struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	UserID        uint      `json:"userId" gorm:"not null"`
	FileName      string    `json:"fileName" gorm:"not null"`
	FilePath      string    `json:"filePath" gorm:"not null"`
	ExtractedText string    `json:"extractedText" gorm:"type:text"`
	SelectedRole  string    `json:"selectedRole" gorm:"not null"`
	UploadedAt    time.Time `json:"uploadedAt"`
}
