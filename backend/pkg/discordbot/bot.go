package discordbot

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

// DiscordBotService manages the Discord bot and presence tracking
type DiscordBotService struct {
	Token     string
	GuildID   string
	db        *gorm.DB
	conn      *websocket.Conn
	heartbeat time.Duration
	sequence  *int
	sessionID string
	presences map[string]*PresenceData
	mutex     sync.RWMutex
	running   bool
	stopChan  chan bool
}

// PresenceData represents Discord user presence information
type PresenceData struct {
	UserID     string     `json:"user_id" gorm:"primaryKey"`
	Status     string     `json:"status"`     // online, idle, dnd, offline
	Activities []Activity `json:"activities" gorm:"serializer:json"`
	LastSeen   time.Time  `json:"last_seen"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

// Activity represents Discord user activity
type Activity struct {
	Name    string `json:"name"`
	Type    int    `json:"type"` // 0=playing, 1=streaming, 2=listening, 3=watching, 4=custom, 5=competing
	URL     string `json:"url,omitempty"`
	Details string `json:"details,omitempty"` // For Spotify: track name
	State   string `json:"state,omitempty"`   // For Spotify: artist name
}

// Gateway payload structure
type GatewayPayload struct {
	Op int             `json:"op"`
	D  json.RawMessage `json:"d"`
	S  *int            `json:"s"`
	T  *string         `json:"t"`
}

// Identify payload for authentication
type IdentifyPayload struct {
	Token   string `json:"token"`
	Intents int    `json:"intents"`
	Properties struct {
		OS      string `json:"$os"`
		Browser string `json:"$browser"`
		Device  string `json:"$device"`
	} `json:"properties"`
}

// Ready event data
type ReadyEvent struct {
	SessionID string `json:"session_id"`
	User      struct {
		ID string `json:"id"`
	} `json:"user"`
}

// Presence update event
type PresenceUpdateEvent struct {
	User struct {
		ID string `json:"id"`
	} `json:"user"`
	Status     string     `json:"status"`
	Activities []Activity `json:"activities"`
	GuildID    string     `json:"guild_id"`
}

// NewDiscordBotService creates a new Discord bot service
func NewDiscordBotService(token, guildID string, db *gorm.DB) *DiscordBotService {
	return &DiscordBotService{
		Token:     token,
		GuildID:   guildID,
		db:        db,
		presences: make(map[string]*PresenceData),
		stopChan:  make(chan bool),
	}
}

// Start starts the Discord bot and connects to the Gateway
func (bot *DiscordBotService) Start() error {
	if bot.running {
		return fmt.Errorf("bot is already running")
	}

	log.Println("🤖 Starting Discord Bot service...")

	// Migrate presence data table
	if err := bot.db.AutoMigrate(&PresenceData{}); err != nil {
		return fmt.Errorf("failed to migrate presence data table: %w", err)
	}

	// Get Gateway URL
	gatewayURL, err := bot.getGatewayURL()
	if err != nil {
		return fmt.Errorf("failed to get gateway URL: %w", err)
	}

	// Connect to Gateway
	if err := bot.connectToGateway(gatewayURL); err != nil {
		return fmt.Errorf("failed to connect to gateway: %w", err)
	}

	bot.running = true
	log.Println("✅ Discord Bot service started successfully")

	// Start listening for messages
	go bot.listenForMessages()

	return nil
}

// Stop stops the Discord bot service
func (bot *DiscordBotService) Stop() {
	if !bot.running {
		return
	}

	log.Println("🛑 Stopping Discord Bot service...")
	bot.running = false
	bot.stopChan <- true

	if bot.conn != nil {
		bot.conn.Close()
	}

	log.Println("✅ Discord Bot service stopped")
}

// getGatewayURL fetches the Discord Gateway URL
func (bot *DiscordBotService) getGatewayURL() (string, error) {
	resp, err := http.Get("https://discord.com/api/gateway")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var gateway struct {
		URL string `json:"url"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&gateway); err != nil {
		return "", err
	}

	return gateway.URL + "/?v=10&encoding=json", nil
}

