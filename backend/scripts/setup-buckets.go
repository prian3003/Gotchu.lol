package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type CreateBucketRequest struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Public bool   `json:"public"`
}

func main() {
	supabaseURL := os.Getenv("NEXT_PUBLIC_SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if supabaseURL == "" || serviceKey == "" {
		fmt.Println("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")
		os.Exit(1)
	}

	buckets := []CreateBucketRequest{
		{ID: "user-backgrounds", Name: "user-backgrounds", Public: true},
		{ID: "user-avatars", Name: "user-avatars", Public: true},
		{ID: "user-audio", Name: "user-audio", Public: true},
		{ID: "user-cursors", Name: "user-cursors", Public: true},
		{ID: "user-assets", Name: "user-assets", Public: true},
	}

	client := &http.Client{Timeout: 30 * time.Second}

	for _, bucket := range buckets {
		fmt.Printf("Creating bucket: %s\n", bucket.ID)
		
		jsonData, err := json.Marshal(bucket)
		if err != nil {
			fmt.Printf("Error marshaling bucket data: %v\n", err)
			continue
		}

		url := fmt.Sprintf("%s/storage/v1/bucket", supabaseURL)
		req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
		if err != nil {
			fmt.Printf("Error creating request: %v\n", err)
			continue
		}

		req.Header.Set("Authorization", "Bearer "+serviceKey)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("apikey", serviceKey)

		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("Error creating bucket %s: %v\n", bucket.ID, err)
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
			fmt.Printf("✅ Successfully created bucket: %s\n", bucket.ID)
		} else if resp.StatusCode == http.StatusConflict {
			fmt.Printf("⚠️  Bucket %s already exists\n", bucket.ID)
		} else {
			fmt.Printf("❌ Failed to create bucket %s: HTTP %d\n", bucket.ID, resp.StatusCode)
		}
	}

	fmt.Println("\n🎉 Bucket setup complete!")
}