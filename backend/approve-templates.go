package main

import (
	"fmt"
	"log"
	"time"

	"gotchu-backend/internal/config"
	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/database"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.NewConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Get all pending templates
	var templates []models.Template
	if err := db.Where("status = ?", models.TemplateStatusPendingReview).Find(&templates).Error; err != nil {
		log.Fatalf("Failed to fetch pending templates: %v", err)
	}

	fmt.Printf("Found %d pending templates\n", len(templates))

	// Approve all pending templates for testing
	for _, template := range templates {
		now := time.Now()
		err := db.Model(&template).Updates(map[string]interface{}{
			"status":      models.TemplateStatusApproved,
			"reviewed_at": &now,
		}).Error

		if err != nil {
			log.Printf("Failed to approve template %s: %v", template.Name, err)
		} else {
			fmt.Printf("✅ Approved template: %s (ID: %d)\n", template.Name, template.ID)
		}
	}

	// Show approved templates
	var approvedTemplates []models.Template
	if err := db.Where("status = ?", models.TemplateStatusApproved).Find(&approvedTemplates).Error; err != nil {
		log.Printf("Failed to fetch approved templates: %v", err)
	} else {
		fmt.Printf("\n📋 Total approved templates: %d\n", len(approvedTemplates))
		for _, t := range approvedTemplates {
			fmt.Printf("  - %s (ID: %d) - %s\n", t.Name, t.ID, t.Status)
		}
	}
}