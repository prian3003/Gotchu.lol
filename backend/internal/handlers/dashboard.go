package handlers

import (
	"context"
	"fmt"
	"net/http"
	net_url "net/url"
	"path/filepath"
	"strings"
	"time"

	"gotchu-backend/internal/config"
	"gotchu-backend/internal/middleware"
	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/analytics"
	"gotchu-backend/pkg/discordbot"
	"gotchu-backend/pkg/redis"
	"gotchu-backend/pkg/storage"
	"gotchu-backend/pkg/workers"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// DashboardHandler handles dashboard endpoints
type DashboardHandler struct {
	db          *gorm.DB
	redisClient *redis.Client
	storage     *storage.SupabaseStorage
	config      *config.Config
	geoService  *analytics.GeoLocationService
	discordBot  *discordbot.DiscordBotService
	workerPool  *workers.WorkerPool
}

// NewDashboardHandler creates a new dashboard handler
func NewDashboardHandler(db *gorm.DB, redisClient *redis.Client, cfg *config.Config, discordBot *discordbot.DiscordBotService, workerPool *workers.WorkerPool) *DashboardHandler {
	supabaseStorage := storage.NewSupabaseStorage(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey, cfg.SupabaseAnonKey)
	return &DashboardHandler{
		db:          db,
		redisClient: redisClient,
		storage:     supabaseStorage,
		config:      cfg,
		geoService:  analytics.NewGeoLocationService(),
		discordBot:  discordBot,
		workerPool:  workerPool,
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

	// Cache key for dashboard data
	cacheKey := fmt.Sprintf("dashboard:user:%d", user.ID)
	
	// Check if this is a cache-busting request (from settings page)
	bypassCache := c.Query("t") != ""
	if bypassCache {
		fmt.Printf("Cache bypass requested for user %d (timestamp: %s)\n", user.ID, c.Query("t"))
	}
	
	// Try to get cached data first (unless bypassing cache)
	if h.redisClient != nil && !bypassCache {
		var cachedResponse DashboardResponse
		err := h.redisClient.Get(cacheKey, &cachedResponse)
		if err == nil {
			fmt.Printf("Dashboard cache hit for user %d\n", user.ID)
			// Verify the cached response has the correct structure
			if cachedResponse.Success {
				c.JSON(http.StatusOK, cachedResponse)
				return
			} else {
				fmt.Printf("Dashboard cache hit for user %d but cached response invalid, clearing cache\n", user.ID)
				h.redisClient.Delete(cacheKey)
			}
		}
	}

	fmt.Printf("Dashboard cache miss for user %d, fetching from database\n", user.ID)
	
	// DEBUG: Log current user data from middleware before any processing
	fmt.Printf("DEBUG - Raw user from middleware - ID: %d, Username: %s, ProfileViews: %d, TotalClicks: %d, MfaEnabled: %t\n", 
		user.ID, user.Username, user.ProfileViews, user.TotalClicks, user.MfaEnabled)

	// Always get fresh user data from database to ensure ProfileViews and other stats are current
	var dbUser models.User
	if err := h.db.Where("id = ?", user.ID).First(&dbUser).Error; err == nil {
		fmt.Printf("DEBUG - Raw database query result - ID: %d, Username: %s, ProfileViews: %d, TotalClicks: %d\n", 
			dbUser.ID, dbUser.Username, dbUser.ProfileViews, dbUser.TotalClicks)
		
		// Also do a direct SQL query to double-check
		var directProfileViews int
		h.db.Raw("SELECT profile_views FROM users WHERE id = ?", user.ID).Scan(&directProfileViews)
		fmt.Printf("DEBUG - Direct SQL query profile_views: %d\n", directProfileViews)
		
		user = &dbUser
		fmt.Printf("DEBUG - Fresh user assigned - ID: %d, Username: %s, ProfileViews: %d, TotalClicks: %d\n", 
			user.ID, user.Username, user.ProfileViews, user.TotalClicks)
	} else {
		fmt.Printf("ERROR - Failed to load fresh user data: %v\n", err)
	}

	// Get additional statistics with single query using CTE
	type StatsCounts struct {
		LinksCount int64 `json:"links_count"`
		FilesCount int64 `json:"files_count"`
	}
	
	var statsCounts StatsCounts
	result := h.db.Raw(`
		WITH stats AS (
			SELECT 
				(SELECT COUNT(*) FROM links WHERE user_id = ? AND is_active = true) as links_count,
				(SELECT COUNT(*) FROM files WHERE user_id = ?) as files_count
		)
		SELECT links_count, files_count FROM stats
	`, user.ID, user.ID).Scan(&statsCounts)
	
	if result.Error != nil {
		// Fallback to separate queries if CTE fails
		h.db.Model(&models.Link{}).Where("user_id = ? AND is_active = ?", user.ID, true).Count(&statsCounts.LinksCount)
		h.db.Model(&models.File{}).Where("user_id = ?", user.ID).Count(&statsCounts.FilesCount)
	}

	// Prepare stats
	stats := DashboardStats{
		ProfileViews: user.ProfileViews,
		TotalClicks:  user.TotalClicks,
		JoinDate:     user.CreatedAt,
		LastActive:   user.LastLoginAt,
		LinksCount:   int(statsCounts.LinksCount),
		FilesCount:   int(statsCounts.FilesCount),
	}

	// Prepare user data for dashboard
	var email string
	if user.Email != nil {
		email = *user.Email
	}
	
	userProfile := gin.H{
		"id":           user.ID,
		"uid":          user.ID,
		"username":     user.Username,
		"email":        email,
		"display_name": user.DisplayName,
		"bio":          user.Bio,
		"alias":        user.Alias,
		"avatar_url":   user.AvatarURL,
		"is_verified":  user.IsVerified,
		"is_premium":   user.Plan == "premium",
		"plan":         user.Plan,
		"theme":        user.Theme,
		"mfa_enabled":  user.MfaEnabled,
		"created_at":   user.CreatedAt,
		"profile_views": user.ProfileViews,
		"profile_completion": calculateProfileCompletion(user),
	}

	response := DashboardResponse{
		Success: true,
		Message: "Dashboard data retrieved successfully",
		Data: gin.H{
			"user":  userProfile,
			"stats": stats,
		},
	}

	// DEBUG: Log the userProfile data being returned
	fmt.Printf("DEBUG - userProfile being returned: ID=%v, Username=%v, MfaEnabled=%v, Bio=%v\n",
		userProfile["id"], userProfile["username"], userProfile["mfa_enabled"], userProfile["bio"])

	// Cache the response for 5 minutes (unless bypassing cache)
	if h.redisClient != nil && !bypassCache {
		err := h.redisClient.Set(cacheKey, response, 5*time.Minute)
		if err == nil {
			fmt.Printf("Dashboard data cached for user %d\n", user.ID)
		} else {
			fmt.Printf("Failed to cache dashboard data for user %d: %v\n", user.ID, err)
		}
	}

	c.JSON(http.StatusOK, response)
}

// GetUserProfile returns public user profile by username
func (h *DashboardHandler) GetUserProfile(c *gin.Context) {
	username := c.Param("username")
	fmt.Printf("DEBUG: GetUserProfile called for username: '%s'\n", username)
	if username == "" {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: "Username is required",
		})
		return
	}

	// Single optimized query: find user by username/alias AND preload links in one operation
	var user models.User
	err := h.db.Preload("Links", "is_active = ? ORDER BY \"order\" ASC, created_at ASC", true).
		Where("(username = ? OR alias = ?) AND is_active = ?", username, username, true).
		First(&user).Error
	
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

	links := user.Links

	// Track unique profile view if not viewing own profile (non-blocking)
	if !isAuthenticated || currentUser.ID != user.ID {
		h.workerPool.SubmitFunc(fmt.Sprintf("track-view-%d", user.ID), func() error {
			h.trackProfileView(c, user.ID)
			return nil
		})
	}

	// Prepare base profile data
	profileData := gin.H{
		"id":            user.ID,
		"username":      user.Username,
		"alias":         user.Alias,
		"display_name":  user.DisplayName,
		"bio":           user.Bio,
		"avatar_url":    user.AvatarURL,
		"is_verified":   user.IsVerified,
		"theme":         user.Theme,
		"profile_views": user.ProfileViews,
		"created_at":    user.CreatedAt,
		"links":         links,
		
		// Discord data
		"discord_id":       user.DiscordID,
		"discord_username": user.DiscordUsername,
		"discord_avatar":   user.DiscordAvatar,
		"is_booster":       user.IsBooster,
		"boosting_since":   user.BoostingSince,
	}

	// Channel for Discord presence (non-blocking optimization)
	type presenceResult struct {
		data gin.H
		ok   bool
	}
	presenceChan := make(chan presenceResult, 1)
	
	// Start Discord presence fetch in background if available
	if user.DiscordID != nil && h.discordBot != nil && h.discordBot.IsRunning() {
		go func() {
			if presence, err := h.discordBot.GetUserPresence(*user.DiscordID); err == nil && presence != nil {
				presenceChan <- presenceResult{
					data: gin.H{
						"status":      presence.Status,
						"activities":  presence.Activities,
						"last_seen":   presence.LastSeen,
						"updated_at":  presence.UpdatedAt,
					},
					ok: true,
				}
			} else {
				presenceChan <- presenceResult{ok: false}
			}
		}()
	} else {
		presenceChan <- presenceResult{ok: false}
	}

	// Wait for Discord presence with timeout (50ms max for responsiveness)
	select {
	case result := <-presenceChan:
		if result.ok {
			profileData["discord_presence"] = result.data
		}
	case <-time.After(50 * time.Millisecond):
		// Continue without Discord presence to maintain fast response times
	}
	
	// Add customization settings
	profileData["customization"] = gin.H{
			// Colors & Theme
			"accent_color":     user.AccentColor,
			"text_color":       user.TextColor,
			"background_color": user.BackgroundColor,
			"primary_color":    user.PrimaryColor,
			"secondary_color":  user.SecondaryColor,
			"icon_color":       user.IconColor,
			
			// Effects
			"background_effect": getStringValue(user.BackgroundEffect),
			"username_effect":   getStringValue(user.UsernameEffect),
			"show_badges":       user.ShowBadges,
			
			// Visual Settings
			"profile_blur":     user.ProfileBlur,
			"profile_opacity":  user.ProfileOpacity,
			"profile_gradient": user.ProfileGradient,
			
			// Glow Effects
			"glow_username": user.GlowUsername,
			"glow_socials":  user.GlowSocials,
			"glow_badges":   user.GlowBadges,
			
			// Animations & Effects
			"animated_title":   user.AnimatedTitle,
			"monochrome_icons": user.MonochromeIcons,
			"swap_box_colors":  user.SwapBoxColors,
			
			// Audio (for public profiles, just show if enabled)
			"volume_level":   user.VolumeLevel,
			"volume_control": user.VolumeControl,
			
			// Discord Integration
			"discord_presence":          user.DiscordPresence,
			"use_discord_avatar":        user.UseDiscordAvatar,
			"discord_avatar_decoration": user.DiscordAvatarDecoration,
			
			// Asset URLs (public)
			"background_url": getStringValue(user.BackgroundURL),
			"audio_url":      getStringValue(user.AudioURL),
			"cursor_url":     getStringValue(user.CustomCursorURL),
			
			// Typography
			"text_font":      getStringValue(user.TextFont),
			
			// Splash Screen Settings
			"enable_splash_screen":      user.EnableSplashScreen,
			"splash_text":              getStringValue(user.SplashText),
			"splash_font_size":         getStringValue(user.SplashFontSize),
			"splash_animated":          user.SplashAnimated,
			"splash_glow_effect":       user.SplashGlowEffect,
			"splash_show_particles":    user.SplashShowParticles,
			"splash_auto_hide":         user.SplashAutoHide,
			"splash_auto_hide_delay":   user.SplashAutoHideDelay,
			"splash_background_visible": user.SplashBackgroundVisible,
			"splash_background_color":  getStringValue(user.SplashBackgroundColor),
			"splash_transparent":       user.SplashTransparent,
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

// Helper function to safely get string value from pointer
func getStringValue(ptr *string) string {
	if ptr == nil {
		return ""
	}
	return *ptr
}


// Helper function to check if slice contains string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// Helper function to validate hex color format
func isValidHexColor(color string) bool {
	if len(color) != 7 || color[0] != '#' {
		return false
	}
	for i := 1; i < 7; i++ {
		c := color[i]
		if !((c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f')) {
			return false
		}
	}
	return true
}

// validateCustomizationSettings validates customization settings
func validateCustomizationSettings(settings *CustomizationSettings) error {
	// Validate theme
	validThemes := []string{"light", "dark", "auto"}
	if !contains(validThemes, settings.Theme) {
		return fmt.Errorf("invalid theme: %s", settings.Theme)
	}

	// Validate color formats (hex colors)
	colorFields := []struct {
		name  string
		value string
	}{
		{"accent_color", settings.AccentColor},
		{"text_color", settings.TextColor},
		{"background_color", settings.BackgroundColor},
		{"primary_color", settings.PrimaryColor},
		{"secondary_color", settings.SecondaryColor},
		{"icon_color", settings.IconColor},
	}

	for _, field := range colorFields {
		if !isValidHexColor(field.value) {
			return fmt.Errorf("invalid %s format: %s", field.name, field.value)
		}
	}

	// Validate numeric ranges
	if settings.ProfileBlur < 0 || settings.ProfileBlur > 50 {
		return fmt.Errorf("profile_blur must be between 0 and 50")
	}

	if settings.ProfileOpacity < 0 || settings.ProfileOpacity > 100 {
		return fmt.Errorf("profile_opacity must be between 0 and 100")
	}

	if settings.VolumeLevel < 0 || settings.VolumeLevel > 100 {
		return fmt.Errorf("volume_level must be between 0 and 100")
	}

	// Validate effects
	validBackgroundEffects := []string{"", "none", "particles", "rain", "snow", "matrix", "waves", "gradient", "geometric"}
	if settings.BackgroundEffect != "" && !contains(validBackgroundEffects, settings.BackgroundEffect) {
		return fmt.Errorf("invalid background_effect: %s", settings.BackgroundEffect)
	}

	validUsernameEffects := []string{"", "none", "glow", "rainbow", "typewriter", "bounce", "fade"}
	if settings.UsernameEffect != "" && !contains(validUsernameEffects, settings.UsernameEffect) {
		return fmt.Errorf("invalid username_effect: %s", settings.UsernameEffect)
	}

	// Validate text font length
	if len(settings.TextFont) > 100 {
		return fmt.Errorf("text_font length cannot exceed 100 characters")
	}

	return nil
}

// CustomizationSettings represents user customization preferences
type CustomizationSettings struct {
	// Basic Theme
	Theme           string `json:"theme"`
	AccentColor     string `json:"accent_color"`
	TextColor       string `json:"text_color"`
	BackgroundColor string `json:"background_color"`
	PrimaryColor    string `json:"primary_color"`
	SecondaryColor  string `json:"secondary_color"`
	IconColor       string `json:"icon_color"`

	// Effects
	BackgroundEffect string `json:"background_effect"`
	UsernameEffect   string `json:"username_effect"`
	ShowBadges       bool   `json:"show_badges"`
	
	// Visual Settings
	ProfileBlur     int `json:"profile_blur"`
	ProfileOpacity  int `json:"profile_opacity"`
	ProfileGradient bool `json:"profile_gradient"`
	
	// Glow Effects
	GlowUsername bool `json:"glow_username"`
	GlowSocials  bool `json:"glow_socials"`
	GlowBadges   bool `json:"glow_badges"`
	
	// Animations & Effects
	AnimatedTitle   bool `json:"animated_title"`
	MonochromeIcons bool `json:"monochrome_icons"`
	SwapBoxColors   bool `json:"swap_box_colors"`
	
	// Audio
	VolumeLevel   int  `json:"volume_level"`
	VolumeControl bool `json:"volume_control"`
	
	// Discord Integration
	DiscordPresence         bool `json:"discord_presence"`
	UseDiscordAvatar        bool `json:"use_discord_avatar"`
	DiscordAvatarDecoration bool `json:"discord_avatar_decoration"`
	
	// Asset URLs
	BackgroundURL string `json:"background_url"`
	AudioURL      string `json:"audio_url"`
	CursorURL     string `json:"cursor_url"`
	
	// Profile Information
	Description   string `json:"description"`
	Bio           string `json:"bio"`
	
	// Typography
	TextFont      string `json:"text_font"`
	
	// Splash Screen Settings
	EnableSplashScreen      bool   `json:"enable_splash_screen"`
	SplashText              string `json:"splash_text"`
	SplashFontSize          string `json:"splash_font_size"`
	SplashAnimated          bool   `json:"splash_animated"`
	SplashGlowEffect        bool   `json:"splash_glow_effect"`
	SplashShowParticles     bool   `json:"splash_show_particles"`
	SplashAutoHide          bool   `json:"splash_auto_hide"`
	SplashAutoHideDelay     int    `json:"splash_auto_hide_delay"`
	SplashBackgroundVisible bool   `json:"splash_background_visible"`
	SplashBackgroundColor   string `json:"splash_background_color"`
	SplashTransparent       bool   `json:"splash_transparent"`
}

// SaveCustomizationSettings saves user customization preferences
func (h *DashboardHandler) SaveCustomizationSettings(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, DashboardResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	var settings CustomizationSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: "Invalid settings data: " + err.Error(),
		})
		return
	}

	// Validate settings
	if err := validateCustomizationSettings(&settings); err != nil {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: "Invalid settings: " + err.Error(),
		})
		return
	}

	// Update user in database with customization settings
	updates := map[string]interface{}{
		// Basic Theme
		"theme":            settings.Theme,
		"accent_color":     settings.AccentColor,
		"text_color":       settings.TextColor,
		"background_color": settings.BackgroundColor,
		"primary_color":    settings.PrimaryColor,
		"secondary_color":  settings.SecondaryColor,
		"icon_color":       settings.IconColor,
		
		// Effects
		"background_effect": settings.BackgroundEffect,
		"username_effect":   settings.UsernameEffect,
		"show_badges":       settings.ShowBadges,
		
		// Visual Settings
		"profile_blur":     settings.ProfileBlur,
		"profile_opacity":  settings.ProfileOpacity,
		"profile_gradient": settings.ProfileGradient,
		
		// Glow Effects
		"glow_username": settings.GlowUsername,
		"glow_socials":  settings.GlowSocials,
		"glow_badges":   settings.GlowBadges,
		
		// Animations & Effects
		"animated_title":   settings.AnimatedTitle,
		"monochrome_icons": settings.MonochromeIcons,
		"swap_box_colors":  settings.SwapBoxColors,
		
		// Audio
		"volume_level":   settings.VolumeLevel,
		"volume_control": settings.VolumeControl,
		
		// Discord Integration
		"discord_presence":          settings.DiscordPresence,
		"use_discord_avatar":        settings.UseDiscordAvatar,
		"discord_avatar_decoration": settings.DiscordAvatarDecoration,
		
		// Profile Information
		"description": settings.Description,
		"bio":         settings.Bio,
		
		// Typography
		"text_font": func() interface{} {
			if settings.TextFont != "" {
				return settings.TextFont
			}
			return nil
		}(),
		
		// Splash Screen Settings
		"enable_splash_screen":      settings.EnableSplashScreen,
		"splash_animated":           settings.SplashAnimated,
		"splash_glow_effect":        settings.SplashGlowEffect,
		"splash_show_particles":     settings.SplashShowParticles,
		"splash_auto_hide":          settings.SplashAutoHide,
		"splash_auto_hide_delay":    settings.SplashAutoHideDelay,
		"splash_background_visible": settings.SplashBackgroundVisible,
		"splash_transparent":        settings.SplashTransparent,
		
		// Timestamps
		"updated_at": time.Now(),
	}

	// Handle nullable fields
	if settings.BackgroundURL != "" {
		updates["background_url"] = settings.BackgroundURL
	} else {
		updates["background_url"] = nil
	}
	
	if settings.AudioURL != "" {
		updates["audio_url"] = settings.AudioURL
	} else {
		updates["audio_url"] = nil
	}
	
	if settings.CursorURL != "" {
		updates["custom_cursor_url"] = settings.CursorURL
	} else {
		updates["custom_cursor_url"] = nil
	}
	
	// Splash screen text fields
	if settings.SplashText != "" {
		updates["splash_text"] = settings.SplashText
	} else {
		updates["splash_text"] = nil
	}
	
	
	if settings.SplashFontSize != "" {
		updates["splash_font_size"] = settings.SplashFontSize
	} else {
		updates["splash_font_size"] = nil
	}
	
	// Splash background color field
	if settings.SplashBackgroundColor != "" {
		updates["splash_background_color"] = settings.SplashBackgroundColor
	} else {
		updates["splash_background_color"] = nil
	}

	// Update user in database
	err := h.db.Model(&models.User{}).Where("id = ?", user.ID).Updates(updates).Error
	if err != nil {
		fmt.Printf("Failed to update customization settings for user %d: %v\n", user.ID, err)
		c.JSON(http.StatusInternalServerError, DashboardResponse{
			Success: false,
			Message: "Failed to save settings to database",
		})
		return
	}

	// Clear cache to force refresh
	cacheKey := fmt.Sprintf("customization:user:%d", user.ID)
	if h.redisClient != nil {
		h.redisClient.Delete(cacheKey)
		// Also clear dashboard cache since user data changed
		dashboardCacheKey := fmt.Sprintf("dashboard:user:%d", user.ID)
		h.redisClient.Delete(dashboardCacheKey)
	}

	fmt.Printf("Customization settings saved to database for user %d\n", user.ID)

	c.JSON(http.StatusOK, DashboardResponse{
		Success: true,
		Message: "Customization settings saved successfully",
		Data: gin.H{
			"settings": settings,
		},
	})
}

