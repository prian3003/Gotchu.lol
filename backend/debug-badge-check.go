package main

import (
	"encoding/json"
	"fmt"
	"log"

	"gotchu-backend/internal/config"
	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/badges"
	"gotchu-backend/pkg/database"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.NewConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Get user with username 'x'
	var user models.User
	if err := db.Where("username = ?", "x").First(&user).Error; err != nil {
		log.Fatalf("Failed to get user: %v", err)
	}

	fmt.Printf("=== USER DETAILS ===\n")
	fmt.Printf("ID: %d\n", user.ID)
	fmt.Printf("Username: %s\n", user.Username)
	fmt.Printf("Plan: %s\n", user.Plan)
	fmt.Printf("Is Premium: %t\n", user.Plan == "premium")

	// Get premium badge details
	var premiumBadge models.Badge
	if err := db.Where("id = ?", "premium").First(&premiumBadge).Error; err != nil {
		log.Fatalf("Premium badge not found: %v", err)
	}

	fmt.Printf("\n=== PREMIUM BADGE DETAILS ===\n")
	fmt.Printf("ID: %s\n", premiumBadge.ID)
	fmt.Printf("Name: %s\n", premiumBadge.Name)
	fmt.Printf("RequirementType: %s\n", premiumBadge.RequirementType)
	fmt.Printf("RequirementData: %s\n", premiumBadge.RequirementData)
	fmt.Printf("IsActive: %t\n", premiumBadge.IsActive)

	// Parse requirement data
	var reqData map[string]interface{}
	if err := json.Unmarshal([]byte(premiumBadge.RequirementData), &reqData); err != nil {
		log.Printf("Failed to parse requirement data: %v", err)
	} else {
		fmt.Printf("Parsed requirement: %+v\n", reqData)
	}

	// Check current user badges with proper joins
	var userBadges []models.UserBadge
	if err := db.Preload("Badge").Where("user_id = ?", user.ID).Find(&userBadges).Error; err != nil {
		fmt.Printf("Failed to get user badges: %v\n", err)
	} else {
		fmt.Printf("\n=== CURRENT USER BADGES ===\n")
		fmt.Printf("User has %d badges:\n", len(userBadges))
		for _, ub := range userBadges {
			fmt.Printf("- Badge: %s (ID: %s)\n", ub.Badge.Name, ub.Badge.ID)
			fmt.Printf("  Earned: %t\n", ub.IsEarned)
			fmt.Printf("  Progress: %.2f\n", ub.Progress)
			fmt.Printf("  Current Value: %.2f\n", ub.CurrentValue)
			fmt.Printf("  Target Value: %.2f\n", ub.TargetValue)
			fmt.Printf("  Visible: %t\n", ub.IsVisible)
			fmt.Printf("  Showcased: %t\n", ub.IsShowcased)
		}
	}

	// Test the badge service manually
	fmt.Printf("\n=== MANUAL BADGE SERVICE TEST ===\n")
	badgeService := badges.NewService(db)
	
	// Call the badge check function
	fmt.Printf("Calling CheckAndAwardBadges...\n")
	if err := badgeService.CheckAndAwardBadges(user.ID); err != nil {
		fmt.Printf("❌ Badge check failed: %v\n", err)
	} else {
		fmt.Printf("✅ Badge check completed\n")
	}

	// Check user badges again after the check
	userBadges = []models.UserBadge{}
	if err := db.Preload("Badge").Where("user_id = ?", user.ID).Find(&userBadges).Error; err != nil {
		fmt.Printf("Failed to get updated user badges: %v\n", err)
	} else {
		fmt.Printf("\n=== UPDATED USER BADGES ===\n")
		fmt.Printf("User now has %d badges:\n", len(userBadges))
		for _, ub := range userBadges {
			fmt.Printf("- Badge: %s (ID: %s)\n", ub.Badge.Name, ub.Badge.ID)
			fmt.Printf("  Earned: %t\n", ub.IsEarned)
			fmt.Printf("  Progress: %.2f\n", ub.Progress)
			fmt.Printf("  Current Value: %.2f\n", ub.CurrentValue)
			fmt.Printf("  Target Value: %.2f\n", ub.TargetValue)
		}
	}
}