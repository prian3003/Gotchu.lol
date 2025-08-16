package middleware

import (
	"net/http"
	"strconv"
	"time"

	"gotchu-backend/pkg/redis"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// RateLimiter struct for rate limiting
type RateLimiter struct {
	redisClient *redis.Client
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(redisClient *redis.Client) *RateLimiter {
	return &RateLimiter{
		redisClient: redisClient,
	}
}

// GlobalRateLimit applies global rate limiting per IP
func (rl *RateLimiter) GlobalRateLimit(requestsPerWindow int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		key := "global:" + clientIP

		result, err := rl.redisClient.CheckRateLimit(key, requestsPerWindow, window)
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
				"error": "Too many requests. Please try again later.",
				"code":  "RATE_LIMITED",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// APIRateLimit applies rate limiting for API endpoints
func (rl *RateLimiter) APIRateLimit(requestsPerWindow int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		var key string

		// Use user ID if authenticated, otherwise use IP
		if userID, exists := c.Get("user_id"); exists {
			key = "api:user:" + strconv.FormatUint(uint64(userID.(uint)), 10)
		} else {
			key = "api:ip:" + c.ClientIP()
		}

		result, err := rl.redisClient.CheckRateLimit(key, requestsPerWindow, window)
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
				"error": "API rate limit exceeded. Please try again later.",
				"code":  "API_RATE_LIMITED",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// MemoryRateLimit uses in-memory rate limiting (for lighter endpoints)
func MemoryRateLimit(requestsPerSecond int, burst int) gin.HandlerFunc {
	limiter := rate.NewLimiter(rate.Limit(requestsPerSecond), burst)

	return func(c *gin.Context) {
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded",
				"code":  "RATE_LIMITED",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// CustomRateLimit allows custom rate limiting logic
func (rl *RateLimiter) CustomRateLimit(keyFunc func(*gin.Context) string, requestsPerWindow int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := keyFunc(c)
		if key == "" {
			c.Next()
			return
		}

		result, err := rl.redisClient.CheckRateLimit(key, requestsPerWindow, window)
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
				"error": "Rate limit exceeded. Please try again later.",
				"code":  "RATE_LIMITED",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}