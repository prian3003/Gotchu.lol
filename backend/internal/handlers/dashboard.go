package handlers

import (
	"net/http"
	"time"

	"gotchu-backend/internal/middleware"
	"gotchu-backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// DashboardHandler handles dashboard endpoints
type DashboardHandler struct {
	db *gorm.DB
}

// NewDashboardHandler creates a new dashboard handler
func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
	return &DashboardHandler{
		db: db,
	}
}

// DashboardStats represents dashboard statistics
type DashboardStats struct {
	ProfileViews int       `json:"profile_views"`
	TotalClicks  int       `json:"total_clicks"`
	JoinDate     time.Time `json:"join_date"`
	LastActive   *time.Time `json:"last_active"`
	LinksCount   int       `json:"links_count"`
	FilesCount   int       `json:"files_count"`
}

// DashboardResponse represents dashboard response
type DashboardResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// GetDashboard returns dashboard data for authenticated user
func (h *DashboardHandler) GetDashboard(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, DashboardResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	// Get additional statistics
	var linksCount int64
	h.db.Model(&models.Link{}).Where("user_id = ? AND is_active = ?", user.ID, true).Count(&linksCount)

	var filesCount int64
	h.db.Model(&models.File{}).Where("user_id = ?", user.ID).Count(&filesCount)

	// Prepare stats
	stats := DashboardStats{
		ProfileViews: user.ProfileViews,
		TotalClicks:  user.TotalClicks,
		JoinDate:     user.CreatedAt,
		LastActive:   user.LastLoginAt,
		LinksCount:   int(linksCount),
		FilesCount:   int(filesCount),
	}

	// Prepare user data for dashboard
	userProfile := UserProfile{
		ID:          user.ID,
		Username:    user.Username,
		Email:       *user.Email,
		DisplayName: user.DisplayName,
		AvatarURL:   user.AvatarURL,
		IsVerified:  user.IsVerified,
		Plan:        user.Plan,
		Theme:       user.Theme,
		CreatedAt:   user.CreatedAt,
	}

	c.JSON(http.StatusOK, DashboardResponse{
		Success: true,
		Message: "Dashboard data retrieved successfully",
		Data: gin.H{
			"user":  userProfile,
			"stats": stats,
		},
	})
}

// GetUserProfile returns public user profile by username
func (h *DashboardHandler) GetUserProfile(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: "Username is required",
		})
		return
	}

	// Get user
	var user models.User
	err := h.db.Where("username = ? AND is_active = ?", username, true).First(&user).Error
	if err != nil {
		c.JSON(http.StatusNotFound, DashboardResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}

	// Check if profile is public or if viewer is the owner
	currentUser, isAuthenticated := middleware.GetCurrentUser(c)
	if !user.IsPublic && (!isAuthenticated || currentUser.ID != user.ID) {
		c.JSON(http.StatusForbidden, DashboardResponse{
			Success: false,
			Message: "Profile is private",
		})
		return
	}

	// Get user's links
	var links []models.Link
	h.db.Where("user_id = ? AND is_active = ?", user.ID, true).
		Order("\"order\" ASC, created_at ASC").
		Find(&links)

	// Increment profile view if not viewing own profile and not already viewed recently
	if !isAuthenticated || currentUser.ID != user.ID {
		// TODO: Track profile view with analytics (implement proper view tracking)
		h.db.Model(&user).UpdateColumn("profile_views", gorm.Expr("profile_views + ?", 1))
	}

	// Prepare public profile data
	profileData := gin.H{
		"id":            user.ID,
		"username":      user.Username,
		"display_name":  user.DisplayName,
		"bio":           user.Bio,
		"avatar_url":    user.AvatarURL,
		"is_verified":   user.IsVerified,
		"theme":         user.Theme,
		"profile_views": user.ProfileViews,
		"created_at":    user.CreatedAt,
		"links":         links,
	}

	// Add private data if viewing own profile
	if isAuthenticated && currentUser.ID == user.ID {
		profileData["email"] = user.Email
		profileData["total_clicks"] = user.TotalClicks
		profileData["plan"] = user.Plan
		profileData["last_login_at"] = user.LastLoginAt
	}

	c.JSON(http.StatusOK, DashboardResponse{
		Success: true,
		Message: "Profile retrieved successfully",
		Data: gin.H{
			"user": profileData,
		},
	})
}