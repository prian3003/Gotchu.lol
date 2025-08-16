package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"gotchu-backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
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
	// Configure GORM logger
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Warn, // Only show warnings and errors
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	// Configure PostgreSQL connection to disable prepared statement caching
	config := postgres.Config{
		DSN: databaseURL,
		PreferSimpleProtocol: true, // Disable prepared statements
	}

	// Open database connection
	db, err := gorm.Open(postgres.New(config), &gorm.Config{
		Logger: newLogger,
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

	// Set connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

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
		
		// Link indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_user_active_order ON links (user_id, is_active, \"order\");",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_clicks_desc ON links (clicks DESC);",
		
		// Profile view indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_views_user_created ON profile_views (user_id, created_at DESC);",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_views_viewer_created ON profile_views (viewer_user_id, created_at DESC);",
		
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

	// Create default badges
	badges := []models.Badge{
		{
			Name:              "Welcome",
			Description:       "Welcome to gotchu.lol! This badge is awarded when you create your account.",
			Category:          models.BadgeCategoryMilestone,
			Rarity:            models.BadgeRarityCommon,
			IconType:          models.BadgeIconTypeEmoji,
			IconValue:         "👋",
			RequirementType:   models.RequirementTypeManual,
			RequirementData:   `{"type": "account_created"}`,
			PointsAwarded:     10,
			ExperienceAwarded: 5,
			IsActive:          true,
		},
		{
			Name:              "First Link",
			Description:       "Added your first link to your profile.",
			Category:          models.BadgeCategoryMilestone,
			Rarity:            models.BadgeRarityCommon,
			IconType:          models.BadgeIconTypeEmoji,
			IconValue:         "🔗",
			RequirementType:   models.RequirementTypeLinkCount,
			RequirementData:   `{"count": 1}`,
			PointsAwarded:     15,
			ExperienceAwarded: 10,
			IsActive:          true,
		},
		{
			Name:              "Popular",
			Description:       "Your profile has been viewed 100 times.",
			Category:          models.BadgeCategoryEngagement,
			Rarity:            models.BadgeRarityUncommon,
			IconType:          models.BadgeIconTypeEmoji,
			IconValue:         "👀",
			RequirementType:   models.RequirementTypeProfileViews,
			RequirementData:   `{"count": 100}`,
			PointsAwarded:     50,
			ExperienceAwarded: 25,
			IsActive:          true,
		},
		{
			Name:              "Verified",
			Description:       "Your account has been verified.",
			Category:          models.BadgeCategoryStaff,
			Rarity:            models.BadgeRarityRare,
			IconType:          models.BadgeIconTypeEmoji,
			IconValue:         "✅",
			RequirementType:   models.RequirementTypeManual,
			RequirementData:   `{"type": "verification"}`,
			PointsAwarded:     100,
			ExperienceAwarded: 50,
			IsActive:          true,
		},
	}

	for _, badge := range badges {
		var existingBadge models.Badge
		err := db.Where("name = ?", badge.Name).First(&existingBadge).Error
		if err == gorm.ErrRecordNotFound {
			if err := db.Create(&badge).Error; err != nil {
				log.Printf("Failed to create badge %s: %v", badge.Name, err)
			}
		}
	}

	log.Println("Initial data seeded successfully")
	return nil
}

// Close closes the database connection
func Close(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}