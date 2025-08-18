package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"gotchu-backend/internal/config"
	"gotchu-backend/internal/middleware"
	"gotchu-backend/internal/models"
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
}

// NewDashboardHandler creates a new dashboard handler
func NewDashboardHandler(db *gorm.DB, redisClient *redis.Client, cfg *config.Config) *DashboardHandler {
	supabaseStorage := storage.NewSupabaseStorage(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey, cfg.SupabaseAnonKey)
	return &DashboardHandler{
		db:          db,
		redisClient: redisClient,
		storage:     supabaseStorage,
		config:      cfg,
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
	
	userProfile := UserProfile{
		ID:          user.ID,
		Username:    user.Username,
		Email:       email,
		DisplayName: user.DisplayName,
		AvatarURL:   user.AvatarURL,
		IsVerified:  user.IsVerified,
		Plan:        user.Plan,
		Theme:       user.Theme,
		CreatedAt:   user.CreatedAt,
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
	validBackgroundEffects := []string{"", "none", "particles", "matrix", "waves", "gradient", "geometric"}
	if settings.BackgroundEffect != "" && !contains(validBackgroundEffects, settings.BackgroundEffect) {
		return fmt.Errorf("invalid background_effect: %s", settings.BackgroundEffect)
	}

	validUsernameEffects := []string{"", "none", "glow", "rainbow", "typewriter", "bounce", "fade"}
	if settings.UsernameEffect != "" && !contains(validUsernameEffects, settings.UsernameEffect) {
		return fmt.Errorf("invalid username_effect: %s", settings.UsernameEffect)
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
		"backgroundImage": {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"},
		"avatar":         {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"},
		"audio":          {"audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/m4a"},
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