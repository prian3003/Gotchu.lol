package main

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"gotchu-backend/pkg/redis"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
	}

	// Get Redis configuration
	redisHost := os.Getenv("REDIS_HOST")
	redisPort := os.Getenv("REDIS_PORT")
	redisPassword := os.Getenv("REDIS_PASSWORD")
	redisUsername := os.Getenv("REDIS_USERNAME")
	redisDBStr := os.Getenv("REDIS_DB")

	if redisHost == "" {
		fmt.Println("No Redis configuration found")
		return
	}

	redisDB := 0
	if redisDBStr != "" {
		if db, err := strconv.Atoi(redisDBStr); err == nil {
			redisDB = db
		}
	}

	// Connect to Redis
	redisClient, err := redis.NewClient(redisHost, redisPort, redisPassword, redisUsername, redisDB)
	if err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}
	defer redisClient.Close()

	// Clear the specific deduplication key for user 3 (user 'x') with IP ::1
	dedupeKey := "view_dedupe:3:::1"
	
	// Delete the deduplication key
	err = redisClient.Delete(dedupeKey)
	if err != nil {
		fmt.Printf("Failed to clear dedupe key: %v\n", err)
	} else {
		fmt.Printf("Successfully cleared deduplication key: %s\n", dedupeKey)
	}
	
	// Also clear any analytics cache
	analyticsKey := "analytics:user:3"
	err = redisClient.Delete(analyticsKey)
	if err != nil {
		fmt.Printf("Failed to clear analytics cache: %v\n", err)
	} else {
		fmt.Printf("Successfully cleared analytics cache: %s\n", analyticsKey)
	}
}