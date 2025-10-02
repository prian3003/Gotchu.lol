package handlers

import (
	"net/http"
	"time"

	"gotchu-backend/pkg/discord"
	"gotchu-backend/pkg/discordbot"

	"github.com/gin-gonic/gin"
)

// DiscordBotHandler handles Discord bot related endpoints
type DiscordBotHandler struct {
	botService     *discordbot.DiscordBotService
	discordService *discord.Service
}

// NewDiscordBotHandler creates a new Discord bot handler
func NewDiscordBotHandler(botService *discordbot.DiscordBotService, discordService *discord.Service) *DiscordBotHandler {
	return &DiscordBotHandler{
		botService:     botService,
		discordService: discordService,
	}
}

// PresenceResponse represents the API response structure
type PresenceResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// GetUserPresence returns the presence status for a specific user
func (h *DiscordBotHandler) GetUserPresence(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		c.JSON(http.StatusBadRequest, PresenceResponse{
			Success: false,
			Message: "User ID is required",
		})
		return
	}

	// Get presence data
	presence, err := h.botService.GetUserPresence(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, PresenceResponse{
			Success: false,
			Message: "Failed to get user presence",
			Error:   err.Error(),
		})
		return
	}

	if presence == nil {
		c.JSON(http.StatusNotFound, PresenceResponse{
			Success: false,
			Message: "User presence not found",
		})
		return
	}

	c.JSON(http.StatusOK, PresenceResponse{
		Success: true,
		Message: "Presence retrieved successfully",
		Data: gin.H{
			"user_id":    presence.UserID,
			"status":     presence.Status,
			"activities": presence.Activities,
			"last_seen":  presence.LastSeen,
			"updated_at": presence.UpdatedAt,
		},
	})
}

// GetAllPresences returns all tracked presences
func (h *DiscordBotHandler) GetAllPresences(c *gin.Context) {
	presences := h.botService.GetAllPresences()

	// Convert to API-friendly format
	result := make(map[string]interface{})
	for userID, presence := range presences {
		result[userID] = gin.H{
			"status":     presence.Status,
			"activities": presence.Activities,
			"last_seen":  presence.LastSeen,
			"updated_at": presence.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, PresenceResponse{
		Success: true,
		Message: "All presences retrieved successfully",
		Data:    result,
	})
}

// GetBotStatus returns the current status of the Discord bot
func (h *DiscordBotHandler) GetBotStatus(c *gin.Context) {
	isRunning := h.botService.IsRunning()
	
	c.JSON(http.StatusOK, PresenceResponse{
		Success: true,
		Message: "Bot status retrieved successfully",
		Data: gin.H{
			"running":    isRunning,
			"timestamp":  time.Now(),
		},
	})
}

// StartBot starts the Discord bot service
func (h *DiscordBotHandler) StartBot(c *gin.Context) {
	if h.botService.IsRunning() {
		c.JSON(http.StatusConflict, PresenceResponse{
			Success: false,
			Message: "Bot is already running",
		})
		return
	}

	err := h.botService.Start()
	if err != nil {
		c.JSON(http.StatusInternalServerError, PresenceResponse{
			Success: false,
			Message: "Failed to start bot",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, PresenceResponse{
		Success: true,
		Message: "Bot started successfully",
	})
}

// StopBot stops the Discord bot service
func (h *DiscordBotHandler) StopBot(c *gin.Context) {
	if !h.botService.IsRunning() {
		c.JSON(http.StatusConflict, PresenceResponse{
			Success: false,
			Message: "Bot is not running",
		})
		return
	}

	h.botService.Stop()

	c.JSON(http.StatusOK, PresenceResponse{
		Success: true,
		Message: "Bot stopped successfully",
	})
}

// GetDiscordBadges returns Discord badges for a specific Discord user ID
func (h *DiscordBotHandler) GetDiscordBadges(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		c.JSON(http.StatusBadRequest, PresenceResponse{
			Success: false,
			Message: "Discord User ID is required",
		})
		return
	}


	// Get user info from Discord to retrieve public flags
	// Note: This would require OAuth token for specific user, 
	// so we'll need to modify approach for production use
	// For now, we'll demonstrate with a placeholder implementation
	
	// In a real implementation, you would:
	// 1. Get the user's Discord OAuth token from your database
	// 2. Use that token to fetch user info with public flags
	// 3. Parse the public_flags field to get badges
	
	// For demonstration, let's assume we have some way to get public flags
	// This is a simplified version - in production you'd need proper OAuth flow
	
	// Placeholder response - in real implementation you'd fetch user data
	// and extract public_flags from the Discord API response
	// For demo purposes, let's simulate some common Discord badges
	publicFlags := discord.EarlySupporter | discord.HouseBravery // Demo badges
	
	// Get Discord badges from public flags
	badges := discord.GetDiscordBadges(publicFlags)
	

	c.JSON(http.StatusOK, PresenceResponse{
		Success: true,
		Message: "Discord badges retrieved successfully",
		Data: gin.H{
			"user_id": userID,
			"badges":  badges,
			"count":   len(badges),
		},
	})
}

// GetDiscordUser returns basic Discord user info for display purposes
func (h *DiscordBotHandler) GetDiscordUser(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		c.JSON(http.StatusBadRequest, PresenceResponse{
			Success: false,
			Message: "Discord User ID is required",
		})
		return
	}

	// For now, we'll return basic info that can be constructed from the user ID
	// In a production environment, you might want to cache Discord user info
	// or fetch it through proper Discord API calls with bot permissions
	
	// Generate default avatar URL
	avatarURL := h.discordService.GetAvatarURL(userID, "", 128)

	c.JSON(http.StatusOK, PresenceResponse{
		Success: true,
		Message: "Discord user info retrieved successfully",
		Data: gin.H{
			"user_id":    userID,
			"username":   "", // Would need API call to get actual username
			"avatar":     "",
			"avatar_url": avatarURL,
		},
	})
}