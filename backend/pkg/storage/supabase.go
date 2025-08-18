package storage

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
)

// SupabaseStorage handles file uploads to Supabase storage
type SupabaseStorage struct {
	URL           string
	ServiceKey    string
	AnonKey       string
	httpClient    *http.Client
}

// NewSupabaseStorage creates a new Supabase storage client
func NewSupabaseStorage(url, serviceKey, anonKey string) *SupabaseStorage {
	return &SupabaseStorage{
		URL:        url,
		ServiceKey: serviceKey,
		AnonKey:    anonKey,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// UploadResponse represents the response from Supabase upload
type UploadResponse struct {
	Key string `json:"Key"`
}

// UploadFile uploads a file to Supabase storage
func (s *SupabaseStorage) UploadFile(bucketName, fileName string, file multipart.File, contentType string) (string, error) {
	// Create the upload URL
	uploadURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.URL, bucketName, fileName)

	// Read the file content
	fileContent, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("failed to read file content: %w", err)
	}

	// Create the request
	req, err := http.NewRequest("POST", uploadURL, bytes.NewReader(fileContent))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+s.ServiceKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("apikey", s.AnonKey)

	// Make the request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("upload failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	// Return the public URL
	publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.URL, bucketName, fileName)
	return publicURL, nil
}

// DeleteFile deletes a file from Supabase storage
func (s *SupabaseStorage) DeleteFile(bucketName, fileName string) error {
	deleteURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.URL, bucketName, fileName)

	req, err := http.NewRequest("DELETE", deleteURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.ServiceKey)
	req.Header.Set("apikey", s.AnonKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

// GetBucketForAssetType returns the appropriate bucket name for each asset type
func GetBucketForAssetType(assetType string) string {
	switch assetType {
	case "backgroundImage":
		return "user-backgrounds"
	case "avatar":
		return "user-avatars"
	case "audio":
		return "user-audio"
	case "cursor":
		return "user-cursors"
	default:
		return "user-assets"
	}
}