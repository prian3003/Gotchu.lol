package handlers

import (
	"net/http"
	"time"

	"gotchu-backend/pkg/discordbot"

	"github.com/gin-gonic/gin"
)

// DiscordBotHandler handles Discord bot related endpoints
type DiscordBotHandler struct {
	botService *discordbot.DiscordBotService
}

// NewDiscordBotHandler creates a new Discord bot handler
func NewDiscordBotHandler(botService *discordbot.DiscordBotService) *DiscordBotHandler {
	return &DiscordBotHandler{
		botService: botService,
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