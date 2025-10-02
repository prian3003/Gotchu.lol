package database

import (
	"fmt"
	"log"
	"time"

	"gotchu-backend/internal/middleware"
	"gotchu-backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Config represents database configuration
type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
	TimeZone string
}

// NewConnection creates a new database connection
func NewConnection(databaseURL string) (*gorm.DB, error) {
	// Initialize performance monitoring
	middleware.InitializePerformanceLogging()
	
	// Configure performance monitoring logger
	performanceLogger := middleware.NewPerformanceMonitor(100 * time.Millisecond)

	// Configure PostgreSQL connection for maximum performance
	config := postgres.Config{
		DSN:                  databaseURL,
		PreferSimpleProtocol: false, // Enable prepared statements for performance
	}

	// Open database connection with performance monitoring
	db, err := gorm.Open(postgres.New(config), &gorm.Config{
		Logger: performanceLogger, // Use performance monitoring logger
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	// Get underlying sql.DB
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %v", err)
	}

	// Set connection pool settings optimized for production performance
	sqlDB.SetMaxIdleConns(25)     // Increased for better performance
	sqlDB.SetMaxOpenConns(100)    // Increased for high throughput
	sqlDB.SetConnMaxLifetime(30 * time.Minute) // Longer lifetime for efficiency
	sqlDB.SetConnMaxIdleTime(15 * time.Minute) // Balanced idle timeout

	// Test connection
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	log.Println("Database connected successfully")
	return db, nil
}

// AutoMigrate runs database migrations
func AutoMigrate(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// Enable UUID extension
	db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")

	// Core user and auth models
	err := db.AutoMigrate(
		&models.User{},
		&models.UserAuth{},
		&models.UserSession{},
		&models.EmailVerification{},
		&models.Link{},
		&models.LinkClick{},
		&models.File{},
		&models.Follow{},
		&models.Activity{},
		&models.CustomDomain{},
		&models.ProfileView{},
		&models.AnalyticsEvent{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate core models: %v", err)
	}

	// Template models
	err = db.AutoMigrate(
		&models.Template{},
		&models.TemplateLink{},
		&models.TemplateAsset{},
		&models.TemplateLike{},
		&models.TemplateReport{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate template models: %v", err)
	}

	// Badge models
	err = db.AutoMigrate(
		&models.Badge{},
		&models.UserBadge{},
		&models.BadgeProgressEvent{},
		&models.BadgeEvent{},
		&models.BadgeCollection{},
		&models.BadgeCollectionItem{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate badge models: %v", err)
	}

	// Payment models - drop and recreate tables to fix constraints
	db.Exec("DROP TABLE IF EXISTS payment_refunds CASCADE;")
	db.Exec("DROP TABLE IF EXISTS payment_webhooks CASCADE;")
	db.Exec("DROP TABLE IF EXISTS subscriptions CASCADE;")
	db.Exec("DROP TABLE IF EXISTS pricing_plans CASCADE;")
	db.Exec("DROP TABLE IF EXISTS payments CASCADE;")
	
	// Drop the old unique index if it exists
	db.Exec("DROP INDEX IF EXISTS idx_payments_payment_id;")
	
	err = db.AutoMigrate(
		&models.Payment{},
		&models.PaymentHistory{},
		&models.PaymentWebhook{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate payment models: %v", err)
	}

	// Create indexes for better performance
	err = createIndexes(db)
	if err != nil {
		return fmt.Errorf("failed to create indexes: %v", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// createIndexes creates additional database indexes for performance
func createIndexes(db *gorm.DB) error {
	indexes := []string{
		// User indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at_desc ON users (created_at DESC);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_plan_active ON users (plan, is_active);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_alias_active ON users (username, alias, is_active);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_alias_active ON users (alias, is_active) WHERE alias IS NOT NULL;",

		// Link indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_user_active_order ON links (user_id, is_active, \"order\");",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_clicks_desc ON links (clicks DESC);",

		// Profile view indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_views_user_created ON profile_views (user_id, created_at DESC);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_views_ip_user ON profile_views (ip_address, user_id);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_views_session ON profile_views (session_id);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_views_country ON profile_views (country);",

		// Link click indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_link_clicks_link_created ON link_clicks (link_id, created_at DESC);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_link_clicks_session ON link_clicks (session_id);",

		// Analytics indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_type_created ON analytics_events (user_id, event_type, created_at DESC);",

		// Template indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_templates_status_featured_created ON templates (status, is_featured, created_at DESC);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_templates_category_status ON templates (category, status);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_templates_downloads_desc ON templates (downloads DESC);",

		// Badge indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_badges_user_earned ON user_badges (user_id, is_earned);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_badges_earned_at_desc ON user_badges (earned_at DESC);",

		// Payment indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user_status_created ON payments (user_id, status, created_at DESC);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_order_id ON payments (order_id);",
		"CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_payment_id_unique ON payments (payment_id) WHERE payment_id != '' AND payment_id IS NOT NULL;",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status_created ON payments (status, created_at DESC);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_webhooks_payment_id ON payment_webhooks (payment_id);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_active ON subscriptions (user_id, status);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions (expires_at);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_plan_status ON subscriptions (plan_type, status);",
	}

	for _, indexSQL := range indexes {
		if err := db.Exec(indexSQL).Error; err != nil {
			log.Printf("Warning: Failed to create index: %v", err)
			// Continue with other indexes even if one fails
		}
	}

	return nil
}

// CreateTriggers creates database triggers for automatic updates
func CreateTriggers(db *gorm.DB) error {
	triggers := []string{
		// Update user total_clicks when link clicks are added
		`CREATE OR REPLACE FUNCTION update_user_total_clicks()
		RETURNS TRIGGER AS $$
		BEGIN
			UPDATE users 
			SET total_clicks = (
				SELECT COALESCE(SUM(clicks), 0) 
				FROM links 
				WHERE user_id = (
					SELECT user_id 
					FROM links 
					WHERE id = NEW.link_id
				)
			)
			WHERE id = (
				SELECT user_id 
				FROM links 
				WHERE id = NEW.link_id
			);
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;`,

		`DROP TRIGGER IF EXISTS trigger_update_user_total_clicks ON link_clicks;
		CREATE TRIGGER trigger_update_user_total_clicks
			AFTER INSERT ON link_clicks
			FOR EACH ROW
			EXECUTE FUNCTION update_user_total_clicks();`,

		// Update link clicks count when link_clicks are added
		`CREATE OR REPLACE FUNCTION update_link_clicks()
		RETURNS TRIGGER AS $$
		BEGIN
			UPDATE links 
			SET clicks = clicks + 1
			WHERE id = NEW.link_id;
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;`,

		`DROP TRIGGER IF EXISTS trigger_update_link_clicks ON link_clicks;
		CREATE TRIGGER trigger_update_link_clicks
			AFTER INSERT ON link_clicks
			FOR EACH ROW
			EXECUTE FUNCTION update_link_clicks();`,

		// Update template likes count
		`CREATE OR REPLACE FUNCTION update_template_likes()
		RETURNS TRIGGER AS $$
		BEGIN
			IF TG_OP = 'INSERT' THEN
				UPDATE templates 
				SET likes = likes + 1
				WHERE id = NEW.template_id;
				RETURN NEW;
			ELSIF TG_OP = 'DELETE' THEN
				UPDATE templates 
				SET likes = likes - 1
				WHERE id = OLD.template_id;
				RETURN OLD;
			END IF;
			RETURN NULL;
		END;
		$$ LANGUAGE plpgsql;`,

		`DROP TRIGGER IF EXISTS trigger_update_template_likes ON template_likes;
		CREATE TRIGGER trigger_update_template_likes
			AFTER INSERT OR DELETE ON template_likes
			FOR EACH ROW
			EXECUTE FUNCTION update_template_likes();`,
	}

	for _, triggerSQL := range triggers {
		if err := db.Exec(triggerSQL).Error; err != nil {
			log.Printf("Warning: Failed to create trigger: %v", err)
		}
	}

	log.Println("Database triggers created successfully")
	return nil
}

// SeedData creates initial data for the application
func SeedData(db *gorm.DB) error {
	log.Println("Seeding initial data...")

	// Seed comprehensive badges
	if err := seedBadges(db); err != nil {
		log.Printf("Failed to seed badges: %v", err)
		return err
	}

	log.Println("Initial data seeded successfully")
	return nil
}

// seedBadges creates all the default badges
func seedBadges(db *gorm.DB) error {
	badges := []models.Badge{
		// Staff Badge
		{
			ID:              "staff",
			Name:            "Staff",
			Description:     "Be a part of the gotchu.lol staff team.",
			Category:        models.BadgeCategoryStaff,
			Rarity:          models.BadgeRarityLegendary,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "star",
			IconColor:       stringPtr("#3b82f6"),
			RequirementType: models.RequirementTypeManual,
			RequirementData: `{"role": "staff"}`,
			PointsAwarded:   1000,
			DisplayOrder:    1,
			IsActive:        true,
		},
		
		// Helper Badge
		{
			ID:              "helper",
			Name:            "Helper",
			Description:     "Be active and help users in the community.",
			Category:        models.BadgeCategoryEngagement,
			Rarity:          models.BadgeRarityRare,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "help-circle",
			IconColor:       stringPtr("#f59e0b"),
			RequirementType: models.RequirementTypeManual,
			RequirementData: `{"role": "helper"}`,
			PointsAwarded:   500,
			DisplayOrder:    2,
			IsActive:        true,
		},
		
		// Premium Badge
		{
			ID:              "premium",
			Name:            "Premium",
			Description:     "Purchase the premium package.",
			Category:        models.BadgeCategoryPremium,
			Rarity:          models.BadgeRarityEpic,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "gem",
			IconColor:       stringPtr("#8b5cf6"),
			RequirementType: models.RequirementTypePremiumDays,
			RequirementData: `{"days": 1}`,
			PointsAwarded:   250,
			DisplayOrder:    3,
			IsActive:        true,
		},
		
		// Verified Badge
		{
			ID:              "verified",
			Name:            "Verified",
			Description:     "Purchase or be a known content creator.",
			Category:        models.BadgeCategoryAchievement,
			Rarity:          models.BadgeRarityRare,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "badge-check",
			IconColor:       stringPtr("#06b6d4"),
			RequirementType: models.RequirementTypeManual,
			RequirementData: `{"verified": true}`,
			PointsAwarded:   200,
			DisplayOrder:    4,
			IsActive:        true,
		},
		
		// Donor Badge
		{
			ID:              "donor",
			Name:            "Donor",
			Description:     "Donate atleast 10€ to gotchu.lol.",
			Category:        models.BadgeCategoryAchievement,
			Rarity:          models.BadgeRarityRare,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "gift",
			IconColor:       stringPtr("#10b981"),
			RequirementType: models.RequirementTypeCustomMetric,
			RequirementData: `{"metric": "donation_amount", "threshold": 10}`,
			PointsAwarded:   300,
			DisplayOrder:    5,
			IsActive:        true,
		},
		
		// OG Badge
		{
			ID:              "og",
			Name:            "OG",
			Description:     "Be an early supporter of gotchu.lol.",
			Category:        models.BadgeCategoryMilestone,
			Rarity:          models.BadgeRarityLegendary,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "trophy",
			IconColor:       stringPtr("#eab308"),
			RequirementType: models.RequirementTypeAccountAge,
			RequirementData: `{"days": 365}`,
			PointsAwarded:   500,
			DisplayOrder:    6,
			IsActive:        true,
		},
		
		// Gifter Badge
		{
			ID:              "gifter",
			Name:            "Gifter",
			Description:     "Gift a gotchu.lol product to another user.",
			Category:        models.BadgeCategorySocial,
			Rarity:          models.BadgeRarityUncommon,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "gift",
			IconColor:       stringPtr("#f97316"),
			RequirementType: models.RequirementTypeCustomMetric,
			RequirementData: `{"metric": "gifts_given", "threshold": 1}`,
			PointsAwarded:   150,
			DisplayOrder:    7,
			IsActive:        true,
		},
		
		// Server Booster Badge
		{
			ID:              "serverbooster",
			Name:            "Server Booster",
			Description:     "Boost the gotchu.lol discord server.",
			Category:        models.BadgeCategorySocial,
			Rarity:          models.BadgeRarityEpic,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "rocket",
			IconColor:       stringPtr("#8b5cf6"),
			RequirementType: models.RequirementTypeDiscordBoost,
			RequirementData: `{"boost": true}`,
			PointsAwarded:   400,
			DisplayOrder:    8,
			IsActive:        true,
		},
		
		// Winner Badge
		{
			ID:              "winner",
			Name:            "Winner",
			Description:     "Win a gotchu.lol event.",
			Category:        models.BadgeCategoryAchievement,
			Rarity:          models.BadgeRarityEpic,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "trophy",
			IconColor:       stringPtr("#eab308"),
			RequirementType: models.RequirementTypeEvent,
			RequirementData: `{"event": "contest", "place": 1}`,
			PointsAwarded:   600,
			DisplayOrder:    9,
			IsActive:        true,
		},
		
		// Second Place Badge
		{
			ID:              "secondplace",
			Name:            "Second Place",
			Description:     "Get second place in a gotchu.lol event.",
			Category:        models.BadgeCategoryAchievement,
			Rarity:          models.BadgeRarityRare,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "medal",
			IconColor:       stringPtr("#6b7280"),
			RequirementType: models.RequirementTypeEvent,
			RequirementData: `{"event": "contest", "place": 2}`,
			PointsAwarded:   400,
			DisplayOrder:    10,
			IsActive:        true,
		},
		
		// Third Place Badge
		{
			ID:              "thirdplace",
			Name:            "Third Place",
			Description:     "Get third place in a gotchu.lol event.",
			Category:        models.BadgeCategoryAchievement,
			Rarity:          models.BadgeRarityRare,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "medal",
			IconColor:       stringPtr("#cd7c2f"),
			RequirementType: models.RequirementTypeEvent,
			RequirementData: `{"event": "contest", "place": 3}`,
			PointsAwarded:   300,
			DisplayOrder:    11,
			IsActive:        true,
		},
		
		// Image Host Badge
		{
			ID:              "imagehost",
			Name:            "Image Host",
			Description:     "Purchase the Image Host.",
			Category:        models.BadgeCategoryPremium,
			Rarity:          models.BadgeRarityRare,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "image",
			IconColor:       stringPtr("#10b981"),
			RequirementType: models.RequirementTypeCustomMetric,
			RequirementData: `{"service": "image_host", "purchased": true}`,
			PointsAwarded:   200,
			DisplayOrder:    12,
			IsActive:        true,
		},
		
		// Bug Hunter Badge
		{
			ID:              "bughunter",
			Name:            "Bug Hunter",
			Description:     "Report a bug to the gotchu.lol team.",
			Category:        models.BadgeCategoryAchievement,
			Rarity:          models.BadgeRarityUncommon,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "bug",
			IconColor:       stringPtr("#10b981"),
			RequirementType: models.RequirementTypeCustomMetric,
			RequirementData: `{"metric": "bugs_reported", "threshold": 1}`,
			PointsAwarded:   100,
			DisplayOrder:    13,
			IsActive:        true,
		},
		
		// Easter 2025 Badge
		{
			ID:              "easter2025",
			Name:            "Easter 2025",
			Description:     "Exclusive badge from the 2025 easter sale.",
			Category:        models.BadgeCategorySeasonal,
			Rarity:          models.BadgeRarityMythic,
			IconType:        models.BadgeIconTypeEmoji,
			IconValue:       "🥚",
			IconColor:       stringPtr("#f472b6"),
			RequirementType: models.RequirementTypeEvent,
			RequirementData: `{"event": "easter2025", "participated": true}`,
			PointsAwarded:   750,
			DisplayOrder:    14,
			IsActive:        true,
			IsLimited:       true,
		},
		
		// Christmas 2024 Badge
		{
			ID:              "christmas2024",
			Name:            "Christmas 2024",
			Description:     "Exclusive badge from the 2024 winter sale.",
			Category:        models.BadgeCategorySeasonal,
			Rarity:          models.BadgeRarityMythic,
			IconType:        models.BadgeIconTypeEmoji,
			IconValue:       "🎄",
			IconColor:       stringPtr("#dc2626"),
			RequirementType: models.RequirementTypeEvent,
			RequirementData: `{"event": "christmas2024", "participated": true}`,
			PointsAwarded:   750,
			DisplayOrder:    15,
			IsActive:        true,
			IsLimited:       true,
		},
		
		// Additional common badges (using existing UUIDs from database)
		{
			ID:              "53b134ed-63d0-4279-9df2-3e0255b08945",
			Name:            "Welcome",
			Description:     "Welcome to gotchu.lol! Awarded when you create your account.",
			Category:        models.BadgeCategoryMilestone,
			Rarity:          models.BadgeRarityCommon,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "user-plus",
			IconColor:       stringPtr("#10b981"),
			RequirementType: models.RequirementTypeManual,
			RequirementData: `{"welcome": true}`,
			PointsAwarded:   10,
			DisplayOrder:    16,
			IsActive:        true,
		},
		
		{
			ID:              "4b228ac5-e068-457d-92d0-56257b647d05",
			Name:            "First Link",
			Description:     "Added your first link to your profile.",
			Category:        models.BadgeCategoryMilestone,
			Rarity:          models.BadgeRarityCommon,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "link",
			IconColor:       stringPtr("#3b82f6"),
			RequirementType: models.RequirementTypeLinkCount,
			RequirementData: `{"threshold": 1}`,
			PointsAwarded:   15,
			DisplayOrder:    17,
			IsActive:        true,
		},
		
		{
			ID:              "3587abfa-a4f2-49eb-a7c7-ba1bc84179c2",
			Name:            "Popular",
			Description:     "Your profile has been viewed 100 times.",
			Category:        models.BadgeCategoryEngagement,
			Rarity:          models.BadgeRarityUncommon,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "eye",
			IconColor:       stringPtr("#f59e0b"),
			RequirementType: models.RequirementTypeProfileViews,
			RequirementData: `{"threshold": 100}`,
			PointsAwarded:   50,
			DisplayOrder:    18,
			IsActive:        true,
		},
		
		{
			ID:              "a637c430-3482-4408-839a-9c8fb64f7286",
			Name:            "Verified",
			Description:     "Your account has been verified.",
			Category:        models.BadgeCategoryAchievement,
			Rarity:          models.BadgeRarityRare,
			IconType:        models.BadgeIconTypeLucide,
			IconValue:       "badge-check",
			IconColor:       stringPtr("#06b6d4"),
			RequirementType: models.RequirementTypeManual,
			RequirementData: `{"verified": true}`,
			PointsAwarded:   200,
			DisplayOrder:    4,
			IsActive:        true,
		},
	}

	// Create badges if they don't exist
	for _, badge := range badges {
		var existingBadge models.Badge
		result := db.Where("id = ?", badge.ID).First(&existingBadge)
		
		if result.Error != nil && result.Error == gorm.ErrRecordNotFound {
			// Badge doesn't exist, create it
			if err := db.Create(&badge).Error; err != nil {
				log.Printf("Failed to create badge %s: %v", badge.Name, err)
				return err
			}
			log.Printf("✅ Created badge: %s", badge.Name)
		} else {
			// Badge exists, optionally update it (preserving user data)
			updates := models.Badge{
				Name:            badge.Name,
				Description:     badge.Description,
				Category:        badge.Category,
				Rarity:          badge.Rarity,
				IconType:        badge.IconType,
				IconValue:       badge.IconValue,
				IconColor:       badge.IconColor,
				RequirementType: badge.RequirementType,
				RequirementData: badge.RequirementData,
				PointsAwarded:   badge.PointsAwarded,
				DisplayOrder:    badge.DisplayOrder,
				IsActive:        badge.IsActive,
				IsLimited:       badge.IsLimited,
			}
			
			if err := db.Model(&existingBadge).Updates(&updates).Error; err != nil {
				log.Printf("Failed to update badge %s: %v", badge.Name, err)
				return err
			}
			log.Printf("🔄 Updated badge: %s", badge.Name)
		}
	}

	log.Printf("✅ Badge seeding completed: %d badges processed", len(badges))
	return nil
}

// Helper function to create string pointers
func stringPtr(s string) *string {
	return &s
}

// Close closes the database connection
func Close(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
