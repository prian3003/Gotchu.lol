package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"gotchu-backend/internal/middleware"
	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/redis"
	"gotchu-backend/pkg/storage"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// TemplateHandler handles template-related requests
type TemplateHandler struct {
	db      *gorm.DB
	redis   *redis.Client
	storage *storage.SupabaseStorage
}

// NewTemplateHandler creates a new template handler
func NewTemplateHandler(db *gorm.DB, redisClient *redis.Client, supabaseStorage *storage.SupabaseStorage) *TemplateHandler {
	return &TemplateHandler{
		db:      db,
		redis:   redisClient,
		storage: supabaseStorage,
	}
}

// GetTemplates retrieves templates with filtering and pagination
func (h *TemplateHandler) GetTemplates(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	category := c.Query("category")
	sortBy := c.DefaultQuery("sort", "created_at")
	order := c.DefaultQuery("order", "desc")
	search := c.Query("search")
	featured := c.Query("featured") == "true"
	publicOnly := c.DefaultQuery("public", "true") == "true"

	// Calculate offset
	offset := (page - 1) * limit

	// Build query
	query := h.db.Model(&models.Template{}).
		Preload("Creator").
		Preload("TemplateLinks").
		Where("status = ?", models.TemplateStatusApproved)

	if publicOnly {
		query = query.Where("is_public = ?", true)
	}

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if featured {
		query = query.Where("is_featured = ?", true)
	}

	if search != "" {
		query = query.Where(
			"name ILIKE ? OR description ILIKE ? OR tags ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%",
		)
	}

	// Apply sorting
	validSorts := map[string]bool{
		"created_at": true,
		"updated_at": true,
		"downloads":  true,
		"likes":      true,
		"views":      true,
		"name":       true,
	}

	if validSorts[sortBy] {
		if order == "asc" {
			query = query.Order(sortBy + " ASC")
		} else {
			query = query.Order(sortBy + " DESC")
		}
	} else {
		query = query.Order("created_at DESC")
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get templates with pagination
	var templates []models.Template
	if err := query.Offset(offset).Limit(limit).Find(&templates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch templates",
		})
		return
	}

	// Calculate pagination info
	totalPages := int((total + int64(limit) - 1) / int64(limit))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"templates": templates,
			"pagination": gin.H{
				"page":        page,
				"limit":       limit,
				"total":       total,
				"total_pages": totalPages,
				"has_next":    page < totalPages,
				"has_prev":    page > 1,
			},
		},
	})
}

// GetTemplate retrieves a specific template by ID
func (h *TemplateHandler) GetTemplate(c *gin.Context) {
	templateID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid template ID",
		})
		return
	}

	var template models.Template
	if err := h.db.Preload("Creator").
		Preload("TemplateLinks").
		Preload("TemplateAssets").
		First(&template, uint(templateID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Template not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch template",
		})
		return
	}

	// Increment view count
	h.db.Model(&template).Update("views", gorm.Expr("views + ?", 1))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    gin.H{"template": template},
	})
}

// ApplyTemplate applies a template to the current user's profile
func (h *TemplateHandler) ApplyTemplate(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authentication required",
		})
		return
	}

	templateID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid template ID",
		})
		return
	}

	// Get template
	var template models.Template
	if err := h.db.Preload("TemplateLinks").
		First(&template, uint(templateID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Template not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch template",
		})
		return
	}

	// Check if template requires premium
	if template.IsPremiumOnly && user.Plan != "premium" {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "Premium subscription required for this template",
		})
		return
	}

	// Apply template settings to user
	updates := map[string]interface{}{}

	if template.AccentColor != nil {
		updates["accent_color"] = *template.AccentColor
	}
	if template.TextColor != nil {
		updates["text_color"] = *template.TextColor
	}
	if template.BackgroundColor != nil {
		updates["background_color"] = *template.BackgroundColor
	}
	if template.IconColor != nil {
		updates["icon_color"] = *template.IconColor
	}
	if template.PrimaryColor != nil {
		updates["primary_color"] = *template.PrimaryColor
	}
	if template.SecondaryColor != nil {
		updates["secondary_color"] = *template.SecondaryColor
	}
	if template.BackgroundURL != nil {
		updates["background_url"] = *template.BackgroundURL
	}
	if template.AudioURL != nil {
		updates["audio_url"] = *template.AudioURL
	}
	if template.CustomCursorURL != nil {
		updates["cursor_url"] = *template.CustomCursorURL
	}
	if template.ProfileOpacity != nil {
		updates["profile_opacity"] = *template.ProfileOpacity
	}
	if template.ProfileBlur != nil {
		updates["profile_blur"] = *template.ProfileBlur
	}
	if template.VolumeLevel != nil {
		updates["volume_level"] = *template.VolumeLevel
	}
	if template.BackgroundEffect != nil {
		updates["background_effect"] = *template.BackgroundEffect
	}
	if template.UsernameEffect != nil {
		updates["username_effect"] = *template.UsernameEffect
	}
	if template.GlowUsername != nil {
		updates["glow_username"] = *template.GlowUsername
	}
	if template.GlowSocials != nil {
		updates["glow_socials"] = *template.GlowSocials
	}
	if template.GlowBadges != nil {
		updates["glow_badges"] = *template.GlowBadges
	}
	if template.AnimatedTitle != nil {
		updates["animated_title"] = *template.AnimatedTitle
	}
	if template.MonochromeIcons != nil {
		updates["monochrome_icons"] = *template.MonochromeIcons
	}
	if template.SwapBoxColors != nil {
		updates["swap_box_colors"] = *template.SwapBoxColors
	}
	if template.VolumeControl != nil {
		updates["volume_control"] = *template.VolumeControl
	}
	if template.ProfileGradient != nil {
		updates["profile_gradient"] = *template.ProfileGradient
	}

	// Update user customization
	if err := h.db.Model(user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to apply template",
		})
		return
	}

	// Increment download count
	h.db.Model(&template).Update("downloads", gorm.Expr("downloads + ?", 1))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Template applied successfully",
	})
}

