package models

import (
	"time"
)

// Badge represents the badge model
type Badge struct {
	ID                string                `json:"id" gorm:"primaryKey;type:varchar(50);default:gen_random_uuid()"`
	Name              string                `json:"name" gorm:"uniqueIndex;not null;size:255"`
	Description       string                `json:"description" gorm:"not null;type:text"`
	Category          BadgeCategory         `json:"category" gorm:"not null"`
	Rarity            BadgeRarity           `json:"rarity" gorm:"default:'COMMON'"`
	IconType          BadgeIconType         `json:"icon_type" gorm:"default:'EMOJI'"`
	IconValue         string                `json:"icon_value" gorm:"not null;size:255"`
	IconColor         *string               `json:"icon_color,omitempty" gorm:"size:20"`
	BorderColor       *string               `json:"border_color,omitempty" gorm:"size:20"`
	GradientFrom      *string               `json:"gradient_from,omitempty" gorm:"size:20"`
	GradientTo        *string               `json:"gradient_to,omitempty" gorm:"size:20"`
	GlowColor         *string               `json:"glow_color,omitempty" gorm:"size:20"`
	RequirementType   RequirementType       `json:"requirement_type" gorm:"not null"`
	RequirementData   string                `json:"requirement_data" gorm:"not null;type:json"`
	IsSecret          bool                  `json:"is_secret" gorm:"default:false"`
	IsLimited         bool                  `json:"is_limited" gorm:"default:false"`
	MaxEarners        *int                  `json:"max_earners,omitempty"`
	PointsAwarded     int                   `json:"points_awarded" gorm:"default:0"`
	ExperienceAwarded int                   `json:"experience_awarded" gorm:"default:0"`
	DisplayOrder      int                   `json:"display_order" gorm:"default:0"`
	IsActive          bool                  `json:"is_active" gorm:"default:true"`
	Version           string                `json:"version" gorm:"default:'1.0.0';size:20"`
	Tags              *string               `json:"tags,omitempty" gorm:"type:json"`
	TotalEarned       int                   `json:"total_earned" gorm:"default:0"`
	EarnedToday       int                   `json:"earned_today" gorm:"default:0"`
	EarnedThisWeek    int                   `json:"earned_this_week" gorm:"default:0"`
	CreatedAt         time.Time             `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time             `json:"updated_at" gorm:"autoUpdateTime"`
	ValidFrom         *time.Time            `json:"valid_from,omitempty"`
	ValidUntil        *time.Time            `json:"valid_until,omitempty"`

	// Relationships
	CollectionItems []BadgeCollectionItem `json:"collection_items,omitempty" gorm:"foreignKey:BadgeID"`
	BadgeEvents     []BadgeEvent          `json:"badge_events,omitempty" gorm:"foreignKey:BadgeID"`
	UserBadges      []UserBadge           `json:"user_badges,omitempty" gorm:"foreignKey:BadgeID"`
}

// BadgeCategory enum
type BadgeCategory string

const (
	BadgeCategoryMilestone   BadgeCategory = "MILESTONE"
	BadgeCategoryEngagement  BadgeCategory = "ENGAGEMENT"
	BadgeCategoryContent     BadgeCategory = "CONTENT"
	BadgeCategorySocial      BadgeCategory = "SOCIAL"
	BadgeCategoryTimeBased   BadgeCategory = "TIME_BASED"
	BadgeCategoryAchievement BadgeCategory = "ACHIEVEMENT"
	BadgeCategorySeasonal    BadgeCategory = "SEASONAL"
	BadgeCategoryStaff       BadgeCategory = "STAFF"
	BadgeCategoryPremium     BadgeCategory = "PREMIUM"
	BadgeCategoryCommunity   BadgeCategory = "COMMUNITY"
	BadgeCategoryRare        BadgeCategory = "RARE"
)

// BadgeRarity enum
type BadgeRarity string

const (
	BadgeRarityCommon    BadgeRarity = "COMMON"
	BadgeRarityUncommon  BadgeRarity = "UNCOMMON"
	BadgeRarityRare      BadgeRarity = "RARE"
	BadgeRarityEpic      BadgeRarity = "EPIC"
	BadgeRarityLegendary BadgeRarity = "LEGENDARY"
	BadgeRarityMythic    BadgeRarity = "MYTHIC"
)

// BadgeIconType enum
type BadgeIconType string

const (
	BadgeIconTypeEmoji       BadgeIconType = "EMOJI"
	BadgeIconTypeLucide      BadgeIconType = "LUCIDE"
	BadgeIconTypeCustomImage BadgeIconType = "CUSTOM_IMAGE"
	BadgeIconTypeSVG         BadgeIconType = "SVG"
)

// RequirementType enum
type RequirementType string

const (
	RequirementTypeProfileViews  RequirementType = "PROFILE_VIEWS"
	RequirementTypeLinkClicks    RequirementType = "LINK_CLICKS"
	RequirementTypeFollowerCount RequirementType = "FOLLOWER_COUNT"
	RequirementTypeAccountAge    RequirementType = "ACCOUNT_AGE"
	RequirementTypeLinkCount     RequirementType = "LINK_COUNT"
	RequirementTypeUploadCount   RequirementType = "UPLOAD_COUNT"
	RequirementTypeStreakDays    RequirementType = "STREAK_DAYS"
	RequirementTypeDiscordBoost  RequirementType = "DISCORD_BOOST"
	RequirementTypePremiumDays   RequirementType = "PREMIUM_DAYS"
	RequirementTypeCustomMetric  RequirementType = "CUSTOM_METRIC"
	RequirementTypeManual        RequirementType = "MANUAL"
	RequirementTypeEvent         RequirementType = "EVENT"
	RequirementTypeReferral      RequirementType = "REFERRAL"
	RequirementTypeSocialShare   RequirementType = "SOCIAL_SHARE"
)

// UserBadge represents user badge progress and achievements
type UserBadge struct {
	ID             string               `json:"id" gorm:"primaryKey;type:varchar(50);default:gen_random_uuid()"`
	UserID         uint                 `json:"user_id" gorm:"not null;index"`
	BadgeID        string               `json:"badge_id" gorm:"not null;index;size:50"`
	IsEarned       bool                 `json:"is_earned" gorm:"default:false"`
	Progress       float64              `json:"progress" gorm:"default:0.0"`
	CurrentValue   float64              `json:"current_value" gorm:"default:0.0"`
	TargetValue    float64              `json:"target_value" gorm:"not null"`
	EarnedAt       *time.Time           `json:"earned_at,omitempty"`
	EarnMethod     *EarnMethod          `json:"earn_method,omitempty"`
	EarnContext    *string              `json:"earn_context,omitempty" gorm:"type:json"`
	IsVisible      bool                 `json:"is_visible" gorm:"default:true"`
	IsShowcased    bool                 `json:"is_showcased" gorm:"default:false"`
	ShowcaseOrder  *int                 `json:"showcase_order,omitempty"`
	IsNotified     bool                 `json:"is_notified" gorm:"default:false"`
	NotifiedAt     *time.Time           `json:"notified_at,omitempty"`
	CreatedAt      time.Time            `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt      time.Time            `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	User           User                 `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Badge          Badge                `json:"badge,omitempty" gorm:"foreignKey:BadgeID"`
	ProgressEvents []BadgeProgressEvent `json:"progress_events,omitempty" gorm:"foreignKey:UserBadgeID"`
}