// GetCustomizationSettings retrieves user customization preferences
func (h *DashboardHandler) GetCustomizationSettings(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, DashboardResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	// Cache key for user settings
	cacheKey := fmt.Sprintf("customization:user:%d", user.ID)
	
	// TEMPORARILY DISABLE CACHE to force fresh data loading
	// TODO: Re-enable after race condition is fixed
	/*
	// Try to get cached settings
	if h.redisClient != nil {
		var settings CustomizationSettings
		err := h.redisClient.Get(cacheKey, &settings)
		if err == nil {
			fmt.Printf("Customization settings cache hit for user %d\n", user.ID)
			c.JSON(http.StatusOK, DashboardResponse{
				Success: true,
				Message: "Customization settings retrieved successfully",
				Data: gin.H{
					"settings": settings,
				},
			})
			return
		}
	}
	*/

	// Get fresh user data from database
	var dbUser models.User
	err := h.db.Where("id = ?", user.ID).First(&dbUser).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, DashboardResponse{
			Success: false,
			Message: "Failed to retrieve user data",
		})
		return
	}

	// Debug log the database values
	fmt.Printf("Database boolean values for user %d: ShowBadges=%t, VolumeControl=%t, ProfileGradient=%t, GlowUsername=%t\n", 
		user.ID, dbUser.ShowBadges, dbUser.VolumeControl, dbUser.ProfileGradient, dbUser.GlowUsername)

	// Convert user model to CustomizationSettings with smart defaults
	settings := CustomizationSettings{
		// Basic Theme
		Theme:           dbUser.Theme,
		AccentColor:     dbUser.AccentColor,
		TextColor:       dbUser.TextColor,
		BackgroundColor: dbUser.BackgroundColor,
		PrimaryColor:    dbUser.PrimaryColor,
		SecondaryColor:  dbUser.SecondaryColor,
		IconColor:       dbUser.IconColor,
		
		// Effects
		BackgroundEffect: getStringValue(dbUser.BackgroundEffect),
		UsernameEffect:   getStringValue(dbUser.UsernameEffect),
		ShowBadges:       dbUser.ShowBadges, // Use actual DB value
		
		// Visual Settings
		ProfileBlur:     dbUser.ProfileBlur,
		ProfileOpacity:  dbUser.ProfileOpacity,
		ProfileGradient: dbUser.ProfileGradient, // Use actual DB value
		
		// Glow Effects
		GlowUsername: dbUser.GlowUsername, // Default: false
		GlowSocials:  dbUser.GlowSocials,  // Default: false
		GlowBadges:   dbUser.GlowBadges,   // Default: false
		
		// Animations & Effects
		AnimatedTitle:   dbUser.AnimatedTitle,   // Default: false
		MonochromeIcons: dbUser.MonochromeIcons, // Default: false
		SwapBoxColors:   dbUser.SwapBoxColors,   // Default: false
		
		// Audio
		VolumeLevel:   dbUser.VolumeLevel,
		VolumeControl: dbUser.VolumeControl, // Use actual DB value
		
		// Discord Integration
		DiscordPresence:         dbUser.DiscordPresence,         // Default: false
		UseDiscordAvatar:        dbUser.UseDiscordAvatar,        // Default: false
		DiscordAvatarDecoration: dbUser.DiscordAvatarDecoration, // Default: false
		
		// Asset URLs
		BackgroundURL: getStringValue(dbUser.BackgroundURL),
		AudioURL:      getStringValue(dbUser.AudioURL),
		CursorURL:     getStringValue(dbUser.CustomCursorURL),
		
		// Profile Information  
		Description:   getStringValue(dbUser.Description),
		Bio:           getStringValue(dbUser.Bio),
		
		// Typography
		TextFont:      getStringValue(dbUser.TextFont),
		
		// Splash Screen Settings
		EnableSplashScreen:      dbUser.EnableSplashScreen,
		SplashText:              getStringValue(dbUser.SplashText),
		SplashFontSize:          getStringValue(dbUser.SplashFontSize),
		SplashAnimated:          dbUser.SplashAnimated,
		SplashGlowEffect:        dbUser.SplashGlowEffect,
		SplashShowParticles:     dbUser.SplashShowParticles,
		SplashAutoHide:          dbUser.SplashAutoHide,
		SplashAutoHideDelay:     dbUser.SplashAutoHideDelay,
		SplashBackgroundVisible: dbUser.SplashBackgroundVisible,
		SplashBackgroundColor:   getStringValue(dbUser.SplashBackgroundColor),
		SplashTransparent:       dbUser.SplashTransparent,
	}

	// Debug log the final settings being returned
	fmt.Printf("Final settings being returned for user %d: ShowBadges=%t, VolumeControl=%t, ProfileGradient=%t, Bio='%s'\n", 
		user.ID, settings.ShowBadges, settings.VolumeControl, settings.ProfileGradient, settings.Bio)

	// Cache the settings for future requests
	if h.redisClient != nil {
		err := h.redisClient.Set(cacheKey, settings, 30*time.Minute)
		if err == nil {
			fmt.Printf("Customization settings cached for user %d\n", user.ID)
		} else {
			fmt.Printf("Failed to cache customization settings for user %d: %v\n", user.ID, err)
		}
	}

	c.JSON(http.StatusOK, DashboardResponse{
		Success: true,
		Message: "Customization settings retrieved successfully",
		Data: gin.H{
			"settings": settings,
			"user": gin.H{
				"avatar_url": dbUser.AvatarURL,
				"username":   dbUser.Username,
				"display_name": dbUser.DisplayName,
			},
		},
	})
}

