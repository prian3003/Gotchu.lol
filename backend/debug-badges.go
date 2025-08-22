package main

import (
	"fmt"
	"log"

	"gotchu-backend/internal/config"
	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/badges"
	"gotchu-backend/pkg/database"
)

func debugBadges() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.NewConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Get first user (usually you)
	var user models.User
	if err := db.First(&user).Error; err != nil {
		log.Fatalf("Failed to get user: %v", err)
	}

	fmt.Printf("User ID: %d\n", user.ID)
	fmt.Printf("Username: %s\n", user.Username)
	fmt.Printf("Plan: %s\n", user.Plan)
	fmt.Printf("Is Premium: %t\n", user.Plan == "premium")

	// Check if premium badge exists
	var premiumBadge models.Badge
	if err := db.Where("id = ?", "premium").First(&premiumBadge).Error; err != nil {
		fmt.Printf("Premium badge not found: %v\n", err)
	} else {
		fmt.Printf("Premium badge exists: %s\n", premiumBadge.Name)
		fmt.Printf("Requirement Data: %s\n", premiumBadge.RequirementData)
	}

	// Check current user badges
	var userBadges []models.UserBadge
	if err := db.Where("user_id = ?", user.ID).Find(&userBadges).Error; err != nil {
		fmt.Printf("Failed to get user badges: %v\n", err)
	} else {
		fmt.Printf("User has %d badges:\n", len(userBadges))
		for _, ub := range userBadges {
			var badge models.Badge
			db.First(&badge, ub.BadgeID)
			fmt.Printf("- %s (earned: %t)\n", badge.Name, ub.IsEarned)
		}
	}

	// Manually trigger badge check
	badgeService := badges.NewService(db)
	fmt.Printf("\nTriggering badge check...\n")
	if err := badgeService.CheckAndAwardBadges(user.ID); err != nil {
		log.Printf("Failed to check badges: %v", err)
	} else {
		fmt.Printf("Badge check completed successfully\n")
	}

	// Check user badges again
	userBadges = []models.UserBadge{}
	if err := db.Where("user_id = ?", user.ID).Find(&userBadges).Error; err != nil {
		fmt.Printf("Failed to get updated user badges: %v\n", err)
	} else {
		fmt.Printf("After badge check, user has %d badges:\n", len(userBadges))
		for _, ub := range userBadges {
			var badge models.Badge
			db.First(&badge, ub.BadgeID)
			fmt.Printf("- %s (earned: %t, progress: %.2f)\n", badge.Name, ub.IsEarned, ub.Progress)
		}
	}
}

func main() {
	debugBadges()
}