package handlers

import (
	"crypto/rand"
	"encoding/base32"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"gotchu-backend/internal/config"
	"gotchu-backend/internal/middleware"
	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/auth"
	"gotchu-backend/pkg/email"
	"gotchu-backend/pkg/redis"

	"github.com/gin-gonic/gin"
	"github.com/pquerna/otp/totp"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
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
	config         *config.Config
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(db *gorm.DB, authService *auth.Service, redisClient *redis.Client, authMiddleware *middleware.AuthMiddleware, emailService *email.Service, siteURL string, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		db:             db,
		authService:    authService,
		redisClient:    redisClient,
		authMiddleware: authMiddleware,
		emailService:   emailService,
		siteURL:        siteURL,
		config:         cfg,
	}
}

// InitOAuthConfig initializes OAuth configurations with values from config
func InitOAuthConfig(googleClientID, googleClientSecret, discordClientID, discordClientSecret string) {
	googleOAuthConfig.ClientID = googleClientID
	googleOAuthConfig.ClientSecret = googleClientSecret
	
	discordOAuthConfig.ClientID = discordClientID
	discordOAuthConfig.ClientSecret = discordClientSecret
}

// RegisterRequest represents registration request
type RegisterRequest struct {
	Username      string `json:"username" binding:"required,min=1,max=30"`
	Email         string `json:"email" binding:"required,email"`
	Password      string `json:"password" binding:"required,min=8"`
	TurnstileToken string `json:"turnstile_token"`
}

// LoginRequest represents login request
type LoginRequest struct {
	Identifier     string `json:"identifier" binding:"required"` // username or email
	Password       string `json:"password" binding:"required"`
	TurnstileToken string `json:"turnstile_token"`
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
		fmt.Printf("Login JSON binding failed: %v, Content-Type: %s, Content-Length: %d\n", 
			err, c.GetHeader("Content-Type"), c.Request.ContentLength)
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "Invalid request data: " + err.Error(),
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

	// Set secure session cookie
	h.setSecureCookie(c, "sessionId", authResult.SessionID, int(h.authService.GetSessionExpiry()))

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

	// Set secure session cookie
	h.setSecureCookie(c, "sessionId", authResult.SessionID, int(h.authService.GetSessionExpiry()))

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
	// Get session ID from cookie
	sessionID, err := c.Cookie("sessionId")
	if err != nil || sessionID == "" {
		// Fallback to header for backward compatibility
		sessionID = c.GetHeader("X-Session-ID")
	}

	if sessionID != "" {
		h.redisClient.DeleteSession(sessionID)
	}

	// Clear the session cookie securely
	h.setSecureCookie(c, "sessionId", "", -1)

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
				Email:       func() string {
					if user.Email != nil {
						return *user.Email
					}
					return ""
				}(),
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

		// Check if alias is already taken (check both alias and username columns)
		var existingUser models.User
		err := h.db.Where("(alias = ? OR username = ?) AND id != ?", alias, alias, userID).First(&existingUser).Error
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

	// Set session cookie for automatic authentication
	h.setSecureCookie(c, "sessionId", authResult.SessionID, int(h.authService.GetSessionExpiry()))

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

	// If 2FA is already enabled, return current setup info for reconfiguration
	if user.MfaEnabled && user.MfaSecret != nil {
		// Generate QR code URL with existing secret for reconfiguration
		qrURL := generateTOTPURL(*user.MfaSecret, *user.Email, "gotchu.lol")
		
		// Generate new backup codes
		backupCodes := generateBackupCodes(10)

		c.JSON(http.StatusOK, TwoFAGenerateResponse{
			Success:     true,
			Message:     "2FA is already enabled. You can reconfigure or generate new backup codes.",
			Secret:      *user.MfaSecret,
			QRCodeURL:   qrURL,
			BackupCodes: backupCodes,
		})
		return
	}

	// Generate TOTP secret for new setup
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

	// Clear dashboard cache to force refresh of user data
	if h.redisClient != nil {
		dashboardCacheKey := fmt.Sprintf("dashboard:user:%d", user.ID)
		customizationCacheKey := fmt.Sprintf("customization:user:%d", user.ID)
		h.redisClient.Delete(dashboardCacheKey)
		h.redisClient.Delete(customizationCacheKey)
		fmt.Printf("Cleared dashboard and customization cache for user %d after enabling 2FA\n", user.ID)
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

	// Clear dashboard cache to force refresh of user data
	if h.redisClient != nil {
		dashboardCacheKey := fmt.Sprintf("dashboard:user:%d", user.ID)
		customizationCacheKey := fmt.Sprintf("customization:user:%d", user.ID)
		h.redisClient.Delete(dashboardCacheKey)
		h.redisClient.Delete(customizationCacheKey)
		fmt.Printf("Cleared dashboard and customization cache for user %d after disabling 2FA\n", user.ID)
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

// ChangePasswordRequest represents change password request
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

// ChangePassword handles password change
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Not authenticated",
		})
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
		})
		return
	}

	// Validate new password strength
	if err := h.authService.ValidatePassword(req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Check if new password is different from current
	if req.CurrentPassword == req.NewPassword {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "New password must be different from current password",
		})
		return
	}

	// Get user auth record to verify current password
	var userAuth models.UserAuth
	err := h.db.Where("user_id = ?", user.ID).First(&userAuth).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to verify user",
		})
		return
	}

	// Verify current password
	if !h.authService.VerifyPassword(req.CurrentPassword, userAuth.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Current password is incorrect",
		})
		return
	}

	// Hash new password
	hashedPassword, err := h.authService.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to process new password",
		})
		return
	}

	// Generate new salt
	salt, err := h.authService.GenerateSalt()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate security data",
		})
		return
	}

	// Update password and salt
	err = h.db.Model(&userAuth).Updates(map[string]interface{}{
		"password_hash": hashedPassword,
		"salt":         salt,
		"updated_at":   time.Now(),
	}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update password",
		})
		return
	}

	// Log password change
	fmt.Printf("Password changed for user %d (%s)\n", user.ID, user.Username)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Password changed successfully",
	})
}

