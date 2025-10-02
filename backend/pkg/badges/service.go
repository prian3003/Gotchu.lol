package badges

import (
	"encoding/json"
	"fmt"
	"gotchu-backend/internal/models"
	"log"
	"time"

	"gorm.io/gorm"
)

// Service handles badge operations and automatic awarding
type Service struct {
	db *gorm.DB
}

// NewService creates a new badge service
func NewService(db *gorm.DB) *Service {
	return &Service{
		db: db,
	}
}

// CheckAndMarkClaimable checks all badges for a user and marks them as claimable if conditions are met
func (s *Service) CheckAndMarkClaimable(userID uint) (int, error) {
	// Get user data
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return 0, fmt.Errorf("failed to get user: %w", err)
	}

	// Get all active badges
	var badges []models.Badge
	if err := s.db.Where("is_active = ?", true).Find(&badges).Error; err != nil {
		return 0, fmt.Errorf("failed to get badges: %w", err)
	}

	claimableCount := 0
	// Check each badge and mark as claimable if conditions are met
	for _, badge := range badges {
		if claimed, err := s.checkAndMarkClaimable(&user, &badge); err != nil {
			log.Printf("Error checking badge %s for user %d: %v", badge.Name, userID, err)
		} else if claimed {
			claimableCount++
		}
	}

	return claimableCount, nil
}

// CheckAndMarkClaimable checks a specific badge for a user and marks it as claimable if conditions are met
func (s *Service) checkAndMarkClaimable(user *models.User, badge *models.Badge) (bool, error) {
	// Check if user already has this badge
	var existingUserBadge models.UserBadge
	result := s.db.Where("user_id = ? AND badge_id = ?", user.ID, badge.ID).First(&existingUserBadge)
	
	// If badge already earned, skip
	if result.Error == nil && existingUserBadge.IsEarned {
		return false, nil
	}

	// Parse requirement data
	var reqData map[string]interface{}
	if err := json.Unmarshal([]byte(badge.RequirementData), &reqData); err != nil {
		return false, fmt.Errorf("failed to parse requirement data: %w", err)
	}

	// Check if user meets the requirements
	meets, progress, currentValue, targetValue := s.checkRequirement(user, badge.RequirementType, reqData)
	
	log.Printf("🔍 Badge %s for user %d: meets=%v, progress=%.2f, current=%.2f, target=%.2f", 
		badge.Name, user.ID, meets, progress, currentValue, targetValue)

	// Create or update user badge record
	if result.Error == gorm.ErrRecordNotFound {
		// Create new user badge record
		userBadge := models.UserBadge{
			UserID:       user.ID,
			BadgeID:      badge.ID,
			IsEarned:     false, // Never auto-earn, only mark as claimable
			IsClaimable:  meets,
			Progress:     progress,
			CurrentValue: currentValue,
			TargetValue:  targetValue,
			IsVisible:    true,
			IsShowcased:  false,
		}

		if err := s.db.Create(&userBadge).Error; err != nil {
			return false, fmt.Errorf("failed to create user badge: %w", err)
		}

		if meets {
			log.Printf("🎯 Badge %s is now claimable for user %d", badge.Name, user.ID)
			return true, nil
		}
	} else {
		// Update existing user badge record
		updates := map[string]interface{}{
			"progress":      progress,
			"current_value": currentValue,
			"target_value":  targetValue,
			"is_claimable":  meets,
		}

		// If badge just became claimable
		if meets && !existingUserBadge.IsClaimable && !existingUserBadge.IsEarned {
			log.Printf("🎯 Badge %s is now claimable for user %d", badge.Name, user.ID)
		} else {
			log.Printf("📝 Badge %s for user %d: meets=%v, already_claimable=%v, already_earned=%v", 
				badge.Name, user.ID, meets, existingUserBadge.IsClaimable, existingUserBadge.IsEarned)
		}

		if err := s.db.Model(&existingUserBadge).Updates(updates).Error; err != nil {
			return false, fmt.Errorf("failed to update user badge: %w", err)
		}

		return meets && !existingUserBadge.IsClaimable && !existingUserBadge.IsEarned, nil
	}

	return false, nil
}

