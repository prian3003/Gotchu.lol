package main

import (
	"encoding/json"
	"fmt"
	"log"

	"gotchu-backend/internal/config"
	"gotchu-backend/internal/models"
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

	fmt.Printf("User: %s (ID: %d, Plan: %s)\n", user.Username, user.ID, user.Plan)

	// Get premium badge
	var premiumBadge models.Badge
	if err := db.Where("id = ?", "premium").First(&premiumBadge).Error; err != nil {
		log.Fatalf("Premium badge not found: %v", err)
	}

	fmt.Printf("Premium Badge: %s\n", premiumBadge.Name)
	fmt.Printf("Requirement Type: %s\n", premiumBadge.RequirementType)
	fmt.Printf("Requirement Data: %s\n", premiumBadge.RequirementData)

	// Parse requirement data
	var reqData map[string]interface{}
	if err := json.Unmarshal([]byte(premiumBadge.RequirementData), &reqData); err != nil {
		log.Fatalf("Failed to parse requirement data: %v", err)
	}

	// Check premium requirement manually
	requiredDays, ok := reqData["days"].(float64)
	if !ok {
		fmt.Printf("Invalid days requirement\n")
		return
	}

	fmt.Printf("Required days: %.0f\n", requiredDays)
	fmt.Printf("User plan == 'premium': %t\n", user.Plan == "premium")

	// Check if user badge already exists
	var userBadge models.UserBadge
	result := db.Where("user_id = ? AND badge_id = ?", user.ID, "premium").First(&userBadge)
	
	if result.Error != nil {
		fmt.Printf("User badge doesn't exist, creating...\n")
		// Create new user badge
		newUserBadge := models.UserBadge{
			UserID:       user.ID,
			BadgeID:      "premium",
			IsEarned:     user.Plan == "premium",
			Progress:     1.0,
			CurrentValue: requiredDays,
			TargetValue:  requiredDays,
			IsVisible:    true,
			IsShowcased:  true,
		}

		if err := db.Create(&newUserBadge).Error; err != nil {
			log.Fatalf("Failed to create user badge: %v", err)
		}
		fmt.Printf("✅ Premium badge created and awarded!\n")
	} else {
		fmt.Printf("User badge exists: earned=%t, progress=%.2f\n", userBadge.IsEarned, userBadge.Progress)
		if !userBadge.IsEarned && user.Plan == "premium" {
			// Update to earned
			db.Model(&userBadge).Updates(map[string]interface{}{
				"is_earned":     true,
				"progress":      1.0,
				"current_value": requiredDays,
				"target_value":  requiredDays,
				"is_showcased":  true,
			})
			fmt.Printf("✅ Premium badge updated to earned!\n")
		}
	}
}