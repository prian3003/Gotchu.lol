package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// Service handles authentication operations
type Service struct {
	jwtSecret     []byte
	sessionExpiry time.Duration
}

// Claims represents JWT claims
type Claims struct {
	UserID    uint   `json:"user_id"`
	Username  string `json:"username"`
	SessionID string `json:"session_id"`
	jwt.RegisteredClaims
}

// SessionData represents session information
type SessionData struct {
	UserID     uint      `json:"user_id"`
	Username   string    `json:"username"`
	Email      string    `json:"email"`
	IsVerified bool      `json:"is_verified"`
	Plan       string    `json:"plan"`
	CreatedAt  time.Time `json:"created_at"`
}

// AuthResult represents authentication result
type AuthResult struct {
	SessionID string      `json:"session_id"`
	Token     string      `json:"token"`
	User      SessionData `json:"user"`
	ExpiresAt time.Time   `json:"expires_at"`
}

// NewService creates a new authentication service
func NewService(jwtSecret string, sessionExpiry time.Duration) *Service {
	return &Service{
		jwtSecret:     []byte(jwtSecret),
		sessionExpiry: sessionExpiry,
	}
}

// Password Operations

// HashPassword hashes a password using bcrypt
func (s *Service) HashPassword(password string) (string, error) {
	if len(password) == 0 {
		return "", errors.New("password cannot be empty")
	}

	// Use cost 12 for good security vs performance balance
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %v", err)
	}

	return string(hashedBytes), nil
}

// VerifyPassword verifies a password against its hash
func (s *Service) VerifyPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateSalt generates a random salt
func (s *Service) GenerateSalt() (string, error) {
	bytes := make([]byte, 32)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", fmt.Errorf("failed to generate salt: %v", err)
	}
	return hex.EncodeToString(bytes), nil
}

// JWT Operations

// GenerateToken generates a JWT token
func (s *Service) GenerateToken(userID uint, username, sessionID string) (string, error) {
	expirationTime := time.Now().Add(s.sessionExpiry)
	
	claims := &Claims{
		UserID:    userID,
		Username:  username,
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "gotchu.lol",
			Subject:   fmt.Sprintf("user:%d", userID),
			ID:        sessionID,
			Audience:  []string{"gotchu-users"},
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %v", err)
	}

	return tokenString, nil
}

// ValidateToken validates and parses a JWT token
func (s *Service) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %v", err)
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	// Additional validation
	if claims.ExpiresAt.Before(time.Now()) {
		return nil, errors.New("token has expired")
	}

	if claims.Issuer != "gotchu.lol" {
		return nil, errors.New("invalid token issuer")
	}

	return claims, nil
}

// Session Operations

// GenerateSessionID generates a unique session ID
func (s *Service) GenerateSessionID() string {
	return uuid.New().String()
}

// CreateAuthResult creates an authentication result
func (s *Service) CreateAuthResult(userID uint, username, email string, isVerified bool, plan string) (*AuthResult, error) {
	sessionID := s.GenerateSessionID()
	
	token, err := s.GenerateToken(userID, username, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %v", err)
	}

	expiresAt := time.Now().Add(s.sessionExpiry)

	sessionData := SessionData{
		UserID:     userID,
		Username:   username,
		Email:      email,
		IsVerified: isVerified,
		Plan:       plan,
		CreatedAt:  time.Now(),
	}

	return &AuthResult{
		SessionID: sessionID,
		Token:     token,
		User:      sessionData,
		ExpiresAt: expiresAt,
	}, nil
}

// RefreshToken generates a new token for an existing session
func (s *Service) RefreshToken(sessionID string, userID uint, username string) (string, error) {
	return s.GenerateToken(userID, username, sessionID)
}

// Validation Functions

// ValidateUsername validates username format and requirements
func (s *Service) ValidateUsername(username string) error {
	if len(username) < 1 {
		return errors.New("username must be at least 1 character long")
	}
	
	if len(username) > 30 {
		return errors.New("username must be no more than 30 characters long")
	}

	// Check for valid characters (alphanumeric and underscore only)
	for _, char := range username {
		if !((char >= 'a' && char <= 'z') || 
			 (char >= 'A' && char <= 'Z') || 
			 (char >= '0' && char <= '9') || 
			 char == '_') {
			return errors.New("username can only contain letters, numbers, and underscores")
		}
	}

	// Cannot start with underscore or number
	if username[0] == '_' || (username[0] >= '0' && username[0] <= '9') {
		return errors.New("username must start with a letter")
	}

	return nil
}

// ValidateEmail validates email format
func (s *Service) ValidateEmail(email string) error {
	if len(email) == 0 {
		return errors.New("email is required")
	}

	if len(email) > 255 {
		return errors.New("email is too long")
	}

	// Basic email validation
	atCount := 0
	dotAfterAt := false
	atIndex := -1

	for i, char := range email {
		if char == '@' {
			atCount++
			atIndex = i
		} else if char == '.' && atIndex != -1 && i > atIndex {
			dotAfterAt = true
		}
	}

	if atCount != 1 {
		return errors.New("invalid email format")
	}

	if atIndex == 0 || atIndex == len(email)-1 {
		return errors.New("invalid email format")
	}

	if !dotAfterAt {
		return errors.New("invalid email format")
	}

	return nil
}

// ValidatePassword validates password strength
func (s *Service) ValidatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters long")
	}

	if len(password) > 128 {
		return errors.New("password is too long")
	}

	// Check for at least one letter and one number
	hasLetter := false
	hasNumber := false

	for _, char := range password {
		if (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') {
			hasLetter = true
		} else if char >= '0' && char <= '9' {
			hasNumber = true
		}
	}

	if !hasLetter {
		return errors.New("password must contain at least one letter")
	}

	if !hasNumber {
		return errors.New("password must contain at least one number")
	}

	return nil
}

// Security Functions

// GenerateResetToken generates a password reset token
func (s *Service) GenerateResetToken() (string, error) {
	bytes := make([]byte, 32)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", fmt.Errorf("failed to generate reset token: %v", err)
	}
	return hex.EncodeToString(bytes), nil
}

// GenerateEmailVerificationToken generates an email verification token
func (s *Service) GenerateEmailVerificationToken() (string, error) {
	bytes := make([]byte, 32)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", fmt.Errorf("failed to generate verification token: %v", err)
	}
	return hex.EncodeToString(bytes), nil
}

// IsTokenExpired checks if a timestamp-based token has expired
func (s *Service) IsTokenExpired(createdAt time.Time, validFor time.Duration) bool {
	return time.Now().After(createdAt.Add(validFor))
}

// Utility Functions

// GetSessionExpiry returns the session expiry duration
func (s *Service) GetSessionExpiry() time.Duration {
	return s.sessionExpiry
}

// ExtractUserIDFromToken extracts user ID from token without full validation (for logging)
func (s *Service) ExtractUserIDFromToken(tokenString string) (uint, error) {
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &Claims{})
	if err != nil {
		return 0, err
	}

	if claims, ok := token.Claims.(*Claims); ok {
		return claims.UserID, nil
	}

	return 0, errors.New("invalid token claims")
}