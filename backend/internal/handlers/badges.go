package handlers

import (
	"net/http"

	"gotchu-backend/internal/middleware"
	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/badges"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// BadgesHandler handles badge-related endpoints
type BadgesHandler struct {
	db            *gorm.DB
	badgeService  *badges.Service
}

// NewBadgesHandler creates a new badges handler
func NewBadgesHandler(db *gorm.DB) *BadgesHandler {
	return &BadgesHandler{
		db:           db,
		badgeService: badges.NewService(db),
	}
}

// BadgeResponse represents the API response structure
type BadgeResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// UserBadgeDisplay represents a badge for display purposes
type UserBadgeDisplay struct {
	ID            string                 `json:"id"`
	Badge         BadgeInfo              `json:"badge"`
	IsEarned      bool                   `json:"is_earned"`
	Progress      float64                `json:"progress"`
	CurrentValue  float64                `json:"current_value"`
	TargetValue   float64                `json:"target_value"`
	EarnedAt      *string                `json:"earned_at,omitempty"`
	IsVisible     bool                   `json:"is_visible"`
	IsShowcased   bool                   `json:"is_showcased"`
	ShowcaseOrder *int                   `json:"showcase_order,omitempty"`
}

// BadgeInfo represents badge information for display
type BadgeInfo struct {
	ID              string                    `json:"id"`
	Name            string                    `json:"name"`
	Description     string                    `json:"description"`
	Category        models.BadgeCategory      `json:"category"`
	Rarity          models.BadgeRarity        `json:"rarity"`
	IconType        models.BadgeIconType      `json:"icon_type"`
	IconValue       string                    `json:"icon_value"`
	IconColor       *string                   `json:"icon_color,omitempty"`
	BorderColor     *string                   `json:"border_color,omitempty"`
	GradientFrom    *string                   `json:"gradient_from,omitempty"`
	GradientTo      *string                   `json:"gradient_to,omitempty"`
	GlowColor       *string                   `json:"glow_color,omitempty"`
	IsSecret        bool                      `json:"is_secret"`
	IsLimited       bool                      `json:"is_limited"`
	PointsAwarded   int                       `json:"points_awarded"`
	DisplayOrder    int                       `json:"display_order"`
	TotalEarned     int                       `json:"total_earned"`
}

// GetUserBadges retrieves all badges for a specific user
func (h *BadgesHandler) GetUserBadges(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, BadgeResponse{
			Success: false,
			Message: "Username is required",
		})
		return
	}

	// Find user by username
	var user models.User
	if err := h.db.Where("username = ?", username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, BadgeResponse{
				Success: false,
				Message: "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, BadgeResponse{
			Success: false,
			Message: "Database error",
			Error:   err.Error(),
		})
		return
	}

	// Get user badges with badge information
	var userBadges []models.UserBadge
	err := h.db.Preload("Badge").Where("user_id = ?", user.ID).Find(&userBadges).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, BadgeResponse{
			Success: false,
			Message: "Failed to fetch user badges",
			Error:   err.Error(),
		})
		return
	}

	// Convert to display format
	displayBadges := make([]UserBadgeDisplay, len(userBadges))
	for i, ub := range userBadges {
		earnedAt := ""
		if ub.EarnedAt != nil {
			earnedAt = ub.EarnedAt.Format("2006-01-02T15:04:05Z07:00")
		}

		displayBadges[i] = UserBadgeDisplay{
			ID:            ub.ID,
			IsEarned:      ub.IsEarned,
			Progress:      ub.Progress,
			CurrentValue:  ub.CurrentValue,
			TargetValue:   ub.TargetValue,
			EarnedAt:      &earnedAt,
			IsVisible:     ub.IsVisible,
			IsShowcased:   ub.IsShowcased,
			ShowcaseOrder: ub.ShowcaseOrder,
			Badge: BadgeInfo{
				ID:              ub.Badge.ID,
				Name:            ub.Badge.Name,
				Description:     ub.Badge.Description,
				Category:        ub.Badge.Category,
				Rarity:          ub.Badge.Rarity,
				IconType:        ub.Badge.IconType,
				IconValue:       ub.Badge.IconValue,
				IconColor:       ub.Badge.IconColor,
				BorderColor:     ub.Badge.BorderColor,
				GradientFrom:    ub.Badge.GradientFrom,
				GradientTo:      ub.Badge.GradientTo,
				GlowColor:       ub.Badge.GlowColor,
				IsSecret:        ub.Badge.IsSecret,
				IsLimited:       ub.Badge.IsLimited,
				PointsAwarded:   ub.Badge.PointsAwarded,
				DisplayOrder:    ub.Badge.DisplayOrder,
				TotalEarned:     ub.Badge.TotalEarned,
			},
		}
	}

	c.JSON(http.StatusOK, BadgeResponse{
		Success: true,
		Message: "Badges retrieved successfully",
		Data: gin.H{
			"badges":       displayBadges,
			"total_badges": len(displayBadges),
			"earned_count": countEarnedBadges(displayBadges),
		},
	})
}