// UploadAsset handles file uploads for user assets using Supabase storage
func (h *DashboardHandler) UploadAsset(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, DashboardResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	// Parse multipart form
	err := c.Request.ParseMultipartForm(10 << 20) // 10MB max memory
	if err != nil {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: "Failed to parse multipart form: " + err.Error(),
		})
		return
	}

	// Get the file from form
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: "No file provided: " + err.Error(),
		})
		return
	}
	defer file.Close()

	// Get the asset type
	assetType := c.PostForm("type")
	if assetType == "" {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: "Asset type is required",
		})
		return
	}

	// Check if storage is configured
	if h.storage == nil {
		c.JSON(http.StatusServiceUnavailable, DashboardResponse{
			Success: false,
			Message: "File storage is not configured on the server. Please contact the administrator.",
		})
		return
	}

	// Validate file size
	maxSize := int64(5 << 20) // 5MB default
	if assetType == "audio" {
		maxSize = int64(10 << 20) // 10MB for audio
	} else if assetType == "backgroundImage" {
		maxSize = int64(15 << 20) // 15MB for background (images and videos)
	}
	
	if header.Size > maxSize {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: fmt.Sprintf("File too large. Maximum size is %dMB", maxSize/(1<<20)),
		})
		return
	}

	// Validate file type
	allowedTypes := map[string][]string{
		"backgroundImage": {
			// Images
			"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
			// Videos
			"video/mp4", "video/webm", "video/ogg", "video/avi", "video/mov", "video/quicktime",
		},
		"avatar":         {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"},
		"audio":          {"audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/m4a", "audio/opus"},
		"cursor":         {"image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml", "image/gif", "image/jpeg", "image/jpg", "image/webp"},
	}

	contentType := header.Header.Get("Content-Type")
	validTypes, exists := allowedTypes[assetType]
	if !exists {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: "Invalid asset type",
		})
		return
	}

	isValidType := false
	for _, validType := range validTypes {
		if contentType == validType {
			isValidType = true
			break
		}
	}

	if !isValidType {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: fmt.Sprintf("Invalid file type for %s. Allowed types: %s", assetType, strings.Join(validTypes, ", ")),
		})
		return
	}

	// Generate unique filename for Supabase storage
	ext := strings.ToLower(filepath.Ext(header.Filename))
	filename := fmt.Sprintf("user_%d/%s_%d%s", user.ID, assetType, time.Now().Unix(), ext)
	
	// Get the appropriate bucket name
	bucketName := storage.GetBucketForAssetType(assetType)
	
	// Upload to Supabase storage
	fileURL, err := h.storage.UploadFile(bucketName, filename, file, contentType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, DashboardResponse{
			Success: false,
			Message: "Failed to upload file to storage: " + err.Error(),
		})
		return
	}

	// Save file info to database
	fileRecord := models.File{
		UserID:      user.ID,
		Filename:    header.Filename,
		FileSize:    header.Size,
		MimeType:    contentType,
		StorageKey:  filename,
		URL:         fileURL,
		DownloadURL: &fileURL,
		IsPublic:    true,
		Type:        getFileType(assetType),
	}

	if err := h.db.Create(&fileRecord).Error; err != nil {
		// Clean up the file from Supabase if database save fails
		h.storage.DeleteFile(bucketName, filename)
		c.JSON(http.StatusInternalServerError, DashboardResponse{
			Success: false,
			Message: "Failed to save file record to database",
		})
		return
	}

	// Get current asset URL for cleanup after update
	var currentAssetURL string
	switch assetType {
	case "backgroundImage":
		if user.BackgroundURL != nil {
			currentAssetURL = *user.BackgroundURL
		}
	case "avatar":
		if user.AvatarURL != nil {
			currentAssetURL = *user.AvatarURL
		}
	case "audio":
		if user.AudioURL != nil {
			currentAssetURL = *user.AudioURL
		}
	case "cursor":
		if user.CustomCursorURL != nil {
			currentAssetURL = *user.CustomCursorURL
		}
	}

	// Update user's asset URL field based on asset type
	updateData := make(map[string]interface{})
	switch assetType {
	case "backgroundImage":
		updateData["background_url"] = fileURL
	case "avatar":
		updateData["avatar_url"] = fileURL
	case "audio":
		updateData["audio_url"] = fileURL
	case "cursor":
		updateData["custom_cursor_url"] = fileURL
	}

	// Update the user record with the new asset URL
	if len(updateData) > 0 {
		if err := h.db.Model(&user).Updates(updateData).Error; err != nil {
			fmt.Printf("Warning: Failed to update user asset URL: %v\n", err)
		} else {
			// After successful database update, clean up old asset in background
			if currentAssetURL != "" && !strings.HasPrefix(currentAssetURL, "http://") && !strings.HasPrefix(currentAssetURL, "https://") {
				go func() {
					// Extract file path from storage URL for cleanup
					oldFilePath := extractFilePathFromURL(currentAssetURL, user.ID)
					if oldFilePath != "" {
						cleanupErr := h.storage.DeleteFile(bucketName, oldFilePath)
						if cleanupErr != nil {
							fmt.Printf("Background cleanup failed for old %s file %s: %v\n", assetType, oldFilePath, cleanupErr)
						} else {
							fmt.Printf("Background cleanup successful for old %s file %s\n", assetType, oldFilePath)
						}
					}
				}()
			}
		}
	}

	fmt.Printf("File uploaded successfully to Supabase for user %d: %s -> %s\n", user.ID, filename, fileURL)

	c.JSON(http.StatusOK, DashboardResponse{
		Success: true,
		Message: "File uploaded successfully",
		Data: gin.H{
			"file": gin.H{
				"id":       fileRecord.ID,
				"filename": fileRecord.Filename,
				"url":      fileURL,
				"type":     assetType,
				"size":     fileRecord.FileSize,
			},
			"url": fileURL,
		},
	})
}

