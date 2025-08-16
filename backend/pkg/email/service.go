package email

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Service struct {
	apiKey   string
	fromName string
	fromEmail string
	baseURL  string
}

type EmailRequest struct {
	From    string `json:"from"`
	To      []string `json:"to"`
	Subject string `json:"subject"`
	HTML    string `json:"html"`
}

type EmailAddress struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

type EmailResponse struct {
	ID      string `json:"id"`
	Message string `json:"message,omitempty"`
}

// NewService creates a new email service
func NewService(apiKey, fromName, fromEmail string) *Service {
	return &Service{
		apiKey:    apiKey,
		fromName:  fromName,
		fromEmail: fromEmail,
		baseURL:   "https://api.resend.com",
	}
}

// GenerateVerificationToken generates a secure verification token
func (s *Service) GenerateVerificationToken() (string, error) {
	bytes := make([]byte, 32) // 256-bit token
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate token: %v", err)
	}
	return hex.EncodeToString(bytes), nil
}

// SendVerificationEmail sends an email verification link
func (s *Service) SendVerificationEmail(toEmail, username, verificationToken, baseURL string) error {
	verificationLink := fmt.Sprintf("%s/verify-email?token=%s", baseURL, verificationToken)
	
	htmlContent := s.buildVerificationEmailHTML(username, verificationLink)
	
	emailReq := EmailRequest{
		From:    s.fromEmail,
		To:      []string{toEmail},
		Subject: "Welcome to Gotchu - Verify your email",
		HTML:    htmlContent,
	}

	return s.sendEmail(emailReq)
}

// sendEmail sends an email via Resend API
func (s *Service) sendEmail(req EmailRequest) error {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal email request: %v", err)
	}

	httpReq, err := http.NewRequest("POST", s.baseURL+"/emails", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+s.apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errorResp map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errorResp)
		return fmt.Errorf("email API error (status %d): %v", resp.StatusCode, errorResp)
	}

	return nil
}

// buildVerificationEmailHTML creates beautiful verification email HTML
func (s *Service) buildVerificationEmailHTML(username, verificationLink string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your email - Gotchu</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%%, #1a1a1a 100%%);
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #58A4B0;
            margin-bottom: 10px;
        }
        .content {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 40px;
            backdrop-filter: blur(10px);
            text-align: center;
        }
        .welcome {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #ffffff;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            color: #a0a0a0;
            margin-bottom: 32px;
        }
        .verify-btn {
            display: inline-block;
            background: linear-gradient(135deg, #58A4B0 0%%, #4A8C96 100%%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 8px 32px rgba(88, 164, 176, 0.3);
            transition: all 0.3s ease;
        }
        .verify-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(88, 164, 176, 0.4);
        }
        .security {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 14px;
            color: #666;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">gotchu</div>
        </div>
        
        <div class="content">
            <div class="welcome">Welcome to Gotchu, %s! 🎉</div>
            
            <div class="message">
                Thanks for joining our community! To get started and access all features, 
                please verify your email address by clicking the button below.
            </div>
            
            <a href="%s" class="verify-btn">
                Verify Email Address
            </a>
            
            <div class="security">
                🔒 This link will expire in 24 hours for security.<br>
                If you didn't create this account, you can safely ignore this email.
            </div>
        </div>
        
        <div class="footer">
            © 2025 Gotchu. Made with ❤️ for creators.
        </div>
    </div>
</body>
</html>`, username, verificationLink)
}