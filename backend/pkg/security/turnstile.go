package security

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

// TurnstileVerifyRequest represents the request payload for Cloudflare Turnstile verification
type TurnstileVerifyRequest struct {
	Secret   string `json:"secret"`
	Response string `json:"response"`
	RemoteIP string `json:"remoteip,omitempty"`
}

// TurnstileVerifyResponse represents the response from Cloudflare Turnstile verification
type TurnstileVerifyResponse struct {
	Success     bool      `json:"success"`
	ChallengeTS time.Time `json:"challenge_ts"`
	Hostname    string    `json:"hostname"`
	ErrorCodes  []string  `json:"error-codes,omitempty"`
	Action      string    `json:"action,omitempty"`
	CData       string    `json:"cdata,omitempty"`
}

const (
	TurnstileVerifyURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
	RequestTimeout     = 10 * time.Second
)

// VerifyTurnstileToken verifies a Cloudflare Turnstile token
func VerifyTurnstileToken(token, clientIP string) (*TurnstileVerifyResponse, error) {
	if token == "" {
		return nil, fmt.Errorf("turnstile token is required")
	}

	secretKey := os.Getenv("CLOUDFLARE_SECRET_KEY")
	if secretKey == "" {
		// Use test secret key for development
		secretKey = "1x0000000000000000000000000000000AA"
	}

	// Prepare request payload
	payload := TurnstileVerifyRequest{
		Secret:   secretKey,
		Response: token,
		RemoteIP: clientIP,
	}

	// Marshal to JSON
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: RequestTimeout,
	}

	// Create POST request
	req, err := http.NewRequest("POST", TurnstileVerifyURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "gotchu-auth/1.0")

	// Make the request
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	// Parse response
	var verifyResp TurnstileVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&verifyResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &verifyResp, nil
}

// ValidateTurnstileToken validates a Turnstile token and returns an error if invalid
func ValidateTurnstileToken(token, clientIP string) error {
	if token == "" {
		return fmt.Errorf("security verification required")
	}

	// Skip validation in test environment
	if os.Getenv("GO_ENV") == "test" {
		return nil
	}

	result, err := VerifyTurnstileToken(token, clientIP)
	if err != nil {
		return fmt.Errorf("verification failed: %w", err)
	}

	if !result.Success {
		errorMsg := "security verification failed"
		if len(result.ErrorCodes) > 0 {
			errorMsg = fmt.Sprintf("verification failed: %v", result.ErrorCodes)
		}
		return fmt.Errorf(errorMsg)
	}

	return nil
}

// GetClientIP extracts the client IP from the request
func GetClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first (proxy/load balancer)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take the first IP from the comma-separated list
		if idx := bytes.IndexByte([]byte(xff), ','); idx != -1 {
			return xff[:idx]
		}
		return xff
	}

	// Check X-Real-IP header (proxy)
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	// Check CF-Connecting-IP header (Cloudflare)
	if cfip := r.Header.Get("CF-Connecting-IP"); cfip != "" {
		return cfip
	}

	// Fall back to RemoteAddr
	return r.RemoteAddr
}