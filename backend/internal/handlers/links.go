package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"gotchu-backend/internal/middleware"
	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/redis"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// LinkHandler handles link-related endpoints
type LinkHandler struct {
	db          *gorm.DB
	redisClient *redis.Client
}

// NewLinkHandler creates a new link handler
func NewLinkHandler(db *gorm.DB, redisClient *redis.Client) *LinkHandler {
	return &LinkHandler{
		db:          db,
		redisClient: redisClient,
	}
}

// LinkResponse represents standard link response format
type LinkResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// CreateLinkRequest represents the request payload for creating a link
type CreateLinkRequest struct {
	Title       string                `json:"title" binding:"required,min=1,max=255"`
	URL         *string               `json:"url" binding:"omitempty,url"`
	Description *string               `json:"description" binding:"omitempty,max=1000"`
	Type        models.LinkType       `json:"type" binding:"omitempty,oneof=DEFAULT HEADER PRODUCT SERVICE MARKETPLACE"`
	Icon        *string               `json:"icon" binding:"omitempty,max=100"`
	ImageURL    *string               `json:"image_url" binding:"omitempty,url"`
	Color       *string               `json:"color" binding:"omitempty,len=7"`
	IsActive    *bool                 `json:"is_active"`
}

// UpdateLinkRequest represents the request payload for updating a link
type UpdateLinkRequest struct {
	Title       *string               `json:"title" binding:"omitempty,min=1,max=255"`
	URL         *string               `json:"url" binding:"omitempty,url"`
	Description *string               `json:"description" binding:"omitempty,max=1000"`
	Type        *models.LinkType      `json:"type" binding:"omitempty,oneof=DEFAULT HEADER PRODUCT SERVICE MARKETPLACE"`
	Icon        *string               `json:"icon" binding:"omitempty,max=100"`
	ImageURL    *string               `json:"image_url" binding:"omitempty,url"`
	Color       *string               `json:"color" binding:"omitempty,len=7"`
	IsActive    *bool                 `json:"is_active"`
	Order       *int                  `json:"order"`
}

// GetLinks retrieves all links for the authenticated user
func (h *LinkHandler) GetLinks(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, LinkResponse{
			Success: false,
			Message: "Authentication required",
			Error:   "UNAUTHORIZED",
		})
		return
	}

	// Fetch from database directly (no caching for links)
	var links []models.Link
	err := h.db.Where("user_id = ?", user.ID).
		Order("\"order\" ASC, created_at ASC").
		Find(&links).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to retrieve links",
			Error:   "DATABASE_ERROR",
		})
		return
	}

	// Ensure links is never nil
	if links == nil {
		links = []models.Link{}
	}

	c.JSON(http.StatusOK, LinkResponse{
		Success: true,
		Message: "Links retrieved successfully",
		Data: gin.H{
			"links": links,
		},
	})
}

// GetLink retrieves a specific link by ID
func (h *LinkHandler) GetLink(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, LinkResponse{
			Success: false,
			Message: "Authentication required",
			Error:   "UNAUTHORIZED",
		})
		return
	}

	linkID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, LinkResponse{
			Success: false,
			Message: "Invalid link ID",
			Error:   "INVALID_ID",
		})
		return
	}

	var link models.Link
	err = h.db.Where("id = ? AND user_id = ?", linkID, user.ID).First(&link).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, LinkResponse{
				Success: false,
				Message: "Link not found",
				Error:   "NOT_FOUND",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to retrieve link",
			Error:   "DATABASE_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, LinkResponse{
		Success: true,
		Message: "Link retrieved successfully",
		Data: gin.H{
			"link": link,
		},
	})
}