// ListUserAudioFiles lists all audio files for the authenticated user
func (h *DashboardHandler) ListUserAudioFiles(c *gin.Context) {
	// Get session from context
	session, exists := c.Get("session")
	if !exists {
		c.JSON(http.StatusUnauthorized, DashboardResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}

	sessionData, ok := session.(*redis.SessionData)
	if !ok {
		c.JSON(http.StatusUnauthorized, DashboardResponse{
			Success: false,
			Message: "Invalid session",
		})
		return
	}

	userID := sessionData.UserID

	// Check if storage is configured
	if h.storage == nil {
		c.JSON(http.StatusOK, DashboardResponse{
			Success: true,
			Message: "Audio files retrieved successfully",
			Data: gin.H{
				"files": []gin.H{}, // Empty array when storage not configured
			},
		})
		return
	}

	// Create folder path for user
	folderPath := fmt.Sprintf("user_%d", userID)

	// List files from Supabase
	files, err := h.storage.ListFiles("user-audio", folderPath)
	if err != nil {
		fmt.Printf("Error listing audio files for user %d: %v\n", userID, err)
		c.JSON(http.StatusInternalServerError, DashboardResponse{
			Success: false,
			Message: "Failed to list audio files",
		})
		return
	}

	// Transform files to include public URLs
	var audioFiles []gin.H
	for _, file := range files {
		// Skip placeholder files and hidden files
		if file.Name == ".emptyFolderPlaceholder" || strings.HasPrefix(file.Name, ".") {
			continue
		}
		
		filePath := fmt.Sprintf("%s/%s", folderPath, file.Name)
		publicURL := h.storage.GetPublicURL("user-audio", filePath)
		
		audioFiles = append(audioFiles, gin.H{
			"name":       file.Name,
			"url":        publicURL,
			"filePath":   filePath,
			"fileName":   file.Name,
			"size":       file.Size,
			"createdAt":  file.CreatedAt,
			"updatedAt":  file.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, DashboardResponse{
		Success: true,
		Message: "Audio files retrieved successfully",
		Data: gin.H{
			"files": audioFiles,
		},
	})
}

// DeleteUserAsset deletes a specific asset file for the authenticated user
func (h *DashboardHandler) DeleteUserAsset(c *gin.Context) {
	// Get session from context
	session, exists := c.Get("session")
	if !exists {
		c.JSON(http.StatusUnauthorized, DashboardResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}

	sessionData, ok := session.(*redis.SessionData)
	if !ok {
		c.JSON(http.StatusUnauthorized, DashboardResponse{
			Success: false,
			Message: "Invalid session",
		})
		return
	}

	userID := sessionData.UserID

	// Get file path and asset type from request body
	var deleteRequest struct {
		FilePath  string `json:"filePath" binding:"required"`
		AssetType string `json:"assetType" binding:"required"`
	}

	if err := c.ShouldBindJSON(&deleteRequest); err != nil {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	// Validate asset type
	validAssetTypes := []string{"audio", "backgroundImage", "avatar", "cursor"}
	isValidType := false
	for _, validType := range validAssetTypes {
		if deleteRequest.AssetType == validType {
			isValidType = true
			break
		}
	}
	
	if !isValidType {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: "Invalid asset type",
		})
		return
	}

	// Check if this is an external URL (OAuth avatar, etc.)
	isExternalURL := strings.HasPrefix(deleteRequest.FilePath, "http://") || strings.HasPrefix(deleteRequest.FilePath, "https://")
	
	if !isExternalURL {
		// For local files, verify the file path belongs to the user
		expectedPrefix := fmt.Sprintf("user_%d/", userID)
		if !strings.HasPrefix(deleteRequest.FilePath, expectedPrefix) {
			c.JSON(http.StatusForbidden, DashboardResponse{
				Success: false,
				Message: "Access denied: file does not belong to user",
			})
			return
		}

		// Check if storage is configured
		if h.storage == nil {
			c.JSON(http.StatusServiceUnavailable, DashboardResponse{
				Success: false,
				Message: "File storage is not configured on the server",
			})
			return
		}

		// Get the appropriate bucket name and delete from Supabase storage
		bucketName := storage.GetBucketForAssetType(deleteRequest.AssetType)
		err := h.storage.DeleteFile(bucketName, deleteRequest.FilePath)
		if err != nil {
			fmt.Printf("Error deleting %s file %s for user %d: %v\n", deleteRequest.AssetType, deleteRequest.FilePath, userID, err)
			c.JSON(http.StatusInternalServerError, DashboardResponse{
				Success: false,
				Message: fmt.Sprintf("Failed to delete %s file", deleteRequest.AssetType),
			})
			return
		}
	}
	// For external URLs (OAuth avatars), we just clear the URL from the database

	// Update user's asset URL field based on asset type
	updateData := make(map[string]interface{})
	switch deleteRequest.AssetType {
	case "backgroundImage":
		updateData["background_url"] = nil
	case "avatar":
		updateData["avatar_url"] = nil
	case "audio":
		updateData["audio_url"] = nil
	case "cursor":
		updateData["custom_cursor_url"] = nil
	}

	// Update the user record to remove the asset URL
	if len(updateData) > 0 {
		var user models.User
		if err := h.db.Where("id = ?", userID).First(&user).Error; err == nil {
			if err := h.db.Model(&user).Updates(updateData).Error; err != nil {
				fmt.Printf("Warning: Failed to update user asset URL after deletion: %v\n", err)
			}
		}
	}

	fmt.Printf("Successfully deleted %s file %s for user %d\n", deleteRequest.AssetType, deleteRequest.FilePath, userID)

	c.JSON(http.StatusOK, DashboardResponse{
		Success: true,
		Message: fmt.Sprintf("%s file deleted successfully", strings.Title(deleteRequest.AssetType)),
	})
}

// getFileType maps asset types to FileType enum
func getFileType(assetType string) models.FileType {
	switch assetType {
	case "backgroundImage":
		return models.FileTypeBackground
	case "avatar":
		return models.FileTypeAvatar
	case "audio":
		return models.FileTypeAudio
	case "cursor":
		return models.FileTypeCursor
	default:
		return models.FileTypeOther
	}
}

// extractFilePathFromURL extracts the storage file path from a Supabase URL
func extractFilePathFromURL(url string, userID uint) string {
	if url == "" {
		return ""
	}
	
	// Parse URL to extract path
	parsedURL, err := net_url.Parse(url)
	if err != nil {
		return ""
	}
	
	// Extract path segments
	pathParts := strings.Split(strings.TrimPrefix(parsedURL.Path, "/"), "/")
	
	// Find user folder and construct file path
	for i, part := range pathParts {
		if strings.HasPrefix(part, fmt.Sprintf("user_%d", userID)) {
			// Return the path from user folder onwards
			return strings.Join(pathParts[i:], "/")
		}
	}
	
	// Fallback: look for filename and assume user_ID/filename structure
	if len(pathParts) > 0 {
		filename := pathParts[len(pathParts)-1]
		if filename != "" {
			return fmt.Sprintf("user_%d/%s", userID, filename)
		}
	}
	
	return ""
}

// AnalyticsData represents analytics data for a user
type AnalyticsData struct {
	TotalLinkClicks     int                `json:"total_link_clicks"`
	ClickRate           float64            `json:"click_rate"`
	ProfileViews        int                `json:"profile_views"`
	AverageDailyViews   int                `json:"average_daily_views"`
	ProfileViewsChart   []DailyViews       `json:"profile_views_chart"`
	Devices             DeviceBreakdown    `json:"devices"`
	TopSocials          []SocialClick      `json:"top_socials"`
	TopReferrers        []Referrer         `json:"top_referrers"`
	TopCountries        []CountryView      `json:"top_countries"`
}

type DailyViews struct {
	Day   string `json:"day"`
	Views int    `json:"views"`
}

type DeviceBreakdown struct {
	Mobile  float64 `json:"mobile"`
	Desktop float64 `json:"desktop"`
	Tablet  float64 `json:"tablet"`
}

type SocialClick struct {
	Name  string `json:"name"`
	Clicks int   `json:"clicks"`
	Icon  string `json:"icon"`
}

type Referrer struct {
	Source string  `json:"source"`
	Visits float64 `json:"visits"`
	Icon   string  `json:"icon"`
}

type CountryView struct {
	Name       string  `json:"name"`
	Views      int     `json:"views"`
	Percentage float64 `json:"percentage"`
	Code       string  `json:"code"`
}

// GetAnalytics returns analytics data for authenticated user
func (h *DashboardHandler) GetAnalytics(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, DashboardResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	// Always get fresh user data from database to ensure ProfileViews and other stats are current
	var dbUser models.User
	if err := h.db.Where("id = ?", user.ID).First(&dbUser).Error; err == nil {
		user = &dbUser
		fmt.Printf("DEBUG - Analytics fresh user from database - ID: %d, Username: %s, ProfileViews: %d, TotalClicks: %d\n", 
			user.ID, user.Username, user.ProfileViews, user.TotalClicks)
	} else {
		fmt.Printf("ERROR - Analytics failed to load fresh user data: %v\n", err)
	}

	// Get query parameters for time filtering
	daysParam := c.DefaultQuery("days", "14")
	offsetParam := c.DefaultQuery("offset", "0")
	
	// Parse parameters
	days := 14
	if d, err := fmt.Sscanf(daysParam, "%d", &days); err != nil || d != 1 || days < 0 || days > 365 {
		days = 14 // Default to 14 days
	}
	// Special case: days = 0 means "All Time" (no time limit)
	
	offset := 0
	if d, err := fmt.Sscanf(offsetParam, "%d", &offset); err != nil || d != 1 || offset < 0 {
		offset = 0 // Default to current period
	}

	// Check user plan limits - free users limited to 14 days (except All Time)
	if user.Plan != "premium" && days > 14 && days != 0 {
		days = 14
	}

	// TEMPORARILY DISABLED: Fast analytics with time-based cache key + version for cache invalidation
	// Use shorter cache time for current data (offset=0) to show more real-time updates
	// analyticsVersion := "v2" // Increment this when analytics logic changes
	// cacheKey := fmt.Sprintf("analytics:fast:%s:%d:%d:%d", analyticsVersion, user.ID, days, offset)
	// cacheTime := 2 * time.Minute
	// if offset == 0 {
	// 	cacheTime = 1 * time.Minute // More frequent updates for current data
	// }
	
	// TEMPORARILY DISABLED: Try cache first for lightning-fast response (with versioned cache key)
	// if h.redisClient != nil {
	// 	var cachedData AnalyticsData
	// 	fmt.Printf("DEBUG CACHE: Trying cache key: %s\n", cacheKey)
	// 	err := h.redisClient.Get(cacheKey, &cachedData)
	// 	if err == nil {
	// 		fmt.Printf("DEBUG CACHE: HIT - returning cached data for key: %s\n", cacheKey)
	// 		c.JSON(http.StatusOK, DashboardResponse{
	// 			Success: true,
	// 			Message: "Analytics data retrieved successfully",
	// 			Data:    cachedData,
	// 		})
	// 		return
	// 	} else {
	// 		fmt.Printf("DEBUG CACHE: MISS - cache error: %v for key: %s\n", err, cacheKey)
	// 	}
	// }

	// Calculate time range for filtering
	var startTime, endTime time.Time
	
	if days == 0 {
		// All Time: Start from account creation date or very early date
		startTime = time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC) // Early date to capture all data
		endTime = time.Now()
	} else if days == 1 && offset == 0 {
		// Today: Start from beginning of today (00:00:00) to now
		now := time.Now()
		startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		endTime = now
		fmt.Printf("DEBUG: Today analytics - StartTime: %v, EndTime: %v\n", startTime, endTime)
	} else {
		// Default behavior: show current data up to now (offset = 0 means "up to today")
		endTime = time.Now().AddDate(0, 0, -offset)
		startTime = endTime.AddDate(0, 0, -days)
		
		// If offset is 0 (default), we want current data ending "now"
		if offset == 0 {
			endTime = time.Now()
			startTime = endTime.AddDate(0, 0, -days)
		}
	}

	fmt.Printf("DEBUG: Analytics time range - StartTime: %v, EndTime: %v, Days: %d, Offset: %d\n", 
		startTime, endTime, days, offset)
	
	// TEMPORARY DEBUG: Return user data directly for debugging
	if c.Query("debug") == "user" {
		c.JSON(http.StatusOK, DashboardResponse{
			Success: true,
			Message: "Debug user data",
			Data: gin.H{
				"user_id": user.ID,
				"username": user.Username, 
				"profile_views": user.ProfileViews,
				"total_clicks": user.TotalClicks,
				"days_param": days,
			},
		})
		return
	}
	
	// DEBUG: Check if All Time path will be taken
	fmt.Printf("DEBUG: Analytics request - Days: %d, User ID: %d, ProfileViews: %d, TotalClicks: %d\n", 
		days, user.ID, user.ProfileViews, user.TotalClicks)
	if days == 0 {
		fmt.Printf("DEBUG: All Time analytics requested for User ID: %d, ProfileViews: %d, TotalClicks: %d\n", 
			user.ID, user.ProfileViews, user.TotalClicks)
	}

	// Fast parallel analytics calculation with time filtering
	type AnalyticsCounts struct {
		TotalClicks       int64 `json:"total_clicks"`
		RealProfileViews  int64 `json:"real_profile_views"`
	}
	
	var analyticsCounts AnalyticsCounts
	var clicksErr, viewsErr error
	
	// Run analytics queries in parallel for speed
	done := make(chan bool, 2)
	
	go func() {
		// For clicks, use LinkClick records with timestamps for time filtering
		if days == 0 {
			// All Time: Use user's aggregate total clicks for performance
			analyticsCounts.TotalClicks = int64(user.TotalClicks)
			fmt.Printf("DEBUG Analytics All Time - User ID: %d, TotalClicks: %d\n", user.ID, user.TotalClicks)
		} else {
			// Time-limited: Count from LinkClick records with time filtering
			var timeFilteredClicks int64
			clicksErr = h.db.Model(&models.LinkClick{}).
				Joins("JOIN links ON link_clicks.link_id = links.id").
				Where("links.user_id = ? AND links.is_active = ? AND link_clicks.created_at >= ? AND link_clicks.created_at <= ?", 
					user.ID, true, startTime, endTime).
				Count(&timeFilteredClicks).Error
			analyticsCounts.TotalClicks = timeFilteredClicks
			fmt.Printf("DEBUG Analytics Time-Filtered - User ID: %d, TotalClicks: %d (period: %d days, %v to %v)\n", 
				user.ID, timeFilteredClicks, days, startTime.Format("2006-01-02 15:04"), endTime.Format("2006-01-02 15:04"))
		}
		done <- true
	}()
	
	go func() {
		// Profile views with time filtering
		if days == 0 {
			// All Time: Always use aggregate total from user table for complete historical data
			analyticsCounts.RealProfileViews = int64(user.ProfileViews)
			fmt.Printf("DEBUG Analytics All Time - User ID: %d, Using user aggregate ProfileViews: %d\n", 
				user.ID, user.ProfileViews)
		} else {
			// Time-limited query: Use only detailed records
			viewsErr = h.db.Model(&models.ProfileView{}).
				Where("user_id = ? AND created_at >= ? AND created_at <= ?", user.ID, startTime, endTime).
				Count(&analyticsCounts.RealProfileViews).Error
		}
		done <- true
	}()
	
	// Wait for both queries to complete
	<-done
	<-done
	
	if clicksErr != nil || viewsErr != nil {
		c.JSON(http.StatusInternalServerError, DashboardResponse{
			Success: false,
			Message: "Failed to retrieve analytics data",
		})
		return
	}
	
	totalClicks := analyticsCounts.TotalClicks
	realProfileViews := analyticsCounts.RealProfileViews
	profileViews := int(realProfileViews)
	
	fmt.Printf("DEBUG: Analytics calculation - UserID: %d, ProfileViews from user table: %d, Real ProfileViews from records (time filtered): %d, TotalClicks: %d\n", 
		user.ID, user.ProfileViews, profileViews, totalClicks)
	
	// Debug: Check total ProfileView records without time filtering
	var totalProfileViewRecords int64
	h.db.Model(&models.ProfileView{}).Where("user_id = ?", user.ID).Count(&totalProfileViewRecords)
	fmt.Printf("DEBUG: Total ProfileView records in database (no time filter): %d\n", totalProfileViewRecords)

	// Calculate click rate (clicks per view)
	var clickRate float64
	if profileViews > 0 {
		clickRate = (float64(totalClicks) / float64(profileViews)) * 100
	}

	// Calculate average daily views for the selected period
	var avgDailyViews int
	if days > 0 {
		avgDailyViews = profileViews / days
	} else {
		// For "All Time", calculate based on account age
		accountAge := int(time.Since(user.CreatedAt).Hours() / 24)
		if accountAge > 0 {
			avgDailyViews = profileViews / accountAge
		}
	}
	if avgDailyViews < 1 && profileViews > 0 {
		avgDailyViews = 1
	}

	// Get real profile views data for the selected period
	profileViewsChart := h.getProfileViewsChartWithTimeRange(user.ID, startTime, endTime, days)
	
	// Get real device breakdown from profile views in time range
	deviceBreakdown := h.getDeviceBreakdownWithTimeRange(user.ID, startTime, endTime)
	
	// Get real country breakdown from profile views in time range
	countryBreakdown := h.getCountryBreakdownWithTimeRange(user.ID, startTime, endTime)
	
	// Get real referrer breakdown from profile views in time range
	referrerBreakdown := h.getReferrerBreakdownWithTimeRange(user.ID, startTime, endTime)

	// Get top clicked links as "social" data
	var topLinks []models.Link
	h.db.Where("user_id = ? AND is_active = ?", user.ID, true).
		Order("clicks DESC").
		Limit(5).
		Find(&topLinks)

	// Common social platforms that Simple Icons supports
	socialPlatforms := []string{
		"instagram", "twitter", "x", "linkedin", "youtube", "tiktok", 
		"spotify", "pinterest", "github", "discord", "telegram", 
		"soundcloud", "facebook", "snapchat", "twitch", "reddit",
		"behance", "dribbble", "medium", "patreon", "onlyfans",
		"cashapp", "venmo", "paypal", "kofi", "buymeacoffee",
		"etsy", "shopify", "amazon", "ebay", "gumroad",
		"steam", "xbox", "playstation", "nintendo", "epicgames",
		"wordpress", "blogger", "substack", "notion", "figma",
		"adobe", "canva", "unsplash", "500px", "flickr",
	}

	topSocials := make([]SocialClick, 0)
	for _, link := range topLinks {
		icon := "link" // default fallback
		linkText := strings.ToLower(link.Title)
		linkURL := ""
		if link.URL != nil {
			linkURL = strings.ToLower(*link.URL)
		}
		
		// Check against all known social platforms
		for _, platform := range socialPlatforms {
			if strings.Contains(linkText, platform) || strings.Contains(linkURL, platform) {
				// Special case for Twitter/X
				if platform == "twitter" || strings.Contains(linkURL, "x.com") {
					icon = "x"
				} else {
					icon = platform
				}
				break
			}
		}
		
		topSocials = append(topSocials, SocialClick{
			Name:   link.Title,
			Clicks: link.Clicks,
			Icon:   icon,
		})
	}
	
	// Ensure we always have at least empty arrays for the frontend
	if topSocials == nil {
		topSocials = make([]SocialClick, 0)
	}

	// DEBUG: Log all variables before fallback logic
	fmt.Printf("=== ANALYTICS FALLBACK DEBUG ===\n")
	fmt.Printf("DEBUG: profileViews (time-filtered): %d\n", profileViews)
	fmt.Printf("DEBUG: user.ProfileViews (total): %d\n", user.ProfileViews)
	fmt.Printf("DEBUG: realProfileViews: %d\n", realProfileViews)
	fmt.Printf("DEBUG: user.ID: %d, user.Username: %s\n", user.ID, user.Username)
	fmt.Printf("DEBUG: Fallback condition - profileViews == 0: %t, user.ProfileViews > 0: %t\n", profileViews == 0, user.ProfileViews > 0)
	fmt.Printf("=== END FALLBACK DEBUG ===\n")

	// Use the time-filtered profile views instead of total aggregate
	displayProfileViews := profileViews // This is the time-filtered value from realProfileViews
	fmt.Printf("DEBUG: 🔧 Using time-filtered profile views: %d (period: %d days)\n", displayProfileViews, days)
	
	// Recalculate metrics based on time-filtered profile views
	if displayProfileViews > 0 {
		if days == 1 && offset == 0 {
			// For "Today", show views as-is since it's current day
			avgDailyViews = displayProfileViews
		} else if days > 0 {
			avgDailyViews = displayProfileViews / days
		} else {
			// For "All Time", calculate based on account age
			accountAge := int(time.Since(user.CreatedAt).Hours() / 24)
			if accountAge > 0 {
				avgDailyViews = displayProfileViews / accountAge
			}
		}
		if avgDailyViews < 1 && days != 1 {
			avgDailyViews = 1
		}
		clickRate = (float64(totalClicks) / float64(displayProfileViews)) * 100
	} else {
		avgDailyViews = 0
		clickRate = 0
	}

	// DEBUG: Final analytics values
	fmt.Printf("=== FINAL ANALYTICS VALUES ===\n")
	fmt.Printf("DEBUG: displayProfileViews (final): %d\n", displayProfileViews)
	fmt.Printf("DEBUG: totalClicks: %d\n", totalClicks)
	fmt.Printf("DEBUG: avgDailyViews: %d\n", avgDailyViews)
	fmt.Printf("DEBUG: clickRate: %.2f\n", clickRate)
	fmt.Printf("=== END FINAL VALUES ===\n")

	// Prepare analytics response
	analyticsData := AnalyticsData{
		TotalLinkClicks:   int(totalClicks),
		ClickRate:         clickRate,
		ProfileViews:      displayProfileViews,
		AverageDailyViews: avgDailyViews,
		ProfileViewsChart: profileViewsChart,
		Devices:           deviceBreakdown,
		TopSocials:        topSocials,
		TopReferrers:      referrerBreakdown,
		TopCountries:      countryBreakdown,
	}

	// DEBUG: Add debug info if requested
	if c.Query("debug") == "true" {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Analytics data retrieved successfully (DEBUG MODE)",
			"debug": gin.H{
				"user_id": user.ID,
				"username": user.Username,
				"user_profile_views_total": user.ProfileViews,
				"profile_views_time_filtered": profileViews,
				"real_profile_views": realProfileViews,
				"display_profile_views_final": displayProfileViews,
				"fallback_condition_met": profileViews == 0 && user.ProfileViews > 0,
				"days": days,
				"start_time": startTime,
				"end_time": endTime,
			},
			"data": analyticsData,
		})
		return
	}

	// TEMPORARILY DISABLED: Cache with dynamic time based on data freshness needs
	// if h.redisClient != nil {
	// 	h.workerPool.SubmitFunc(fmt.Sprintf("cache-analytics-%d", user.ID), func() error {
	// 		return h.redisClient.Set(cacheKey, analyticsData, cacheTime)
	// 	})
	// }

	c.JSON(http.StatusOK, DashboardResponse{
		Success: true,
		Message: "Analytics data retrieved successfully",
		Data:    analyticsData,
	})
}

