package models

import (
	"time"
	"gorm.io/gorm"
)

// User represents the user model
type User struct {
	ID                      uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	SupabaseID              *string   `json:"supabase_id,omitempty" gorm:"uniqueIndex;size:255"`
	Username                string    `json:"username" gorm:"uniqueIndex;not null;size:50"`
	Alias                   *string   `json:"alias,omitempty" gorm:"uniqueIndex;size:50"`
	Email                   *string   `json:"email,omitempty" gorm:"uniqueIndex;size:255"`
	EmailVerified           bool      `json:"email_verified" gorm:"default:false"`
	EmailVerifiedAt         *time.Time `json:"email_verified_at,omitempty"`
	DisplayName             *string   `json:"display_name,omitempty" gorm:"size:100"`
	Bio                     *string   `json:"bio,omitempty" gorm:"type:text"`
	AvatarURL               *string   `json:"avatar_url,omitempty" gorm:"size:500"`
	Location                *string   `json:"location,omitempty" gorm:"size:100"`
	IsVerified              bool      `json:"is_verified" gorm:"default:false"`
	Plan                    string    `json:"plan" gorm:"default:'free';size:20"`
	IsActive                bool      `json:"is_active" gorm:"default:true"`
	DiscordID               *string   `json:"discord_id,omitempty" gorm:"uniqueIndex;size:50"`
	DiscordUsername         *string   `json:"discord_username,omitempty" gorm:"size:100"`
	DiscordAvatar           *string   `json:"discord_avatar,omitempty" gorm:"size:100"`
	TwitterURL              *string   `json:"twitter_url,omitempty" gorm:"size:500"`
	GithubURL               *string   `json:"github_url,omitempty" gorm:"size:500"`
	InstagramURL            *string   `json:"instagram_url,omitempty" gorm:"size:500"`
	LinkedinURL             *string   `json:"linkedin_url,omitempty" gorm:"size:500"`
	WebsiteURL              *string   `json:"website_url,omitempty" gorm:"size:500"`
	ProfileViews            int       `json:"profile_views" gorm:"default:0"`
	TotalClicks             int       `json:"total_clicks" gorm:"default:0"`
	Theme                   string    `json:"theme" gorm:"default:'dark';size:20"`
	IsPublic                bool      `json:"is_public" gorm:"default:true"`
	ShowAnalytics           bool      `json:"show_analytics" gorm:"default:true"`
	BackgroundURL           *string   `json:"background_url,omitempty" gorm:"size:500"`
	AudioURL                *string   `json:"audio_url,omitempty" gorm:"size:500"`
	CustomCursorURL         *string   `json:"custom_cursor_url,omitempty" gorm:"size:500"`
	Description             *string   `json:"description,omitempty" gorm:"type:text"`
	DiscordPresence         bool      `json:"discord_presence" gorm:"default:false"`
	ProfileOpacity          int       `json:"profile_opacity" gorm:"default:90"`
	ProfileBlur             int       `json:"profile_blur" gorm:"default:0"`
	VolumeLevel             int       `json:"volume_level" gorm:"default:50"`
	BackgroundEffect        *string   `json:"background_effect,omitempty" gorm:"size:50"`
	UsernameEffect          *string   `json:"username_effect,omitempty" gorm:"size:50"`
	GlowUsername            bool      `json:"glow_username" gorm:"default:false"`
	GlowSocials             bool      `json:"glow_socials" gorm:"default:false"`
	GlowBadges              bool      `json:"glow_badges" gorm:"default:false"`
	ShowBadges              bool      `json:"show_badges" gorm:"default:true"`
	AccentColor             string    `json:"accent_color" gorm:"default:'#1bbd9a';size:20"`
	TextColor               string    `json:"text_color" gorm:"default:'#FFFFFF';size:20"`
	BackgroundColor         string    `json:"background_color" gorm:"default:'#0F0F23';size:20"`
	IconColor               string    `json:"icon_color" gorm:"default:'#FFFFFF';size:20"`
	PrimaryColor            string    `json:"primary_color" gorm:"default:'#1bbd9a';size:20"`
	SecondaryColor          string    `json:"secondary_color" gorm:"default:'#EC4899';size:20"`
	MonochromeIcons         bool      `json:"monochrome_icons" gorm:"default:false"`
	AnimatedTitle           bool      `json:"animated_title" gorm:"default:false"`
	SwapBoxColors           bool      `json:"swap_box_colors" gorm:"default:false"`
	VolumeControl           bool      `json:"volume_control" gorm:"default:true"`
	UseDiscordAvatar        bool      `json:"use_discord_avatar" gorm:"default:false"`
	DiscordAvatarDecoration bool      `json:"discord_avatar_decoration" gorm:"default:false"`
	ProfileGradient         bool      `json:"profile_gradient" gorm:"default:true"`
	TextFont                *string   `json:"text_font,omitempty" gorm:"size:100"`
	CurrentTemplateID       *uint     `json:"current_template_id,omitempty"`
	LastLoginAt             *time.Time `json:"last_login_at,omitempty"`
	
	// Role and Badge Related Fields
	Role                    string    `json:"role" gorm:"default:'user';size:20"` // user, helper, moderator, admin, staff
	IsStaff                 bool      `json:"is_staff" gorm:"default:false"`
	IsHelper                bool      `json:"is_helper" gorm:"default:false"`
	IsModerator             bool      `json:"is_moderator" gorm:"default:false"`
	VerifiedAt              *time.Time `json:"verified_at,omitempty"`
	
	// Donation and Support Fields
	TotalDonated            float64   `json:"total_donated" gorm:"default:0"`
	IsBooster               bool      `json:"is_booster" gorm:"default:false"` // Discord server booster
	BoostingSince           *time.Time `json:"boosting_since,omitempty"`
	MfaEnabled              bool      `json:"mfa_enabled" gorm:"default:false"`
	MfaSecret               *string   `json:"mfa_secret,omitempty" gorm:"size:255"`
	MfaType                 *string   `json:"mfa_type,omitempty" gorm:"size:20"`
	DiscordLoginEnabled     bool      `json:"discord_login_enabled" gorm:"default:false"`
	CreatedAt               time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt               time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	Links                   []Link                   `json:"links,omitempty" gorm:"foreignKey:UserID"`
	Files                   []File                   `json:"files,omitempty" gorm:"foreignKey:UserID"`
	Activities              []Activity               `json:"activities,omitempty" gorm:"foreignKey:UserID"`
	ProfileViewEvents       []ProfileView            `json:"profile_view_events,omitempty" gorm:"foreignKey:UserID"`
	ViewedProfiles          []ProfileView            `json:"viewed_profiles,omitempty" gorm:"foreignKey:ViewerUserID"`
	AnalyticsEvents         []AnalyticsEvent         `json:"analytics_events,omitempty" gorm:"foreignKey:UserID"`
	UserSessions            []UserSession            `json:"user_sessions,omitempty" gorm:"foreignKey:UserID"`
	Following               []Follow                 `json:"following,omitempty" gorm:"foreignKey:FollowerID"`
	Followers               []Follow                 `json:"followers,omitempty" gorm:"foreignKey:FollowingID"`
	CustomDomains           []CustomDomain           `json:"custom_domains,omitempty" gorm:"foreignKey:UserID"`
	CreatedTemplates        []Template               `json:"created_templates,omitempty" gorm:"foreignKey:CreatorID"`
	ReviewedTemplates       []Template               `json:"reviewed_templates,omitempty" gorm:"foreignKey:ReviewedByID"`
	TemplateLikes           []TemplateLike           `json:"template_likes,omitempty" gorm:"foreignKey:UserID"`
	TemplateReports         []TemplateReport         `json:"template_reports,omitempty" gorm:"foreignKey:UserID"`
	UserBadges              []UserBadge              `json:"user_badges,omitempty" gorm:"foreignKey:UserID"`
	BadgeEvents             []BadgeEvent             `json:"badge_events,omitempty" gorm:"foreignKey:UserID"`
}

