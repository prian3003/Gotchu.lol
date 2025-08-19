package main

import (
	"fmt"
	"log"

	"gotchu-backend/internal/config"
	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/database"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg := config.Load()

	fmt.Printf("🔗 Database URL: %s\n", cfg.DatabaseURL)
	fmt.Printf("🔗 Direct URL: %s\n", cfg.DirectURL)

	// Initialize database
	db, err := database.NewConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Check what database we're actually connected to
	var result struct {
		CurrentDatabase string `gorm:"column:current_database"`
		Version         string `gorm:"column:version"`
	}

	db.Raw("SELECT current_database(), version()").Scan(&result)
	fmt.Printf("📊 Connected Database: %s\n", result.CurrentDatabase)
	fmt.Printf("🐘 PostgreSQL Version: %s\n", result.Version)

	// Check if templates table exists
	if db.Migrator().HasTable(&models.Template{}) {
		fmt.Println("✅ Templates table exists")
		
		// Get table info
		var count int64
		db.Model(&models.Template{}).Count(&count)
		fmt.Printf("📋 Templates count: %d\n", count)
		
		// List all tables
		var tables []string
		db.Raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%template%'").Pluck("table_name", &tables)
		fmt.Printf("🗂️ Template-related tables: %v\n", tables)
		
		// List all tables in database
		var allTables []string
		db.Raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name").Pluck("table_name", &allTables)
		fmt.Printf("📁 All tables: %v\n", allTables)
	} else {
		fmt.Println("❌ Templates table does not exist")
		fmt.Println("🔄 Running migrations...")
		if err := database.AutoMigrate(db); err != nil {
			log.Fatalf("Failed to run migrations: %v", err)
		}
		fmt.Println("✅ Migrations completed")
	}

	// Test direct connection to Supabase
	fmt.Println("\n🧪 Testing connection details...")
	
	// Check connection pool stats
	sqlDB, err := db.DB()
	if err != nil {
		log.Printf("Failed to get underlying DB: %v", err)
	} else {
		stats := sqlDB.Stats()
		fmt.Printf("🔌 Connection pool - Open: %d, InUse: %d, Idle: %d\n", 
			stats.OpenConnections, stats.InUse, stats.Idle)
	}
}