package main

import (
	"encoding/json"
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

	// Initialize database
	db, err := database.NewConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Check if templates table exists
	if db.Migrator().HasTable(&models.Template{}) {
		fmt.Println("✅ Templates table exists")
	} else {
		fmt.Println("❌ Templates table does not exist")
		fmt.Println("Running migrations...")
		if err := database.AutoMigrate(db); err != nil {
			log.Fatalf("Failed to run migrations: %v", err)
		}
		fmt.Println("✅ Migrations completed")
	}

	// Check if we can create a template
	fmt.Println("\n🧪 Testing template creation...")
	
	// First, let's create a test user if it doesn't exist
	var user models.User
	err = db.Where("username = ?", "testuser").First(&user).Error
	if err != nil {
		user = models.User{
			Username: "testuser",
			Email:    stringPtr("test@example.com"),
		}
		if err := db.Create(&user).Error; err != nil {
			log.Printf("Failed to create test user: %v", err)
		} else {
			fmt.Println("✅ Test user created")
		}
	}

	// Try to create a template
	template := models.Template{
		Name:               "Test Template",
		Description:        stringPtr("A test template"),
		Category:           models.TemplateCategoryPersonal,
		Status:             models.TemplateStatusPendingReview,
		IsPublic:           true,
		IsPremiumOnly:      false,
		CreatorID:          user.ID,
		Tags:               stringPtr(`["test", "debug"]`),
		Version:            "1.0.0",
		AccentColor:        &user.AccentColor,
		TextColor:          &user.TextColor,
		BackgroundColor:    &user.BackgroundColor,
		IconColor:          &user.IconColor,
		PrimaryColor:       &user.PrimaryColor,
		SecondaryColor:     &user.SecondaryColor,
		ProfileOpacity:     &user.ProfileOpacity,
		ProfileBlur:        &user.ProfileBlur,
		VolumeLevel:        &user.VolumeLevel,
		GlowUsername:       &user.GlowUsername,
		GlowSocials:        &user.GlowSocials,
		GlowBadges:         &user.GlowBadges,
		AnimatedTitle:      &user.AnimatedTitle,
		MonochromeIcons:    &user.MonochromeIcons,
		SwapBoxColors:      &user.SwapBoxColors,
		VolumeControl:      &user.VolumeControl,
		ProfileGradient:    &user.ProfileGradient,
	}

	if err := db.Create(&template).Error; err != nil {
		fmt.Printf("❌ Failed to create template: %v\n", err)
	} else {
		fmt.Printf("✅ Template created successfully with ID: %d\n", template.ID)
		
		// Show the created template as JSON
		templateJSON, _ := json.MarshalIndent(template, "", "  ")
		fmt.Printf("Created template: %s\n", templateJSON)
	}

	// List existing templates
	var templates []models.Template
	if err := db.Find(&templates).Error; err != nil {
		fmt.Printf("❌ Failed to fetch templates: %v\n", err)
	} else {
		fmt.Printf("📋 Found %d templates in database\n", len(templates))
		for _, t := range templates {
			fmt.Printf("  - ID: %d, Name: %s, Status: %s\n", t.ID, t.Name, t.Status)
		}
	}

	// Check template categories endpoint
	fmt.Println("\n🏷️ Testing categories...")
	categories := []models.TemplateCategory{
		models.TemplateCategoryMinimal,
		models.TemplateCategoryProfessional,
		models.TemplateCategoryCreative,
		models.TemplateCategoryGaming,
		models.TemplateCategoryMusic,
		models.TemplateCategoryBusiness,
		models.TemplateCategoryPersonal,
		models.TemplateCategoryCommunity,
		models.TemplateCategorySeasonal,
		models.TemplateCategoryOther,
	}
	
	fmt.Printf("Available categories: %v\n", categories)
}

func stringPtr(s string) *string {
	return &s
}