// GetShowcasedBadges retrieves badges that are showcased on user's profile
func (h *BadgesHandler) GetShowcasedBadges(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, BadgeResponse{
			Success: false,
			Message: "Username is required",
		})
		return
	}

	// Find user by username
	var user models.User
	if err := h.db.Where("username = ?", username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, BadgeResponse{
				Success: false,
				Message: "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, BadgeResponse{
			Success: false,
			Message: "Database error",
			Error:   err.Error(),
		})
		return
	}

	// Get showcased badges ordered by showcase_order
	var userBadges []models.UserBadge
	err := h.db.Preload("Badge").
		Where("user_id = ? AND is_earned = ? AND is_showcased = ? AND is_visible = ?", 
			user.ID, true, true, true).
		Order("showcase_order ASC, earned_at DESC").
		Find(&userBadges).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, BadgeResponse{
			Success: false,
			Message: "Failed to fetch showcased badges",
			Error:   err.Error(),
		})
		return
	}

	// Convert to display format
	displayBadges := make([]UserBadgeDisplay, len(userBadges))
	for i, ub := range userBadges {
		earnedAt := ""
		if ub.EarnedAt != nil {
			earnedAt = ub.EarnedAt.Format("2006-01-02T15:04:05Z07:00")
		}

		displayBadges[i] = UserBadgeDisplay{
			ID:            ub.ID,
			IsEarned:      ub.IsEarned,
			Progress:      ub.Progress,
			CurrentValue:  ub.CurrentValue,
			TargetValue:   ub.TargetValue,
			EarnedAt:      &earnedAt,
			IsVisible:     ub.IsVisible,
			IsShowcased:   ub.IsShowcased,
			ShowcaseOrder: ub.ShowcaseOrder,
			Badge: BadgeInfo{
				ID:              ub.Badge.ID,
				Name:            ub.Badge.Name,
				Description:     ub.Badge.Description,
				Category:        ub.Badge.Category,
				Rarity:          ub.Badge.Rarity,
				IconType:        ub.Badge.IconType,
				IconValue:       ub.Badge.IconValue,
				IconColor:       ub.Badge.IconColor,
				BorderColor:     ub.Badge.BorderColor,
				GradientFrom:    ub.Badge.GradientFrom,
				GradientTo:      ub.Badge.GradientTo,
				GlowColor:       ub.Badge.GlowColor,
				IsSecret:        ub.Badge.IsSecret,
				IsLimited:       ub.Badge.IsLimited,
				PointsAwarded:   ub.Badge.PointsAwarded,
				DisplayOrder:    ub.Badge.DisplayOrder,
				TotalEarned:     ub.Badge.TotalEarned,
			},
		}
	}

	c.JSON(http.StatusOK, BadgeResponse{
		Success: true,
		Message: "Showcased badges retrieved successfully",
		Data: gin.H{
			"badges": displayBadges,
			"count":  len(displayBadges),
		},
	})
}

