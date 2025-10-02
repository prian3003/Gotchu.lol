package redis

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

type Client struct {
	rdb *redis.Client
	ctx context.Context
}

type SessionData struct {
	UserID    uint      `json:"user_id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	IsVerified bool     `json:"is_verified"`
	Plan      string    `json:"plan"`
	CreatedAt time.Time `json:"created_at"`
}

type UserCache struct {
	ID           uint      `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	DisplayName  *string   `json:"display_name"`
	AvatarURL    *string   `json:"avatar_url"`
	IsVerified   bool      `json:"is_verified"`
	Plan         string    `json:"plan"`
	Theme        string    `json:"theme"`
	IsActive     bool      `json:"is_active"`
	ProfileViews int       `json:"profile_views"`
	TotalClicks  int       `json:"total_clicks"`
	MfaEnabled   bool      `json:"mfa_enabled"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type RateLimitResult struct {
	Count     int `json:"count"`
	Limit     int `json:"limit"`
	Remaining int `json:"remaining"`
	Exceeded  bool `json:"exceeded"`
}

// NewClient creates a new Redis client (traditional Redis)
func NewClient(host, port, password, username string, db int) (*Client, error) {
	portInt, err := strconv.Atoi(port)
	if err != nil {
		return nil, fmt.Errorf("invalid port: %v", err)
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%d", host, portInt),
		Password:     password,
		Username:     username,
		DB:           db,
		MaxRetries:   3,
		DialTimeout:  10 * time.Second,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
		PoolSize:     20,
		MinIdleConns: 5,
	})

	ctx := context.Background()

	// Test connection
	_, err = rdb.Ping(ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %v", err)
	}

	return &Client{
		rdb: rdb,
		ctx: ctx,
	}, nil
}

// NewUpstashClient creates a new Upstash Redis client
func NewUpstashClient(redisURL, token string) (*Client, error) {
	// Parse Upstash Redis URL to extract connection details
	// Upstash URL format: https://your-endpoint.upstash.io
	// We'll use redis-go with TLS and authentication
	
	rdb := redis.NewClient(&redis.Options{
		Addr:     redisURL[8:] + ":6379", // Remove https:// and add port
		Password: token,
		DB:       0,
		TLSConfig: &tls.Config{
			ServerName: redisURL[8:], // Remove https://
		},
		MaxRetries:   3,
		DialTimeout:  10 * time.Second,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
		PoolSize:     20,
		MinIdleConns: 5,
	})

	ctx := context.Background()

	// Test connection
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Upstash Redis: %v", err)
	}

	return &Client{
		rdb: rdb,
		ctx: ctx,
	}, nil
}

// Close closes the Redis connection
func (c *Client) Close() error {
	return c.rdb.Close()
}

// Session Management

// SetSession stores session data in Redis
func (c *Client) SetSession(sessionID string, data SessionData, expiration time.Duration) error {
	sessionKey := fmt.Sprintf("session:%s", sessionID)
	
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal session data: %v", err)
	}

	return c.rdb.SetEx(c.ctx, sessionKey, jsonData, expiration).Err()
}

// GetSession retrieves session data from Redis
func (c *Client) GetSession(sessionID string) (*SessionData, error) {
	sessionKey := fmt.Sprintf("session:%s", sessionID)
	
	result, err := c.rdb.Get(c.ctx, sessionKey).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // Session not found
		}
		return nil, fmt.Errorf("failed to get session: %v", err)
	}

	var data SessionData
	err = json.Unmarshal([]byte(result), &data)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal session data: %v", err)
	}

	return &data, nil
}

// DeleteSession removes session from Redis
func (c *Client) DeleteSession(sessionID string) error {
	sessionKey := fmt.Sprintf("session:%s", sessionID)
	return c.rdb.Del(c.ctx, sessionKey).Err()
}

// ExtendSession extends session expiration
func (c *Client) ExtendSession(sessionID string, expiration time.Duration) error {
	sessionKey := fmt.Sprintf("session:%s", sessionID)
	return c.rdb.Expire(c.ctx, sessionKey, expiration).Err()
}

// User Cache Management

// SetUserCache stores user data in cache
func (c *Client) SetUserCache(userID uint, data UserCache, expiration time.Duration) error {
	userKey := fmt.Sprintf("user:%d", userID)
	
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal user data: %v", err)
	}

	return c.rdb.SetEx(c.ctx, userKey, jsonData, expiration).Err()
}

// GetUserCache retrieves user data from cache
func (c *Client) GetUserCache(userID uint) (*UserCache, error) {
	userKey := fmt.Sprintf("user:%d", userID)
	
	result, err := c.rdb.Get(c.ctx, userKey).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // User not found in cache
		}
		return nil, fmt.Errorf("failed to get user cache: %v", err)
	}

	var data UserCache
	err = json.Unmarshal([]byte(result), &data)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal user data: %v", err)
	}

	return &data, nil
}

// InvalidateUserCache removes user from cache
func (c *Client) InvalidateUserCache(userID uint) error {
	userKey := fmt.Sprintf("user:%d", userID)
	return c.rdb.Del(c.ctx, userKey).Err()
}

// Rate Limiting

// CheckRateLimit checks and increments rate limit counter
func (c *Client) CheckRateLimit(key string, limit int, window time.Duration) (*RateLimitResult, error) {
	rateLimitKey := fmt.Sprintf("rate_limit:%s", key)
	
	// Use a Lua script for atomic increment and expire operations
	luaScript := `
		local current = redis.call('INCR', KEYS[1])
		if current == 1 then
			redis.call('EXPIRE', KEYS[1], ARGV[1])
		end
		return current
	`
	
	windowSeconds := int(window.Seconds())
	result, err := c.rdb.Eval(c.ctx, luaScript, []string{rateLimitKey}, windowSeconds).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to check rate limit: %v", err)
	}

	count := int(result.(int64))
	remaining := limit - count
	if remaining < 0 {
		remaining = 0
	}

	return &RateLimitResult{
		Count:     count,
		Limit:     limit,
		Remaining: remaining,
		Exceeded:  count > limit,
	}, nil
}

// ClearRateLimit removes rate limit counter
func (c *Client) ClearRateLimit(key string) error {
	rateLimitKey := fmt.Sprintf("rate_limit:%s", key)
	return c.rdb.Del(c.ctx, rateLimitKey).Err()
}

// Generic Cache Operations

// Set stores a key-value pair with optional expiration
func (c *Client) Set(key string, value interface{}, expiration time.Duration) error {
	jsonData, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %v", err)
	}

	if expiration > 0 {
		return c.rdb.SetEx(c.ctx, key, jsonData, expiration).Err()
	}
	return c.rdb.Set(c.ctx, key, jsonData, 0).Err()
}

// Get retrieves a value by key
func (c *Client) Get(key string, dest interface{}) error {
	result, err := c.rdb.Get(c.ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil // Key not found
		}
		return fmt.Errorf("failed to get key %s: %v", key, err)
	}

	return json.Unmarshal([]byte(result), dest)
}

// Delete removes a key
func (c *Client) Delete(key string) error {
	return c.rdb.Del(c.ctx, key).Err()
}

// Exists checks if a key exists
func (c *Client) Exists(key string) (bool, error) {
	result, err := c.rdb.Exists(c.ctx, key).Result()
	if err != nil {
		return false, fmt.Errorf("failed to check key existence: %v", err)
	}
	return result > 0, nil
}

// Analytics and Metrics

// IncrementCounter increments a counter with optional expiration
func (c *Client) IncrementCounter(key string, expiration time.Duration) (int64, error) {
	result, err := c.rdb.Incr(c.ctx, key).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to increment counter: %v", err)
	}

	// Set expiration only if this is the first increment
	if result == 1 && expiration > 0 {
		c.rdb.Expire(c.ctx, key, expiration)
	}

	return result, nil
}

// AddToSet adds a member to a set
func (c *Client) AddToSet(key string, member interface{}) error {
	return c.rdb.SAdd(c.ctx, key, member).Err()
}

// GetSetMembers gets all members of a set
func (c *Client) GetSetMembers(key string) ([]string, error) {
	return c.rdb.SMembers(c.ctx, key).Result()
}

// IsSetMember checks if a member exists in a set
func (c *Client) IsSetMember(key string, member interface{}) (bool, error) {
	return c.rdb.SIsMember(c.ctx, key, member).Result()
}

// AddToSortedSet adds a member to a sorted set with score
func (c *Client) AddToSortedSet(key string, score float64, member interface{}) error {
	return c.rdb.ZAdd(c.ctx, key, redis.Z{Score: score, Member: fmt.Sprintf("%v", member)}).Err()
}

// GetSortedSetRange gets members from a sorted set by rank
func (c *Client) GetSortedSetRange(key string, start, stop int64) ([]string, error) {
	return c.rdb.ZRange(c.ctx, key, start, stop).Result()
}

// Health Check

// Ping checks if Redis is responsive
func (c *Client) Ping() error {
	return c.rdb.Ping(c.ctx).Err()
}

// GetStats returns Redis connection stats
func (c *Client) GetStats() *redis.PoolStats {
	return c.rdb.PoolStats()
}