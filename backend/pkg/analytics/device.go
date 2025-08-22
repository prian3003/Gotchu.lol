package analytics

import (
	"regexp"
	"strings"
)

// DeviceInfo represents detected device information
type DeviceInfo struct {
	Device  string `json:"device"`  // mobile, desktop, tablet
	Browser string `json:"browser"` // chrome, firefox, safari, etc.
	OS      string `json:"os"`      // windows, macos, linux, ios, android
}

// DetectDevice analyzes User-Agent string and returns device information
func DetectDevice(userAgent string) *DeviceInfo {
	if userAgent == "" {
		return &DeviceInfo{
			Device:  "unknown",
			Browser: "unknown",
			OS:      "unknown",
		}
	}

	ua := strings.ToLower(userAgent)
	
	// Detect device type
	device := "desktop"
	if isMobile(ua) {
		device = "mobile"
	} else if isTablet(ua) {
		device = "tablet"
	}

	// Detect browser
	browser := detectBrowser(ua)
	
	// Detect OS
	os := detectOS(ua)

	return &DeviceInfo{
		Device:  device,
		Browser: browser,
		OS:      os,
	}
}

// isMobile checks if the user agent indicates a mobile device
func isMobile(ua string) bool {
	mobilePatterns := []string{
		"mobile", "android", "iphone", "ipod", "blackberry",
		"windows phone", "opera mini", "iemobile", "wpdesktop",
		"mobile safari", "mobile chrome", "mobile firefox",
	}
	
	for _, pattern := range mobilePatterns {
		if strings.Contains(ua, pattern) {
			return true
		}
	}
	
	return false
}

// isTablet checks if the user agent indicates a tablet device
func isTablet(ua string) bool {
	tabletPatterns := []string{
		"ipad", "tablet", "kindle", "nexus 7", "nexus 9", "nexus 10",
		"galaxy tab", "surface", "playbook",
	}
	
	for _, pattern := range tabletPatterns {
		if strings.Contains(ua, pattern) {
			return true
		}
	}
	
	// Android tablets (have android but not mobile)
	if strings.Contains(ua, "android") && !strings.Contains(ua, "mobile") {
		return true
	}
	
	return false
}

// detectBrowser identifies the browser from user agent
func detectBrowser(ua string) string {
	browsers := map[string][]string{
		"chrome":   {"chrome", "crios"},
		"firefox":  {"firefox", "fxios"},
		"safari":   {"safari"},
		"edge":     {"edge", "edg"},
		"opera":    {"opera", "opr"},
		"brave":    {"brave"},
		"vivaldi":  {"vivaldi"},
		"samsung":  {"samsungbrowser"},
		"ie":       {"msie", "trident"},
	}
	
	for browser, patterns := range browsers {
		for _, pattern := range patterns {
			if strings.Contains(ua, pattern) {
				// Special case for Safari - make sure it's not Chrome
				if browser == "safari" && strings.Contains(ua, "chrome") {
					continue
				}
				return browser
			}
		}
	}
	
	return "unknown"
}

// detectOS identifies the operating system from user agent
func detectOS(ua string) string {
	osPatterns := map[string][]string{
		"windows":  {"windows nt", "win32", "win64"},
		"macos":    {"mac os x", "macos", "macintosh"},
		"linux":    {"linux", "ubuntu", "debian", "fedora", "centos"},
		"ios":      {"iphone os", "ios", "iphone", "ipad", "ipod"},
		"android":  {"android"},
		"chromeos": {"cros"},
	}
	
	for os, patterns := range osPatterns {
		for _, pattern := range patterns {
			if strings.Contains(ua, pattern) {
				return os
			}
		}
	}
	
	return "unknown"
}

// GetRefererDomain extracts domain from referer URL
func GetRefererDomain(referer string) string {
	if referer == "" {
		return "direct"
	}
	
	// Remove protocol
	re := regexp.MustCompile(`^https?://`)
	domain := re.ReplaceAllString(referer, "")
	
	// Extract domain part (before first slash)
	parts := strings.Split(domain, "/")
	if len(parts) > 0 {
		domain = parts[0]
	}
	
	// Remove www. prefix
	domain = strings.TrimPrefix(domain, "www.")
	
	// Handle common social media and search engine domains
	commonDomains := map[string]string{
		"google.com":     "google",
		"google.co.uk":   "google",
		"google.ca":      "google",
		"google.de":      "google",
		"bing.com":       "bing",
		"yahoo.com":      "yahoo",
		"facebook.com":   "facebook",
		"twitter.com":    "twitter",
		"x.com":          "twitter",
		"instagram.com":  "instagram",
		"linkedin.com":   "linkedin",
		"youtube.com":    "youtube",
		"tiktok.com":     "tiktok",
		"reddit.com":     "reddit",
		"github.com":     "github",
	}
	
	if simpleDomain, exists := commonDomains[domain]; exists {
		return simpleDomain
	}
	
	return domain
}