// OAuth Configuration
var (
	googleOAuthConfig = &oauth2.Config{
		ClientID:     "",  // Will be set from environment
		ClientSecret: "",  // Will be set from environment
		RedirectURL:  "http://localhost:8080/api/auth/oauth/google/callback",
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}

	discordOAuthConfig = &oauth2.Config{
		ClientID:     "",  // Will be set from environment
		ClientSecret: "",  // Will be set from environment
		RedirectURL:  "http://localhost:8080/api/auth/oauth/discord/callback",
		Scopes:       []string{"identify", "email"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://discord.com/api/oauth2/authorize",
			TokenURL: "https://discord.com/api/oauth2/token",
		},
	}
)

// OAuth User Info structures
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	VerifiedEmail bool   `json:"verified_email"`
}

type DiscordUserInfo struct {
	ID            string `json:"id"`
	Username      string `json:"username"`
	Discriminator string `json:"discriminator"`
	Avatar        string `json:"avatar"`
	Email         string `json:"email"`
	Verified      bool   `json:"verified"`
	GlobalName    string `json:"global_name"`
}

// InitiateOAuth initiates OAuth flow for Google or Discord
func (h *AuthHandler) InitiateOAuth(c *gin.Context) {
	provider := c.Param("provider")
	state := c.Query("state")
	
	if state == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Missing state parameter",
		})
		return
	}

	// Store state in Redis for verification (expires in 10 minutes)
	stateKey := fmt.Sprintf("oauth_state:%s", state)
	err := h.redisClient.Set(stateKey, provider, 10*time.Minute)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to initiate OAuth",
		})
		return
	}

	var authURL string
	switch provider {
	case "google":
		authURL = googleOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	case "discord":
		authURL = discordOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Unsupported OAuth provider",
		})
		return
	}

	c.Redirect(http.StatusTemporaryRedirect, authURL)
}

