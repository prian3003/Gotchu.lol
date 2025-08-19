package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Error loading .env file:", err)
	} else {
		log.Println("Successfully loaded .env file")
	}

	// Check environment variables
	supabaseURL := os.Getenv("NEXT_PUBLIC_SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	fmt.Printf("NEXT_PUBLIC_SUPABASE_URL: %s\n", supabaseURL)
	if serviceKey != "" {
		fmt.Printf("SUPABASE_SERVICE_ROLE_KEY: %s...(hidden)\n", serviceKey[:10])
	} else {
		fmt.Println("SUPABASE_SERVICE_ROLE_KEY: (not set)")
	}

	if supabaseURL == "" {
		fmt.Println("❌ Environment variables not loaded properly")
		os.Exit(1)
	} else {
		fmt.Println("✅ Environment variables loaded successfully")
	}
}