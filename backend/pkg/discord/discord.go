package discord

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

// Service handles Discord OAuth2 and API operations
type Service struct {
	ClientID     string
	ClientSecret string
	RedirectURI  string
	BotToken     string
	GuildID      string
}

// DiscordUser represents a Discord user from the API
type DiscordUser struct {
	ID            string `json:"id"`
	Username      string `json:"username"`
	Discriminator string `json:"discriminator"`
	Avatar        string `json:"avatar"`
	Bot           bool   `json:"bot"`
	System        bool   `json:"system"`
	MfaEnabled    bool   `json:"mfa_enabled"`
	Banner        string `json:"banner"`
	AccentColor   int    `json:"accent_color"`
	Locale        string `json:"locale"`
	Verified      bool   `json:"verified"`
	Email         string `json:"email"`
	Flags         int    `json:"flags"`
	PremiumType   int    `json:"premium_type"`
	PublicFlags   int    `json:"public_flags"`
}

// TokenResponse represents Discord OAuth2 token response
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
}

// GuildMember represents a Discord guild member
type GuildMember struct {
	User         DiscordUser `json:"user"`
	Nick         string      `json:"nick"`
	Avatar       string      `json:"avatar"`
	Roles        []string    `json:"roles"`
	JoinedAt     time.Time   `json:"joined_at"`
	PremiumSince *time.Time  `json:"premium_since"`
	Deaf         bool        `json:"deaf"`
	Mute         bool        `json:"mute"`
	Pending      bool        `json:"pending"`
}

// NewService creates a new Discord service
func NewService(clientID, clientSecret, redirectURI, botToken, guildID string) *Service {
	return &Service{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURI:  redirectURI,
		BotToken:     botToken,
		GuildID:      guildID,
	}
}

// GetAuthURL returns the Discord OAuth2 authorization URL
func (s *Service) GetAuthURL(state string) string {
	baseURL := "https://discord.com/api/oauth2/authorize"
	params := url.Values{}
	params.Add("client_id", s.ClientID)
	params.Add("redirect_uri", s.RedirectURI)
	params.Add("response_type", "code")
	params.Add("scope", "identify email guilds")
	params.Add("state", state)
	
	return fmt.Sprintf("%s?%s", baseURL, params.Encode())
}

// ExchangeCodeForToken exchanges authorization code for access token
func (s *Service) ExchangeCodeForToken(code string) (*TokenResponse, error) {
	data := url.Values{}
	data.Set("client_id", s.ClientID)
	data.Set("client_secret", s.ClientSecret)
	data.Set("grant_type", "authorization_code")
	data.Set("code", code)
	data.Set("redirect_uri", s.RedirectURI)

	req, err := http.NewRequest("POST", "https://discord.com/api/oauth2/token", bytes.NewBufferString(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to create token request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Content-Length", strconv.Itoa(len(data.Encode())))

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code for token: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read token response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Discord API error: %s - %s", resp.Status, string(body))
	}

	var tokenResp TokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, fmt.Errorf("failed to parse token response: %w", err)
	}

	return &tokenResp, nil
}

// GetUser gets user information using access token
func (s *Service) GetUser(accessToken string) (*DiscordUser, error) {
	req, err := http.NewRequest("GET", "https://discord.com/api/users/@me", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create user request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read user response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Discord API error: %s - %s", resp.Status, string(body))
	}

	var user DiscordUser
	if err := json.Unmarshal(body, &user); err != nil {
		return nil, fmt.Errorf("failed to parse user response: %w", err)
	}

	return &user, nil
}

// CheckGuildMembership checks if user is a member of the configured guild
func (s *Service) CheckGuildMembership(userID string) (*GuildMember, error) {
	if s.BotToken == "" || s.GuildID == "" {
		return nil, fmt.Errorf("bot token or guild ID not configured")
	}

	url := fmt.Sprintf("https://discord.com/api/guilds/%s/members/%s", s.GuildID, userID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create guild member request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bot %s", s.BotToken))

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to check guild membership: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read guild member response: %w", err)
	}

	if resp.StatusCode == http.StatusNotFound {
		return nil, nil // User is not a member
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Discord API error: %s - %s", resp.Status, string(body))
	}

	var member GuildMember
	if err := json.Unmarshal(body, &member); err != nil {
		return nil, fmt.Errorf("failed to parse guild member response: %w", err)
	}

	return &member, nil
}

// IsBooster checks if user is boosting the guild
func (s *Service) IsBooster(userID string) (bool, *time.Time, error) {
	member, err := s.CheckGuildMembership(userID)
	if err != nil {
		return false, nil, err
	}

	if member == nil {
		return false, nil, nil // Not a member
	}

	return member.PremiumSince != nil, member.PremiumSince, nil
}

// GetAvatarURL returns the full avatar URL for a Discord user
func (s *Service) GetAvatarURL(userID, avatar string, size int) string {
	if avatar == "" {
		// Default avatar
		discriminator := "0" // Default for new username system
		defaultNum, _ := strconv.Atoi(discriminator)
		return fmt.Sprintf("https://cdn.discordapp.com/embed/avatars/%d.png", defaultNum%5)
	}

	extension := "png"
	if len(avatar) > 2 && avatar[:2] == "a_" {
		extension = "gif" // Animated avatar
	}

	return fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.%s?size=%d", userID, avatar, extension, size)
}