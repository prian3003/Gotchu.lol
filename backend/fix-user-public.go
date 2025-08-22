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

	// Get all users and check their is_public status
	var users []models.User
	err = db.Find(&users).Error
	if err != nil {
		log.Fatal("Failed to get users:", err)
	}

	fmt.Printf("Found %d users:\n", len(users))
	for _, user := range users {
		fmt.Printf("  ID: %d, Username: %s, IsPublic: %v, IsActive: %v\n", 
			user.ID, user.Username, user.IsPublic, user.IsActive)
	}

	// Update all users to have is_public = true (since it should be default)
	result := db.Model(&models.User{}).Where("is_public = ?", false).Update("is_public", true)
	if result.Error != nil {
		log.Fatal("Failed to update users:", result.Error)
	}

	fmt.Printf("\nUpdated %d users to be public\n", result.RowsAffected)

	// Verify the changes
	var updatedUsers []models.User
	err = db.Find(&updatedUsers).Error
	if err != nil {
		log.Fatal("Failed to get updated users:", err)
	}

	fmt.Printf("\nAfter update:\n")
	for _, user := range updatedUsers {
		fmt.Printf("  ID: %d, Username: %s, IsPublic: %v, IsActive: %v\n", 
			user.ID, user.Username, user.IsPublic, user.IsActive)
	}
}