// trackProfileView records a unique profile view with analytics data
func (h *DashboardHandler) trackProfileView(c *gin.Context, userID uint) {
	// Extract request data immediately while context is valid
	ipAddress := analytics.GetClientIP(c.Request)
	userAgent := c.GetHeader("User-Agent")
	referer := c.GetHeader("Referer")
	sessionID := c.GetHeader("X-Session-ID")
	
	fmt.Printf("DEBUG: trackProfileView - UserID: %d, IP: %s, UserAgent: %s\n", userID, ipAddress, userAgent)
	
	// For localhost/development, use a mock IP for testing geolocation
	testIP := ipAddress
	if ipAddress == "::1" || ipAddress == "127.0.0.1" || ipAddress == "localhost" {
		testIP = "8.8.8.8" // Use Google DNS IP for testing geolocation
		fmt.Printf("DEBUG: Using test IP %s for localhost geolocation testing\n", testIP)
	}
	
	// Use Redis for quick deduplication check
	dedupeKey := fmt.Sprintf("view_dedupe:%d:%s", userID, ipAddress)
	fmt.Printf("DEBUG: Checking deduplication key: %s\n", dedupeKey)
	if h.redisClient != nil {
		// Check if we've already tracked this IP for this user recently
		exists, err := h.redisClient.Exists(dedupeKey)
		if err == nil && exists {
			fmt.Printf("DEBUG: View already tracked recently for this IP, skipping\n")
			return // Already tracked recently
		}
		
		// Set deduplication key with 24-hour expiry
		h.redisClient.Set(dedupeKey, "1", 24*time.Hour)
		fmt.Printf("DEBUG: Set deduplication key, proceeding with tracking\n")
	} else {
		// Fallback to database check if Redis unavailable
		var existingView models.ProfileView
		twentyFourHoursAgo := time.Now().Add(-24 * time.Hour)
		
		err := h.db.Where("user_id = ? AND ip_address = ? AND created_at > ?", 
			userID, ipAddress, twentyFourHoursAgo).First(&existingView).Error
		
		if err == nil {
			return // Already viewed within 24 hours
		}
	}
	
	// Process analytics data in background
	go func() {
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("Recovered from panic in trackProfileView: %v\n", r)
			}
		}()
		
		// Detect device and browser information
		deviceInfo := analytics.DetectDevice(userAgent)
		
		// Get geolocation data (this can be slow, so it's now truly async)
		var country, city *string
		if geoLocation, err := h.geoService.GetLocation(testIP); err == nil {
			fmt.Printf("DEBUG: Geolocation - IP: %s, Country: %s, City: %s\n", testIP, geoLocation.Country, geoLocation.City)
			if geoLocation.Country != "Unknown" {
				country = &geoLocation.Country
				city = &geoLocation.City
			}
		} else {
			fmt.Printf("DEBUG: Geolocation failed - IP: %s, Error: %v\n", testIP, err)
		}
		
		// Create profile view record
		profileView := models.ProfileView{
			UserID:    userID,
			IPAddress: &ipAddress,
			UserAgent: &userAgent,
			Referer:   &referer,
			Country:   country,
			City:      city,
			Device:    &deviceInfo.Device,
			Browser:   &deviceInfo.Browser,
			SessionID: &sessionID,
		}
		
		// Save to database with timeout context
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		
		if err := h.db.WithContext(ctx).Create(&profileView).Error; err != nil {
			fmt.Printf("Failed to save profile view for user %d: %v\n", userID, err)
			// Remove deduplication key on failure so it can be retried
			if h.redisClient != nil {
				h.redisClient.Delete(dedupeKey)
			}
			return
		} else {
			fmt.Printf("DEBUG: Profile view saved successfully - ID: %d, UserID: %d, Country: %v\n", profileView.ID, profileView.UserID, profileView.Country)
		}
		
		// Update user's total profile views count
		h.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).
			UpdateColumn("profile_views", gorm.Expr("profile_views + ?", 1))
		
		// Clear analytics cache to force refresh
		if h.redisClient != nil {
			cacheKey := fmt.Sprintf("analytics:user:%d", userID)
			h.redisClient.Delete(cacheKey)
			
			// Also invalidate user cache since ProfileViews changed
			h.redisClient.InvalidateUserCache(userID)
			
			// Clear dashboard cache too
			dashboardCacheKey := fmt.Sprintf("dashboard:%d", userID)
			h.redisClient.Delete(dashboardCacheKey)
		}
		
		fmt.Printf("Recorded unique profile view for user %d from IP %s (%s, %s)\n", 
			userID, ipAddress, deviceInfo.Device, getStringValue(country))
	}()
}