// LikeTemplate toggles like on a template
func (h *TemplateHandler) LikeTemplate(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authentication required",
		})
		return
	}

	templateID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid template ID",
		})
		return
	}

	// Check if template exists
	var template models.Template
	if err := h.db.First(&template, uint(templateID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Template not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch template",
		})
		return
	}

	// Check if user already liked this template
	var existingLike models.TemplateLike
	likeExists := h.db.Where("user_id = ? AND template_id = ?", user.ID, uint(templateID)).
		First(&existingLike).Error == nil

	if likeExists {
		// Unlike - remove the like
		if err := h.db.Delete(&existingLike).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Failed to unlike template",
			})
			return
		}
		// Decrement like count
		h.db.Model(&template).Update("likes", gorm.Expr("likes - ?", 1))

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"liked":   false,
			"message": "Template unliked",
		})
	} else {
		// Like - add the like
		newLike := models.TemplateLike{
			UserID:     user.ID,
			TemplateID: uint(templateID),
		}

		if err := h.db.Create(&newLike).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Failed to like template",
			})
			return
		}
		// Increment like count
		h.db.Model(&template).Update("likes", gorm.Expr("likes + ?", 1))

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"liked":   true,
			"message": "Template liked",
		})
	}
}

// GetUserLikedTemplates retrieves templates liked by the current user
func (h *TemplateHandler) GetUserLikedTemplates(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authentication required",
		})
		return
	}

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	// Get liked templates
	var templates []models.Template
	query := h.db.Model(&models.Template{}).
		Preload("Creator").
		Preload("TemplateLinks").
		Joins("INNER JOIN template_likes ON templates.id = template_likes.template_id").
		Where("template_likes.user_id = ?", user.ID).
		Order("template_likes.created_at DESC")

	// Get total count
	var total int64
	query.Count(&total)

	if err := query.Offset(offset).Limit(limit).Find(&templates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch liked templates",
		})
		return
	}

	// Calculate pagination info
	totalPages := int((total + int64(limit) - 1) / int64(limit))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"templates": templates,
			"pagination": gin.H{
				"page":        page,
				"limit":       limit,
				"total":       total,
				"total_pages": totalPages,
				"has_next":    page < totalPages,
				"has_prev":    page > 1,
			},
		},
	})
}

