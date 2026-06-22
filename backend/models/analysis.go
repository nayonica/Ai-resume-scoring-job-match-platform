package models

import (
	"time"
)

type Analysis struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	UserID          uint      `json:"userId" gorm:"not null"`
	ResumeID        uint      `json:"resumeId" gorm:"not null"`
	SelectedRole    string    `json:"selectedRole" gorm:"not null"`
	AtsScore        int       `json:"atsScore"`
	RoleMatchScore  int       `json:"roleMatchScore"`
	OverallScore    int       `json:"overallScore"`
	ExtractedSkills []string  `json:"extractedSkills" gorm:"type:text[]"` // Postgres Text Array representation
	MatchedSkills   []string  `json:"matchedSkills" gorm:"type:text[]"`
	MissingSkills   []string  `json:"missingSkills" gorm:"type:text[]"`
	CreatedAt       time.Time `json:"createdAt"`
}