// EarnMethod enum
type EarnMethod string

const (
	EarnMethodAutomatic   EarnMethod = "AUTOMATIC"
	EarnMethodManual      EarnMethod = "MANUAL"
	EarnMethodImport      EarnMethod = "IMPORT"
	EarnMethodEvent       EarnMethod = "EVENT"
	EarnMethodAchievement EarnMethod = "ACHIEVEMENT"
)

// BadgeProgressEvent represents badge progress events
type BadgeProgressEvent struct {
	ID               string            `json:"id" gorm:"primaryKey;type:varchar(50);default:gen_random_uuid()"`
	UserBadgeID      string            `json:"user_badge_id" gorm:"not null;index;size:50"`
	PreviousProgress float64           `json:"previous_progress" gorm:"not null"`
	NewProgress      float64           `json:"new_progress" gorm:"not null"`
	DeltaValue       float64           `json:"delta_value" gorm:"not null"`
	EventType        ProgressEventType `json:"event_type" gorm:"not null"`
	EventData        *string           `json:"event_data,omitempty" gorm:"type:json"`
	Source           *string           `json:"source,omitempty" gorm:"size:100"`
	Metadata         *string           `json:"metadata,omitempty" gorm:"type:json"`
	CreatedAt        time.Time         `json:"created_at" gorm:"autoCreateTime"`

	// Relationships
	UserBadge UserBadge `json:"user_badge,omitempty" gorm:"foreignKey:UserBadgeID"`
}

