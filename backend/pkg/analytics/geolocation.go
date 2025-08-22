package analytics

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"
)

// GeoLocation represents geographical location data
type GeoLocation struct {
	Country     string `json:"country"`
	CountryCode string `json:"country_code"`
	City        string `json:"city"`
	Region      string `json:"region"`
	Timezone    string `json:"timezone"`
	ISP         string `json:"isp"`
}

// GeoLocationService handles IP geolocation lookups
type GeoLocationService struct {
	httpClient *http.Client
}

// NewGeoLocationService creates a new geolocation service
func NewGeoLocationService() *GeoLocationService {
	return &GeoLocationService{
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// GetLocation gets geographical information for an IP address
func (g *GeoLocationService) GetLocation(ipAddress string) (*GeoLocation, error) {
	// Handle localhost and private IPs
	if isPrivateIP(ipAddress) {
		return &GeoLocation{
			Country:     "Unknown",
			CountryCode: "XX",
			City:        "Unknown",
			Region:      "Unknown",
			Timezone:    "Unknown",
			ISP:         "Local",
		}, nil
	}

	// For development/testing, use a free IP geolocation API
	// In production, you might want to use a paid service for better accuracy
	return g.getLocationFromIPAPI(ipAddress)
}

// getLocationFromIPAPI uses ip-api.com free service (limited to 45 requests per minute)
func (g *GeoLocationService) getLocationFromIPAPI(ipAddress string) (*GeoLocation, error) {
	url := fmt.Sprintf("http://ip-api.com/json/%s?fields=status,message,country,countryCode,region,city,timezone,isp", ipAddress)
	
	resp, err := g.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch geolocation: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("geolocation API returned status %d", resp.StatusCode)
	}

	var apiResponse struct {
		Status      string `json:"status"`
		Message     string `json:"message"`
		Country     string `json:"country"`
		CountryCode string `json:"countryCode"`
		Region      string `json:"region"`
		City        string `json:"city"`
		Timezone    string `json:"timezone"`
		ISP         string `json:"isp"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return nil, fmt.Errorf("failed to decode geolocation response: %v", err)
	}

	if apiResponse.Status != "success" {
		return nil, fmt.Errorf("geolocation lookup failed: %s", apiResponse.Message)
	}

	return &GeoLocation{
		Country:     apiResponse.Country,
		CountryCode: apiResponse.CountryCode,
		City:        apiResponse.City,
		Region:      apiResponse.Region,
		Timezone:    apiResponse.Timezone,
		ISP:         apiResponse.ISP,
	}, nil
}

// isPrivateIP checks if an IP address is private/local
func isPrivateIP(ipAddress string) bool {
	// Handle common local addresses
	if ipAddress == "127.0.0.1" || ipAddress == "::1" || ipAddress == "localhost" {
		return true
	}

	ip := net.ParseIP(ipAddress)
	if ip == nil {
		return true // Invalid IP, treat as private
	}

	// Check for private IP ranges
	privateRanges := []string{
		"10.0.0.0/8",     // RFC1918
		"172.16.0.0/12",  // RFC1918
		"192.168.0.0/16", // RFC1918
		"169.254.0.0/16", // Link-local
		"::1/128",        // IPv6 loopback
		"fe80::/10",      // IPv6 link-local
		"fc00::/7",       // IPv6 unique local
	}

	for _, cidr := range privateRanges {
		_, ipNet, err := net.ParseCIDR(cidr)
		if err != nil {
			continue
		}
		if ipNet.Contains(ip) {
			return true
		}
	}

	return false
}

// GetClientIP extracts the real client IP from request headers
func GetClientIP(r *http.Request) string {
	// Check X-Forwarded-For header (from proxy/load balancer)
	xForwardedFor := r.Header.Get("X-Forwarded-For")
	if xForwardedFor != "" {
		// X-Forwarded-For can contain multiple IPs, take the first one
		ips := strings.Split(xForwardedFor, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// Check X-Real-IP header (from nginx/proxy)
	xRealIP := r.Header.Get("X-Real-IP")
	if xRealIP != "" {
		return xRealIP
	}

	// Check CF-Connecting-IP header (from Cloudflare)
	cfConnectingIP := r.Header.Get("CF-Connecting-IP")
	if cfConnectingIP != "" {
		return cfConnectingIP
	}

	// Fall back to RemoteAddr
	ip := r.RemoteAddr
	// Remove port if present
	if strings.Contains(ip, ":") {
		ip, _, _ = net.SplitHostPort(ip)
	}

	return ip
}