// HandleOAuthCallback handles OAuth callback from Google or Discord
func (h *AuthHandler) HandleOAuthCallback(c *gin.Context) {
	provider := c.Param("provider")
	code := c.Query("code")
	state := c.Query("state")
	
	fmt.Printf("OAuth callback received - Provider: %s, Code: %s, State: %s\n", provider, code[:10]+"...", state)

	if code == "" || state == "" {
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:5173/signin?error=oauth_failed")
		return
	}

	// Verify state parameter
	stateKey := fmt.Sprintf("oauth_state:%s", state)
	var storedProvider string
	err := h.redisClient.Get(stateKey, &storedProvider)
	if err != nil || storedProvider != provider {
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:5173/signin?error=invalid_state")
		return
	}

	// Delete used state
	h.redisClient.Delete(stateKey)

	var config *oauth2.Config
	switch provider {
	case "google":
		config = googleOAuthConfig
	case "discord":
		config = discordOAuthConfig
	default:
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:5173/signin?error=unsupported_provider")
		return
	}

	// Exchange code for token
	token, err := config.Exchange(c.Request.Context(), code)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:5173/signin?error=token_exchange_failed")
		return
	}

	// Get user info
	var userInfo interface{}
	var email, username, avatarURL string
	var isVerified bool

	switch provider {
	case "google":
		googleUser, err := h.getGoogleUserInfo(token.AccessToken)
		if err != nil {
			c.Redirect(http.StatusTemporaryRedirect, "http://localhost:5173/signin?error=user_info_failed")
			return
		}
		userInfo = googleUser
		email = googleUser.Email
		username = strings.Split(email, "@")[0] // Use email prefix as initial username
		avatarURL = googleUser.Picture
		isVerified = googleUser.VerifiedEmail

	case "discord":
		discordUser, err := h.getDiscordUserInfo(token.AccessToken)
		if err != nil {
			c.Redirect(http.StatusTemporaryRedirect, "http://localhost:5173/signin?error=user_info_failed")
			return
		}
		userInfo = discordUser
		email = discordUser.Email
		username = discordUser.Username
		if discordUser.Avatar != "" {
			avatarURL = fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.png", discordUser.ID, discordUser.Avatar)
		}
		isVerified = discordUser.Verified
	}

	// Find or create user
	user, isNewUser, err := h.findOrCreateOAuthUser(provider, userInfo, email, username, avatarURL, isVerified)
	if err != nil {
		fmt.Printf("OAuth user creation failed: %v\n", err)
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:5173/signin?error=user_creation_failed")
		return
	}
	
	fmt.Printf("OAuth user result - ID: %d, Username: %s, IsNewUser: %t\n", user.ID, user.Username, isNewUser)

	// Create session ID
	sessionID := h.authService.GenerateSessionID()
	fmt.Printf("OAuth: Generated session ID: %s\n", sessionID)

	// Store session in Redis using proper SessionData format
	userEmail := email
	if user.Email != nil {
		userEmail = *user.Email
	}
	
	sessionData := redis.SessionData{
		UserID:     user.ID,
		Username:   user.Username,
		Email:      userEmail,
		IsVerified: user.IsVerified,
		Plan:       user.Plan,
		CreatedAt:  user.CreatedAt,
	}
	
	err = h.redisClient.SetSession(sessionID, sessionData, h.authService.GetSessionExpiry())
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:5173/signin?error=session_creation_failed")
		return
	}

	// Parse original redirect from state
	stateData := make(map[string]interface{})
	stateBytes, err := json.Marshal(state)
	if err == nil {
		json.Unmarshal(stateBytes, &stateData)
	}
	
	// Set secure session cookie before redirect
	h.setSecureCookie(c, "sessionId", sessionID, int(h.authService.GetSessionExpiry()))

	// Redirect to frontend OAuth callback handler (no sensitive data in URL)
	redirectURL := "http://localhost:5173/auth/callback"
	redirectURL += fmt.Sprintf("?provider=%s", provider)
	if isNewUser {
		redirectURL += "&new_user=true"
		redirectURL += "&needs_setup=true"
		redirectURL += fmt.Sprintf("&suggested_username=%s", url.QueryEscape(username))
	}

	fmt.Printf("OAuth redirect URL: %s\n", redirectURL)
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// getGoogleUserInfo fetches user information from Google API
func (h *AuthHandler) getGoogleUserInfo(accessToken string) (*GoogleUserInfo, error) {
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var userInfo GoogleUserInfo
	err = json.Unmarshal(body, &userInfo)
	if err != nil {
		return nil, err
	}

	return &userInfo, nil
}

