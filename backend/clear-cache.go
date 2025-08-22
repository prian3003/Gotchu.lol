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
		fmt.Println("No Redis configuration found, skipping cache clear")
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

	// Clear all user caches
	usernames := []string{"x", "hi", "xxx", "sat", "testuser", ""}
	
	for _, username := range usernames {
		if username == "" {
			continue
		}
		
		// Clear user cache
		userCacheKey := fmt.Sprintf("user:username:%s", username)
		err := redisClient.Delete(userCacheKey)
		if err != nil {
			fmt.Printf("Failed to clear cache for %s: %v\n", username, err)
		} else {
			fmt.Printf("Cleared cache for user: %s\n", username)
		}
		
		// Clear dashboard cache
		dashboardCacheKey := fmt.Sprintf("dashboard:user:%s", username)
		err = redisClient.Delete(dashboardCacheKey)
		if err != nil {
			fmt.Printf("Failed to clear dashboard cache for %s: %v\n", username, err)
		} else {
			fmt.Printf("Cleared dashboard cache for user: %s\n", username)
		}
	}

	fmt.Println("Cache clearing completed")
}