// UserAuth represents authentication data (separate from user profile)
type UserAuth struct {
	ID           uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID       uint      `json:"user_id" gorm:"not null;index"`
	PasswordHash string    `json:"-" gorm:"not null;size:255"`
	Salt         string    `json:"-" gorm:"not null;size:255"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// UserSession represents user sessions
type UserSession struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint      `json:"user_id" gorm:"not null;index"`
	SessionID string    `json:"session_id" gorm:"uniqueIndex;not null;size:255"`
	IPAddress *string   `json:"ip_address,omitempty" gorm:"size:45"`
	UserAgent *string   `json:"user_agent,omitempty" gorm:"type:text"`
	StartTime time.Time `json:"start_time" gorm:"autoCreateTime"`
	EndTime   *time.Time `json:"end_time,omitempty"`
	Duration  *int      `json:"duration,omitempty"`
	PageViews int       `json:"page_views" gorm:"default:0"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// Link represents user links
type Link struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Title       string    `json:"title" gorm:"not null;size:255"`
	URL         *string   `json:"url,omitempty" gorm:"size:1000"`
	Description *string   `json:"description,omitempty" gorm:"type:text"`
	Clicks      int       `json:"clicks" gorm:"default:0"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	Type        LinkType  `json:"type" gorm:"default:'DEFAULT'"`
	Icon        *string   `json:"icon,omitempty" gorm:"size:100"`
	ImageURL    *string   `json:"image_url,omitempty" gorm:"size:500"`
	Color       *string   `json:"color,omitempty" gorm:"size:20"`
	Order       int       `json:"order" gorm:"default:0"`
	UserID      uint      `json:"user_id" gorm:"not null;index"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	User       User        `json:"user,omitempty" gorm:"foreignKey:UserID"`
	LinkClicks []LinkClick `json:"link_clicks,omitempty" gorm:"foreignKey:LinkID"`
}

