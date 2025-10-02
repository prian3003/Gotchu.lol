package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/auth"
	"gotchu-backend/pkg/redis"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AuthMiddleware handles authentication
type AuthMiddleware struct {
	authService *auth.Service
	redisClient *redis.Client
	db          *gorm.DB
}

// NewAuthMiddleware creates a new auth middleware
func NewAuthMiddleware(authService *auth.Service, redisClient *redis.Client, db *gorm.DB) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
		redisClient: redisClient,
		db:          db,
	}
}

// RequireAuth middleware requires authentication
func (am *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, session, err := am.authenticateRequest(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
				"code":  "AUTH_REQUIRED",
			})
			c.Abort()
			return
		}

		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired session",
				"code":  "INVALID_SESSION",
			})
			c.Abort()
			return
		}

		if !user.IsActive {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "User account is inactive",
				"code":  "USER_INACTIVE",
			})
			c.Abort()
			return
		}

		// Store user and session in context
		c.Set("user", user)
		c.Set("session", session)
		c.Set("user_id", user.ID)

		c.Next()
	}
}

// OptionalAuth middleware provides optional authentication
func (am *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, session, _ := am.authenticateRequest(c)

		if user != nil && user.IsActive {
			c.Set("user", user)
			c.Set("session", session)
			c.Set("user_id", user.ID)
		}

		c.Next()
	}
}

// RequirePremium middleware requires premium subscription
func (am *AuthMiddleware) RequirePremium() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
				"code":  "AUTH_REQUIRED",
			})
			c.Abort()
			return
		}

		userModel := user.(*models.User)
		premiumPlans := []string{"premium", "pro", "enterprise", "admin", "staff"}

		isPremium := false
		for _, plan := range premiumPlans {
			if userModel.Plan == plan {
				isPremium = true
				break
			}
		}

		if !isPremium {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Premium subscription required",
				"code":  "PREMIUM_REQUIRED",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAdmin middleware requires admin privileges
func (am *AuthMiddleware) RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
				"code":  "AUTH_REQUIRED",
			})
			c.Abort()
			return
		}

		userModel := user.(*models.User)
		if userModel.Plan != "admin" && userModel.Plan != "staff" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Admin access required",
				"code":  "ADMIN_REQUIRED",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// authenticateRequest handles the core authentication logic
func (am *AuthMiddleware) authenticateRequest(c *gin.Context) (*models.User, *redis.SessionData, error) {
	// Try session ID from cookie first, then header for backward compatibility
	sessionID, err := c.Cookie("sessionId")
	if err != nil || sessionID == "" {
		// Fallback to header for backward compatibility
		sessionID = c.GetHeader("X-Session-ID")
	}
	
	if sessionID != "" {
		session, err := am.redisClient.GetSession(sessionID)
		if err != nil {
			return nil, nil, err
		}

		if session != nil {
			// Extend session
			am.redisClient.ExtendSession(sessionID, am.authService.GetSessionExpiry())

			// Get user from cache or database
			user, err := am.getUserByID(session.UserID)
			if err != nil {
				return nil, nil, err
			}

			return user, session, nil
		} else {
			fmt.Printf("Auth middleware: Session not found in Redis\n")
		}
	}

	// Try JWT token
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString != authHeader {
			claims, err := am.authService.ValidateToken(tokenString)
			if err != nil {
				return nil, nil, err
			}

			// Validate session if present in claims
			if claims.SessionID != "" {
				session, err := am.redisClient.GetSession(claims.SessionID)
				if err != nil {
					return nil, nil, err
				}

				if session != nil {
					user, err := am.getUserByID(session.UserID)
					if err != nil {
						return nil, nil, err
					}

					return user, session, nil
				}
			}
		}
	}

	return nil, nil, nil
}

// getUserByID gets user by ID with caching
func (am *AuthMiddleware) getUserByID(userID uint) (*models.User, error) {
	// Try cache first
	cached, err := am.redisClient.GetUserCache(userID)
	if err == nil && cached != nil {
		user := &models.User{
			ID:           cached.ID,
			Username:     cached.Username,
			Email:        &cached.Email,
			DisplayName:  cached.DisplayName,
			AvatarURL:    cached.AvatarURL,
			IsVerified:   cached.IsVerified,
			Plan:         cached.Plan,
			Theme:        cached.Theme,
			IsActive:     cached.IsActive,
			ProfileViews: cached.ProfileViews,
			TotalClicks:  cached.TotalClicks,
			MfaEnabled:   cached.MfaEnabled,
		}
		return user, nil
	}

	// Get from database
	var user models.User
	err = am.db.Where("id = ?", userID).First(&user).Error
	if err != nil {
		return nil, err
	}

	// Cache the user data
	userEmail := ""
	if user.Email != nil {
		userEmail = *user.Email
	}
	
	cacheData := redis.UserCache{
		ID:           user.ID,
		Username:     user.Username,
		Email:        userEmail,
		DisplayName:  user.DisplayName,
		AvatarURL:    user.AvatarURL,
		IsVerified:   user.IsVerified,
		Plan:         user.Plan,
		Theme:        user.Theme,
		IsActive:     user.IsActive,
		ProfileViews: user.ProfileViews,
		TotalClicks:  user.TotalClicks,
		MfaEnabled:   user.MfaEnabled,
		UpdatedAt:    time.Now(),
	}
	am.redisClient.SetUserCache(user.ID, cacheData, 30*time.Minute)

	return &user, nil
}

// RateLimitAuth middleware for authentication endpoints
func (am *AuthMiddleware) RateLimitAuth(maxAttempts int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get identifier from request body
		var requestBody map[string]interface{}
		if c.ShouldBindJSON(&requestBody) == nil {
			var identifier string

			if id, exists := requestBody["identifier"]; exists {
				identifier = id.(string)
			} else if username, exists := requestBody["username"]; exists {
				identifier = username.(string)
			} else if email, exists := requestBody["email"]; exists {
				identifier = email.(string)
			}

			if identifier != "" {
				// Check rate limit
				result, err := am.redisClient.CheckRateLimit(
					"auth:"+identifier,
					maxAttempts,
					window,
				)

				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{
						"error": "Rate limiting error",
						"code":  "RATE_LIMIT_ERROR",
					})
					c.Abort()
					return
				}

				// Set rate limit headers
				c.Header("X-RateLimit-Limit", strconv.Itoa(result.Limit))
				c.Header("X-RateLimit-Remaining", strconv.Itoa(result.Remaining))
				c.Header("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(window).Unix(), 10))

				if result.Exceeded {
					c.JSON(http.StatusTooManyRequests, gin.H{
						"error": "Too many login attempts. Please try again later.",
						"code":  "RATE_LIMITED",
					})
					c.Abort()
					return
				}
			}
		}

		c.Next()
	}
}

// ClearAuthRateLimit clears rate limit for successful authentication
func (am *AuthMiddleware) ClearAuthRateLimit(identifier string) error {
	return am.redisClient.ClearRateLimit("auth:" + identifier)
}

// GetCurrentUser helper to get current user from context
func GetCurrentUser(c *gin.Context) (*models.User, bool) {
	user, exists := c.Get("user")
	if !exists {
		return nil, false
	}
	return user.(*models.User), true
}

// GetCurrentSession helper to get current session from context
func GetCurrentSession(c *gin.Context) (*redis.SessionData, bool) {
	session, exists := c.Get("session")
	if !exists {
		return nil, false
	}
	return session.(*redis.SessionData), true
}

// GetCurrentUserID helper to get current user ID from context
func GetCurrentUserID(c *gin.Context) (uint, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}
	return userID.(uint), true
}