// CreateLink creates a new link for the authenticated user
func (h *LinkHandler) CreateLink(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, LinkResponse{
			Success: false,
			Message: "Authentication required",
			Error:   "UNAUTHORIZED",
		})
		return
	}

	var req CreateLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, LinkResponse{
			Success: false,
			Message: "Invalid request data: " + err.Error(),
			Error:   "VALIDATION_ERROR",
		})
		return
	}

	// Validate color format if provided
	if req.Color != nil && !isValidHexColor(*req.Color) {
		c.JSON(http.StatusBadRequest, LinkResponse{
			Success: false,
			Message: "Invalid color format. Use hex format like #FF0000",
			Error:   "INVALID_COLOR",
		})
		return
	}

	// Check for duplicate platform (except Custom URL which can have multiple)
	if req.Icon != nil && *req.Icon != "link" {
		var existingLink models.Link
		err := h.db.Where("user_id = ? AND icon = ? AND is_active = ?", user.ID, *req.Icon, true).First(&existingLink).Error
		if err == nil {
			c.JSON(http.StatusBadRequest, LinkResponse{
				Success: false,
				Message: "You already have a link for this platform. Each platform can only be added once.",
				Error:   "DUPLICATE_PLATFORM",
			})
			return
		}
	}

	// Get the next order number
	var maxOrder int
	h.db.Model(&models.Link{}).
		Where("user_id = ?", user.ID).
		Select("COALESCE(MAX(\"order\"), 0)").
		Scan(&maxOrder)

	// Set default values
	linkType := models.LinkTypeDefault
	if req.Type != "" {
		linkType = req.Type
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	// Create the link
	link := models.Link{
		Title:       req.Title,
		URL:         req.URL,
		Description: req.Description,
		Type:        linkType,
		Icon:        req.Icon,
		ImageURL:    req.ImageURL,
		Color:       req.Color,
		IsActive:    isActive,
		Order:       maxOrder + 1,
		UserID:      user.ID,
		Clicks:      0,
	}

	if err := h.db.Create(&link).Error; err != nil {
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to create link",
			Error:   "DATABASE_ERROR",
		})
		return
	}

	// No cache to clear since we removed caching

	c.JSON(http.StatusCreated, LinkResponse{
		Success: true,
		Message: "Link created successfully",
		Data: gin.H{
			"link": link,
		},
	})
}

// UpdateLink updates an existing link
func (h *LinkHandler) UpdateLink(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, LinkResponse{
			Success: false,
			Message: "Authentication required",
			Error:   "UNAUTHORIZED",
		})
		return
	}

	linkID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, LinkResponse{
			Success: false,
			Message: "Invalid link ID",
			Error:   "INVALID_ID",
		})
		return
	}

	var req UpdateLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, LinkResponse{
			Success: false,
			Message: "Invalid request data: " + err.Error(),
			Error:   "VALIDATION_ERROR",
		})
		return
	}

	// Validate color format if provided
	if req.Color != nil && !isValidHexColor(*req.Color) {
		c.JSON(http.StatusBadRequest, LinkResponse{
			Success: false,
			Message: "Invalid color format. Use hex format like #FF0000",
			Error:   "INVALID_COLOR",
		})
		return
	}

	// Find the link
	var link models.Link
	err = h.db.Where("id = ? AND user_id = ?", linkID, user.ID).First(&link).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, LinkResponse{
				Success: false,
				Message: "Link not found",
				Error:   "NOT_FOUND",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to find link",
			Error:   "DATABASE_ERROR",
		})
		return
	}

	// Prepare updates
	updates := make(map[string]interface{})
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.URL != nil {
		updates["url"] = *req.URL
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Type != nil {
		updates["type"] = *req.Type
	}
	if req.Icon != nil {
		updates["icon"] = *req.Icon
	}
	if req.ImageURL != nil {
		updates["image_url"] = *req.ImageURL
	}
	if req.Color != nil {
		updates["color"] = *req.Color
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}
	if req.Order != nil {
		updates["\"order\""] = *req.Order
	}
	updates["updated_at"] = time.Now()

	// Update the link
	err = h.db.Model(&link).Updates(updates).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to update link",
			Error:   "DATABASE_ERROR",
		})
		return
	}

	// Fetch updated link
	err = h.db.Where("id = ?", linkID).First(&link).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to retrieve updated link",
			Error:   "DATABASE_ERROR",
		})
		return
	}

	// No cache to clear since we removed caching

	c.JSON(http.StatusOK, LinkResponse{
		Success: true,
		Message: "Link updated successfully",
		Data: gin.H{
			"link": link,
		},
	})
}

// DeleteLink deletes a link
func (h *LinkHandler) DeleteLink(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, LinkResponse{
			Success: false,
			Message: "Authentication required",
			Error:   "UNAUTHORIZED",
		})
		return
	}

	linkID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, LinkResponse{
			Success: false,
			Message: "Invalid link ID",
			Error:   "INVALID_ID",
		})
		return
	}

	// Check if link exists and belongs to user
	var link models.Link
	err = h.db.Where("id = ? AND user_id = ?", linkID, user.ID).First(&link).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, LinkResponse{
				Success: false,
				Message: "Link not found",
				Error:   "NOT_FOUND",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to find link",
			Error:   "DATABASE_ERROR",
		})
		return
	}

	// Start transaction for safe deletion
	tx := h.db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to start transaction",
			Error:   "DATABASE_ERROR",
		})
		return
	}
	defer tx.Rollback()

	// First delete all related link clicks
	err = tx.Where("link_id = ?", linkID).Delete(&models.LinkClick{}).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to delete link analytics",
			Error:   "DATABASE_ERROR",
		})
		return
	}

	// Then delete the link
	err = tx.Delete(&link).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to delete link",
			Error:   "DATABASE_ERROR",
		})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to commit deletion",
			Error:   "DATABASE_ERROR",
		})
		return
	}

	// No cache to clear since we removed caching

	c.JSON(http.StatusOK, LinkResponse{
		Success: true,
		Message: "Link deleted successfully",
	})
}