// LinkType enum
type LinkType string

const (
	LinkTypeDefault     LinkType = "DEFAULT"
	LinkTypeHeader      LinkType = "HEADER"
	LinkTypeProduct     LinkType = "PRODUCT"
	LinkTypeService     LinkType = "SERVICE"
	LinkTypeMarketplace LinkType = "MARKETPLACE"
)

// LinkClick represents link click analytics
type LinkClick struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	LinkID    uint      `json:"link_id" gorm:"not null;index"`
	IPAddress *string   `json:"ip_address,omitempty" gorm:"size:45"`
	UserAgent *string   `json:"user_agent,omitempty" gorm:"type:text"`
	Referer   *string   `json:"referer,omitempty" gorm:"size:500"`
	Country   *string   `json:"country,omitempty" gorm:"size:100"`
	City      *string   `json:"city,omitempty" gorm:"size:100"`
	Device    *string   `json:"device,omitempty" gorm:"size:100"`
	Browser   *string   `json:"browser,omitempty" gorm:"size:100"`
	SessionID *string   `json:"session_id,omitempty" gorm:"size:255"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`

	// Relationships
	Link Link `json:"link,omitempty" gorm:"foreignKey:LinkID"`
}

// ProfileView represents profile view analytics
type ProfileView struct {
	ID                uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID            uint      `json:"user_id" gorm:"not null;index"`
	ViewerUserID      *uint     `json:"viewer_user_id,omitempty" gorm:"index"`
	ViewerFingerprint *string   `json:"viewer_fingerprint,omitempty" gorm:"size:255;index"`
	IPAddress         *string   `json:"ip_address,omitempty" gorm:"size:45;index"`
	UserAgent         *string   `json:"user_agent,omitempty" gorm:"type:text"`
	Referer           *string   `json:"referer,omitempty" gorm:"size:500"`
	Country           *string   `json:"country,omitempty" gorm:"size:100"`
	City              *string   `json:"city,omitempty" gorm:"size:100"`
	Device            *string   `json:"device,omitempty" gorm:"size:100"`
	Browser           *string   `json:"browser,omitempty" gorm:"size:100"`
	SessionID         *string   `json:"session_id,omitempty" gorm:"size:255;index"`
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime;index"`

	// Relationships
	User       User  `json:"user,omitempty" gorm:"foreignKey:UserID"`
	ViewerUser *User `json:"viewer_user,omitempty" gorm:"foreignKey:ViewerUserID"`
}