// getProfileViewsChart returns daily profile views for the last 7 days
func (h *DashboardHandler) getProfileViewsChart(userID uint) []DailyViews {
	sevenDaysAgo := time.Now().AddDate(0, 0, -7)
	
	var results []struct {
		Date  time.Time `json:"date"`
		Count int       `json:"count"`
	}
	
	err := h.db.Model(&models.ProfileView{}).
		Select("DATE(created_at) as date, COUNT(*) as count").
		Where("user_id = ? AND created_at >= ?", userID, sevenDaysAgo).
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&results).Error
	
	if err != nil {
		fmt.Printf("Failed to get profile views chart for user %d: %v\n", userID, err)
		return []DailyViews{}
	}
	
	// Create map of existing data
	dataMap := make(map[string]int)
	for _, result := range results {
		dateStr := result.Date.Weekday().String()[:3] // Get first 3 letters of weekday
		dataMap[dateStr] = result.Count
	}
	
	// Generate chart data for last 7 days
	chart := make([]DailyViews, 7)
	for i := 0; i < 7; i++ {
		date := time.Now().AddDate(0, 0, -6+i)
		dayName := date.Weekday().String()[:3]
		
		chart[i] = DailyViews{
			Day:   dayName,
			Views: dataMap[dayName], // Will be 0 if no data exists
		}
	}
	
	return chart
}