// TrackClick records a click on a link and increments the click counter
func (h *LinkHandler) TrackClick(c *gin.Context) {
	linkID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, LinkResponse{
			Success: false,
			Message: "Invalid link ID",
			Error:   "INVALID_ID",
		})
		return
	}

	// Find the link
	var link models.Link
	err = h.db.Where("id = ? AND is_active = ?", linkID, true).First(&link).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, LinkResponse{
				Success: false,
				Message: "Link not found or inactive",
				Error:   "NOT_FOUND",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to find link",
			Error:   "DATABASE_ERROR",
		})
		return
	}

	// Extract analytics data from request
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	referer := c.GetHeader("Referer")
	sessionID := c.GetHeader("X-Session-ID")

	// Create click record
	linkClick := models.LinkClick{
		LinkID:    uint(linkID),
		IPAddress: &ipAddress,
		UserAgent: &userAgent,
		Referer:   &referer,
		SessionID: &sessionID,
		// TODO: Add geolocation data (Country, City) using IP service
		// TODO: Add device/browser detection
	}

	// Save click record (database triggers will automatically update counters)
	err = h.db.Create(&linkClick).Error
	if err != nil {
		// Log error but don't fail the request
		fmt.Printf("Failed to save click analytics for link %d: %v\n", linkID, err)
	}

	// No cache to clear since we removed caching

	c.JSON(http.StatusOK, LinkResponse{
		Success: true,
		Message: "Click tracked successfully",
		Data: gin.H{
			"link_id": linkID,
		},
	})
}

// ReorderLinks updates the order of multiple links
func (h *LinkHandler) ReorderLinks(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, LinkResponse{
			Success: false,
			Message: "Authentication required",
			Error:   "UNAUTHORIZED",
		})
		return
	}

	type ReorderRequest struct {
		Links []struct {
			ID    uint `json:"id" binding:"required"`
			Order int  `json:"order" binding:"required"`
		} `json:"links" binding:"required"`
	}

	var req ReorderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, LinkResponse{
			Success: false,
			Message: "Invalid request data: " + err.Error(),
			Error:   "VALIDATION_ERROR",
		})
		return
	}

	// Start transaction
	tx := h.db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to start transaction",
			Error:   "DATABASE_ERROR",
		})
		return
	}
	defer tx.Rollback()

	// Update each link's order
	for _, linkOrder := range req.Links {
		err := tx.Model(&models.Link{}).
			Where("id = ? AND user_id = ?", linkOrder.ID, user.ID).
			Update("\"order\"", linkOrder.Order).Error
		if err != nil {
			c.JSON(http.StatusInternalServerError, LinkResponse{
				Success: false,
				Message: "Failed to update link order",
				Error:   "DATABASE_ERROR",
			})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to commit changes",
			Error:   "DATABASE_ERROR",
		})
		return
	}

	// No cache to clear since we removed caching

	c.JSON(http.StatusOK, LinkResponse{
		Success: true,
		Message: "Links reordered successfully",
	})
}

// GetPublicUserLinks retrieves all active links for a public user by username
func (h *LinkHandler) GetPublicUserLinks(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, LinkResponse{
			Success: false,
			Message: "Username is required",
			Error:   "INVALID_USERNAME",
		})
		return
	}

	// Skip cache and get fresh data directly from database
	var user models.User
	err := h.db.Where("username = ? AND is_active = ? AND is_public = ?", username, true, true).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, LinkResponse{
				Success: false,
				Message: "User not found or profile is private",
				Error:   "USER_NOT_FOUND",
			})
		} else {
			c.JSON(http.StatusInternalServerError, LinkResponse{
				Success: false,
				Message: "Failed to find user",
				Error:   "DATABASE_ERROR",
			})
		}
		return
	}

	// Get user's active links
	var links []models.Link
	err = h.db.Where("user_id = ? AND is_active = ?", user.ID, true).
		Order("\"order\" ASC, created_at ASC").
		Find(&links).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, LinkResponse{
			Success: false,
			Message: "Failed to retrieve links",
			Error:   "DATABASE_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, LinkResponse{
		Success: true,
		Message: "Links retrieved successfully",
		Data: gin.H{
			"links": links,
		},
	})
}

// Note: isValidHexColor function is imported from dashboard.go

// Helper function to clear user links cache
func (h *LinkHandler) clearUserLinksCache(userID uint) {
	if h.redisClient != nil {
		cacheKey := fmt.Sprintf("links:user:%d", userID)
		h.redisClient.Delete(cacheKey)
	}
}