// Activity represents user activity log
type Activity struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID      uint      `json:"user_id" gorm:"not null;index"`
	Type        string    `json:"type" gorm:"not null;size:50"`
	Description string    `json:"description" gorm:"not null;type:text"`
	Metadata    *string   `json:"metadata,omitempty" gorm:"type:json"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime;index"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// AnalyticsEvent represents analytics events
type AnalyticsEvent struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint      `json:"user_id" gorm:"not null;index"`
	EventType string    `json:"event_type" gorm:"not null;size:100;index"`
	EventData *string   `json:"event_data,omitempty" gorm:"type:json"`
	IPAddress *string   `json:"ip_address,omitempty" gorm:"size:45"`
	UserAgent *string   `json:"user_agent,omitempty" gorm:"type:text"`
	SessionID *string   `json:"session_id,omitempty" gorm:"size:255;index"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime;index"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// Follow represents user following relationships
type Follow struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	FollowerID  uint      `json:"follower_id" gorm:"not null;index"`
	FollowingID uint      `json:"following_id" gorm:"not null;index"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`

	// Relationships
	Follower  User `json:"follower,omitempty" gorm:"foreignKey:FollowerID"`
	Following User `json:"following,omitempty" gorm:"foreignKey:FollowingID"`
}

// CustomDomain represents custom domains
type CustomDomain struct {
	ID                uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID            uint      `json:"user_id" gorm:"not null;index"`
	Domain            string    `json:"domain" gorm:"uniqueIndex;not null;size:255"`
	IsVerified        bool      `json:"is_verified" gorm:"default:false"`
	IsPrimary         bool      `json:"is_primary" gorm:"default:false"`
	VerificationToken string    `json:"verification_token" gorm:"not null;size:255"`
	SSLStatus         string    `json:"ssl_status" gorm:"default:'pending';size:20"`
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// File represents uploaded files
type File struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID      uint      `json:"user_id" gorm:"not null;index"`
	Filename    string    `json:"filename" gorm:"not null;size:255"`
	FileSize    int64     `json:"file_size" gorm:"not null"`
	MimeType    string    `json:"mime_type" gorm:"not null;size:100"`
	StorageKey  string    `json:"storage_key" gorm:"uniqueIndex;not null;size:255"`
	URL         string    `json:"url" gorm:"not null;size:500"`
	DownloadURL *string   `json:"download_url,omitempty" gorm:"size:500"`
	IsPublic    bool      `json:"is_public" gorm:"default:true"`
	Downloads   int       `json:"downloads" gorm:"default:0"`
	Type        FileType  `json:"type" gorm:"default:'OTHER'"`
	Metadata    *string   `json:"metadata,omitempty" gorm:"type:json"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// FileType enum
type FileType string

const (
	FileTypeAudio      FileType = "AUDIO"
	FileTypeBackground FileType = "BACKGROUND"
	FileTypeAvatar     FileType = "AVATAR"
	FileTypeCursor     FileType = "CURSOR"
	FileTypeCover      FileType = "COVER"
	FileTypeOther      FileType = "OTHER"
)

// BeforeCreate hook for User
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.DisplayName == nil && u.Username != "" {
		u.DisplayName = &u.Username
	}
	return nil
}

// TableName specifies the table name for User
func (User) TableName() string {
	return "users"
}

// TableName specifies the table name for UserAuth
func (UserAuth) TableName() string {
	return "user_auth"
}

// TableName specifies the table name for UserSession
func (UserSession) TableName() string {
	return "user_sessions"
}

// TableName specifies the table name for ProfileView
func (ProfileView) TableName() string {
	return "profile_views"
}

