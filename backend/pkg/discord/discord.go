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

// DiscordBadge represents a Discord badge
type DiscordBadge struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
}

// Discord Public Flags constants
const (
	DiscordEmployee          = 1 << 0  // Discord Staff
	DiscordPartner           = 1 << 1  // Partnered Server Owner
	HypeSquadEvents          = 1 << 2  // HypeSquad Events
	BugHunterLevel1          = 1 << 3  // Bug Hunter Level 1
	HouseBravery             = 1 << 6  // House of Bravery
	HouseBrilliance          = 1 << 7  // House of Brilliance
	HouseBalance             = 1 << 8  // House of Balance
	EarlySupporter           = 1 << 9  // Early Supporter
	TeamUser                 = 1 << 10 // Team User
	BugHunterLevel2          = 1 << 14 // Bug Hunter Level 2
	VerifiedBot              = 1 << 16 // Verified Bot
	EarlyVerifiedBotDeveloper = 1 << 17 // Early Verified Bot Developer
	DiscordCertifiedModerator = 1 << 18 // Discord Certified Moderator
	BotHTTPInteractions      = 1 << 19 // Bot uses only HTTP interactions
)

// GetDiscordBadges converts Discord public flags to badge objects
func GetDiscordBadges(publicFlags int) []DiscordBadge {
	var badges []DiscordBadge

	flagMap := map[int]DiscordBadge{
		DiscordEmployee: {
			ID:          "discord_employee",
			Name:        "Discord Staff",
			Description: "Discord Team Member",
			Icon:        "https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png",
		},
		DiscordPartner: {
			ID:          "discord_partner",
			Name:        "Discord Partner",
			Description: "Partnered Server Owner",
			Icon:        "https://cdn.discordapp.com/badge-icons/3f9748e53446a137a052f3454e2de41e.png",
		},
		HypeSquadEvents: {
			ID:          "hypesquad_events",
			Name:        "HypeSquad Events",
			Description: "HypeSquad Events Organizer",
			Icon:        "https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png",
		},
		BugHunterLevel1: {
			ID:          "bug_hunter_1",
			Name:        "Bug Hunter",
			Description: "Discord Bug Hunter Level 1",
			Icon:        "https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a940dd0.png",
		},
		HouseBravery: {
			ID:          "house_bravery",
			Name:        "HypeSquad Bravery",
			Description: "House of Bravery Member",
			Icon:        "https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png",
		},
		HouseBrilliance: {
			ID:          "house_brilliance",
			Name:        "HypeSquad Brilliance",
			Description: "House of Brilliance Member",
			Icon:        "https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png",
		},
		HouseBalance: {
			ID:          "house_balance",
			Name:        "HypeSquad Balance",
			Description: "House of Balance Member",
			Icon:        "https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png",
		},
		EarlySupporter: {
			ID:          "early_supporter",
			Name:        "Early Supporter",
			Description: "Early Nitro Supporter",
			Icon:        "https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png",
		},
		BugHunterLevel2: {
			ID:          "bug_hunter_2",
			Name:        "Bug Hunter Gold",
			Description: "Discord Bug Hunter Level 2",
			Icon:        "https://cdn.discordapp.com/badge-icons/848f79194d4be5ff5f81505cbd0ce1e6.png",
		},
		EarlyVerifiedBotDeveloper: {
			ID:          "early_bot_dev",
			Name:        "Early Bot Developer",
			Description: "Early Verified Bot Developer",
			Icon:        "https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png",
		},
		DiscordCertifiedModerator: {
			ID:          "certified_mod",
			Name:        "Discord Moderator",
			Description: "Discord Certified Moderator",
			Icon:        "https://cdn.discordapp.com/badge-icons/fee1624003e2fee35cb398e125dc479b.png",
		},
	}

	for flag, badge := range flagMap {
		if publicFlags&flag != 0 {
			badges = append(badges, badge)
		}
	}

	return badges
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