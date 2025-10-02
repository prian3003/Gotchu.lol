package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"time"

	"gotchu-backend/internal/middleware"
	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/discord"
	"gotchu-backend/pkg/badges"

	"github.com/gin-gonic/gin"
	"gotchu-backend/pkg/redis"
	"gorm.io/gorm"
)

// DiscordHandler handles Discord OAuth2 authentication
type DiscordHandler struct {
	db            *gorm.DB
	redisClient   *redis.Client
	discordService *discord.Service
	badgeService  *badges.Service
}

// NewDiscordHandler creates a new Discord handler
func NewDiscordHandler(db *gorm.DB, redisClient *redis.Client, discordService *discord.Service) *DiscordHandler {
	return &DiscordHandler{
		db:            db,
		redisClient:   redisClient,
		discordService: discordService,
		badgeService:  badges.NewService(db),
	}
}

// DiscordResponse represents API response structure
type DiscordResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// InitiateDiscordAuth starts the Discord OAuth2 flow
func (h *DiscordHandler) InitiateDiscordAuth(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, DiscordResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	// Generate a random state parameter
	state := generateRandomState()
	
	// Store state in Redis with user ID for 10 minutes
	stateKey := "discord_auth_state:" + state
	err := h.redisClient.Set(stateKey, user.ID, 10*time.Minute)
	if err != nil {
		c.JSON(http.StatusInternalServerError, DiscordResponse{
			Success: false,
			Message: "Failed to initiate Discord authentication",
			Error:   err.Error(),
		})
		return
	}

	authURL := h.discordService.GetAuthURL(state)

	c.JSON(http.StatusOK, DiscordResponse{
		Success: true,
		Message: "Discord authentication URL generated",
		Data: gin.H{
			"auth_url": authURL,
			"state":    state,
		},
	})
}

// DiscordCallback handles the Discord OAuth2 callback
func (h *DiscordHandler) DiscordCallback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")
	errorParam := c.Query("error")

	if errorParam != "" {
		c.JSON(http.StatusBadRequest, DiscordResponse{
			Success: false,
			Message: "Discord authentication failed",
			Error:   errorParam,
		})
		return
	}

	if code == "" || state == "" {
		c.JSON(http.StatusBadRequest, DiscordResponse{
			Success: false,
			Message: "Missing authorization code or state parameter",
		})
		return
	}

	// Verify state and get user ID
	stateKey := "discord_auth_state:" + state
	var userID uint
	err := h.redisClient.Get(stateKey, &userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, DiscordResponse{
			Success: false,
			Message: "Invalid or expired state parameter",
		})
		return
	}

	// Delete the state from Redis
	h.redisClient.Delete(stateKey)

	// Exchange code for token
	tokenResp, err := h.discordService.ExchangeCodeForToken(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, DiscordResponse{
			Success: false,
			Message: "Failed to exchange authorization code",
			Error:   err.Error(),
		})
		return
	}

	// Get Discord user info
	discordUser, err := h.discordService.GetUser(tokenResp.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, DiscordResponse{
			Success: false,
			Message: "Failed to get Discord user information",
			Error:   err.Error(),
		})
		return
	}

	// Check guild membership and booster status
	isBooster, boostingSince, err := h.discordService.IsBooster(discordUser.ID)
	if err != nil {
		// Log error but don't fail the connection
		// Guild membership check is optional
	}

	// Update user with Discord information
	var user models.User
	err = h.db.First(&user, userID).Error
	if err != nil {
		c.JSON(http.StatusNotFound, DiscordResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}

	// Update Discord fields
	user.DiscordID = &discordUser.ID
	user.DiscordUsername = &discordUser.Username
	user.DiscordAvatar = &discordUser.Avatar
	user.DiscordLoginEnabled = true
	user.IsBooster = isBooster
	if boostingSince != nil {
		user.BoostingSince = boostingSince
	}

	// Save the updated user
	err = h.db.Save(&user).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, DiscordResponse{
			Success: false,
			Message: "Failed to save Discord connection",
			Error:   err.Error(),
		})
		return
	}

	// Check and award badges after Discord connection
	go func() {
		if _, err := h.badgeService.CheckAndMarkClaimable(user.ID); err != nil {
			fmt.Printf("Error checking badges after Discord connection for user %d: %v\n", user.ID, err)
		}
	}()

	// Redirect to frontend with success
	frontendURL := "http://localhost:5173/dashboard?discord_connected=true"
	c.Redirect(http.StatusFound, frontendURL)
}

