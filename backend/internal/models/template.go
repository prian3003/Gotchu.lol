package models

import (
	"time"
)

// Template represents template model
type Template struct {
	ID                 uint             `json:"id" gorm:"primaryKey;autoIncrement"`
	Name               string           `json:"name" gorm:"not null;size:255"`
	Description        *string          `json:"description,omitempty" gorm:"type:text"`
	Category           TemplateCategory `json:"category" gorm:"default:'OTHER'"`
	Status             TemplateStatus   `json:"status" gorm:"default:'DRAFT'"`
	IsPublic           bool             `json:"is_public" gorm:"default:true"`
	IsFeatured         bool             `json:"is_featured" gorm:"default:false"`
	IsPremiumOnly      bool             `json:"is_premium_only" gorm:"default:false"`
	CreatorID          uint             `json:"creator_id" gorm:"not null;index"`
	PreviewImageURL    *string          `json:"preview_image_url,omitempty" gorm:"size:500"`
	ThumbnailURL       *string          `json:"thumbnail_url,omitempty" gorm:"size:500"`
	BackgroundURL      *string          `json:"background_url,omitempty" gorm:"size:500"`
	AudioURL           *string          `json:"audio_url,omitempty" gorm:"size:500"`
	CustomCursorURL    *string          `json:"custom_cursor_url,omitempty" gorm:"size:500"`
	SuggestedAvatarURL *string          `json:"suggested_avatar_url,omitempty" gorm:"size:500"`
	ProfileOpacity     *int             `json:"profile_opacity,omitempty"`
	ProfileBlur        *int             `json:"profile_blur,omitempty"`
	VolumeLevel        *int             `json:"volume_level,omitempty"`
	BackgroundEffect   *string          `json:"background_effect,omitempty" gorm:"size:50"`
	UsernameEffect     *string          `json:"username_effect,omitempty" gorm:"size:50"`
	GlowUsername       *bool            `json:"glow_username,omitempty"`
	GlowSocials        *bool            `json:"glow_socials,omitempty"`
	GlowBadges         *bool            `json:"glow_badges,omitempty"`
	AnimatedTitle      *bool            `json:"animated_title,omitempty"`
	AccentColor        *string          `json:"accent_color,omitempty" gorm:"size:20"`
	TextColor          *string          `json:"text_color,omitempty" gorm:"size:20"`
	BackgroundColor    *string          `json:"background_color,omitempty" gorm:"size:20"`
	IconColor          *string          `json:"icon_color,omitempty" gorm:"size:20"`
	PrimaryColor       *string          `json:"primary_color,omitempty" gorm:"size:20"`
	SecondaryColor     *string          `json:"secondary_color,omitempty" gorm:"size:20"`
	MonochromeIcons    *bool            `json:"monochrome_icons,omitempty"`
	SwapBoxColors      *bool            `json:"swap_box_colors,omitempty"`
	VolumeControl      *bool            `json:"volume_control,omitempty"`
	ProfileGradient    *bool            `json:"profile_gradient,omitempty"`
	Downloads          int              `json:"downloads" gorm:"default:0"`
	Views              int              `json:"views" gorm:"default:0"`
	Likes              int              `json:"likes" gorm:"default:0"`
	Reports            int              `json:"reports" gorm:"default:0"`
	Tags               *string          `json:"tags,omitempty" gorm:"type:json"`
	Difficulty         *string          `json:"difficulty,omitempty" gorm:"size:20"`
	EstimatedSetupTime *int             `json:"estimated_setup_time,omitempty"`
	ReviewNotes        *string          `json:"review_notes,omitempty" gorm:"type:text"`
	ReviewedByID       *uint            `json:"reviewed_by_id,omitempty"`
	ReviewedAt         *time.Time       `json:"reviewed_at,omitempty"`
	Version            string           `json:"version" gorm:"default:'1.0.0';size:20"`
	ParentTemplateID   *uint            `json:"parent_template_id,omitempty"`
	CreatedAt          time.Time        `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt          time.Time        `json:"updated_at" gorm:"autoUpdateTime"`
	PublishedAt        *time.Time       `json:"published_at,omitempty"`

	// Relationships
	Creator         User               `json:"creator,omitempty" gorm:"foreignKey:CreatorID"`
	ReviewedBy      *User              `json:"reviewed_by,omitempty" gorm:"foreignKey:ReviewedByID"`
	ParentTemplate  *Template          `json:"parent_template,omitempty" gorm:"foreignKey:ParentTemplateID"`
	Variations      []Template         `json:"variations,omitempty" gorm:"foreignKey:ParentTemplateID"`
	TemplateAssets  []TemplateAsset    `json:"template_assets,omitempty" gorm:"foreignKey:TemplateID;constraint:OnDelete:CASCADE"`
	TemplateLinks   []TemplateLink     `json:"template_links,omitempty" gorm:"foreignKey:TemplateID;constraint:OnDelete:CASCADE"`
	TemplateLikes   []TemplateLike     `json:"template_likes,omitempty" gorm:"foreignKey:TemplateID;constraint:OnDelete:CASCADE"`
	TemplateReports []TemplateReport   `json:"template_reports,omitempty" gorm:"foreignKey:TemplateID;constraint:OnDelete:CASCADE"`
}

// TemplateCategory enum
type TemplateCategory string

const (
	TemplateCategoryMinimal      TemplateCategory = "MINIMAL"
	TemplateCategoryProfessional TemplateCategory = "PROFESSIONAL"
	TemplateCategoryCreative     TemplateCategory = "CREATIVE"
	TemplateCategoryGaming       TemplateCategory = "GAMING"
	TemplateCategoryMusic        TemplateCategory = "MUSIC"
	TemplateCategoryBusiness     TemplateCategory = "BUSINESS"
	TemplateCategoryPersonal     TemplateCategory = "PERSONAL"
	TemplateCategoryCommunity    TemplateCategory = "COMMUNITY"
	TemplateCategorySeasonal     TemplateCategory = "SEASONAL"
	TemplateCategoryOther        TemplateCategory = "OTHER"
)

// TemplateStatus enum
type TemplateStatus string

const (
	TemplateStatusDraft         TemplateStatus = "DRAFT"
	TemplateStatusPendingReview TemplateStatus = "PENDING_REVIEW"
	TemplateStatusApproved      TemplateStatus = "APPROVED"
	TemplateStatusRejected      TemplateStatus = "REJECTED"
	TemplateStatusFeatured      TemplateStatus = "FEATURED"
	TemplateStatusArchived      TemplateStatus = "ARCHIVED"
)

// TemplateLink represents template links
type TemplateLink struct {
	ID            uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	TemplateID    uint      `json:"template_id" gorm:"not null;index"`
	Title         string    `json:"title" gorm:"not null;size:255"`
	URL           *string   `json:"url,omitempty" gorm:"size:1000"`
	Description   *string   `json:"description,omitempty" gorm:"type:text"`
	Type          LinkType  `json:"type" gorm:"default:'DEFAULT'"`
	Icon          *string   `json:"icon,omitempty" gorm:"size:100"`
	Color         *string   `json:"color,omitempty" gorm:"size:20"`
	Order         int       `json:"order" gorm:"default:0"`
	IsPlaceholder bool      `json:"is_placeholder" gorm:"default:false"`
	CreatedAt     time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	Template Template `json:"template,omitempty" gorm:"foreignKey:TemplateID;constraint:OnDelete:CASCADE"`
}

// TemplateAsset represents template assets
type TemplateAsset struct {
	ID           uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	TemplateID   uint      `json:"template_id" gorm:"not null;index"`
	AssetType    string    `json:"asset_type" gorm:"not null;size:50;index"`
	OriginalURL  string    `json:"original_url" gorm:"not null;size:500"`
	ProcessedURL *string   `json:"processed_url,omitempty" gorm:"size:500"`
	FileSize     *int64    `json:"file_size,omitempty"`
	MimeType     *string   `json:"mime_type,omitempty" gorm:"size:100"`
	Metadata     *string   `json:"metadata,omitempty" gorm:"type:json"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`

	// Relationships
	Template Template `json:"template,omitempty" gorm:"foreignKey:TemplateID;constraint:OnDelete:CASCADE"`
}

// TemplateLike represents template likes
type TemplateLike struct {
	ID         uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID     uint      `json:"user_id" gorm:"not null;index"`
	TemplateID uint      `json:"template_id" gorm:"not null;index"`
	CreatedAt  time.Time `json:"created_at" gorm:"autoCreateTime"`

	// Relationships
	User     User     `json:"user,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Template Template `json:"template,omitempty" gorm:"foreignKey:TemplateID;constraint:OnDelete:CASCADE"`
}

// TemplateReport represents template reports
type TemplateReport struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID      uint      `json:"user_id" gorm:"not null;index"`
	TemplateID  uint      `json:"template_id" gorm:"not null;index"`
	Reason      string    `json:"reason" gorm:"not null;size:100"`
	Description *string   `json:"description,omitempty" gorm:"type:text"`
	Status      string    `json:"status" gorm:"default:'pending';size:20;index"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`

	// Relationships
	User     User     `json:"user,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Template Template `json:"template,omitempty" gorm:"foreignKey:TemplateID;constraint:OnDelete:CASCADE"`
}

// TableName specifies the table name for Template
func (Template) TableName() string {
	return "templates"
}

// TableName specifies the table name for TemplateLink
func (TemplateLink) TableName() string {
	return "template_links"
}

// TableName specifies the table name for TemplateAsset
func (TemplateAsset) TableName() string {
	return "template_assets"
}

// TableName specifies the table name for TemplateLike
func (TemplateLike) TableName() string {
	return "template_likes"
}

// TableName specifies the table name for TemplateReport
func (TemplateReport) TableName() string {
	return "template_reports"
}