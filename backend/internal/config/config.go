package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	// Server
	Port    string
	GinMode string

	// Database
	DatabaseURL string
	DirectURL   string

	// Redis - Traditional
	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisUsername string
	RedisDB       int
	
	// Redis - Upstash (alternative to traditional Redis)
	UpstashRedisURL   string
	UpstashRedisToken string

	// JWT
	JWTSecret string

	// CORS
	CORSOrigins string

	// Rate Limiting
	RateLimitWindow    time.Duration
	RateLimitMax       int
	AuthRateLimitMax   int
	SessionExpiry      time.Duration

	// Supabase (optional)
	SupabaseURL            string
	SupabaseAnonKey        string
	SupabaseServiceRoleKey string

	// Discord (optional)
	DiscordBotToken     string
	DiscordClientID     string
	DiscordClientSecret string
	DiscordRedirectURI  string
	DiscordGuildID      string

	// Google OAuth (optional)
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURI  string

	// Email (optional)
	ResendAPIKey string
	EmailFrom    string

	// Cloudflare (optional)
	CloudflareTurnstileSiteKey   string
	CloudflareTurnstileSecretKey string

	// Site
	SiteURL string

	// OxaPay Payment Gateway
	OxaPayMerchantKey string
	OxaPayAPIKey      string
	
	// URLs
	BaseURL     string
	FrontendURL string
}

// Load loads configuration from environment variables
func Load() *Config {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	config := &Config{
		// Server
		Port:    getEnv("PORT", "8080"),
		GinMode: getEnv("GIN_MODE", "debug"),

		// Database
		DatabaseURL: getEnvRequired("DATABASE_URL"),
		DirectURL:   getEnv("DIRECT_URL", ""),

		// Redis - Traditional (fallback if Upstash not available)
		RedisHost:     getEnv("REDIS_HOST", ""),
		RedisPort:     getEnv("REDIS_PORT", ""),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisUsername: getEnv("REDIS_USERNAME", "default"),
		RedisDB:       getEnvAsInt("REDIS_DB", 0),
		
		// Redis - Upstash (preferred)
		UpstashRedisURL:   getEnv("UPSTASH_REDIS_REST_URL", ""),
		UpstashRedisToken: getEnv("UPSTASH_REDIS_REST_TOKEN", ""),

		// JWT
		JWTSecret: getEnvRequired("JWT_SECRET"),

		// CORS
		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"),

		// Rate Limiting
		RateLimitWindow:  time.Duration(getEnvAsInt("RATE_LIMIT_WINDOW", 300)) * time.Second,
		RateLimitMax:     getEnvAsInt("RATE_LIMIT_MAX", 100),
		AuthRateLimitMax: getEnvAsInt("AUTH_RATE_LIMIT_MAX", 5),
		SessionExpiry:    time.Duration(getEnvAsInt("SESSION_EXPIRY", 86400)) * time.Second,

		// Supabase
		SupabaseURL:            getEnv("NEXT_PUBLIC_SUPABASE_URL", ""),
		SupabaseAnonKey:        getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""),
		SupabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),

		// Discord
		DiscordBotToken:     getEnv("DISCORD_BOT_TOKEN", ""),
		DiscordClientID:     getEnv("DISCORD_CLIENT_ID", ""),
		DiscordClientSecret: getEnv("DISCORD_CLIENT_SECRET", ""),
		DiscordRedirectURI:  getEnv("DISCORD_REDIRECT_URI", ""),
		DiscordGuildID:      getEnv("DISCORD_GUILD_ID", ""),

		// Google OAuth
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURI:  getEnv("GOOGLE_REDIRECT_URI", ""),

		// Email
		ResendAPIKey: getEnv("RESEND_API_KEY", ""),
		EmailFrom:    getEnv("EMAIL_FROM", "noreply@gotchu.lol"),

		// Cloudflare
		CloudflareTurnstileSiteKey:   getEnv("NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY", ""),
		CloudflareTurnstileSecretKey: getEnv("CLOUDFLARE_TURNSTILE_SECRET_KEY", ""),

		// Site
		SiteURL: getEnv("SITE_URL", "http://localhost:5173"),

		// OxaPay Payment Gateway
		OxaPayMerchantKey: getEnv("OXAPAY_MERCHANT_KEY", ""),
		OxaPayAPIKey:      getEnv("OXAPAY_API_KEY", ""),
		
		// URLs
		BaseURL:     getEnv("BASE_URL", "http://localhost:8080"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
	}

	return config
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvRequired gets a required environment variable
func getEnvRequired(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("Required environment variable %s is not set", key)
	}
	return value
}

// getEnvAsInt gets an environment variable as integer with default
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
		log.Printf("Invalid integer value for %s: %s, using default: %d", key, value, defaultValue)
	}
	return defaultValue
}

// IsDevelopment returns true if running in development mode
func (c *Config) IsDevelopment() bool {
	return c.GinMode == "debug"
}

// IsProduction returns true if running in production mode
func (c *Config) IsProduction() bool {
	return c.GinMode == "release"
}