// DisconnectDiscord removes Discord connection from user account
func (h *DiscordHandler) DisconnectDiscord(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, DiscordResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	// Clear Discord fields - use Select to ensure nil values are updated
	err := h.db.Model(&user).Select("discord_id", "discord_username", "discord_avatar", "discord_login_enabled", "is_booster", "boosting_since", "use_discord_avatar", "discord_avatar_decoration", "discord_presence").Updates(models.User{
		DiscordID:            nil,
		DiscordUsername:      nil,
		DiscordAvatar:        nil,
		DiscordLoginEnabled:  false,
		IsBooster:            false,
		BoostingSince:        nil,
		UseDiscordAvatar:     false,
		DiscordAvatarDecoration: false,
		DiscordPresence:      false,
	}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, DiscordResponse{
			Success: false,
			Message: "Failed to disconnect Discord",
			Error:   err.Error(),
		})
		return
	}

	// Debug: Verify the fields were cleared
	var updatedUser models.User
	h.db.First(&updatedUser, user.ID)
	fmt.Printf("DEBUG: After disconnect - User %d DiscordID: %v, Username: %v\n", 
		updatedUser.ID, updatedUser.DiscordID, updatedUser.DiscordUsername)

	c.JSON(http.StatusOK, DiscordResponse{
		Success: true,
		Message: "Discord account disconnected successfully",
	})
}

// GetDiscordStatus returns the current Discord connection status
func (h *DiscordHandler) GetDiscordStatus(c *gin.Context) {
	contextUser, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, DiscordResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	// Fetch fresh user data from database to get latest Discord info
	var user models.User
	err := h.db.First(&user, contextUser.ID).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, DiscordResponse{
			Success: false,
			Message: "Failed to fetch user data",
			Error:   err.Error(),
		})
		return
	}

	// Debug logging
	fmt.Printf("DEBUG: Discord status for user %d: DiscordID=%v, Username=%v, LoginEnabled=%v\n", 
		user.ID, user.DiscordID, user.DiscordUsername, user.DiscordLoginEnabled)

	var avatarURL *string
	if user.DiscordID != nil {
		// Always provide Discord avatar URL when connected (regardless of UseDiscordAvatar setting)
		// The UseDiscordAvatar setting controls whether it's used as profile avatar, not whether we can access it
		avatarHash := ""
		if user.DiscordAvatar != nil {
			avatarHash = *user.DiscordAvatar
		}
		url := h.discordService.GetAvatarURL(*user.DiscordID, avatarHash, 128)
		avatarURL = &url
	}

	c.JSON(http.StatusOK, DiscordResponse{
		Success: true,
		Message: "Discord status retrieved",
		Data: gin.H{
			"connected":        user.DiscordID != nil,
			"discord_id":       user.DiscordID,
			"discord_username": user.DiscordUsername,
			"is_booster":       user.IsBooster,
			"boosting_since":   user.BoostingSince,
			"avatar_url":       avatarURL,
			"use_discord_avatar": user.UseDiscordAvatar,
			"discord_presence": user.DiscordPresence,
			"avatar_decoration": user.DiscordAvatarDecoration,
		},
	})
}

// RefreshDiscordData refreshes Discord user data (booster status, etc.)
func (h *DiscordHandler) RefreshDiscordData(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, DiscordResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	if user.DiscordID == nil {
		c.JSON(http.StatusBadRequest, DiscordResponse{
			Success: false,
			Message: "Discord account not connected",
		})
		return
	}

	// Check current booster status
	isBooster, boostingSince, err := h.discordService.IsBooster(*user.DiscordID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, DiscordResponse{
			Success: false,
			Message: "Failed to refresh Discord data",
			Error:   err.Error(),
		})
		return
	}

	// Update booster status
	user.IsBooster = isBooster
	if boostingSince != nil {
		user.BoostingSince = boostingSince
	} else {
		user.BoostingSince = nil
	}

	err = h.db.Save(&user).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, DiscordResponse{
			Success: false,
			Message: "Failed to save updated Discord data",
			Error:   err.Error(),
		})
		return
	}

	// Check and award badges after Discord data refresh
	go func() {
		if _, err := h.badgeService.CheckAndMarkClaimable(user.ID); err != nil {
			fmt.Printf("Error checking badges after Discord refresh for user %d: %v\n", user.ID, err)
		}
	}()

	c.JSON(http.StatusOK, DiscordResponse{
		Success: true,
		Message: "Discord data refreshed successfully",
		Data: gin.H{
			"is_booster":     user.IsBooster,
			"boosting_since": user.BoostingSince,
		},
	})
}

// generateRandomState generates a random state parameter for OAuth2
func generateRandomState() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}