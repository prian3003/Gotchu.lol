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

	// Check which tables exist
	var tables []string
	err = db.Raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%user%' ORDER BY table_name").Pluck("table_name", &tables).Error
	if err != nil {
		log.Fatal("Failed to get tables:", err)
	}

	fmt.Printf("User-related tables found:\n")
	for _, table := range tables {
		fmt.Printf("  - %s\n", table)
	}

	// Check what table GORM is actually using for User model
	fmt.Printf("\nGORM User model table name: %s\n", models.User{}.TableName())

	// Check records in both tables if they exist
	for _, table := range tables {
		if table == "users" || table == "User" {
			fmt.Printf("\nRecords in %s table:\n", table)
			
			if table == "users" {
				// Use GORM to query users table
				var users []models.User
				err = db.Find(&users).Error
				if err != nil {
					fmt.Printf("  Error querying %s: %v\n", table, err)
				} else {
					fmt.Printf("  Found %d records:\n", len(users))
					for _, user := range users {
						fmt.Printf("    ID: %d, Username: %s, IsPublic: %v, IsActive: %v\n", 
							user.ID, user.Username, user.IsPublic, user.IsActive)
					}
				}
			} else {
				// Raw query for other table
				type RawUser struct {
					ID       uint   `json:"id"`
					Username string `json:"username"`
					IsPublic *bool  `json:"is_public"`
					IsActive *bool  `json:"is_active"`
				}
				
				var rawUsers []RawUser
				err = db.Table(table).Select("id, username, is_public, is_active").Find(&rawUsers).Error
				if err != nil {
					fmt.Printf("  Error querying %s: %v\n", table, err)
				} else {
					fmt.Printf("  Found %d records:\n", len(rawUsers))
					for _, user := range rawUsers {
						isPublic := "NULL"
						isActive := "NULL"
						if user.IsPublic != nil {
							isPublic = fmt.Sprintf("%v", *user.IsPublic)
						}
						if user.IsActive != nil {
							isActive = fmt.Sprintf("%v", *user.IsActive)
						}
						fmt.Printf("    ID: %d, Username: %s, IsPublic: %s, IsActive: %s\n", 
							user.ID, user.Username, isPublic, isActive)
					}
				}
			}
		}
	}

	// Test the exact query that GetUserProfile uses
	fmt.Printf("\nTesting GetUserProfile query for user 'x':\n")
	var user models.User
	err = db.Where("username = ? AND is_active = ?", "x", true).First(&user).Error
	if err != nil {
		fmt.Printf("  Query failed: %v\n", err)
	} else {
		fmt.Printf("  Query succeeded:\n")
		fmt.Printf("    ID: %d, Username: %s, IsPublic: %v, IsActive: %v\n", 
			user.ID, user.Username, user.IsPublic, user.IsActive)
	}
}