// getDeviceBreakdown returns device usage percentages
func (h *DashboardHandler) getDeviceBreakdown(userID uint) DeviceBreakdown {
	var results []struct {
		Device string `json:"device"`
		Count  int    `json:"count"`
	}
	
	err := h.db.Model(&models.ProfileView{}).
		Select("device, COUNT(*) as count").
		Where("user_id = ? AND device IS NOT NULL", userID).
		Group("device").
		Scan(&results).Error
	
	if err != nil {
		fmt.Printf("Failed to get device breakdown for user %d: %v\n", userID, err)
		return DeviceBreakdown{Mobile: 0, Desktop: 0, Tablet: 0}
	}
	
	var total int
	deviceCounts := make(map[string]int)
	
	for _, result := range results {
		deviceCounts[result.Device] = result.Count
		total += result.Count
	}
	
	if total == 0 {
		return DeviceBreakdown{Mobile: 0, Desktop: 0, Tablet: 0}
	}
	
	return DeviceBreakdown{
		Mobile:  float64(deviceCounts["mobile"]) / float64(total) * 100,
		Desktop: float64(deviceCounts["desktop"]) / float64(total) * 100,
		Tablet:  float64(deviceCounts["tablet"]) / float64(total) * 100,
	}
}

// getCountryBreakdown returns top countries by views
func (h *DashboardHandler) getCountryBreakdown(userID uint) []CountryView {
	var results []struct {
		Country string `json:"country"`
		Count   int    `json:"count"`
	}
	
	err := h.db.Model(&models.ProfileView{}).
		Select("country, COUNT(*) as count").
		Where("user_id = ? AND country IS NOT NULL", userID).
		Group("country").
		Order("count DESC").
		Limit(6).
		Scan(&results).Error
	
	if err != nil {
		fmt.Printf("Failed to get country breakdown for user %d: %v\n", userID, err)
		return []CountryView{}
	}
	
	// Get total views for percentage calculation
	var total int
	for _, result := range results {
		total += result.Count
	}
	
	if total == 0 {
		return []CountryView{}
	}
	
	// Convert to CountryView format
	countries := make([]CountryView, len(results))
	for i, result := range results {
		// Simple country code mapping (you might want to expand this)
		countryCode := getCountryCode(result.Country)
		
		countries[i] = CountryView{
			Name:       result.Country,
			Views:      result.Count,
			Percentage: float64(result.Count) / float64(total) * 100,
			Code:       countryCode,
		}
	}
	
	return countries
}

// getReferrerBreakdown returns top referrer sources
func (h *DashboardHandler) getReferrerBreakdown(userID uint) []Referrer {
	var results []struct {
		Referer string `json:"referer"`
		Count   int    `json:"count"`
	}
	
	err := h.db.Raw(`
		SELECT 
			CASE 
				WHEN referer IS NULL OR referer = '' THEN 'direct'
				WHEN referer LIKE '%google%' THEN 'google'
				WHEN referer LIKE '%twitter%' OR referer LIKE '%x.com%' THEN 'twitter'
				WHEN referer LIKE '%instagram%' THEN 'instagram'
				WHEN referer LIKE '%linkedin%' THEN 'linkedin'
				WHEN referer LIKE '%youtube%' THEN 'youtube'
				WHEN referer LIKE '%facebook%' THEN 'facebook'
				ELSE 'other'
			END as referer,
			COUNT(*) as count
		FROM profile_views 
		WHERE user_id = ? 
		GROUP BY referer
		ORDER BY count DESC
		LIMIT 5
	`, userID).Scan(&results).Error
	
	if err != nil {
		fmt.Printf("Failed to get referrer breakdown for user %d: %v\n", userID, err)
		return []Referrer{}
	}
	
	// Get total for percentage calculation
	var total int
	for _, result := range results {
		total += result.Count
	}
	
	if total == 0 {
		return []Referrer{}
	}
	
	// Convert to Referrer format with icons
	referrers := make([]Referrer, len(results))
	for i, result := range results {
		icon := getReferrerIcon(result.Referer)
		
		referrers[i] = Referrer{
			Source: result.Referer,
			Visits: float64(result.Count) / float64(total) * 100,
			Icon:   icon,
		}
	}
	
	return referrers
}

// getCountryCode returns a simple country code mapping
func getCountryCode(country string) string {
	countryMap := map[string]string{
		"United States": "US",
		"Germany":       "DE",
		"United Kingdom": "GB",
		"France":        "FR", 
		"Canada":        "CA",
		"Australia":     "AU",
		"Japan":         "JP",
		"Brazil":        "BR",
		"India":         "IN",
		"China":         "CN",
		"Russia":        "RU",
		"Spain":         "ES",
		"Italy":         "IT",
		"Netherlands":   "NL",
		"Sweden":        "SE",
		"Norway":        "NO",
		"Denmark":       "DK",
		"Finland":       "FI",
	}
	
	if code, exists := countryMap[country]; exists {
		return code
	}
	
	return "XX" // Unknown country
}

// getReferrerIcon returns appropriate icon for referrer source
func getReferrerIcon(source string) string {
	iconMap := map[string]string{
		"direct":    "🔗",
		"google":    "🔍",
		"twitter":   "🐦",
		"instagram": "📷",
		"linkedin":  "💼",
		"youtube":   "📺",
		"facebook":  "📘",
		"other":     "🌐",
	}
	
	if icon, exists := iconMap[source]; exists {
		return icon
	}
	
	return "🌐"
}