// connectToGateway establishes WebSocket connection to Discord Gateway
func (bot *DiscordBotService) connectToGateway(gatewayURL string) error {
	var err error
	bot.conn, _, err = websocket.DefaultDialer.Dial(gatewayURL, nil)
	if err != nil {
		return err
	}

	log.Printf("🔗 Connected to Discord Gateway: %s", gatewayURL)
	return nil
}

// listenForMessages listens for Gateway messages and handles them
func (bot *DiscordBotService) listenForMessages() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("❌ Bot panic recovered: %v", r)
			// Attempt to restart
			go func() {
				time.Sleep(5 * time.Second)
				log.Println("🔄 Attempting to restart bot...")
				bot.Stop()
				bot.Start()
			}()
		}
	}()

	for bot.running {
		select {
		case <-bot.stopChan:
			return
		default:
			var payload GatewayPayload
			if err := bot.conn.ReadJSON(&payload); err != nil {
				log.Printf("❌ Failed to read Gateway message: %v", err)
				continue
			}

			bot.handleGatewayPayload(&payload)
		}
	}
}

// handleGatewayPayload processes incoming Gateway payloads
func (bot *DiscordBotService) handleGatewayPayload(payload *GatewayPayload) {
	// Update sequence number
	if payload.S != nil {
		bot.sequence = payload.S
	}

	switch payload.Op {
	case 10: // Hello - start heartbeat
		bot.handleHello(payload.D)
	case 0: // Dispatch
		if payload.T != nil {
			bot.handleDispatch(*payload.T, payload.D)
		}
	case 11: // Heartbeat ACK
		log.Println("💓 Heartbeat acknowledged")
	case 1: // Heartbeat request
		bot.sendHeartbeat()
	case 7: // Reconnect
		log.Println("🔄 Gateway requested reconnect")
		bot.reconnect()
	case 9: // Invalid session
		log.Println("❌ Invalid session, reconnecting...")
		bot.reconnect()
	}
}

// handleHello processes Hello opcode and starts heartbeat
func (bot *DiscordBotService) handleHello(data json.RawMessage) {
	var hello struct {
		HeartbeatInterval int `json:"heartbeat_interval"`
	}

	if err := json.Unmarshal(data, &hello); err != nil {
		log.Printf("❌ Failed to parse Hello: %v", err)
		return
	}

	bot.heartbeat = time.Duration(hello.HeartbeatInterval) * time.Millisecond
	log.Printf("💓 Starting heartbeat every %v", bot.heartbeat)

	// Start heartbeat
	go bot.startHeartbeat()

	// Send identify
	bot.sendIdentify()
}

// handleDispatch processes dispatch events
func (bot *DiscordBotService) handleDispatch(eventType string, data json.RawMessage) {
	switch eventType {
	case "READY":
		bot.handleReady(data)
	case "PRESENCE_UPDATE":
		bot.handlePresenceUpdate(data)
	case "GUILD_MEMBER_UPDATE":
		log.Println("👤 Guild member updated")
	default:
		// Log unknown events for debugging
		log.Printf("📦 Received event: %s", eventType)
	}
}

// handleReady processes READY event
func (bot *DiscordBotService) handleReady(data json.RawMessage) {
	var ready ReadyEvent
	if err := json.Unmarshal(data, &ready); err != nil {
		log.Printf("❌ Failed to parse READY: %v", err)
		return
	}

	bot.sessionID = ready.SessionID
	log.Printf("✅ Bot ready! Session ID: %s, Bot ID: %s", ready.SessionID, ready.User.ID)
}

// handlePresenceUpdate processes presence update events
func (bot *DiscordBotService) handlePresenceUpdate(data json.RawMessage) {
	var presence PresenceUpdateEvent
	if err := json.Unmarshal(data, &presence); err != nil {
		log.Printf("❌ Failed to parse presence update: %v", err)
		return
	}

	// Only track presences from our guild
	if presence.GuildID != bot.GuildID {
		return
	}

	userID := presence.User.ID
	now := time.Now()

	// Debug logging for activities
	if len(presence.Activities) > 0 {
		log.Printf("🎵 User %s activity: %+v", userID, presence.Activities[0])
	}

	// Update in-memory presence
	bot.mutex.Lock()
	bot.presences[userID] = &PresenceData{
		UserID:     userID,
		Status:     presence.Status,
		Activities: presence.Activities,
		LastSeen:   now,
		UpdatedAt:  now,
	}
	bot.mutex.Unlock()

	// Update database
	go bot.updatePresenceInDB(userID, presence.Status, presence.Activities, now)

	log.Printf("👀 %s is now %s", userID, presence.Status)
}