// ProgressEventType enum
type ProgressEventType string

const (
	ProgressEventTypeMetricUpdate ProgressEventType = "METRIC_UPDATE"
	ProgressEventTypeMilestone    ProgressEventType = "MILESTONE"
	ProgressEventTypeBonus        ProgressEventType = "BONUS"
	ProgressEventTypeDecay        ProgressEventType = "DECAY"
	ProgressEventTypeReset        ProgressEventType = "RESET"
)

// BadgeEvent represents badge events
type BadgeEvent struct {
	ID        string         `json:"id" gorm:"primaryKey;type:varchar(50);default:gen_random_uuid()"`
	BadgeID   string         `json:"badge_id" gorm:"not null;index;size:50"`
	UserID    *uint          `json:"user_id,omitempty" gorm:"index"`
	EventType BadgeEventType `json:"event_type" gorm:"not null"`
	EventData string         `json:"event_data" gorm:"not null;type:json"`
	SessionID *string        `json:"session_id,omitempty" gorm:"size:255"`
	IPAddress *string        `json:"ip_address,omitempty" gorm:"size:45"`
	UserAgent *string        `json:"user_agent,omitempty" gorm:"type:text"`
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`

	// Relationships
	Badge Badge `json:"badge,omitempty" gorm:"foreignKey:BadgeID"`
	User  *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// BadgeEventType enum
type BadgeEventType string

const (
	BadgeEventTypeEarned     BadgeEventType = "EARNED"
	BadgeEventTypeProgress   BadgeEventType = "PROGRESS"
	BadgeEventTypeViewed     BadgeEventType = "VIEWED"
	BadgeEventTypeShowcased  BadgeEventType = "SHOWCASED"
	BadgeEventTypeHidden     BadgeEventType = "HIDDEN"
	BadgeEventTypeShared     BadgeEventType = "SHARED"
)

// BadgeCollection represents badge collections
type BadgeCollection struct {
	ID                string                `json:"id" gorm:"primaryKey;type:varchar(50);default:gen_random_uuid()"`
	Name              string                `json:"name" gorm:"uniqueIndex;not null;size:255"`
	Description       string                `json:"description" gorm:"not null;type:text"`
	IconValue         string                `json:"icon_value" gorm:"not null;size:255"`
	CompletionBadgeID *string               `json:"completion_badge_id,omitempty" gorm:"size:50"`
	PointsBonus       int                   `json:"points_bonus" gorm:"default:0"`
	DisplayOrder      int                   `json:"display_order" gorm:"default:0"`
	IsActive          bool                  `json:"is_active" gorm:"default:true"`
	CreatedAt         time.Time             `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time             `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	Badges []BadgeCollectionItem `json:"badges,omitempty" gorm:"foreignKey:CollectionID"`
}

// BadgeCollectionItem represents items in badge collections
type BadgeCollectionItem struct {
	ID           string          `json:"id" gorm:"primaryKey;type:varchar(50);default:gen_random_uuid()"`
	CollectionID string          `json:"collection_id" gorm:"not null;index;size:50"`
	BadgeID      string          `json:"badge_id" gorm:"not null;index;size:50"`
	Order        int             `json:"order" gorm:"default:0"`
	IsRequired   bool            `json:"is_required" gorm:"default:true"`

	// Relationships
	Collection BadgeCollection `json:"collection,omitempty" gorm:"foreignKey:CollectionID"`
	Badge      Badge           `json:"badge,omitempty" gorm:"foreignKey:BadgeID"`
}

// TableName specifies the table name for Badge
func (Badge) TableName() string {
	return "badges"
}

// TableName specifies the table name for UserBadge
func (UserBadge) TableName() string {
	return "user_badges"
}

// TableName specifies the table name for BadgeProgressEvent
func (BadgeProgressEvent) TableName() string {
	return "badge_progress_events"
}

// TableName specifies the table name for BadgeEvent
func (BadgeEvent) TableName() string {
	return "badge_events"
}

// TableName specifies the table name for BadgeCollection
func (BadgeCollection) TableName() string {
	return "badge_collections"
}

// TableName specifies the table name for BadgeCollectionItem
func (BadgeCollectionItem) TableName() string {
	return "badge_collection_items"
}