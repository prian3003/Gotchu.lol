package middleware

import (
	"gotchu-backend/pkg/badges"
	"log"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// BadgeMiddleware provides badge-related middleware functions
type BadgeMiddleware struct {
	badgeService *badges.Service
}

// NewBadgeMiddleware creates a new badge middleware
func NewBadgeMiddleware(db *gorm.DB) *BadgeMiddleware {
	return &BadgeMiddleware{
		badgeService: badges.NewService(db),
	}
}

// CheckBadgesAfterAction middleware that checks badges after user actions
func (m *BadgeMiddleware) CheckBadgesAfterAction() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Continue with the request
		c.Next()

		// After the request, check badges if user is authenticated
		if user, exists := GetCurrentUser(c); exists {
			// Run badge checking in a goroutine to not block the response
			go func() {
				if err := m.badgeService.CheckAndAwardBadges(user.ID); err != nil {
					log.Printf("Failed to check badges for user %d: %v", user.ID, err)
				}
			}()
		}
	})
}

// CheckBadgesOnLogin middleware that checks badges when user logs in
func (m *BadgeMiddleware) CheckBadgesOnLogin() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Continue with the request
		c.Next()

		// After successful login, check badges if user is authenticated and response is successful
		if c.Writer.Status() >= 200 && c.Writer.Status() < 300 {
			if user, exists := GetCurrentUser(c); exists {
				// Run badge checking in a goroutine to not block the response
				go func() {
					log.Printf("Checking badges for user %d after login", user.ID)
					if err := m.badgeService.CheckAndAwardBadges(user.ID); err != nil {
						log.Printf("Failed to check badges for user %d after login: %v", user.ID, err)
					}
				}()
			}
		}
	})
}

// CheckSpecificBadge manually checks a specific badge type for a user (used in handlers)
func (m *BadgeMiddleware) CheckSpecificBadge(userID uint, badgeID string) {
	go func() {
		if err := m.badgeService.CheckAndAwardBadges(userID); err != nil {
			log.Printf("Failed to check specific badge %s for user %d: %v", badgeID, userID, err)
		}
	}()
}