// SettingsRequest represents the settings update request structure
type SettingsRequest struct {
	// Account settings
	Username    string `json:"username"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
	Bio         string `json:"bio"`
	
}

// SaveSettings saves general user settings (account, privacy, notifications)
func (h *DashboardHandler) SaveSettings(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, DashboardResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	var settings SettingsRequest
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: "Invalid settings data: " + err.Error(),
		})
		return
	}

	// Validate settings
	if err := validateSettingsRequest(&settings); err != nil {
		c.JSON(http.StatusBadRequest, DashboardResponse{
			Success: false,
			Message: "Invalid settings: " + err.Error(),
		})
		return
	}

	// Prepare updates map
	updates := map[string]interface{}{
		// Account settings
		"username":     settings.Username,
		"display_name": settings.DisplayName,
		"bio":          settings.Bio,
		
		
		"updated_at": time.Now(),
	}

	// Handle email separately as it might need validation
	if settings.Email != "" {
		updates["email"] = settings.Email
	}

	// Update user in database
	err := h.db.Model(&models.User{}).Where("id = ?", user.ID).Updates(updates).Error
	if err != nil {
		fmt.Printf("Failed to update settings for user %d: %v\n", user.ID, err)
		c.JSON(http.StatusInternalServerError, DashboardResponse{
			Success: false,
			Message: "Failed to save settings to database",
		})
		return
	}

	// Clear cache to force refresh
	if h.redisClient != nil {
		dashboardCacheKey := fmt.Sprintf("dashboard:user:%d", user.ID)
		h.redisClient.Delete(dashboardCacheKey)
	}

	fmt.Printf("Settings saved successfully for user %d\n", user.ID)

	c.JSON(http.StatusOK, DashboardResponse{
		Success: true,
		Message: "Settings saved successfully",
		Data: gin.H{
			"settings": settings,
		},
	})
}

// validateSettingsRequest validates the settings request data
func validateSettingsRequest(settings *SettingsRequest) error {
	// Validate username
	if len(settings.Username) < 3 || len(settings.Username) > 30 {
		return fmt.Errorf("username must be between 3 and 30 characters")
	}
	
	// Validate email format if provided
	if settings.Email != "" {
		if len(settings.Email) > 255 {
			return fmt.Errorf("email address too long")
		}
		// Basic email validation - you might want to use a proper email validation library
		if !strings.Contains(settings.Email, "@") || !strings.Contains(settings.Email, ".") {
			return fmt.Errorf("invalid email format")
		}
	}
	
	// Validate display name length
	if len(settings.DisplayName) > 100 {
		return fmt.Errorf("display name cannot exceed 100 characters")
	}
	
	// Validate bio length
	if len(settings.Bio) > 500 {
		return fmt.Errorf("bio cannot exceed 500 characters")
	}
	
	
	return nil
}

// calculateProfileCompletion calculates the profile completion percentage
func calculateProfileCompletion(user *models.User) int {
	completion := 0
	total := 10 // Total possible points
	
	// Required fields (higher weight)
	if user.Username != "" {
		completion += 2
	}
	if user.Email != nil && *user.Email != "" {
		completion += 2
	}
	
	// Optional fields
	if user.DisplayName != nil && *user.DisplayName != "" {
		completion += 1
	}
	if user.Bio != nil && *user.Bio != "" {
		completion += 1
	}
	if user.AvatarURL != nil && *user.AvatarURL != "" {
		completion += 1
	}
	if user.Location != nil && *user.Location != "" {
		completion += 1
	}
	
	// Social links
	socialCount := 0
	if user.TwitterURL != nil && *user.TwitterURL != "" {
		socialCount++
	}
	if user.GithubURL != nil && *user.GithubURL != "" {
		socialCount++
	}
	if user.InstagramURL != nil && *user.InstagramURL != "" {
		socialCount++
	}
	if user.LinkedinURL != nil && *user.LinkedinURL != "" {
		socialCount++
	}
	if user.WebsiteURL != nil && *user.WebsiteURL != "" {
		socialCount++
	}
	
	// Give points based on social links (0-2 points)
	if socialCount >= 2 {
		completion += 2
	} else if socialCount == 1 {
		completion += 1
	}
	
	// Calculate percentage (completion out of total possible points: 10)
	percentage := (completion * 100) / total
	if percentage > 100 {
		percentage = 100
	}
	
	return percentage
}

// Time-range-aware helper functions for analytics filtering

// getProfileViewsChartWithTimeRange returns daily profile views for a specific time range
func (h *DashboardHandler) getProfileViewsChartWithTimeRange(userID uint, startTime, endTime time.Time, days int) []DailyViews {
	var results []struct {
		Date  time.Time `json:"date"`
		Count int       `json:"count"`
	}
	
	err := h.db.Model(&models.ProfileView{}).
		Select("DATE(created_at) as date, COUNT(*) as count").
		Where("user_id = ? AND created_at >= ? AND created_at <= ?", userID, startTime, endTime).
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&results).Error
	
	if err != nil {
		fmt.Printf("Failed to get profile views chart for user %d: %v\n", userID, err)
		return []DailyViews{}
	}
	
	// Create map of existing data
	dataMap := make(map[string]int)
	for _, result := range results {
		dateKey := result.Date.Format("2006-01-02")
		dataMap[dateKey] = result.Count
	}
	
	// Generate chart data for the requested time range
	chartDays := days
	if chartDays > 7 {
		chartDays = 7 // Limit chart to 7 days for UI clarity
	}
	
	chart := make([]DailyViews, chartDays)
	// Show the most recent days ending at endTime (today by default)
	for i := 0; i < chartDays; i++ {
		date := endTime.AddDate(0, 0, -(chartDays-1-i))
		dayName := date.Weekday().String()[:3]
		dateKey := date.Format("2006-01-02")
		
		chart[i] = DailyViews{
			Day:   dayName,
			Views: dataMap[dateKey], // Will be 0 if no data exists
		}
	}
	
	return chart
}

// getDeviceBreakdownWithTimeRange returns device usage percentages for a time range
func (h *DashboardHandler) getDeviceBreakdownWithTimeRange(userID uint, startTime, endTime time.Time) DeviceBreakdown {
	var results []struct {
		Device string `json:"device"`
		Count  int    `json:"count"`
	}
	
	err := h.db.Model(&models.ProfileView{}).
		Select("device, COUNT(*) as count").
		Where("user_id = ? AND device IS NOT NULL AND created_at >= ? AND created_at <= ?", userID, startTime, endTime).
		Group("device").
		Scan(&results).Error
	
	if err != nil {
		fmt.Printf("Failed to get device breakdown for user %d: %v\n", userID, err)
		return DeviceBreakdown{Mobile: 0, Desktop: 0, Tablet: 0}
	}
	
	var total int
	deviceCounts := make(map[string]int)
	
	for _, result := range results {
		deviceCounts[result.Device] = result.Count
		total += result.Count
	}
	
	if total == 0 {
		return DeviceBreakdown{Mobile: 0, Desktop: 0, Tablet: 0}
	}
	
	return DeviceBreakdown{
		Mobile:  float64(deviceCounts["mobile"]) / float64(total) * 100,
		Desktop: float64(deviceCounts["desktop"]) / float64(total) * 100,
		Tablet:  float64(deviceCounts["tablet"]) / float64(total) * 100,
	}
}

// getCountryBreakdownWithTimeRange returns top countries by views for a time range
func (h *DashboardHandler) getCountryBreakdownWithTimeRange(userID uint, startTime, endTime time.Time) []CountryView {
	var results []struct {
		Country string `json:"country"`
		Count   int    `json:"count"`
	}
	
	err := h.db.Model(&models.ProfileView{}).
		Select("country, COUNT(*) as count").
		Where("user_id = ? AND country IS NOT NULL AND created_at >= ? AND created_at <= ?", userID, startTime, endTime).
		Group("country").
		Order("count DESC").
		Limit(6).
		Scan(&results).Error
	
	if err != nil {
		fmt.Printf("Failed to get country breakdown for user %d: %v\n", userID, err)
		return []CountryView{}
	}
	
	// Get total views for percentage calculation
	var total int
	for _, result := range results {
		total += result.Count
	}
	
	if total == 0 {
		return []CountryView{}
	}
	
	// Convert to CountryView format
	countries := make([]CountryView, len(results))
	for i, result := range results {
		countryCode := getCountryCode(result.Country)
		
		countries[i] = CountryView{
			Name:       result.Country,
			Views:      result.Count,
			Percentage: float64(result.Count) / float64(total) * 100,
			Code:       countryCode,
		}
	}
	
	return countries
}

// getReferrerBreakdownWithTimeRange returns top referrer sources for a time range
func (h *DashboardHandler) getReferrerBreakdownWithTimeRange(userID uint, startTime, endTime time.Time) []Referrer {
	var results []struct {
		Referer string `json:"referer"`
		Count   int    `json:"count"`
	}
	
	err := h.db.Raw(`
		SELECT 
			CASE 
				WHEN referer IS NULL OR referer = '' THEN 'direct'
				WHEN referer LIKE '%google%' THEN 'google'
				WHEN referer LIKE '%twitter%' OR referer LIKE '%x.com%' THEN 'twitter'
				WHEN referer LIKE '%instagram%' THEN 'instagram'
				WHEN referer LIKE '%linkedin%' THEN 'linkedin'
				WHEN referer LIKE '%youtube%' THEN 'youtube'
				WHEN referer LIKE '%facebook%' THEN 'facebook'
				ELSE 'other'
			END as referer,
			COUNT(*) as count
		FROM profile_views 
		WHERE user_id = ? AND created_at >= ? AND created_at <= ?
		GROUP BY referer
		ORDER BY count DESC
		LIMIT 5
	`, userID, startTime, endTime).Scan(&results).Error
	
	if err != nil {
		fmt.Printf("Failed to get referrer breakdown for user %d: %v\n", userID, err)
		return []Referrer{}
	}
	
	// Get total for percentage calculation
	var total int
	for _, result := range results {
		total += result.Count
	}
	
	if total == 0 {
		return []Referrer{}
	}
	
	// Convert to Referrer format with icons
	referrers := make([]Referrer, len(results))
	for i, result := range results {
		icon := getReferrerIcon(result.Referer)
		
		referrers[i] = Referrer{
			Source: result.Referer,
			Visits: float64(result.Count) / float64(total) * 100,
			Icon:   icon,
		}
	}
	
	return referrers
}