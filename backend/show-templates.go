package main

import (
	"encoding/json"
	"fmt"
	"log"

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

	fmt.Println("📋 Templates in your Supabase database:")
	fmt.Println("=====================================")

	// Get all templates with creator info
	var templates []models.Template
	if err := db.Preload("Creator").Find(&templates).Error; err != nil {
		log.Fatalf("Failed to fetch templates: %v", err)
	}

	for i, template := range templates {
		fmt.Printf("\n🎨 Template #%d:\n", i+1)
		fmt.Printf("   ID: %d\n", template.ID)
		fmt.Printf("   Name: %s\n", template.Name)
		fmt.Printf("   Description: %s\n", safeString(template.Description))
		fmt.Printf("   Category: %s\n", template.Category)
		fmt.Printf("   Status: %s\n", template.Status)
		fmt.Printf("   Public: %t\n", template.IsPublic)
		fmt.Printf("   Premium: %t\n", template.IsPremiumOnly)
		fmt.Printf("   Creator ID: %d\n", template.CreatorID)
		fmt.Printf("   Downloads: %d\n", template.Downloads)
		fmt.Printf("   Views: %d\n", template.Views)
		fmt.Printf("   Likes: %d\n", template.Likes)
		fmt.Printf("   Created: %s\n", template.CreatedAt.Format("2006-01-02 15:04:05"))
		
		// Show colors
		if template.AccentColor != nil {
			fmt.Printf("   Accent Color: %s\n", *template.AccentColor)
		}
		if template.PrimaryColor != nil {
			fmt.Printf("   Primary Color: %s\n", *template.PrimaryColor)
		}
		if template.SecondaryColor != nil {
			fmt.Printf("   Secondary Color: %s\n", *template.SecondaryColor)
		}
	}

	fmt.Println("\n🔍 Raw SQL query result:")
	fmt.Println("========================")
	
	// Raw SQL to show table structure
	var rawResults []map[string]interface{}
	db.Raw("SELECT id, name, description, category, status, is_public, creator_id, created_at FROM templates ORDER BY id").Scan(&rawResults)
	
	for _, result := range rawResults {
		jsonData, _ := json.MarshalIndent(result, "   ", "  ")
		fmt.Printf("   %s\n", jsonData)
	}

	fmt.Println("\n📊 Table schema info:")
	fmt.Println("====================")
	
	// Show column info
	var columns []struct {
		ColumnName string `gorm:"column:column_name"`
		DataType   string `gorm:"column:data_type"`
		IsNullable string `gorm:"column:is_nullable"`
	}
	
	db.Raw(`
		SELECT column_name, data_type, is_nullable 
		FROM information_schema.columns 
		WHERE table_name = 'templates' AND table_schema = 'public'
		ORDER BY ordinal_position
	`).Scan(&columns)
	
	for _, col := range columns {
		fmt.Printf("   %s (%s) - Nullable: %s\n", col.ColumnName, col.DataType, col.IsNullable)
	}
}

func safeString(s *string) string {
	if s == nil {
		return "(null)"
	}
	return *s
}