// updatePresenceInDB updates presence data in the database
func (bot *DiscordBotService) updatePresenceInDB(userID, status string, activities []Activity, timestamp time.Time) {
	presenceData := &PresenceData{
		UserID:     userID,
		Status:     status,
		Activities: activities,
		LastSeen:   timestamp,
		UpdatedAt:  timestamp,
	}

	// Upsert presence data
	result := bot.db.Save(presenceData)
	if result.Error != nil {
		log.Printf("❌ Failed to update presence for %s: %v", userID, result.Error)
	}
}

// startHeartbeat starts the heartbeat routine
func (bot *DiscordBotService) startHeartbeat() {
	ticker := time.NewTicker(bot.heartbeat)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			bot.sendHeartbeat()
		case <-bot.stopChan:
			return
		}
	}
}

// sendHeartbeat sends a heartbeat to maintain connection
func (bot *DiscordBotService) sendHeartbeat() {
	var sequenceData json.RawMessage
	if bot.sequence != nil {
		sequenceData = json.RawMessage(fmt.Sprintf("%d", *bot.sequence))
	} else {
		sequenceData = json.RawMessage("null")
	}

	payload := GatewayPayload{
		Op: 1,
		D:  sequenceData,
	}

	if err := bot.conn.WriteJSON(payload); err != nil {
		log.Printf("❌ Failed to send heartbeat: %v", err)
	}
}

// sendIdentify sends identification payload
func (bot *DiscordBotService) sendIdentify() {
	identify := IdentifyPayload{
		Token:   bot.Token,
		Intents: 1 | 2 | 256, // GUILDS + GUILD_MEMBERS + GUILD_PRESENCES
	}
	identify.Properties.OS = "linux"
	identify.Properties.Browser = "gotchu-bot"
	identify.Properties.Device = "gotchu-bot"

	payload := GatewayPayload{
		Op: 2,
		D:  mustMarshal(identify),
	}

	if err := bot.conn.WriteJSON(payload); err != nil {
		log.Printf("❌ Failed to send identify: %v", err)
	} else {
		log.Println("🔐 Sent identification to Discord")
	}
}

// reconnect attempts to reconnect to the Gateway
func (bot *DiscordBotService) reconnect() {
	log.Println("🔄 Reconnecting to Discord Gateway...")
	bot.Stop()
	time.Sleep(2 * time.Second)
	bot.Start()
}

// GetUserPresence returns the current presence data for a user
func (bot *DiscordBotService) GetUserPresence(userID string) (*PresenceData, error) {
	// First check in-memory cache
	bot.mutex.RLock()
	if presence, exists := bot.presences[userID]; exists {
		bot.mutex.RUnlock()
		return presence, nil
	}
	bot.mutex.RUnlock()

	// Fall back to database
	var presence PresenceData
	err := bot.db.Where("user_id = ?", userID).First(&presence).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // User not found, return nil without error
		}
		return nil, err
	}

	return &presence, nil
}

// GetAllPresences returns all tracked presences
func (bot *DiscordBotService) GetAllPresences() map[string]*PresenceData {
	bot.mutex.RLock()
	defer bot.mutex.RUnlock()

	// Create a copy to avoid race conditions
	presences := make(map[string]*PresenceData)
	for k, v := range bot.presences {
		presences[k] = v
	}

	return presences
}

// IsRunning returns whether the bot is currently running
func (bot *DiscordBotService) IsRunning() bool {
	return bot.running
}

// Helper function to marshal JSON safely
func mustMarshal(v interface{}) json.RawMessage {
	data, err := json.Marshal(v)
	if err != nil {
		panic(fmt.Sprintf("Failed to marshal JSON: %v", err))
	}
	return data
}