// UpdateBadgeOrder updates the showcase order of user badges
func (h *BadgesHandler) UpdateBadgeOrder(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, BadgeResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	var request struct {
		BadgeOrders []struct {
			BadgeID       string `json:"badge_id"`
			ShowcaseOrder int    `json:"showcase_order"`
			IsShowcased   bool   `json:"is_showcased"`
		} `json:"badge_orders"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, BadgeResponse{
			Success: false,
			Message: "Invalid request data",
			Error:   err.Error(),
		})
		return
	}

	// Update badge orders in transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, order := range request.BadgeOrders {
		err := tx.Model(&models.UserBadge{}).
			Where("user_id = ? AND badge_id = ? AND is_earned = ?", user.ID, order.BadgeID, true).
			Updates(map[string]interface{}{
				"showcase_order": order.ShowcaseOrder,
				"is_showcased":   order.IsShowcased,
			}).Error

		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, BadgeResponse{
				Success: false,
				Message: "Failed to update badge order",
				Error:   err.Error(),
			})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, BadgeResponse{
			Success: false,
			Message: "Failed to commit badge order changes",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, BadgeResponse{
		Success: true,
		Message: "Badge orders updated successfully",
	})
}

// GetAllBadges retrieves all available badges with user progress
func (h *BadgesHandler) GetAllBadges(c *gin.Context) {
	currentUser, isAuthenticated := middleware.GetCurrentUser(c)
	
	// Get all active badges
	var badges []models.Badge
	err := h.db.Where("is_active = ?", true).
		Order("display_order ASC, name ASC").
		Find(&badges).Error
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, BadgeResponse{
			Success: false,
			Message: "Failed to fetch badges",
			Error:   err.Error(),
		})
		return
	}

	// If user is authenticated, include their progress
	var displayBadges []interface{}
	if isAuthenticated {
		// Get user's badge progress
		var userBadges []models.UserBadge
		h.db.Where("user_id = ?", currentUser.ID).Find(&userBadges)
		
		// Create map for quick lookup
		userBadgeMap := make(map[string]models.UserBadge)
		for _, ub := range userBadges {
			userBadgeMap[ub.BadgeID] = ub
		}
		
		for _, badge := range badges {
			badgeData := gin.H{
				"badge": BadgeInfo{
					ID:              badge.ID,
					Name:            badge.Name,
					Description:     badge.Description,
					Category:        badge.Category,
					Rarity:          badge.Rarity,
					IconType:        badge.IconType,
					IconValue:       badge.IconValue,
					IconColor:       badge.IconColor,
					BorderColor:     badge.BorderColor,
					GradientFrom:    badge.GradientFrom,
					GradientTo:      badge.GradientTo,
					GlowColor:       badge.GlowColor,
					IsSecret:        badge.IsSecret,
					IsLimited:       badge.IsLimited,
					PointsAwarded:   badge.PointsAwarded,
					DisplayOrder:    badge.DisplayOrder,
					TotalEarned:     badge.TotalEarned,
				},
			}
			
			if userBadge, exists := userBadgeMap[badge.ID]; exists {
				earnedAt := ""
				if userBadge.EarnedAt != nil {
					earnedAt = userBadge.EarnedAt.Format("2006-01-02T15:04:05Z07:00")
				}
				
				badgeData["user_progress"] = gin.H{
					"id":             userBadge.ID,
					"is_earned":      userBadge.IsEarned,
					"progress":       userBadge.Progress,
					"current_value":  userBadge.CurrentValue,
					"target_value":   userBadge.TargetValue,
					"earned_at":      earnedAt,
					"is_visible":     userBadge.IsVisible,
					"is_showcased":   userBadge.IsShowcased,
					"showcase_order": userBadge.ShowcaseOrder,
				}
			} else {
				badgeData["user_progress"] = gin.H{
					"is_earned":     false,
					"progress":      0,
					"current_value": 0,
					"target_value":  1,
					"is_visible":    true,
					"is_showcased":  false,
				}
			}
			
			displayBadges = append(displayBadges, badgeData)
		}
	} else {
		// Public view - only show basic badge info
		for _, badge := range badges {
			if !badge.IsSecret { // Don't show secret badges to unauthenticated users
				displayBadges = append(displayBadges, gin.H{
					"badge": BadgeInfo{
						ID:              badge.ID,
						Name:            badge.Name,
						Description:     badge.Description,
						Category:        badge.Category,
						Rarity:          badge.Rarity,
						IconType:        badge.IconType,
						IconValue:       badge.IconValue,
						IconColor:       badge.IconColor,
						BorderColor:     badge.BorderColor,
						GradientFrom:    badge.GradientFrom,
						GradientTo:      badge.GradientTo,
						GlowColor:       badge.GlowColor,
						IsSecret:        badge.IsSecret,
						IsLimited:       badge.IsLimited,
						PointsAwarded:   badge.PointsAwarded,
						DisplayOrder:    badge.DisplayOrder,
						TotalEarned:     badge.TotalEarned,
					},
				})
			}
		}
	}

	c.JSON(http.StatusOK, BadgeResponse{
		Success: true,
		Message: "Badges retrieved successfully",
		Data: gin.H{
			"badges": displayBadges,
			"count":  len(displayBadges),
		},
	})
}

// Helper function to count earned badges
func countEarnedBadges(badges []UserBadgeDisplay) int {
	count := 0
	for _, badge := range badges {
		if badge.IsEarned {
			count++
		}
	}
	return count
}

// CheckBadges triggers badge checking for the current user
func (h *BadgesHandler) CheckBadges(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, BadgeResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	// Check and award badges for this user
	if err := h.badgeService.CheckAndAwardBadges(user.ID); err != nil {
		c.JSON(http.StatusInternalServerError, BadgeResponse{
			Success: false,
			Message: "Failed to check badges",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, BadgeResponse{
		Success: true,
		Message: "Badges checked successfully",
	})
}

// AwardBadgeManually manually awards a badge to a user (admin only)
func (h *BadgesHandler) AwardBadgeManually(c *gin.Context) {
	currentUser, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, BadgeResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	// Check if user is admin (you'll need to implement admin check)
	// For now, we'll skip admin check but you should add it
	
	var request struct {
		UserID  uint   `json:"user_id" binding:"required"`
		BadgeID string `json:"badge_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, BadgeResponse{
			Success: false,
			Message: "Invalid request data",
			Error:   err.Error(),
		})
		return
	}

	// Award the badge
	if err := h.badgeService.AwardBadgeManually(request.UserID, request.BadgeID, currentUser.ID); err != nil {
		c.JSON(http.StatusInternalServerError, BadgeResponse{
			Success: false,
			Message: "Failed to award badge",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, BadgeResponse{
		Success: true,
		Message: "Badge awarded successfully",
	})
}