package main

import (
	"fmt"
	"log"
	"os"

	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/database"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
	}

	// Get database URL
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	// Connect to database
	db, err := database.NewConnection(databaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Check if users table exists and get column info
	var exists bool
	err = db.Raw("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')").Scan(&exists).Error
	if err != nil {
		log.Fatal("Failed to check table existence:", err)
	}

	fmt.Printf("Users table exists: %v\n", exists)

	if exists {
		// Get column information for users table
		type ColumnInfo struct {
			ColumnName string `json:"column_name"`
			DataType   string `json:"data_type"`
			IsNullable string `json:"is_nullable"`
			ColumnDefault *string `json:"column_default"`
		}

		var columns []ColumnInfo
		err = db.Raw(`
			SELECT column_name, data_type, is_nullable, column_default
			FROM information_schema.columns 
			WHERE table_name = 'users' 
			ORDER BY ordinal_position
		`).Scan(&columns).Error
		
		if err != nil {
			log.Fatal("Failed to get column info:", err)
		}

		fmt.Printf("\nUsers table columns:\n")
		for _, col := range columns {
			defaultVal := "NULL"
			if col.ColumnDefault != nil {
				defaultVal = *col.ColumnDefault
			}
			fmt.Printf("  %s (%s) - Nullable: %s, Default: %s\n", 
				col.ColumnName, col.DataType, col.IsNullable, defaultVal)
		}

		// Check specifically for is_public column
		var isPublicExists bool
		err = db.Raw(`
			SELECT EXISTS (
				SELECT FROM information_schema.columns 
				WHERE table_name = 'users' AND column_name = 'is_public'
			)
		`).Scan(&isPublicExists).Error
		
		if err != nil {
			log.Fatal("Failed to check is_public column:", err)
		}

		fmt.Printf("\nis_public column exists: %v\n", isPublicExists)

		// Try to find a test user and check their is_public value
		var user models.User
		err = db.First(&user).Error
		if err != nil {
			fmt.Printf("No users found or error: %v\n", err)
		} else {
			fmt.Printf("\nSample user:\n")
			fmt.Printf("  ID: %d\n", user.ID)
			fmt.Printf("  Username: %s\n", user.Username)
			fmt.Printf("  IsPublic: %v\n", user.IsPublic)
			fmt.Printf("  IsActive: %v\n", user.IsActive)
		}

		// Test the exact query that's failing
		username := user.Username
		if username != "" {
			var testUser models.User
			err = db.Where("username = ? AND is_active = ? AND is_public = ?", username, true, true).First(&testUser).Error
			if err != nil {
				fmt.Printf("\nTest query failed: %v\n", err)
				
				// Try without is_public
				err = db.Where("username = ? AND is_active = ?", username, true).First(&testUser).Error
				if err != nil {
					fmt.Printf("Query without is_public also failed: %v\n", err)
				} else {
					fmt.Printf("Query without is_public succeeded!\n")
					fmt.Printf("  User IsPublic value: %v\n", testUser.IsPublic)
				}
			} else {
				fmt.Printf("\nTest query succeeded!\n")
				fmt.Printf("  User found with is_public = true\n")
			}
		}
	}
}