// CreateTemplate creates a new template from user's current settings
func (h *TemplateHandler) CreateTemplate(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authentication required",
		})
		return
	}

	// Fetch complete user data with customization settings
	var fullUser models.User
	if err := h.db.First(&fullUser, user.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch user data",
		})
		return
	}
	// Use fullUser instead of user for the rest of the function
	user = &fullUser

	// Parse multipart form data
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Failed to parse form data",
		})
		return
	}

	// Extract form fields
	name := c.PostForm("name")
	description := c.PostForm("description")
	category := c.PostForm("category")
	isPublic := c.PostForm("isPublic") == "true"
	isPremiumOnly := c.PostForm("isPremiumOnly") == "true"
	tags := c.PostForm("tags")

	if name == "" || category == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Name and category are required",
		})
		return
	}

	// Check user template limit (10 templates max)
	var userTemplateCount int64
	if err := h.db.Model(&models.Template{}).Where("creator_id = ?", user.ID).Count(&userTemplateCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to check template limit",
		})
		return
	}

	if userTemplateCount >= 10 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Template limit reached. You can create a maximum of 10 templates.",
		})
		return
	}

	// Validate category
	validCategories := map[models.TemplateCategory]bool{
		models.TemplateCategoryMinimal:      true,
		models.TemplateCategoryProfessional: true,
		models.TemplateCategoryCreative:     true,
		models.TemplateCategoryGaming:       true,
		models.TemplateCategoryMusic:        true,
		models.TemplateCategoryBusiness:     true,
		models.TemplateCategoryPersonal:     true,
		models.TemplateCategoryCommunity:    true,
		models.TemplateCategorySeasonal:     true,
		models.TemplateCategoryOther:        true,
	}

	templateCategory := models.TemplateCategory(category)
	if !validCategories[templateCategory] {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid category",
		})
		return
	}

	// Handle thumbnail upload (required)
	var thumbnailURL *string
	thumbnail, header, err := c.Request.FormFile("thumbnail")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Thumbnail image is required",
		})
		return
	}
	defer thumbnail.Close()
	
	// Generate unique filename
	fileName := fmt.Sprintf("template_thumbnail_%d_%d_%s", user.ID, time.Now().Unix(), header.Filename)
	
	// Upload to thumbnail bucket
	if h.storage != nil {
		if uploadedURL, uploadErr := h.storage.UploadFile("template-thumbnails", fileName, thumbnail, header.Header.Get("Content-Type")); uploadErr == nil {
			thumbnailURL = &uploadedURL
			fmt.Printf("✅ Thumbnail uploaded: %s\n", uploadedURL)
		} else {
			fmt.Printf("❌ Failed to upload thumbnail: %v\n", uploadErr)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Failed to upload thumbnail",
			})
			return
		}
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Storage service unavailable",
		})
		return
	}

	// Create template from user's current customization settings
	template := models.Template{
		Name:               name,
		Description:        &description,
		Category:           templateCategory,
		Status:             models.TemplateStatusApproved, // Auto-approve user templates
		IsPublic:           isPublic,
		IsPremiumOnly:      isPremiumOnly,
		CreatorID:          user.ID,
		Tags:               &tags,
		Version:            "1.0.0",
		ThumbnailURL:       thumbnailURL,
		
		// Copy user's current customization settings
		AccentColor:        &user.AccentColor,
		TextColor:          &user.TextColor,
		BackgroundColor:    &user.BackgroundColor,
		IconColor:          &user.IconColor,
		PrimaryColor:       &user.PrimaryColor,
		SecondaryColor:     &user.SecondaryColor,
		BackgroundURL:      user.BackgroundURL,
		AudioURL:           user.AudioURL,
		CustomCursorURL:    user.CustomCursorURL,
		ProfileOpacity:     &user.ProfileOpacity,
		ProfileBlur:        &user.ProfileBlur,
		VolumeLevel:        &user.VolumeLevel,
		BackgroundEffect:   user.BackgroundEffect,
		UsernameEffect:     user.UsernameEffect,
		GlowUsername:       &user.GlowUsername,
		GlowSocials:        &user.GlowSocials,
		GlowBadges:         &user.GlowBadges,
		AnimatedTitle:      &user.AnimatedTitle,
		MonochromeIcons:    &user.MonochromeIcons,
		SwapBoxColors:      &user.SwapBoxColors,
		VolumeControl:      &user.VolumeControl,
		ProfileGradient:    &user.ProfileGradient,
	}

	if err := h.db.Create(&template).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create template",
		})
		return
	}

	// Copy user assets to template buckets (async)
	go h.copyUserAssetsToTemplate(&template, user)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": fmt.Sprintf("Template created successfully! You have %d/%d templates.", userTemplateCount+1, 10),
		"data":    gin.H{"template": template},
	})
}

// GetTemplateCategories retrieves all available template categories
func (h *TemplateHandler) GetTemplateCategories(c *gin.Context) {
	categories := []models.TemplateCategory{
		models.TemplateCategoryMinimal,
		models.TemplateCategoryProfessional,
		models.TemplateCategoryCreative,
		models.TemplateCategoryGaming,
		models.TemplateCategoryMusic,
		models.TemplateCategoryBusiness,
		models.TemplateCategoryPersonal,
		models.TemplateCategoryCommunity,
		models.TemplateCategorySeasonal,
		models.TemplateCategoryOther,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    gin.H{"categories": categories},
	})
}