// ClaimBadge allows a user to claim a badge they've met the requirements for
func (s *Service) ClaimBadge(userID uint, badgeID string) error {
	// Check if user has the badge and it's claimable
	var userBadge models.UserBadge
	err := s.db.Where("user_id = ? AND badge_id = ?", userID, badgeID).First(&userBadge).Error
	if err == gorm.ErrRecordNotFound {
		return fmt.Errorf("badge not found for user")
	}
	if err != nil {
		return fmt.Errorf("database error: %w", err)
	}

	// Check if already earned
	if userBadge.IsEarned {
		return fmt.Errorf("badge already claimed")
	}

	// Check if claimable
	if !userBadge.IsClaimable {
		return fmt.Errorf("badge requirements not met")
	}

	// Claim the badge
	now := time.Now()
	earnMethod := models.EarnMethodClaimed
	updates := map[string]interface{}{
		"is_earned":     true,
		"is_claimable":  false, // No longer claimable once claimed
		"earned_at":     &now,
		"earn_method":   earnMethod,
		"is_showcased":  true, // Auto-showcase newly claimed badges
	}

	if err := s.db.Model(&userBadge).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to claim badge: %w", err)
	}

	// Get badge info for logging
	var badge models.Badge
	if err := s.db.Where("id = ?", badgeID).First(&badge).Error; err == nil {
		log.Printf("🏆 User %d claimed badge: %s", userID, badge.Name)
	}

	return nil
}

// CheckAndAwardBadge checks a specific badge for a user and awards it if conditions are met (legacy method for manual awards)
func (s *Service) checkAndAwardBadge(user *models.User, badge *models.Badge) error {
	// Check if user already has this badge
	var existingUserBadge models.UserBadge
	result := s.db.Where("user_id = ? AND badge_id = ?", user.ID, badge.ID).First(&existingUserBadge)
	
	// If badge already earned, skip
	if result.Error == nil && existingUserBadge.IsEarned {
		return nil
	}

	// Parse requirement data
	var reqData map[string]interface{}
	if err := json.Unmarshal([]byte(badge.RequirementData), &reqData); err != nil {
		return fmt.Errorf("failed to parse requirement data: %w", err)
	}

	// Check if user meets the requirements
	meets, progress, currentValue, targetValue := s.checkRequirement(user, badge.RequirementType, reqData)

	// Create or update user badge record
	if result.Error == gorm.ErrRecordNotFound {
		// Create new user badge record
		userBadge := models.UserBadge{
			UserID:       user.ID,
			BadgeID:      badge.ID,
			IsEarned:     meets,
			Progress:     progress,
			CurrentValue: currentValue,
			TargetValue:  targetValue,
			IsVisible:    true,
			IsShowcased:  false,
		}

		if meets {
			now := time.Now()
			earnMethod := models.EarnMethodAutomatic
			userBadge.EarnedAt = &now
			userBadge.EarnMethod = &earnMethod
			userBadge.IsShowcased = true // Auto-showcase newly earned badges
		}

		if err := s.db.Create(&userBadge).Error; err != nil {
			return fmt.Errorf("failed to create user badge: %w", err)
		}

		if meets {
			log.Printf("🏆 User %d earned badge: %s", user.ID, badge.Name)
		}
	} else {
		// Update existing user badge record
		updates := map[string]interface{}{
			"progress":      progress,
			"current_value": currentValue,
			"target_value":  targetValue,
		}

		// If badge was just earned
		if meets && !existingUserBadge.IsEarned {
			now := time.Now()
			earnMethod := models.EarnMethodAutomatic
			updates["is_earned"] = true
			updates["earned_at"] = &now
			updates["earn_method"] = earnMethod
			updates["is_showcased"] = true
			log.Printf("🏆 User %d earned badge: %s", user.ID, badge.Name)
		}

		if err := s.db.Model(&existingUserBadge).Updates(updates).Error; err != nil {
			return fmt.Errorf("failed to update user badge: %w", err)
		}
	}

	return nil
}