// getDiscordUserInfo fetches user information from Discord API
func (h *AuthHandler) getDiscordUserInfo(accessToken string) (*DiscordUserInfo, error) {
	req, err := http.NewRequest("GET", "https://discord.com/api/users/@me", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var userInfo DiscordUserInfo
	err = json.Unmarshal(body, &userInfo)
	if err != nil {
		return nil, err
	}

	return &userInfo, nil
}

// findOrCreateOAuthUser finds existing user or creates new one for OAuth login
func (h *AuthHandler) findOrCreateOAuthUser(provider string, userInfo interface{}, email, username, avatarURL string, isVerified bool) (*models.User, bool, error) {
	var user models.User
	var isNewUser bool
	var found bool

	// Strategy 1: Try to find user by provider-specific ID first (most reliable)
	if provider == "discord" {
		if discordUser, ok := userInfo.(*DiscordUserInfo); ok {
			result := h.db.Where("discord_id = ?", discordUser.ID).First(&user)
			if result.Error == nil {
				found = true
				fmt.Printf("Found existing user by Discord ID: %s\n", discordUser.ID)
			}
		}
	}
	// Add similar logic for other providers if needed

	// Strategy 2: If not found by provider ID, try by email
	if !found {
		result := h.db.Where("email = ?", email).First(&user)
		if result.Error == nil {
			found = true
			fmt.Printf("Found existing user by email: %s\n", email)
		}
	}

	// Strategy 3: If not found by email, try by username (least reliable)
	if !found {
		result := h.db.Where("username = ?", username).First(&user)
		if result.Error == nil {
			found = true
			fmt.Printf("Found existing user by username: %s\n", username)
		}
	}

	// If user exists, update their OAuth info and login
	if found {
		needsOAuthSetup := false
		
		if provider == "discord" {
			// If user doesn't have Discord ID set, they need OAuth setup
			needsOAuthSetup = user.DiscordID == nil
		} else if provider == "google" {
			// For Google OAuth, determine if user needs setup based on their current username
			// If username looks like an email address or contains '@', they likely need a proper username
			needsOAuthSetup = strings.Contains(user.Username, "@") || strings.Contains(user.Username, ".")
			
			// Also check if user was created via traditional auth and this is their first OAuth login
			if !needsOAuthSetup {
				var userAuth models.UserAuth
				authResult := h.db.Where("user_id = ?", user.ID).First(&userAuth)
				// If they have password auth AND username suggests they need a better username, setup needed
				if authResult.Error == nil && (len(user.Username) > 20 || user.Username == email) {
					needsOAuthSetup = true
				}
			}
		}
		
		// Update OAuth info
		updates := map[string]interface{}{
			"last_login_at": time.Now(),
		}
		
		// Only update avatar if user doesn't already have one
		if user.AvatarURL == nil || *user.AvatarURL == "" {
			updates["avatar_url"] = avatarURL
		}
		
		if provider == "discord" {
			if discordUser, ok := userInfo.(*DiscordUserInfo); ok {
				updates["discord_id"] = discordUser.ID
				updates["discord_username"] = discordUser.Username
				updates["discord_avatar"] = discordUser.Avatar
			}
		}
		
		if isVerified && !user.EmailVerified {
			updates["email_verified"] = true
			updates["email_verified_at"] = time.Now()
		}

		err := h.db.Model(&user).Updates(updates).Error
		if err != nil {
			return nil, false, fmt.Errorf("failed to update user: %w", err)
		}
		
		// Reload user to get updated data
		h.db.First(&user, user.ID)
		
		fmt.Printf("Successfully updated existing user: %s (ID: %d)\n", user.Username, user.ID)
		return &user, needsOAuthSetup, nil
	}

	// User doesn't exist, create new one
	isNewUser = true
	fmt.Printf("Creating new user for %s OAuth: %s (%s)\n", provider, username, email)
	
	// Ensure username is unique
	baseUsername := username
	counter := 1
	for {
		var existingUser models.User
		result := h.db.Where("username = ?", username).First(&existingUser)
		if result.Error != nil {
			// Username is available
			break
		}
		// Username taken, try with counter
		username = fmt.Sprintf("%s%d", baseUsername, counter)
		counter++
		
		// Safety check to prevent infinite loop
		if counter > 1000 {
			return nil, false, fmt.Errorf("unable to generate unique username after 1000 attempts")
		}
	}

	user = models.User{
		Username:        username,
		Email:           &email,
		EmailVerified:   isVerified,
		DisplayName:     &username,
		AvatarURL:       &avatarURL,
		IsActive:        true,
		Plan:            "free",
		Theme:           "dark",
		IsPublic:        true,
		ShowAnalytics:   true,
		LastLoginAt:     &time.Time{},
	}

	if isVerified {
		now := time.Now()
		user.EmailVerifiedAt = &now
	}

	// Set provider-specific fields
	if provider == "discord" {
		if discordUser, ok := userInfo.(*DiscordUserInfo); ok {
			user.DiscordID = &discordUser.ID
			user.DiscordUsername = &discordUser.Username
			user.DiscordAvatar = &discordUser.Avatar
		}
	}

	// Attempt to create user with retry logic for potential race conditions
	maxRetries := 3
	for attempt := 1; attempt <= maxRetries; attempt++ {
		err := h.db.Create(&user).Error
		if err == nil {
			fmt.Printf("Successfully created new user: %s (ID: %d)\n", user.Username, user.ID)
			return &user, isNewUser, nil
		}
		
		// Check if it's a duplicate key constraint error
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			if strings.Contains(err.Error(), "discord_id") {
				// Discord ID already exists - this shouldn't happen with our lookup logic
				return nil, false, fmt.Errorf("discord account already linked to another user")
			}
			if strings.Contains(err.Error(), "username") {
				// Username conflict - try with a different one
				username = fmt.Sprintf("%s%d", baseUsername, counter)
				counter++
				user.Username = username
				continue
			}
			if strings.Contains(err.Error(), "email") {
				// Email conflict - this shouldn't happen with our lookup logic
				return nil, false, fmt.Errorf("email already registered with another account")
			}
		}
		
		// For other errors, return immediately
		if attempt == maxRetries {
			return nil, false, fmt.Errorf("failed to create user after %d attempts: %w", maxRetries, err)
		}
		
		// Small delay before retry
		time.Sleep(time.Millisecond * 100)
	}

	return &user, isNewUser, nil
}

