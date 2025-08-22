package handlers

import (
	"crypto/rand"
	"encoding/base32"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"gotchu-backend/internal/middleware"
	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/auth"
	"gotchu-backend/pkg/email"
	"gotchu-backend/pkg/redis"

	"github.com/gin-gonic/gin"
	"github.com/pquerna/otp/totp"
	"gorm.io/gorm"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	db             *gorm.DB
	authService    *auth.Service
	redisClient    *redis.Client
	authMiddleware *middleware.AuthMiddleware
	emailService   *email.Service
	siteURL        string
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(db *gorm.DB, authService *auth.Service, redisClient *redis.Client, authMiddleware *middleware.AuthMiddleware, emailService *email.Service, siteURL string) *AuthHandler {
	return &AuthHandler{
		db:             db,
		authService:    authService,
		redisClient:    redisClient,
		authMiddleware: authMiddleware,
		emailService:   emailService,
		siteURL:        siteURL,
	}
}

// RegisterRequest represents registration request
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=1,max=30"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// LoginRequest represents login request
type LoginRequest struct {
	Identifier string `json:"identifier" binding:"required"` // username or email
	Password   string `json:"password" binding:"required"`
}

// Login2FARequest represents login with 2FA request
type Login2FARequest struct {
	Identifier string `json:"identifier" binding:"required"` // username or email
	Password   string `json:"password" binding:"required"`
	TwoFACode  string `json:"twofa_code" binding:"required,min=6,max=6"`
}

// RefreshRequest represents token refresh request
type RefreshRequest struct {
	SessionID string `json:"session_id" binding:"required"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	Success bool                `json:"success"`
	Message string              `json:"message"`
	Data    *AuthResponseData   `json:"data,omitempty"`
}

// AuthResponseData represents authentication response data
type AuthResponseData struct {
	User      UserProfile `json:"user"`
	SessionID string      `json:"session_id"`
	Token     string      `json:"token"`
	ExpiresAt time.Time   `json:"expires_at"`
}

// UserProfile represents user profile in response
type UserProfile struct {
	ID          uint      `json:"id"`
	Username    string    `json:"username"`
	Email       string    `json:"email"`
	DisplayName *string   `json:"display_name"`
	AvatarURL   *string   `json:"avatar_url"`
	IsVerified  bool      `json:"is_verified"`
	Plan        string    `json:"plan"`
	Theme       string    `json:"theme"`
	MfaEnabled  bool      `json:"mfa_enabled"`
	CreatedAt   time.Time `json:"created_at"`
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	fmt.Printf("Register request from %s\n", c.ClientIP())
	
	// Manual JSON parsing to debug EOF issue
	body, err := c.GetRawData()
	if err != nil {
		fmt.Printf("Failed to read body: %v\n", err)
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "Failed to read request body",
		})
		return
	}
	
	fmt.Printf("Raw body received: %s\n", string(body))
	
	var req RegisterRequest
	if err := json.Unmarshal(body, &req); err != nil {
		fmt.Printf("JSON unmarshal error: %v\n", err)
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: fmt.Sprintf("Invalid JSON: %v", err),
		})
		return
	}

	fmt.Printf("Register request data - Username: '%s', Email: '%s'\n", req.Username, req.Email)

	// Normalize input
	req.Username = strings.ToLower(strings.TrimSpace(req.Username))
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	// Validate input
	if err := h.authService.ValidateUsername(req.Username); err != nil {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	if err := h.authService.ValidateEmail(req.Email); err != nil {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	if err := h.authService.ValidatePassword(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	// Check if user already exists
	var existingUser models.User
	err = h.db.Where("username = ? OR email = ?", req.Username, req.Email).First(&existingUser).Error
	if err == nil {
		if existingUser.Username == req.Username {
			c.JSON(http.StatusConflict, AuthResponse{
				Success: false,
				Message: "Username already exists",
			})
			return
		}
		if *existingUser.Email == req.Email {
			c.JSON(http.StatusConflict, AuthResponse{
				Success: false,
				Message: "Email already exists",
			})
			return
		}
	}

	// Hash password
	hashedPassword, err := h.authService.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to process password",
		})
		return
	}

	// Create user (not verified initially)
	user := models.User{
		Username:    req.Username,
		Email:       &req.Email,
		DisplayName: &req.Username, // Use username as initial display name
		Bio:         stringPtr("Welcome to " + req.Username + "'s profile!"),
		IsActive:    true,
		Plan:        "free",
		Theme:       "dark",
		IsVerified:  false, // Email not verified yet
	}

	// Start transaction
	tx := h.db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Database error",
		})
		return
	}

	// Create user
	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to create user",
		})
		return
	}

	// Create auth record
	salt, err := h.authService.GenerateSalt()
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to generate security data",
		})
		return
	}

	userAuth := models.UserAuth{
		UserID:       user.ID,
		PasswordHash: hashedPassword,
		Salt:         salt,
	}

	if err := tx.Create(&userAuth).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to create authentication",
		})
		return
	}

	// Generate verification token
	verificationToken, err := h.emailService.GenerateVerificationToken()
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to generate verification token",
		})
		return
	}

	// Create email verification record
	emailVerification := models.EmailVerification{
		UserID:    user.ID,
		Token:     verificationToken,
		Email:     req.Email,
		ExpiresAt: time.Now().UTC().Add(24 * time.Hour), // 24 hour expiry
	}

	if err := tx.Create(&emailVerification).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to create verification record",
		})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to complete registration",
		})
		return
	}

	// Send verification email (async - don't block response on email failure)
	go func() {
		if err := h.emailService.SendVerificationEmail(
			req.Email,
			req.Username,
			verificationToken,
			h.siteURL,
		); err != nil {
			fmt.Printf("Failed to send verification email to %s: %v\n", req.Email, err)
		}
	}()

	// Clear rate limit on successful registration
	h.authMiddleware.ClearAuthRateLimit(req.Email)

	// Respond with success - indicate email verification is required
	c.JSON(http.StatusCreated, AuthResponse{
		Success: true,
		Message: "Account created successfully. Please check your email to verify your account.",
		Data: &AuthResponseData{
			User: UserProfile{
				ID:          user.ID,
				Username:    user.Username,
				Email:       *user.Email,
				DisplayName: user.DisplayName,
				AvatarURL:   user.AvatarURL,
				IsVerified:  user.IsVerified,
				Plan:        user.Plan,
				Theme:       user.Theme,
				MfaEnabled:  user.MfaEnabled,
				CreatedAt:   user.CreatedAt,
			},
			// No session data - user must verify email first
		},
	})
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "Invalid request data",
		})
		return
	}

	// Normalize identifier
	req.Identifier = strings.ToLower(strings.TrimSpace(req.Identifier))

	// Find user by username or email
	var user models.User
	var userAuth models.UserAuth
	
	err := h.db.Preload("User").
		Joins("JOIN users ON users.id = user_auth.user_id").
		Where("users.username = ? OR users.email = ?", req.Identifier, req.Identifier).
		Where("users.is_active = ?", true).
		First(&userAuth).Error

	if err != nil {
		c.JSON(http.StatusUnauthorized, AuthResponse{
			Success: false,
			Message: "Invalid credentials",
		})
		return
	}

	user = userAuth.User

	// Verify password
	if !h.authService.VerifyPassword(req.Password, userAuth.PasswordHash) {
		c.JSON(http.StatusUnauthorized, AuthResponse{
			Success: false,
			Message: "Invalid credentials",
		})
		return
	}

	// Check if user has 2FA enabled
	if user.MfaEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"requires_2fa": true,
			"message": "2FA verification required",
		})
		return
	}

	// Update last login
	h.db.Model(&user).Update("last_login_at", time.Now())

	// Create session
	authResult, err := h.authService.CreateAuthResult(
		user.ID,
		user.Username,
		*user.Email,
		user.IsVerified,
		user.Plan,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to create session",
		})
		return
	}

	// Store session in Redis
	loginSessionData := redis.SessionData{
		UserID:     authResult.User.UserID,
		Username:   authResult.User.Username,
		Email:      authResult.User.Email,
		IsVerified: authResult.User.IsVerified,
		Plan:       authResult.User.Plan,
		CreatedAt:  authResult.User.CreatedAt,
	}
	err = h.redisClient.SetSession(authResult.SessionID, loginSessionData, h.authService.GetSessionExpiry())
	if err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to store session",
		})
		return
	}

	// Clear rate limit on successful login
	h.authMiddleware.ClearAuthRateLimit(req.Identifier)

	// Respond with success
	c.JSON(http.StatusOK, AuthResponse{
		Success: true,
		Message: "Login successful",
		Data: &AuthResponseData{
			User: UserProfile{
				ID:          user.ID,
				Username:    user.Username,
				Email:       *user.Email,
				DisplayName: user.DisplayName,
				AvatarURL:   user.AvatarURL,
				IsVerified:  user.IsVerified,
				Plan:        user.Plan,
				Theme:       user.Theme,
				MfaEnabled:  user.MfaEnabled,
				CreatedAt:   user.CreatedAt,
			},
			SessionID: authResult.SessionID,
			Token:     authResult.Token,
			ExpiresAt: authResult.ExpiresAt,
		},
	})
}

// Login2FA handles user login with 2FA verification
func (h *AuthHandler) Login2FA(c *gin.Context) {
	var req Login2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "Invalid request data",
		})
		return
	}

	// Normalize identifier
	req.Identifier = strings.ToLower(strings.TrimSpace(req.Identifier))

	// Find user by username or email
	var user models.User
	var userAuth models.UserAuth
	
	err := h.db.Preload("User").
		Joins("JOIN users ON users.id = user_auth.user_id").
		Where("users.username = ? OR users.email = ?", req.Identifier, req.Identifier).
		Where("users.is_active = ?", true).
		First(&userAuth).Error

	if err != nil {
		c.JSON(http.StatusUnauthorized, AuthResponse{
			Success: false,
			Message: "Invalid credentials",
		})
		return
	}

	user = userAuth.User

	// Verify password
	if !h.authService.VerifyPassword(req.Password, userAuth.PasswordHash) {
		c.JSON(http.StatusUnauthorized, AuthResponse{
			Success: false,
			Message: "Invalid credentials",
		})
		return
	}

	// Check if user has 2FA enabled
	if !user.MfaEnabled || user.MfaSecret == nil {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "2FA is not enabled for this account",
		})
		return
	}

	// Verify 2FA code
	valid := totp.Validate(req.TwoFACode, *user.MfaSecret)
	if !valid {
		c.JSON(http.StatusUnauthorized, AuthResponse{
			Success: false,
			Message: "Invalid 2FA code",
		})
		return
	}

	// Update last login
	h.db.Model(&user).Update("last_login_at", time.Now())

	// Create session
	authResult, err := h.authService.CreateAuthResult(
		user.ID,
		user.Username,
		*user.Email,
		user.IsVerified,
		user.Plan,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to create session",
		})
		return
	}

	// Store session in Redis
	loginSessionData := redis.SessionData{
		UserID:     authResult.User.UserID,
		Username:   authResult.User.Username,
		Email:      authResult.User.Email,
		IsVerified: authResult.User.IsVerified,
		Plan:       authResult.User.Plan,
		CreatedAt:  authResult.User.CreatedAt,
	}
	err = h.redisClient.SetSession(authResult.SessionID, loginSessionData, h.authService.GetSessionExpiry())
	if err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to store session",
		})
		return
	}

	// Clear rate limit on successful login
	h.authMiddleware.ClearAuthRateLimit(req.Identifier)

	// Respond with success
	c.JSON(http.StatusOK, AuthResponse{
		Success: true,
		Message: "Login successful",
		Data: &AuthResponseData{
			User: UserProfile{
				ID:          user.ID,
				Username:    user.Username,
				Email:       *user.Email,
				DisplayName: user.DisplayName,
				AvatarURL:   user.AvatarURL,
				IsVerified:  user.IsVerified,
				Plan:        user.Plan,
				Theme:       user.Theme,
				MfaEnabled:  user.MfaEnabled,
				CreatedAt:   user.CreatedAt,
			},
			SessionID: authResult.SessionID,
			Token:     authResult.Token,
			ExpiresAt: authResult.ExpiresAt,
		},
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	sessionID := c.GetHeader("X-Session-ID")
	
	// Also try to get from current session context
	if sessionID == "" {
		if _, exists := middleware.GetCurrentSession(c); exists {
			sessionID = c.GetHeader("X-Session-ID") // This would need to be stored in session
		}
	}

	if sessionID != "" {
		h.redisClient.DeleteSession(sessionID)
	}

	c.JSON(http.StatusOK, AuthResponse{
		Success: true,
		Message: "Logout successful",
	})
}

// GetCurrentUser returns current user information
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, AuthResponse{
			Success: false,
			Message: "Not authenticated",
		})
		return
	}

	session, _ := middleware.GetCurrentSession(c)

	response := gin.H{
		"success": true,
		"data": gin.H{
			"user": UserProfile{
				ID:          user.ID,
				Username:    user.Username,
				Email:       *user.Email,
				DisplayName: user.DisplayName,
				AvatarURL:   user.AvatarURL,
				IsVerified:  user.IsVerified,
				Plan:        user.Plan,
				Theme:       user.Theme,
				MfaEnabled:  user.MfaEnabled,
				CreatedAt:   user.CreatedAt,
			},
		},
	}

	if session != nil {
		response["data"].(gin.H)["session"] = session
	}

	c.JSON(http.StatusOK, response)
}

// RefreshToken refreshes authentication token
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "Session ID required",
		})
		return
	}

	// Get session from Redis
	session, err := h.redisClient.GetSession(req.SessionID)
	if err != nil || session == nil {
		c.JSON(http.StatusUnauthorized, AuthResponse{
			Success: false,
			Message: "Invalid or expired session",
		})
		return
	}

	// Generate new token
	newToken, err := h.authService.RefreshToken(req.SessionID, session.UserID, session.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to refresh token",
		})
		return
	}

	// Extend session
	h.redisClient.ExtendSession(req.SessionID, h.authService.GetSessionExpiry())

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Token refreshed successfully",
		"data": gin.H{
			"token":      newToken,
			"session":    session,
			"expires_at": time.Now().Add(h.authService.GetSessionExpiry()),
		},
	})
}

// CheckUsernameAvailability checks if a username is available
func (h *AuthHandler) CheckUsernameAvailability(c *gin.Context) {
	type UsernameCheckResponse struct {
		Success   bool   `json:"success"`
		Available bool   `json:"available"`
		Message   string `json:"message,omitempty"`
	}

	// Get username from URL parameter instead of JSON body
	username := c.Param("username")
	if username == "" {
		// Fallback to query parameter
		username = c.Query("username")
	}

	fmt.Printf("Username check request from %s for username: '%s'\n", c.ClientIP(), username)

	// Validate username length
	if len(strings.TrimSpace(username)) < 1 {
		c.JSON(http.StatusOK, UsernameCheckResponse{
			Success:   true,
			Available: false,
			Message:   "Username is required",
		})
		return
	}

	// Normalize username to lowercase
	username = strings.ToLower(strings.TrimSpace(username))

	// Validate username format (alphanumeric and underscores only)
	if !isValidUsername(username) {
		c.JSON(http.StatusOK, UsernameCheckResponse{
			Success:   true,
			Available: false,
			Message:   "Username can only contain letters, numbers, and underscores",
		})
		return
	}

	// Check if username exists in database
	var user models.User
	err := h.db.Where("username = ?", username).First(&user).Error
	
	if err == nil {
		// Username exists
		c.JSON(http.StatusOK, UsernameCheckResponse{
			Success:   true,
			Available: false,
			Message:   "Username is already taken",
		})
		return
	}

	if err != gorm.ErrRecordNotFound {
		// Database error
		c.JSON(http.StatusInternalServerError, UsernameCheckResponse{
			Success: false,
			Message: "Failed to check username availability",
		})
		return
	}

	// Username is available
	c.JSON(http.StatusOK, UsernameCheckResponse{
		Success:   true,
		Available: true,
		Message:   "Username is available",
	})
}

// UpdateUsernameRequest represents update username request
type UpdateUsernameRequest struct {
	Username string `json:"username" binding:"required,min=1,max=20"`
}

// UpdateDisplayNameRequest represents update display name request
type UpdateDisplayNameRequest struct {
	DisplayName string `json:"displayName" binding:"max=30"`
}

// UpdateAliasRequest represents update alias request
type UpdateAliasRequest struct {
	Alias string `json:"alias" binding:"max=20"`
}

// UpdateUsername updates the user's username
func (h *AuthHandler) UpdateUsername(c *gin.Context) {
	var req UpdateUsernameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request format",
			"error":   err.Error(),
		})
		return
	}

	// Get current user from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// Normalize username
	newUsername := strings.ToLower(strings.TrimSpace(req.Username))

	// Validate username format
	if !isValidUsername(newUsername) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Username can only contain letters, numbers, and underscores (1-20 characters)",
		})
		return
	}

	// Check if username is already taken
	var existingUser models.User
	err := h.db.Where("username = ? AND id != ?", newUsername, userID).First(&existingUser).Error
	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Username is already taken",
		})
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to check username availability",
		})
		return
	}

	// Update username
	err = h.db.Model(&models.User{}).Where("id = ?", userID).Update("username", newUsername).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update username",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Username updated successfully",
		"data": gin.H{
			"username": newUsername,
		},
	})
}

// UpdateDisplayName updates the user's display name
func (h *AuthHandler) UpdateDisplayName(c *gin.Context) {
	var req UpdateDisplayNameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request format",
			"error":   err.Error(),
		})
		return
	}

	// Get current user from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// Clean display name (allow empty for removal)
	displayName := strings.TrimSpace(req.DisplayName)
	var displayNamePtr *string
	if displayName == "" {
		displayNamePtr = nil
	} else {
		displayNamePtr = &displayName
	}

	// Update display name
	err := h.db.Model(&models.User{}).Where("id = ?", userID).Update("display_name", displayNamePtr).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update display name",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Display name updated successfully",
		"data": gin.H{
			"displayName": displayNamePtr,
		},
	})
}

// UpdateAlias updates the user's alias (Premium only)
func (h *AuthHandler) UpdateAlias(c *gin.Context) {
	var req UpdateAliasRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request format",
			"error":   err.Error(),
		})
		return
	}

	// Get current user from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// Get user to check premium status
	var currentUser models.User
	err := h.db.Where("id = ?", userID).First(&currentUser).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch user data",
		})
		return
	}

	// Check if user has premium plan
	if currentUser.Plan != "premium" {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "Alias feature is only available for premium users",
		})
		return
	}

	// Clean alias (allow empty for removal)
	alias := strings.TrimSpace(req.Alias)
	var aliasPtr *string
	if alias == "" {
		aliasPtr = nil
	} else {
		// Validate alias format
		if !isValidAlias(alias) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Alias can only contain letters, numbers, and underscores (1-20 characters)",
			})
			return
		}

		// Check if alias is already taken
		var existingUser models.User
		err := h.db.Where("alias = ? AND id != ?", alias, userID).First(&existingUser).Error
		if err == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Alias is already taken",
			})
			return
		} else if err != gorm.ErrRecordNotFound {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to check alias availability",
			})
			return
		}

		aliasPtr = &alias
	}

	// Update alias
	err = h.db.Model(&models.User{}).Where("id = ?", userID).Update("alias", aliasPtr).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update alias",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Alias updated successfully",
		"data": gin.H{
			"alias": aliasPtr,
		},
	})
}

// Helper function to validate alias format
func isValidAlias(alias string) bool {
	if len(alias) < 1 || len(alias) > 20 {
		return false
	}
	
	// Check if alias contains only alphanumeric characters and underscores
	for _, char := range alias {
		if !((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9') || char == '_') {
			return false
		}
	}
	return true
}

// Helper function to validate username format
func isValidUsername(username string) bool {
	if len(username) < 1 || len(username) > 20 {
		return false
	}
	
	// Check if username contains only alphanumeric characters and underscores
	for _, char := range username {
		if !((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '_') {
			return false
		}
	}
	
	return true
}

// VerifyEmailRequest represents email verification request
type VerifyEmailRequest struct {
	Token string `form:"token" binding:"required"`
}

// ResendVerificationRequest represents resend verification request  
type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// TwoFAGenerateRequest represents 2FA generate request
type TwoFAGenerateRequest struct {
	// No additional fields needed, uses authenticated user
}

// TwoFAGenerateResponse represents 2FA generate response
type TwoFAGenerateResponse struct {
	Success     bool     `json:"success"`
	Message     string   `json:"message"`
	Secret      string   `json:"secret"`
	QRCodeURL   string   `json:"qr_code_url"`
	BackupCodes []string `json:"backup_codes"`
}

// TwoFAVerifyRequest represents 2FA verify request
type TwoFAVerifyRequest struct {
	Code   string `json:"code" binding:"required,min=6,max=6"`
	Secret string `json:"secret" binding:"required"`
}

// TwoFAVerifyResponse represents 2FA verify response
type TwoFAVerifyResponse struct {
	Success     bool     `json:"success"`
	Message     string   `json:"message"`
	BackupCodes []string `json:"backup_codes,omitempty"`
}

// TwoFADisableRequest represents 2FA disable request
type TwoFADisableRequest struct {
	Password string `json:"password" binding:"required"`
}

// VerifyEmail handles email verification
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var req VerifyEmailRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "Verification token is required",
		})
		return
	}

	// Find verification record
	var emailVerification models.EmailVerification
	err := h.db.Preload("User").Where("token = ?", req.Token).First(&emailVerification).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "Invalid or expired verification token",
		})
		return
	}

	// Check if token is valid
	if !emailVerification.IsValid() {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "Verification token has expired or been used",
		})
		return
	}

	// Start transaction
	tx := h.db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Database error",
		})
		return
	}

	// Mark email as verified
	now := time.Now().UTC()
	if err := tx.Model(&emailVerification.User).Updates(map[string]interface{}{
		"is_verified":        true,
		"email_verified":     true,
		"email_verified_at":  &now,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to verify email",
		})
		return
	}

	// Mark verification token as used
	if err := tx.Model(&emailVerification).Update("used_at", &now).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to update verification record",
		})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to complete verification",
		})
		return
	}

	// Create session for the verified user
	authResult, err := h.authService.CreateAuthResult(
		emailVerification.User.ID,
		emailVerification.User.Username,
		*emailVerification.User.Email,
		true, // Now verified
		emailVerification.User.Plan,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to create session",
		})
		return
	}

	// Store session in Redis
	sessionData := redis.SessionData{
		UserID:     authResult.User.UserID,
		Username:   authResult.User.Username,
		Email:      authResult.User.Email,
		IsVerified: authResult.User.IsVerified,
		Plan:       authResult.User.Plan,
		CreatedAt:  authResult.User.CreatedAt,
	}
	err = h.redisClient.SetSession(authResult.SessionID, sessionData, h.authService.GetSessionExpiry())
	if err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to store session",
		})
		return
	}

	// Respond with success and session data
	c.JSON(http.StatusOK, AuthResponse{
		Success: true,
		Message: "Email verified successfully! Welcome to Gotchu!",
		Data: &AuthResponseData{
			User: UserProfile{
				ID:          emailVerification.User.ID,
				Username:    emailVerification.User.Username,
				Email:       *emailVerification.User.Email,
				DisplayName: emailVerification.User.DisplayName,
				AvatarURL:   emailVerification.User.AvatarURL,
				IsVerified:  true,
				Plan:        emailVerification.User.Plan,
				Theme:       emailVerification.User.Theme,
				CreatedAt:   emailVerification.User.CreatedAt,
			},
			SessionID: authResult.SessionID,
			Token:     authResult.Token,
			ExpiresAt: authResult.ExpiresAt,
		},
	})
}

// ResendVerification handles resending verification email
func (h *AuthHandler) ResendVerification(c *gin.Context) {
	var req ResendVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "Valid email is required",
		})
		return
	}

	// Normalize email
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	// Find user by email
	var user models.User
	err := h.db.Where("email = ?", req.Email).First(&user).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "No account found with this email address",
		})
		return
	}

	// Check if already verified
	if user.IsVerified {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "Email is already verified",
		})
		return
	}

	// Check for recent verification attempts (rate limiting)
	var recentVerification models.EmailVerification
	oneMinuteAgo := time.Now().UTC().Add(-1 * time.Minute)
	err = h.db.Where("user_id = ? AND created_at > ?", user.ID, oneMinuteAgo).First(&recentVerification).Error
	if err == nil {
		c.JSON(http.StatusTooManyRequests, AuthResponse{
			Success: false,
			Message: "Please wait 60 seconds before requesting another verification email",
		})
		return
	}

	// Generate new verification token
	verificationToken, err := h.emailService.GenerateVerificationToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to generate verification token",
		})
		return
	}

	// Create new verification record
	emailVerification := models.EmailVerification{
		UserID:    user.ID,
		Token:     verificationToken,
		Email:     req.Email,
		ExpiresAt: time.Now().UTC().Add(24 * time.Hour), // 24 hour expiry
	}

	if err := h.db.Create(&emailVerification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to create verification record",
		})
		return
	}

	// Send verification email (async)
	go func() {
		if err := h.emailService.SendVerificationEmail(
			req.Email,
			user.Username,
			verificationToken,
			h.siteURL,
		); err != nil {
			fmt.Printf("Failed to send verification email to %s: %v\n", req.Email, err)
		}
	}()

	c.JSON(http.StatusOK, AuthResponse{
		Success: true,
		Message: "Verification email sent successfully",
	})
}

// Generate2FA generates a new TOTP secret and QR code for 2FA setup
func (h *AuthHandler) Generate2FA(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, TwoFAGenerateResponse{
			Success: false,
			Message: "Not authenticated",
		})
		return
	}

	// Check if 2FA is already enabled
	if user.MfaEnabled {
		c.JSON(http.StatusBadRequest, TwoFAGenerateResponse{
			Success: false,
			Message: "2FA is already enabled for this account",
		})
		return
	}

	// Generate TOTP secret
	secret, err := generateTOTPSecret()
	if err != nil {
		c.JSON(http.StatusInternalServerError, TwoFAGenerateResponse{
			Success: false,
			Message: "Failed to generate 2FA secret",
		})
		return
	}

	// Generate QR code URL
	qrURL := generateTOTPURL(secret, *user.Email, "gotchu.lol")

	// Generate backup codes
	backupCodes := generateBackupCodes(10)

	c.JSON(http.StatusOK, TwoFAGenerateResponse{
		Success:     true,
		Message:     "2FA secret generated successfully",
		Secret:      secret,
		QRCodeURL:   qrURL,
		BackupCodes: backupCodes,
	})
}

// Verify2FA verifies the TOTP code and enables 2FA for the user
func (h *AuthHandler) Verify2FA(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, TwoFAVerifyResponse{
			Success: false,
			Message: "Not authenticated",
		})
		return
	}

	var req TwoFAVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, TwoFAVerifyResponse{
			Success: false,
			Message: "Invalid request data",
		})
		return
	}

	// Verify the TOTP code
	valid := totp.Validate(req.Code, req.Secret)
	if !valid {
		c.JSON(http.StatusBadRequest, TwoFAVerifyResponse{
			Success: false,
			Message: "Invalid verification code",
		})
		return
	}

	// Generate backup codes
	backupCodes := generateBackupCodes(10)
	backupCodesJSON, _ := json.Marshal(backupCodes)

	// Update user with 2FA settings
	mfaType := "totp"
	err := h.db.Model(&user).Updates(map[string]interface{}{
		"mfa_enabled": true,
		"mfa_secret":  req.Secret,
		"mfa_type":    &mfaType,
		"updated_at":  time.Now(),
	}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, TwoFAVerifyResponse{
			Success: false,
			Message: "Failed to enable 2FA",
		})
		return
	}

	// Store backup codes (in a real app, you'd store these securely)
	// For now, we'll return them to the user to save
	fmt.Printf("Backup codes for user %d: %s\n", user.ID, string(backupCodesJSON))

	c.JSON(http.StatusOK, TwoFAVerifyResponse{
		Success:     true,
		Message:     "2FA enabled successfully",
		BackupCodes: backupCodes,
	})
}

// Disable2FA disables 2FA for the user
func (h *AuthHandler) Disable2FA(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Not authenticated",
		})
		return
	}

	var req TwoFADisableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Password is required",
		})
		return
	}

	// Get user auth record to verify password
	var userAuth models.UserAuth
	err := h.db.Where("user_id = ?", user.ID).First(&userAuth).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to verify user",
		})
		return
	}

	// Verify password
	if !h.authService.VerifyPassword(req.Password, userAuth.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid password",
		})
		return
	}

	// Disable 2FA
	err = h.db.Model(&user).Updates(map[string]interface{}{
		"mfa_enabled": false,
		"mfa_secret":  nil,
		"mfa_type":    nil,
		"updated_at":  time.Now(),
	}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to disable 2FA",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "2FA disabled successfully",
	})
}

// generateTOTPSecret generates a new TOTP secret
func generateTOTPSecret() (string, error) {
	secretBytes := make([]byte, 20)
	_, err := rand.Read(secretBytes)
	if err != nil {
		return "", err
	}
	return base32.StdEncoding.EncodeToString(secretBytes), nil
}

// generateTOTPURL generates a TOTP URL for QR code
func generateTOTPURL(secret, email, issuer string) string {
	label := fmt.Sprintf("%s:%s", issuer, email)
	return fmt.Sprintf("otpauth://totp/%s?secret=%s&issuer=%s",
		url.QueryEscape(label),
		secret,
		url.QueryEscape(issuer))
}

// generateBackupCodes generates backup codes for 2FA
func generateBackupCodes(count int) []string {
	codes := make([]string, count)
	chars := "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Exclude confusing characters

	for i := 0; i < count; i++ {
		code := make([]byte, 8)
		for j := range code {
			randBytes := make([]byte, 1)
			rand.Read(randBytes)
			code[j] = chars[int(randBytes[0])%len(chars)]
		}
		codes[i] = string(code)
	}
	return codes
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}