package handlers

import (
	"context"
	"fmt"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"gotchu-backend/internal/config"
	"gotchu-backend/internal/middleware"
	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/analytics"
	"gotchu-backend/pkg/redis"
	"gotchu-backend/pkg/storage"

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
}

// NewDashboardHandler creates a new dashboard handler
func NewDashboardHandler(db *gorm.DB, redisClient *redis.Client, cfg *config.Config) *DashboardHandler {
	supabaseStorage := storage.NewSupabaseStorage(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey, cfg.SupabaseAnonKey)
	return &DashboardHandler{
		db:          db,
		redisClient: redisClient,
		storage:     supabaseStorage,
		config:      cfg,
		geoService:  analytics.NewGeoLocationService(),
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
	
	// Try to get cached data first
	if h.redisClient != nil {
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
		"alias":        user.Alias,
		"avatar_url":   user.AvatarURL,
		"is_verified":  user.IsVerified,
		"is_premium":   user.Plan == "premium",
		"plan":         user.Plan,
		"theme":        user.Theme,
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

	// Cache the response for 5 minutes
	if h.redisClient != nil {
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

	// Skip cache for username pages to avoid corruption issues - always get fresh data
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

	// Track unique profile view if not viewing own profile
	if !isAuthenticated || currentUser.ID != user.ID {
		go h.trackProfileView(c, user.ID) // Run in background to not slow down response
	}

	// Prepare public profile data with customization settings
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
		
		// Include customization settings for public profile styling
		"customization": gin.H{
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
			
			// Asset URLs (public)
			"background_url": getStringValue(user.BackgroundURL),
			"audio_url":      getStringValue(user.AudioURL),
			"cursor_url":     getStringValue(user.CustomCursorURL),
			
			// Typography
			"text_font":      getStringValue(user.TextFont),
		},
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
	validBackgroundEffects := []string{"", "none", "particles", "rain", "matrix", "waves", "gradient", "geometric"}
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
		"cursor":         {"image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml"},
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

	// Verify the file path belongs to the user
	expectedPrefix := fmt.Sprintf("user_%d/", userID)
	if !strings.HasPrefix(deleteRequest.FilePath, expectedPrefix) {
		c.JSON(http.StatusForbidden, DashboardResponse{
			Success: false,
			Message: "Access denied: file does not belong to user",
		})
		return
	}

	// Get the appropriate bucket name
	bucketName := storage.GetBucketForAssetType(deleteRequest.AssetType)
	
	// Delete file from Supabase storage
	err := h.storage.DeleteFile(bucketName, deleteRequest.FilePath)
	if err != nil {
		fmt.Printf("Error deleting %s file %s for user %d: %v\n", deleteRequest.AssetType, deleteRequest.FilePath, userID, err)
		c.JSON(http.StatusInternalServerError, DashboardResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to delete %s file", deleteRequest.AssetType),
		})
		return
	}

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

	// TEMPORARY: Skip cache to force fresh analytics calculation
	// cacheKey := fmt.Sprintf("analytics:user:%d", user.ID)
	/*
	if h.redisClient != nil {
		var cachedData AnalyticsData
		err := h.redisClient.Get(cacheKey, &cachedData)
		if err == nil {
			fmt.Printf("Analytics cache hit for user %d\n", user.ID)
			c.JSON(http.StatusOK, DashboardResponse{
				Success: true,
				Message: "Analytics data retrieved successfully",
				Data:    cachedData,
			})
			return
		}
	}
	*/

	fmt.Printf("Analytics cache miss for user %d, calculating from database\n", user.ID)

	// Get total link clicks from user's links
	var totalClicks int64
	h.db.Model(&models.Link{}).Where("user_id = ? AND is_active = ?", user.ID, true).
		Select("COALESCE(SUM(clicks), 0)").Scan(&totalClicks)

	// Get total profile views from ProfileView records (real-time count)
	var realProfileViews int64
	h.db.Model(&models.ProfileView{}).Where("user_id = ?", user.ID).Count(&realProfileViews)
	profileViews := int(realProfileViews)
	
	fmt.Printf("DEBUG: Analytics calculation - UserID: %d, ProfileViews from user table: %d, Real ProfileViews from records: %d, TotalClicks: %d\n", 
		user.ID, user.ProfileViews, profileViews, totalClicks)

	// Calculate click rate (clicks per view)
	var clickRate float64
	if profileViews > 0 {
		clickRate = (float64(totalClicks) / float64(profileViews)) * 100
	}

	// Calculate average daily views (last 30 days)
	avgDailyViews := profileViews / 30
	if avgDailyViews < 1 {
		avgDailyViews = 1
	}

	// Get real profile views data for the last 7 days
	profileViewsChart := h.getProfileViewsChart(user.ID)
	
	// Get real device breakdown from profile views
	deviceBreakdown := h.getDeviceBreakdown(user.ID)
	
	// Get real country breakdown from profile views  
	countryBreakdown := h.getCountryBreakdown(user.ID)
	
	// Get real referrer breakdown from profile views
	referrerBreakdown := h.getReferrerBreakdown(user.ID)

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

	// Use real analytics data
	analytics := AnalyticsData{
		TotalLinkClicks:   int(totalClicks),
		ClickRate:         clickRate,
		ProfileViews:      profileViews,
		AverageDailyViews: avgDailyViews,
		ProfileViewsChart: profileViewsChart,
		Devices:           deviceBreakdown,
		TopSocials:        topSocials,
		TopReferrers:      referrerBreakdown,
		TopCountries:      countryBreakdown,
	}

	// TEMPORARY: Disable analytics caching to force fresh data
	/*
	if h.redisClient != nil {
		err := h.redisClient.Set(cacheKey, analytics, 1*time.Hour)
		if err == nil {
			fmt.Printf("Analytics data cached for user %d\n", user.ID)
		} else {
			fmt.Printf("Failed to cache analytics data for user %d: %v\n", user.ID, err)
		}
	}
	*/

	c.JSON(http.StatusOK, DashboardResponse{
		Success: true,
		Message: "Analytics data retrieved successfully",
		Data:    analytics,
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