// CompleteOAuthSetup handles OAuth user setup completion
func (h *AuthHandler) CompleteOAuthSetup(c *gin.Context) {
	var req struct {
		Username    string `json:"username" binding:"required"`
		DisplayName string `json:"displayName"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "Invalid request data",
		})
		return
	}

	// Get user from session
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, AuthResponse{
			Success: false,
			Message: "User not authenticated",
		})
		return
	}

	// Validate username
	if len(req.Username) < 3 || len(req.Username) > 20 {
		c.JSON(http.StatusBadRequest, AuthResponse{
			Success: false,
			Message: "Username must be between 3 and 20 characters",
		})
		return
	}

	// Check if username is available
	var existingUser models.User
	result := h.db.Where("username = ? AND id != ?", req.Username, userID).First(&existingUser)
	if result.Error == nil {
		c.JSON(http.StatusConflict, AuthResponse{
			Success: false,
			Message: "Username is already taken",
		})
		return
	}

	// Update user
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, AuthResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}

	// Update username and display name
	updates := map[string]interface{}{
		"username": req.Username,
	}

	if req.DisplayName != "" {
		updates["display_name"] = req.DisplayName
	} else {
		updates["display_name"] = req.Username
	}

	if err := h.db.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to update user profile",
		})
		return
	}

	// Get updated user data
	if err := h.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, AuthResponse{
			Success: false,
			Message: "Failed to retrieve updated user data",
		})
		return
	}

	// Update session with new username
	sessionID, exists := c.Get("session_id")
	if exists {
		userEmail := ""
		if user.Email != nil {
			userEmail = *user.Email
		}
		
		sessionData := redis.SessionData{
			UserID:     user.ID,
			Username:   user.Username,
			Email:      userEmail,
			IsVerified: user.IsVerified,
			Plan:       user.Plan,
			CreatedAt:  user.CreatedAt,
		}
		h.redisClient.SetSession(sessionID.(string), sessionData, h.authService.GetSessionExpiry())
	}

	c.JSON(http.StatusOK, AuthResponse{
		Success: true,
		Message: "Profile setup completed successfully",
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
		},
	})
}


// setSecureCookie sets a session cookie with proper security settings
func (h *AuthHandler) setSecureCookie(c *gin.Context, name, value string, maxAge int) {
	// Determine security settings based on environment
	secure := h.config.GinMode == "release" // Secure only in production
	sameSite := http.SameSiteStrictMode
	domain := ""
	
	if h.config.GinMode == "debug" {
		sameSite = http.SameSiteLaxMode
		domain = "localhost" // Allow cross-port in development
	}

	c.SetCookie(
		name,
		value,
		maxAge,
		"/",        // path
		domain,     // domain
		secure,     // secure
		true,       // httpOnly
	)
	
	// Additional security header
	c.Header("Set-Cookie", fmt.Sprintf("%s=%s; Path=/; HttpOnly; SameSite=%s%s%s",
		name, value,
		map[http.SameSite]string{
			http.SameSiteStrictMode: "Strict",
			http.SameSiteLaxMode:    "Lax",
			http.SameSiteNoneMode:   "None",
		}[sameSite],
		func() string { if secure { return "; Secure" }; return "" }(),
		func() string { if maxAge > 0 { return fmt.Sprintf("; Max-Age=%d", maxAge) }; return "" }(),
	))
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}