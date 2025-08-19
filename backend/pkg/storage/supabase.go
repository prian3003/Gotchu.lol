package storage

import (
	"bytes"
	"encoding/json"
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

// FileObject represents a file in Supabase storage
type FileObject struct {
	Name         string    `json:"name"`
	ID           string    `json:"id"`
	UpdatedAt    time.Time `json:"updated_at"`
	CreatedAt    time.Time `json:"created_at"`
	LastAccessed time.Time `json:"last_accessed_at"`
	Size         int64     `json:"size"`
}

// ListFilesResponse represents the response from listing files
type ListFilesResponse struct {
	Files []FileObject `json:"files"`
	Error string       `json:"error,omitempty"`
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

// ListFiles lists all files in a specific folder within a bucket
func (s *SupabaseStorage) ListFiles(bucketName, folderPath string) ([]FileObject, error) {
	// Create the list URL
	listURL := fmt.Sprintf("%s/storage/v1/object/list/%s", s.URL, bucketName)
	
	// Create request body with folder path
	requestBody := map[string]interface{}{
		"prefix": folderPath,
		"limit":  100,
		"offset": 0,
	}
	
	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	// Create the request
	req, err := http.NewRequest("POST", listURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+s.ServiceKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.AnonKey)

	// Make the request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to list files: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("list failed with status %d: %s", resp.StatusCode, string(responseBody))
	}

	// Parse response
	var files []FileObject
	err = json.Unmarshal(responseBody, &files)
	if err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return files, nil
}

// GetPublicURL returns the public URL for a file
func (s *SupabaseStorage) GetPublicURL(bucketName, filePath string) string {
	return fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.URL, bucketName, filePath)
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

// GetTemplateBucketForAssetType returns the appropriate template bucket name for each asset type
func GetTemplateBucketForAssetType(assetType string) string {
	switch assetType {
	case "preview", "thumbnail":
		return "template-" + assetType + "s" // template-previews, template-thumbnails
	case "backgroundImage", "audio", "cursor":
		return "templates" // Store template assets in main templates bucket
	default:
		return "templates"
	}
}

// CopyFileFromURL copies a file from one location to another in Supabase storage
func (s *SupabaseStorage) CopyFileFromURL(sourceURL, destBucket, destFileName string) (string, error) {
	// Download the file from source URL
	resp, err := s.httpClient.Get(sourceURL)
	if err != nil {
		return "", fmt.Errorf("failed to download source file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to download source file, status: %d", resp.StatusCode)
	}

	// Read the file content
	fileContent, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read file content: %w", err)
	}

	// Get content type from response header
	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Upload to destination
	uploadURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.URL, destBucket, destFileName)

	req, err := http.NewRequest("POST", uploadURL, bytes.NewReader(fileContent))
	if err != nil {
		return "", fmt.Errorf("failed to create upload request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.ServiceKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("apikey", s.AnonKey)

	uploadResp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}
	defer uploadResp.Body.Close()

	if uploadResp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(uploadResp.Body)
		return "", fmt.Errorf("upload failed with status %d: %s", uploadResp.StatusCode, string(bodyBytes))
	}

	// Return the public URL
	publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.URL, destBucket, destFileName)
	return publicURL, nil
}