// CheckRequirement checks if a user meets a specific requirement
func (s *Service) checkRequirement(user *models.User, reqType models.RequirementType, reqData map[string]interface{}) (meets bool, progress float64, currentValue float64, targetValue float64) {
	switch reqType {
	case models.RequirementTypePremiumDays:
		return s.checkPremiumDays(user, reqData)
	case models.RequirementTypeAccountAge:
		return s.checkAccountAge(user, reqData)
	case models.RequirementTypeProfileViews:
		return s.checkProfileViews(user, reqData)
	case models.RequirementTypeLinkClicks:
		return s.checkLinkClicks(user, reqData)
	case models.RequirementTypeLinkCount:
		return s.checkLinkCount(user, reqData)
	case models.RequirementTypeCustomMetric:
		return s.checkCustomMetric(user, reqData)
	case models.RequirementTypeManual:
		return s.checkManualRequirement(user, reqData)
	case models.RequirementTypeDiscordBoost:
		return s.checkDiscordBoost(user, reqData)
	case models.RequirementTypeEvent:
		return s.checkEventParticipation(user, reqData)
	default:
		return false, 0, 0, 1
	}
}

// CheckPremiumDays checks if user has premium for specified days
func (s *Service) checkPremiumDays(user *models.User, reqData map[string]interface{}) (bool, float64, float64, float64) {
	requiredDays, ok := reqData["days"].(float64)
	if !ok {
		return false, 0, 0, 1
	}

	// Check if user has premium plan
	if user.Plan != "premium" {
		return false, 0, 0, requiredDays
	}

	// For now, just check if they have premium
	// In a real implementation, you'd check subscription start date
	return true, 1.0, requiredDays, requiredDays
}

// CheckAccountAge checks if account is old enough
func (s *Service) checkAccountAge(user *models.User, reqData map[string]interface{}) (bool, float64, float64, float64) {
	requiredDays, ok := reqData["days"].(float64)
	if !ok {
		return false, 0, 0, 1
	}

	// Calculate account age in days
	accountAge := time.Since(user.CreatedAt).Hours() / 24
	progress := accountAge / requiredDays
	if progress > 1.0 {
		progress = 1.0
	}

	meets := accountAge >= requiredDays
	return meets, progress, accountAge, requiredDays
}

// CheckProfileViews checks profile view count
func (s *Service) checkProfileViews(user *models.User, reqData map[string]interface{}) (bool, float64, float64, float64) {
	threshold, ok := reqData["threshold"].(float64)
	if !ok {
		return false, 0, 0, 1
	}

	currentViews := float64(user.ProfileViews)
	progress := currentViews / threshold
	if progress > 1.0 {
		progress = 1.0
	}

	meets := currentViews >= threshold
	return meets, progress, currentViews, threshold
}

// CheckLinkClicks checks total link clicks
func (s *Service) checkLinkClicks(user *models.User, reqData map[string]interface{}) (bool, float64, float64, float64) {
	threshold, ok := reqData["threshold"].(float64)
	if !ok {
		return false, 0, 0, 1
	}

	currentClicks := float64(user.TotalClicks)
	progress := currentClicks / threshold
	if progress > 1.0 {
		progress = 1.0
	}

	meets := currentClicks >= threshold
	return meets, progress, currentClicks, threshold
}

// CheckLinkCount checks number of links created
func (s *Service) checkLinkCount(user *models.User, reqData map[string]interface{}) (bool, float64, float64, float64) {
	threshold, ok := reqData["threshold"].(float64)
	if !ok {
		return false, 0, 0, 1
	}

	// Count user's links
	var linkCount int64
	s.db.Model(&models.Link{}).Where("user_id = ?", user.ID).Count(&linkCount)

	currentCount := float64(linkCount)
	progress := currentCount / threshold
	if progress > 1.0 {
		progress = 1.0
	}

	meets := currentCount >= threshold
	return meets, progress, currentCount, threshold
}

// CheckCustomMetric checks custom metrics (donations, gifts, etc.)
func (s *Service) checkCustomMetric(user *models.User, reqData map[string]interface{}) (bool, float64, float64, float64) {
	metric, ok := reqData["metric"].(string)
	if !ok {
		return false, 0, 0, 1
	}

	switch metric {
	case "donation_amount":
		// Check donation amount
		threshold, _ := reqData["threshold"].(float64)
		currentAmount := user.TotalDonated
		progress := currentAmount / threshold
		if progress > 1.0 {
			progress = 1.0
		}
		meets := currentAmount >= threshold
		return meets, progress, currentAmount, threshold
		
	case "gifts_given":
		// Check gifts given (would need a gifts table)
		threshold, _ := reqData["threshold"].(float64)
		// For now, return false as we don't have gift tracking
		return false, 0, 0, threshold
		
	case "bugs_reported":
		// Check bugs reported (would need a bug reports table)
		threshold, _ := reqData["threshold"].(float64)
		// For now, return false as we don't have bug tracking
		return false, 0, 0, threshold
		
	case "image_host":
		// Check if user purchased image host service
		purchased, _ := reqData["purchased"].(bool)
		if !purchased {
			return false, 0, 0, 1
		}
		// For now, return false as we don't have service tracking
		return false, 0, 0, 1
	}

	return false, 0, 0, 1
}

