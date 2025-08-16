package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gotchu-backend/internal/config"
	"gotchu-backend/internal/handlers"
	"gotchu-backend/internal/middleware"
	"gotchu-backend/pkg/auth"
	"gotchu-backend/pkg/database"
	"gotchu-backend/pkg/email"
	"gotchu-backend/pkg/redis"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Set Gin mode
	gin.SetMode(cfg.GinMode)

	// Initialize database
	db, err := database.NewConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Skip migrations for development hot reload (set MIGRATE=true when needed)
	if os.Getenv("MIGRATE") == "false" {
		log.Println("Running database migrations...")
		if err := database.AutoMigrate(db); err != nil {
			log.Fatalf("Failed to run migrations: %v", err)
		}

		if err := database.CreateTriggers(db); err != nil {
			log.Printf("Warning: Failed to create triggers: %v", err)
		}

		if err := database.SeedData(db); err != nil {
			log.Printf("Warning: Failed to seed data: %v", err)
		}
	} else {
		log.Println("⚡ Skipping migrations for fast development startup")
	}

	// Initialize Redis
	redisClient, err := redis.NewClient(
		cfg.RedisHost,
		cfg.RedisPort,
		cfg.RedisPassword,
		cfg.RedisUsername,
		cfg.RedisDB,
	)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	// Initialize auth service
	authService := auth.NewService(cfg.JWTSecret, cfg.SessionExpiry)

	// Initialize email service
	var emailService *email.Service
	if cfg.ResendAPIKey != "" {
		emailService = email.NewService(cfg.ResendAPIKey, "Gotchu", cfg.EmailFrom)
		log.Println("✉️ Email service initialized")
	} else {
		log.Println("⚠️ Warning: No Resend API key provided, email verification will be disabled")
	}

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(authService, redisClient, db)
	rateLimiter := middleware.NewRateLimiter(redisClient)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, authService, redisClient, authMiddleware, emailService, cfg.SiteURL)
	dashboardHandler := handlers.NewDashboardHandler(db)

	// Setup router
	router := setupRouter(cfg, authMiddleware, rateLimiter, authHandler, dashboardHandler)

	// Setup HTTP server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("🚀 Server starting on port %s", cfg.Port)
		log.Printf("📍 Health check: http://localhost:%s/health", cfg.Port)
		log.Printf("🔗 API Base: http://localhost:%s/api", cfg.Port)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("🛑 Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Shutdown server
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	// Close database connection
	if err := database.Close(db); err != nil {
		log.Printf("Failed to close database: %v", err)
	}

	// Close Redis connection
	if err := redisClient.Close(); err != nil {
		log.Printf("Failed to close Redis: %v", err)
	}

	log.Println("✅ Server exited")
}

func setupRouter(
	cfg *config.Config,
	authMiddleware *middleware.AuthMiddleware,
	rateLimiter *middleware.RateLimiter,
	authHandler *handlers.AuthHandler,
	dashboardHandler *handlers.DashboardHandler,
) *gin.Engine {
	router := gin.New()

	// Recovery middleware
	router.Use(gin.Recovery())

	// Logging middleware - temporarily disabled to fix EOF issue
	// if cfg.IsDevelopment() {
	//	router.Use(middleware.LoggingMiddleware())
	// }

	// CORS middleware
	router.Use(middleware.SetupCORS(cfg.CORSOrigins))

	// Global rate limiting - temporarily disabled to fix EOF issue
	// router.Use(rateLimiter.GlobalRateLimit(cfg.RateLimitMax, cfg.RateLimitWindow))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"timestamp": time.Now().UTC(),
			"version":   "1.0.0",
			"service":   "gotchu-backend",
		})
	})

	// API routes
	api := router.Group("/api")
	{
		// Auth routes with rate limiting - temporarily disabled to fix EOF issue
		auth := api.Group("/auth")
		// auth.Use(authMiddleware.RateLimitAuth(cfg.AuthRateLimitMax, cfg.RateLimitWindow))
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authMiddleware.OptionalAuth(), authHandler.Logout)
			auth.GET("/me", authMiddleware.RequireAuth(), authHandler.GetCurrentUser)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.GET("/check-username/:username", authHandler.CheckUsernameAvailability)
			auth.GET("/check-username", authHandler.CheckUsernameAvailability)
			// Email verification routes
			auth.GET("/verify-email", authHandler.VerifyEmail)
			auth.POST("/resend-verification", authHandler.ResendVerification)
		}

		// Dashboard routes (protected)
		dashboard := api.Group("/dashboard")
		dashboard.Use(authMiddleware.RequireAuth())
		{
			dashboard.GET("", dashboardHandler.GetDashboard)
		}

		// User routes
		users := api.Group("/users")
		users.Use(authMiddleware.OptionalAuth())
		{
			users.GET("/:username", dashboardHandler.GetUserProfile)
		}

		// Protected API routes
		protected := api.Group("")
		protected.Use(authMiddleware.RequireAuth())
		protected.Use(rateLimiter.APIRateLimit(200, 5*time.Minute)) // Higher limit for authenticated users
		{
			// Add more protected routes here as needed
			protected.GET("/profile", func(c *gin.Context) {
				user, _ := middleware.GetCurrentUser(c)
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"data":    gin.H{"user": user},
				})
			})
		}

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(authMiddleware.RequireAuth())
		admin.Use(authMiddleware.RequireAdmin())
		{
			admin.GET("/stats", func(c *gin.Context) {
				// TODO: Implement admin stats
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"message": "Admin stats endpoint",
				})
			})
		}

		// Premium routes
		premium := api.Group("/premium")
		premium.Use(authMiddleware.RequireAuth())
		premium.Use(authMiddleware.RequirePremium())
		{
			premium.GET("/features", func(c *gin.Context) {
				// TODO: Implement premium features
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"message": "Premium features endpoint",
				})
			})
		}
	}

	// 404 handler
	router.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Route not found",
			"code":  "NOT_FOUND",
			"path":  c.Request.URL.Path,
		})
	})

	return router
}
