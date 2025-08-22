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

	// Clear the specific corrupted cache for user 'x'
	userCacheKey := "user:username:x"
	
	// First check what's in the cache
	exists, err := redisClient.Exists(userCacheKey)
	if err != nil {
		fmt.Printf("Error checking cache: %v\n", err)
	} else {
		fmt.Printf("Cache exists for key %s: %v\n", userCacheKey, exists)
	}
	
	// Delete the corrupted cache
	err = redisClient.Delete(userCacheKey)
	if err != nil {
		fmt.Printf("Failed to clear cache: %v\n", err)
	} else {
		fmt.Printf("Successfully cleared cache for key: %s\n", userCacheKey)
	}
	
	// Also clear dashboard cache
	dashboardCacheKey := "dashboard:user:x"
	err = redisClient.Delete(dashboardCacheKey)
	if err != nil {
		fmt.Printf("Failed to clear dashboard cache: %v\n", err)
	} else {
		fmt.Printf("Successfully cleared dashboard cache for key: %s\n", dashboardCacheKey)
	}
}