// CheckManualRequirement checks manual requirements (staff, helper roles, etc.)
func (s *Service) checkManualRequirement(user *models.User, reqData map[string]interface{}) (bool, float64, float64, float64) {
	// Check user role or special flags
	
	if role, exists := reqData["role"]; exists {
		switch role {
		case "staff":
			// Check if user is staff
			return user.IsStaff || user.Role == "staff", 1.0, 1.0, 1.0
		case "helper":
			// Check if user is helper
			return user.IsHelper || user.Role == "helper", 1.0, 1.0, 1.0
		}
	}

	if verified, exists := reqData["verified"]; exists && verified.(bool) {
		// Check if user is verified
		return user.IsVerified, 1.0, 1.0, 1.0
	}

	// Welcome badge - automatically claimable for all users with accounts
	if welcome, exists := reqData["welcome"]; exists {
		if welcomeBool, ok := welcome.(bool); ok && welcomeBool {
			// All users with accounts should be able to claim the welcome badge
			log.Printf("✅ Welcome badge check for user %d: meets requirements", user.ID)
			return true, 1.0, 1.0, 1.0
		}
	}

	return false, 0, 0, 1
}

// CheckDiscordBoost checks if user boosted the Discord server
func (s *Service) checkDiscordBoost(user *models.User, reqData map[string]interface{}) (bool, float64, float64, float64) {
	// Check if user is a Discord server booster
	return user.IsBooster, 1.0, 1.0, 1.0
}

// CheckEventParticipation checks if user participated in events
func (s *Service) checkEventParticipation(user *models.User, reqData map[string]interface{}) (bool, float64, float64, float64) {
	// This would require event tracking system
	// For now, return false
	return false, 0, 0, 1
}

// AwardBadgeManually manually awards a badge to a user (for admin use)
func (s *Service) AwardBadgeManually(userID uint, badgeID string, adminID uint) error {
	// Check if badge exists
	var badge models.Badge
	if err := s.db.Where("id = ?", badgeID).First(&badge).Error; err != nil {
		return fmt.Errorf("badge not found: %w", err)
	}

	// Check if user already has the badge
	var existingUserBadge models.UserBadge
	result := s.db.Where("user_id = ? AND badge_id = ?", userID, badgeID).First(&existingUserBadge)

	now := time.Now()
	earnMethod := models.EarnMethodManual
	
	if result.Error == gorm.ErrRecordNotFound {
		// Create new user badge
		userBadge := models.UserBadge{
			UserID:       userID,
			BadgeID:      badgeID,
			IsEarned:     true,
			Progress:     1.0,
			CurrentValue: 1.0,
			TargetValue:  1.0,
			EarnedAt:     &now,
			EarnMethod:   &earnMethod,
			EarnContext:  stringPtr(fmt.Sprintf(`{"awarded_by": %d}`, adminID)),
			IsVisible:    true,
			IsShowcased:  true,
		}

		if err := s.db.Create(&userBadge).Error; err != nil {
			return fmt.Errorf("failed to create user badge: %w", err)
		}
	} else if !existingUserBadge.IsEarned {
		// Update existing badge to earned
		updates := map[string]interface{}{
			"is_earned":     true,
			"progress":      1.0,
			"current_value": 1.0,
			"target_value":  1.0,
			"earned_at":     &now,
			"earn_method":   earnMethod,
			"earn_context":  fmt.Sprintf(`{"awarded_by": %d}`, adminID),
			"is_showcased":  true,
		}

		if err := s.db.Model(&existingUserBadge).Updates(updates).Error; err != nil {
			return fmt.Errorf("failed to update user badge: %w", err)
		}
	}

	log.Printf("🏆 Admin %d manually awarded badge %s to user %d", adminID, badge.Name, userID)
	return nil
}

// Helper function to create string pointers
func stringPtr(s string) *string {
	return &s
}