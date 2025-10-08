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
	"gotchu-backend/pkg/discord"
	"gotchu-backend/pkg/discordbot"
	"gotchu-backend/pkg/email"
	"gotchu-backend/pkg/redis"
	"gotchu-backend/pkg/storage"
	"gotchu-backend/pkg/workers"

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

	// Run migrations by default (set MIGRATE=false to skip for faster development)
	if os.Getenv("MIGRATE") != "false" {
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

	// Initialize Redis - prefer Upstash if available, fallback to traditional Redis
	var redisClient *redis.Client
	
	if cfg.UpstashRedisURL != "" && cfg.UpstashRedisToken != "" {
		log.Println("🔗 Connecting to Upstash Redis...")
		redisClient, err = redis.NewUpstashClient(cfg.UpstashRedisURL, cfg.UpstashRedisToken)
		if err != nil {
			log.Printf("Failed to connect to Upstash Redis: %v", err)
			log.Println("📡 Falling back to traditional Redis...")
		} else {
			log.Println("✅ Connected to Upstash Redis successfully")
		}
	}
	
	// Fallback to traditional Redis if Upstash failed or not configured
	if redisClient == nil {
		if cfg.RedisHost != "" && cfg.RedisPort != "" {
			log.Println("🔗 Connecting to traditional Redis...")
			redisClient, err = redis.NewClient(
				cfg.RedisHost,
				cfg.RedisPort,
				cfg.RedisPassword,
				cfg.RedisUsername,
				cfg.RedisDB,
			)
			if err != nil {
				log.Fatalf("Failed to connect to Redis: %v", err)
			}
			log.Println("✅ Connected to traditional Redis successfully")
		} else {
			log.Fatalf("No Redis configuration found. Please configure either Upstash Redis (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) or traditional Redis (REDIS_HOST, REDIS_PORT)")
		}
	}

	// Initialize worker pool for background operations
	workerPool := workers.NewWorkerPool(8, 1000) // 8 workers, 1000 job queue
	workerPool.Start()
	defer workerPool.Stop(5 * time.Second)

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
	badgeMiddleware := middleware.NewBadgeMiddleware(db)

	// Initialize Supabase storage
	var supabaseStorage *storage.SupabaseStorage
	if cfg.SupabaseURL != "" && cfg.SupabaseServiceRoleKey != "" {
		supabaseStorage = storage.NewSupabaseStorage(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey, cfg.SupabaseAnonKey)
		log.Println("🗄️ Supabase storage initialized")
	} else {
		log.Println("⚠️ Warning: Supabase storage not configured")
	}

	// Initialize Discord service
	var discordService *discord.Service
	var discordHandler *handlers.DiscordHandler
	if cfg.DiscordClientID != "" && cfg.DiscordClientSecret != "" {
		discordService = discord.NewService(
			cfg.DiscordClientID,
			cfg.DiscordClientSecret,
			cfg.DiscordRedirectURI,
			cfg.DiscordBotToken,
			cfg.DiscordGuildID,
		)
		discordHandler = handlers.NewDiscordHandler(db, redisClient, discordService)
		log.Println("🤖 Discord integration initialized")
	} else {
		log.Println("⚠️ Warning: Discord integration not configured")
	}

	// Initialize Discord Bot service for real-time presence tracking
	var discordBotService *discordbot.DiscordBotService
	var discordBotHandler *handlers.DiscordBotHandler
	if cfg.DiscordBotToken != "" && cfg.DiscordGuildID != "" {
		discordBotService = discordbot.NewDiscordBotService(cfg.DiscordBotToken, cfg.DiscordGuildID, db)
		discordBotHandler = handlers.NewDiscordBotHandler(discordBotService, discordService)
		
		// Start the bot service
		go func() {
			if err := discordBotService.Start(); err != nil {
				log.Printf("❌ Failed to start Discord bot: %v", err)
			}
		}()
		
		log.Println("🤖 Discord Bot service initialized for presence tracking")
	} else {
		log.Println("⚠️ Warning: Discord Bot service not configured (missing bot token or guild ID)")
	}

	// Initialize OAuth configurations
	handlers.InitOAuthConfig(
		cfg.GoogleClientID,
		cfg.GoogleClientSecret,
		cfg.GoogleRedirectURI,
		cfg.DiscordClientID,
		cfg.DiscordClientSecret,
		cfg.DiscordRedirectURI,
	)
	
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, authService, redisClient, authMiddleware, emailService, cfg.SiteURL, cfg)
	dashboardHandler := handlers.NewDashboardHandler(db, redisClient, cfg, discordBotService, workerPool)
	linkHandler := handlers.NewLinkHandler(db, redisClient)
	templateHandler := handlers.NewTemplateHandler(db, redisClient, supabaseStorage)
	badgesHandler := handlers.NewBadgesHandler(db)
	paymentHandler := handlers.NewPaymentHandler(db, redisClient, cfg, workerPool)

	// Setup router
	router := setupRouter(cfg, authMiddleware, rateLimiter, badgeMiddleware, authHandler, dashboardHandler, linkHandler, templateHandler, badgesHandler, discordHandler, discordBotHandler, paymentHandler)

	// Serve uploaded files
	router.Static("/uploads", "./uploads")

	// Payment success redirect (outside API group for direct access)
	router.GET("/payment-success", paymentHandler.PaymentSuccess)

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

	// Stop Discord bot service
	if discordBotService != nil {
		log.Println("🤖 Stopping Discord Bot service...")
		discordBotService.Stop()
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
	badgeMiddleware *middleware.BadgeMiddleware,
	authHandler *handlers.AuthHandler,
	dashboardHandler *handlers.DashboardHandler,
	linkHandler *handlers.LinkHandler,
	templateHandler *handlers.TemplateHandler,
	badgesHandler *handlers.BadgesHandler,
	discordHandler *handlers.DiscordHandler,
	discordBotHandler *handlers.DiscordBotHandler,
	paymentHandler *handlers.PaymentHandler,
) *gin.Engine {
	router := gin.New()

	// Recovery middleware
	router.Use(gin.Recovery())

	// Logging middleware temporarily disabled for debugging
	// router.Use(middleware.LoggingMiddleware())

	// CORS middleware
	router.Use(middleware.SetupCORS(cfg.CORSOrigins))

	// Validation middleware temporarily disabled for debugging
	// router.Use(middleware.SQLInjectionProtection())

	// Global rate limiting
	router.Use(rateLimiter.GlobalRateLimit(cfg.RateLimitMax, cfg.RateLimitWindow))

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
		// Auth routes with rate limiting temporarily disabled
		auth := api.Group("/auth")
		// auth.Use(authMiddleware.RateLimitAuth(cfg.AuthRateLimitMax, cfg.RateLimitWindow))
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/login/2fa", badgeMiddleware.CheckBadgesOnLogin(), authHandler.Login2FA)
			auth.POST("/logout", authMiddleware.OptionalAuth(), authHandler.Logout)
			auth.GET("/me", authMiddleware.RequireAuth(), authHandler.GetCurrentUser)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.GET("/check-username/:username", authHandler.CheckUsernameAvailability)
			auth.GET("/check-username", authHandler.CheckUsernameAvailability)
			// Email verification routes
			auth.GET("/verify-email", authHandler.VerifyEmail)
			auth.POST("/resend-verification", authHandler.ResendVerification)
			
			// OAuth routes
			auth.GET("/oauth/:provider", authHandler.InitiateOAuth)
			auth.GET("/oauth/:provider/callback", authHandler.HandleOAuthCallback)
			auth.POST("/complete-oauth-setup", authMiddleware.RequireAuth(), authHandler.CompleteOAuthSetup)
			
			// 2FA routes (protected)
			twofa := auth.Group("/2fa")
			twofa.Use(authMiddleware.RequireAuth())
			{
				twofa.POST("/generate", authHandler.Generate2FA)
				twofa.POST("/verify", authHandler.Verify2FA)
				twofa.POST("/disable", authHandler.Disable2FA)
			}

			// Profile update routes (protected)
			auth.POST("/update-username", authMiddleware.RequireAuth(), authHandler.UpdateUsername)
			auth.POST("/update-display-name", authMiddleware.RequireAuth(), authHandler.UpdateDisplayName)
			auth.POST("/update-alias", authMiddleware.RequireAuth(), authHandler.UpdateAlias)
			auth.POST("/change-password", authMiddleware.RequireAuth(), authHandler.ChangePassword)
		}

		// Dashboard routes (protected)
		dashboard := api.Group("/dashboard")
		dashboard.Use(authMiddleware.RequireAuth())
		{
			dashboard.GET("", dashboardHandler.GetDashboard)
			dashboard.GET("/analytics", dashboardHandler.GetAnalytics)
			dashboard.POST("/settings", dashboardHandler.SaveSettings)
		}

		// Customization routes (protected)
		customization := api.Group("/customization")
		customization.Use(authMiddleware.RequireAuth())
		{
			customization.GET("/settings", dashboardHandler.GetCustomizationSettings)
			customization.POST("/settings", dashboardHandler.SaveCustomizationSettings)
		}

		// Audio routes (protected)
		audio := api.Group("/audio")
		audio.Use(authMiddleware.RequireAuth())
		{
			audio.GET("/list", dashboardHandler.ListUserAudioFiles)
		}

		// Asset management routes (protected)
		assets := api.Group("/assets")
		assets.Use(authMiddleware.RequireAuth())
		{
			assets.DELETE("/delete", dashboardHandler.DeleteUserAsset)
		}

		// Upload routes (protected)
		upload := api.Group("/upload")
		upload.Use(authMiddleware.RequireAuth())
		{
			upload.POST("/asset", dashboardHandler.UploadAsset)
		}

		// User routes
		users := api.Group("/users")
		users.Use(authMiddleware.OptionalAuth())
		{
			users.GET("/:username", dashboardHandler.GetUserProfile)
			users.GET("/:username/links", linkHandler.GetPublicUserLinks)
			users.GET("/:username/badges", badgesHandler.GetUserBadges)
			users.GET("/:username/badges/showcased", badgesHandler.GetShowcasedBadges)
		}

		// Link routes
		links := api.Group("/links")
		{
			// Public routes for link clicks (no auth required)
			links.POST("/:id/click", linkHandler.TrackClick)
			
			// Protected routes (authentication required)
			linksProtected := links.Group("")
			linksProtected.Use(authMiddleware.RequireAuth())
			{
				linksProtected.GET("", linkHandler.GetLinks)
				linksProtected.POST("", badgeMiddleware.CheckBadgesAfterAction(), linkHandler.CreateLink)
				linksProtected.GET("/:id", linkHandler.GetLink)
				linksProtected.PUT("/:id", linkHandler.UpdateLink)
				linksProtected.DELETE("/:id", linkHandler.DeleteLink)
				linksProtected.PUT("/reorder", linkHandler.ReorderLinks)
			}
		}

		// Template routes
		templates := api.Group("/templates")
		{
			// Public routes (no auth required)
			templates.GET("", templateHandler.GetTemplates)
			templates.GET("/categories", templateHandler.GetTemplateCategories)
			
			// Protected routes (authentication required)
			templatesProtected := templates.Group("")
			templatesProtected.Use(authMiddleware.RequireAuth())
			{
				templatesProtected.POST("/create", badgeMiddleware.CheckBadgesAfterAction(), templateHandler.CreateTemplate)
				templatesProtected.GET("/my-templates", templateHandler.GetUserTemplates)
				templatesProtected.GET("/liked", templateHandler.GetUserLikedTemplates)
				templatesProtected.POST("/:id/apply", templateHandler.ApplyTemplate)
				templatesProtected.POST("/:id/like", templateHandler.LikeTemplate)
			}
			
			// ID-based routes must come last to avoid conflicts
			templates.GET("/:id", templateHandler.GetTemplate)
		}

		// Badges routes
		badges := api.Group("/badges")
		{
			// Public routes (no auth required)
			badges.GET("", badgesHandler.GetAllBadges)
			
			// Protected routes (authentication required)
			badgesProtected := badges.Group("")
			badgesProtected.Use(authMiddleware.RequireAuth())
			{
				badgesProtected.PUT("/order", badgesHandler.UpdateBadgeOrder)
				badgesProtected.POST("/check", badgesHandler.CheckBadges)
				badgesProtected.POST("/claim/:badgeId", badgesHandler.ClaimBadge)
				badgesProtected.POST("/award", badgesHandler.AwardBadgeManually) // Admin only - add admin middleware later
			}
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

		// Discord routes
		if discordHandler != nil {
			discord := api.Group("/discord")
			{
				// Public callback route (no auth required)
				discord.GET("/callback", discordHandler.DiscordCallback)
				
				// Protected Discord routes
				discordProtected := discord.Group("")
				discordProtected.Use(authMiddleware.RequireAuth())
				{
					discordProtected.POST("/auth", discordHandler.InitiateDiscordAuth)
					discordProtected.GET("/status", discordHandler.GetDiscordStatus)
					discordProtected.POST("/disconnect", discordHandler.DisconnectDiscord)
					discordProtected.POST("/refresh", discordHandler.RefreshDiscordData)
				}
			}
		}

		// Discord Bot routes
		if discordBotHandler != nil {
			discordBot := api.Group("/discord-bot")
			{
				// Public presence viewing endpoints (no auth required)
				discordBot.GET("/presence/:userID", discordBotHandler.GetUserPresence)
				discordBot.GET("/badges/:userID", discordBotHandler.GetDiscordBadges)
				discordBot.GET("/user/:userID", discordBotHandler.GetDiscordUser)
				
				// Protected endpoints (authentication required)
				discordBotProtected := discordBot.Group("")
				discordBotProtected.Use(authMiddleware.RequireAuth())
				{
					discordBotProtected.GET("/presences", discordBotHandler.GetAllPresences)
					discordBotProtected.GET("/status", discordBotHandler.GetBotStatus)
					discordBotProtected.POST("/start", discordBotHandler.StartBot)
					discordBotProtected.POST("/stop", discordBotHandler.StopBot)
				}
			}
		}

		// Payment routes
		payments := api.Group("/payments")
		{
			// Public routes (no auth required)
			payments.GET("/plans", paymentHandler.GetPricingPlans)
			payments.GET("/currencies", paymentHandler.GetAvailableCurrencies)
			payments.POST("/webhook", paymentHandler.ProcessWebhook) // OxaPay webhook
			
			// Protected routes (authentication required)
			paymentsProtected := payments.Group("")
			paymentsProtected.Use(authMiddleware.RequireAuth())
			{
				paymentsProtected.POST("/create", paymentHandler.CreatePayment)
				paymentsProtected.GET("/:id/status", paymentHandler.GetPaymentStatus)
				paymentsProtected.GET("/history", paymentHandler.GetUserPayments)
				paymentsProtected.GET("/subscription", paymentHandler.GetCurrentSubscription)
			}
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
