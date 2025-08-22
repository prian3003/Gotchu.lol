package database

import (
	"encoding/json"
	"gotchu-backend/internal/models"
	"log"

	"gorm.io/gorm"
)

// SeedBadges creates all the default badges in the database
func SeedBadges(db *gorm.DB) error {
	badges := []models.Badge{
		// Staff Badge
		{
			ID:              "staff",
			Name:            "Staff",
			Description:     "Be a part of the guns.lol staff team.",
			Category:        models.BadgeCategoryStaff,
			Rarity:          models.BadgeRarityLegendary,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "star",
			IconColor:       stringPtr("#3b82f6"),
			RequirementType: models.RequirementTypeManual,
			RequirementData: `{"role": "staff"}`,
			PointsAwarded:   1000,
			DisplayOrder:    1,
			IsActive:        true,
		},
		
		// Helper Badge
		{
			ID:              "helper",
			Name:            "Helper",
			Description:     "Be active and help users in the community.",
			Category:        models.BadgeCategoryEngagement,
			Rarity:          models.BadgeRarityRare,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "help-circle",
			IconColor:       stringPtr("#f59e0b"),
			RequirementType: models.RequirementTypeManual,
			RequirementData: `{"role": "helper"}`,
			PointsAwarded:   500,
			DisplayOrder:    2,
			IsActive:        true,
		},
		
		// Premium Badge
		{
			ID:              "premium",
			Name:            "Premium",
			Description:     "Purchase the premium package.",
			Category:        models.BadgeCategoryPremium,
			Rarity:          models.BadgeRarityEpic,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "gem",
			IconColor:       stringPtr("#8b5cf6"),
			RequirementType: models.RequirementTypePremiumDays,
			RequirementData: `{"days": 1}`,
			PointsAwarded:   250,
			DisplayOrder:    3,
			IsActive:        true,
		},
		
		// Verified Badge
		{
			ID:              "verified",
			Name:            "Verified",
			Description:     "Purchase or be a known content creator.",
			Category:        models.BadgeCategoryAchievement,
			Rarity:          models.BadgeRarityRare,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "badge-check",
			IconColor:       stringPtr("#06b6d4"),
			RequirementType: models.RequirementTypeManual,
			RequirementData: `{"verified": true}`,
			PointsAwarded:   200,
			DisplayOrder:    4,
			IsActive:        true,
		},
		
		// Donor Badge
		{
			ID:              "donor",
			Name:            "Donor",
			Description:     "Donate atleast 10€ to guns.lol.",
			Category:        models.BadgeCategoryAchievement,
			Rarity:          models.BadgeRarityRare,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "gift",
			IconColor:       stringPtr("#10b981"),
			RequirementType: models.RequirementTypeCustomMetric,
			RequirementData: `{"metric": "donation_amount", "threshold": 10}`,
			PointsAwarded:   300,
			DisplayOrder:    5,
			IsActive:        true,
		},
		
		// OG Badge
		{
			ID:              "og",
			Name:            "OG",
			Description:     "Be an early supporter of guns.lol.",
			Category:        models.BadgeCategoryMilestone,
			Rarity:          models.BadgeRarityLegendary,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "trophy",
			IconColor:       stringPtr("#eab308"),
			RequirementType: models.RequirementTypeAccountAge,
			RequirementData: `{"days": 365}`,
			PointsAwarded:   500,
			DisplayOrder:    6,
			IsActive:        true,
		},
		
		// Gifter Badge
		{
			ID:              "gifter",
			Name:            "Gifter",
			Description:     "Gift a guns.lol product to another user.",
			Category:        models.BadgeCategorySocial,
			Rarity:          models.BadgeRarityUncommon,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "gift",
			IconColor:       stringPtr("#f97316"),
			RequirementType: models.RequirementTypeCustomMetric,
			RequirementData: `{"metric": "gifts_given", "threshold": 1}`,
			PointsAwarded:   150,
			DisplayOrder:    7,
			IsActive:        true,
		},
		
		// Server Booster Badge
		{
			ID:              "serverbooster",
			Name:            "Server Booster",
			Description:     "Boost the guns.lol discord server.",
			Category:        models.BadgeCategorySocial,
			Rarity:          models.BadgeRarityEpic,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "rocket",
			IconColor:       stringPtr("#8b5cf6"),
			RequirementType: models.RequirementTypeDiscordBoost,
			RequirementData: `{"boost": true}`,
			PointsAwarded:   400,
			DisplayOrder:    8,
			IsActive:        true,
		},
		
		// Winner Badge
		{
			ID:              "winner",
			Name:            "Winner",
			Description:     "Win a guns.lol event.",
			Category:        models.BadgeCategoryAchievement,
			Rarity:          models.BadgeRarityEpic,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "trophy",
			IconColor:       stringPtr("#eab308"),
			RequirementType: models.RequirementTypeEvent,
			RequirementData: `{"event": "contest", "place": 1}`,
			PointsAwarded:   600,
			DisplayOrder:    9,
			IsActive:        true,
		},
		
		// Second Place Badge
		{
			ID:              "secondplace",
			Name:            "Second Place",
			Description:     "Get second place in a guns.lol event.",
			Category:        models.BadgeCategoryAchievement,
			Rarity:          models.BadgeRarityRare,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "medal",
			IconColor:       stringPtr("#6b7280"),
			RequirementType: models.RequirementTypeEvent,
			RequirementData: `{"event": "contest", "place": 2}`,
			PointsAwarded:   400,
			DisplayOrder:    10,
			IsActive:        true,
		},
		
		// Third Place Badge
		{
			ID:              "thirdplace",
			Name:            "Third Place",
			Description:     "Get third place in a guns.lol event.",
			Category:        models.BadgeCategoryAchievement,
			Rarity:          models.BadgeRarityRare,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "medal",
			IconColor:       stringPtr("#cd7c2f"),
			RequirementType: models.RequirementTypeEvent,
			RequirementData: `{"event": "contest", "place": 3}`,
			PointsAwarded:   300,
			DisplayOrder:    11,
			IsActive:        true,
		},
		
		// Image Host Badge
		{
			ID:              "imagehost",
			Name:            "Image Host",
			Description:     "Purchase the Image Host.",
			Category:        models.BadgeCategoryPremium,
			Rarity:          models.BadgeRarityRare,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "image",
			IconColor:       stringPtr("#10b981"),
			RequirementType: models.RequirementTypeCustomMetric,
			RequirementData: `{"service": "image_host", "purchased": true}`,
			PointsAwarded:   200,
			DisplayOrder:    12,
			IsActive:        true,
		},
		
		// Bug Hunter Badge
		{
			ID:              "bughunter",
			Name:            "Bug Hunter",
			Description:     "Report a bug to the guns.lol team.",
			Category:        models.BadgeCategoryAchievement,
			Rarity:          models.BadgeRarityUncommon,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "bug",
			IconColor:       stringPtr("#10b981"),
			RequirementType: models.RequirementTypeCustomMetric,
			RequirementData: `{"metric": "bugs_reported", "threshold": 1}`,
			PointsAwarded:   100,
			DisplayOrder:    13,
			IsActive:        true,
		},
		
		// Easter 2025 Badge
		{
			ID:              "easter2025",
			Name:            "Easter 2025",
			Description:     "Exclusive badge from the 2025 easter sale.",
			Category:        models.BadgeCategorySeasonal,
			Rarity:          models.BadgeRarityMythic,
			IconType:        models.BadgeIconTypeEmoji,
			IconValue:       "🥚",
			IconColor:       stringPtr("#f472b6"),
			RequirementType: models.RequirementTypeEvent,
			RequirementData: `{"event": "easter2025", "participated": true}`,
			PointsAwarded:   750,
			DisplayOrder:    14,
			IsActive:        true,
			IsLimited:       true,
		},
		
		// Christmas 2024 Badge
		{
			ID:              "christmas2024",
			Name:            "Christmas 2024",
			Description:     "Exclusive badge from the 2024 winter sale.",
			Category:        models.BadgeCategorySeasonal,
			Rarity:          models.BadgeRarityMythic,
			IconType:        models.BadgeIconTypeEmoji,
			IconValue:       "🎄",
			IconColor:       stringPtr("#dc2626"),
			RequirementType: models.RequirementTypeEvent,
			RequirementData: `{"event": "christmas2024", "participated": true}`,
			PointsAwarded:   750,
			DisplayOrder:    15,
			IsActive:        true,
			IsLimited:       true,
		},
	}

	// Create badges if they don't exist
	for _, badge := range badges {
		var existingBadge models.Badge
		result := db.Where("id = ?", badge.ID).First(&existingBadge)
		
		if result.Error != nil && result.Error == gorm.ErrRecordNotFound {
			// Badge doesn't exist, create it
			if err := db.Create(&badge).Error; err != nil {
				log.Printf("Failed to create badge %s: %v", badge.Name, err)
				return err
			}
			log.Printf("✅ Created badge: %s", badge.Name)
		} else {
			// Badge exists, optionally update it
			if err := db.Model(&existingBadge).Updates(&badge).Error; err != nil {
				log.Printf("Failed to update badge %s: %v", badge.Name, err)
				return err
			}
			log.Printf("🔄 Updated badge: %s", badge.Name)
		}
	}

	log.Printf("✅ Badge seeding completed successfully")
	return nil
}

// Helper function to create string pointers
func stringPtr(s string) *string {
	return &s
}