// GetUserTemplates retrieves templates created by the current user
func (h *TemplateHandler) GetUserTemplates(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authentication required",
		})
		return
	}

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	// Get user's templates
	var templates []models.Template
	query := h.db.Model(&models.Template{}).
		Preload("Creator").
		Preload("TemplateLinks").
		Where("creator_id = ?", user.ID).
		Order("created_at DESC")

	// Get total count
	var total int64
	query.Count(&total)

	if err := query.Offset(offset).Limit(limit).Find(&templates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch user templates",
		})
		return
	}

	// Calculate pagination info
	totalPages := int((total + int64(limit) - 1) / int64(limit))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"templates": templates,
			"pagination": gin.H{
				"page":        page,
				"limit":       limit,
				"total":       total,
				"total_pages": totalPages,
				"has_next":    page < totalPages,
				"has_prev":    page > 1,
			},
			"template_limit": gin.H{
				"current": total,
				"maximum": 10,
				"remaining": 10 - total,
			},
		},
	})
}

// copyUserAssetsToTemplate copies user's assets to template buckets
func (h *TemplateHandler) copyUserAssetsToTemplate(template *models.Template, user *models.User) {
	fmt.Printf("🗄️ Starting asset copy for template %d\n", template.ID)
	
	if h.storage == nil {
		fmt.Println("❌ Storage not configured, skipping asset copy")
		return // Storage not configured
	}

	// Generate template file prefix
	templatePrefix := fmt.Sprintf("template_%d_%d", template.ID, time.Now().Unix())
	fmt.Printf("📁 Template prefix: %s\n", templatePrefix)

	// Debug user customization data
	fmt.Printf("🔍 User customization data:\n")
	if user.BackgroundURL != nil {
		fmt.Printf("   Background URL: %s\n", *user.BackgroundURL)
	} else {
		fmt.Printf("   Background URL: nil\n")
	}
	if user.AudioURL != nil {
		fmt.Printf("   Audio URL: %s\n", *user.AudioURL)
	} else {
		fmt.Printf("   Audio URL: nil\n")
	}
	if user.CustomCursorURL != nil {
		fmt.Printf("   Cursor URL: %s\n", *user.CustomCursorURL)
	} else {
		fmt.Printf("   Cursor URL: nil\n")
	}

	// Copy background image if exists
	if user.BackgroundURL != nil && *user.BackgroundURL != "" {
		fmt.Printf("🖼️ Copying background image: %s\n", *user.BackgroundURL)
		if newURL, err := h.copyAssetToTemplateStorage(*user.BackgroundURL, "backgroundImage", templatePrefix); err == nil {
			fmt.Printf("✅ Background copied to: %s\n", newURL)
			h.db.Model(template).Update("background_url", newURL)
		} else {
			fmt.Printf("❌ Failed to copy background: %v\n", err)
		}
	} else {
		fmt.Println("⚪ No background image to copy")
	}

	// Copy audio file if exists
	if user.AudioURL != nil && *user.AudioURL != "" {
		fmt.Printf("🎵 Copying audio file: %s\n", *user.AudioURL)
		if newURL, err := h.copyAssetToTemplateStorage(*user.AudioURL, "audio", templatePrefix); err == nil {
			fmt.Printf("✅ Audio copied to: %s\n", newURL)
			h.db.Model(template).Update("audio_url", newURL)
		} else {
			fmt.Printf("❌ Failed to copy audio: %v\n", err)
		}
	} else {
		fmt.Println("⚪ No audio file to copy")
	}

	// Copy cursor if exists
	if user.CustomCursorURL != nil && *user.CustomCursorURL != "" {
		fmt.Printf("🖱️ Copying cursor: %s\n", *user.CustomCursorURL)
		if newURL, err := h.copyAssetToTemplateStorage(*user.CustomCursorURL, "cursor", templatePrefix); err == nil {
			fmt.Printf("✅ Cursor copied to: %s\n", newURL)
			h.db.Model(template).Update("custom_cursor_url", newURL)
		} else {
			fmt.Printf("❌ Failed to copy cursor: %v\n", err)
		}
	} else {
		fmt.Println("⚪ No cursor to copy")
	}

	// Skip automatic preview/thumbnail generation since user uploads thumbnail manually
	fmt.Println("ℹ️ Thumbnail provided by user, skipping automatic generation")

	fmt.Printf("🎉 Asset copy completed for template %d\n", template.ID)
}

// copyAssetToTemplateStorage copies an asset from user storage to template storage
func (h *TemplateHandler) copyAssetToTemplateStorage(sourceURL, assetType, templatePrefix string) (string, error) {
	// Extract filename from URL
	parts := strings.Split(sourceURL, "/")
	originalFilename := parts[len(parts)-1]
	
	// Create new filename
	newFilename := fmt.Sprintf("%s_%s_%s", templatePrefix, assetType, originalFilename)
	
	// Get appropriate bucket
	bucketName := storage.GetTemplateBucketForAssetType(assetType)
	
	// Copy the file
	return h.storage.CopyFileFromURL(sourceURL, bucketName, newFilename)
}


