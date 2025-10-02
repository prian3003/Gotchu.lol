package middleware

import (
	"net/http"
	"regexp"
	"strings"
	"unicode"

	"github.com/gin-gonic/gin"
)

// Input validation middleware for common security checks
func InputValidationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip validation for GET, OPTIONS requests and health checks
		if c.Request.Method == "GET" || 
		   c.Request.Method == "OPTIONS" ||
		   strings.HasPrefix(c.Request.URL.Path, "/health") {
			c.Next()
			return
		}

		// Check request size (10MB limit) - only for requests with body
		if c.Request.ContentLength > 0 && c.Request.ContentLength > 10*1024*1024 {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{
				"error": "Request body too large",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Username validation middleware (disabled - handled at handler level)
func ValidateUsername() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next() // Skip validation - let handlers handle it
	}
}

// Email validation middleware (disabled - handled at handler level)
func ValidateEmail() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next() // Skip validation - let handlers handle it
	}
}

// SQL injection protection middleware
func SQLInjectionProtection() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check query parameters
		for _, values := range c.Request.URL.Query() {
			for _, value := range values {
				if containsSQLInjection(value) {
					c.JSON(http.StatusBadRequest, gin.H{
						"error": "Invalid input detected",
					})
					c.Abort()
					return
				}
			}
		}

		// Check path parameters
		for _, param := range c.Params {
			if containsSQLInjection(param.Value) {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "Invalid input detected",
				})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// Helper functions for validation

func isValidUsername(username string) bool {
	// Username: 3-30 chars, alphanumeric + underscore, no spaces
	if len(username) < 3 || len(username) > 30 {
		return false
	}
	
	matched, _ := regexp.MatchString("^[a-zA-Z0-9_]+$", username)
	return matched
}

func isValidEmail(email string) bool {
	// Basic email validation
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email) && len(email) <= 254
}

func containsSQLInjection(input string) bool {
	// Only check for obvious SQL injection patterns, not normal characters
	lowerInput := strings.ToLower(input)
	
	// Only flag clear SQL injection keywords in specific contexts
	dangerousPatterns := []string{
		"' or 1=1",
		"' or '1'='1",
		"union select",
		"drop table",
		"delete from",
		"insert into",
		"update set",
		"exec(",
		"execute(",
		"script>",
		"javascript:",
		"vbscript:",
		"--",
		"/*",
		"*/",
		"@@",
		"waitfor delay",
		"benchmark(",
		"pg_sleep(",
	}
	
	for _, pattern := range dangerousPatterns {
		if strings.Contains(lowerInput, pattern) {
			return true
		}
	}
	
	return false
}

func containsScriptTags(input string) bool {
	lowerInput := strings.ToLower(input)
	return strings.Contains(lowerInput, "<script") ||
		strings.Contains(lowerInput, "</script>") ||
		strings.Contains(lowerInput, "javascript:") ||
		strings.Contains(lowerInput, "vbscript:")
}

func isValidLength(input string, maxLength int) bool {
	return len(input) <= maxLength
}

func containsControlChars(input string) bool {
	for _, r := range input {
		if unicode.IsControl(r) && r != '\n' && r != '\r' && r != '\t' {
			return true
		}
	}
	return false
}