package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"gotchu-backend/internal/config"
	"gotchu-backend/internal/middleware"
	"gotchu-backend/internal/models"
	"gotchu-backend/pkg/payments"
	"gotchu-backend/pkg/redis"
	"gotchu-backend/pkg/workers"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// PaymentHandler handles payment-related endpoints
type PaymentHandler struct {
	db          *gorm.DB
	redisClient *redis.Client
	config      *config.Config
	oxaPay      *payments.OxaPayService
	workerPool  *workers.WorkerPool
}

// NewPaymentHandler creates a new payment handler with OxaPay integration
func NewPaymentHandler(db *gorm.DB, redisClient *redis.Client, cfg *config.Config, workerPool *workers.WorkerPool) *PaymentHandler {
	var oxaPay *payments.OxaPayService
	if cfg.OxaPayMerchantKey != "" && cfg.OxaPayAPIKey != "" {
		oxaPay = payments.NewOxaPayService(
			cfg.OxaPayMerchantKey,
			cfg.OxaPayAPIKey,
		)
	}

	return &PaymentHandler{
		db:          db,
		redisClient: redisClient,
		config:      cfg,
		oxaPay:      oxaPay,
		workerPool:  workerPool,
	}
}

// PaymentResponse represents a standard payment API response
type PaymentResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// CreatePaymentRequest represents the request to create a new payment
type CreatePaymentRequest struct {
	PlanID   string `json:"plan_id" binding:"required"`
	Currency string `json:"currency" binding:"required"`
}

// CreatePayment creates a new payment with OxaPay
func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, PaymentResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	if h.oxaPay == nil {
		c.JSON(http.StatusServiceUnavailable, PaymentResponse{
			Success: false,
			Message: "Payment service not configured",
		})
		return
	}

	var req CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, PaymentResponse{
			Success: false,
			Message: "Invalid request data",
			Error:   err.Error(),
		})
		return
	}

	// Validate plan ID (only lifetime plan supported)
	if req.PlanID != "premium_lifetime" {
		c.JSON(http.StatusBadRequest, PaymentResponse{
			Success: false,
			Message: "Invalid plan ID. Only 'premium_lifetime' is supported",
		})
		return
	}

	// Get the lifetime plan details
	plan := h.oxaPay.GetLifetimePlan()

	// Validate currency
	supportedCurrencies := h.oxaPay.GetAvailableCurrencies()
	validCurrency := false
	for _, currency := range supportedCurrencies {
		if strings.EqualFold(currency, req.Currency) {
			validCurrency = true
			req.Currency = strings.ToUpper(req.Currency)
			break
		}
	}

	if !validCurrency {
		c.JSON(http.StatusBadRequest, PaymentResponse{
			Success: false,
			Message: "Unsupported currency",
		})
		return
	}

	// Check if user already has premium
	if user.Plan == "premium" {
		c.JSON(http.StatusBadRequest, PaymentResponse{
			Success: false,
			Message: "User already has premium access",
		})
		return
	}

	// Create unique order ID
	orderID := fmt.Sprintf("user_%d_premium_%d", user.ID, time.Now().Unix())

	// Create OxaPay invoice request
	invoiceReq := &payments.CreateInvoiceRequest{
		Amount:      plan.Price,
		Currency:    req.Currency,
		LifeTime:    1800, // 30 minutes (1800 seconds)
		FeePaidBy:   "customer",
		UnderPaid:   5.0, // Allow 5% underpayment
		CallbackURL: fmt.Sprintf("%s/api/payments/webhook", h.config.BaseURL),
		ReturnURL:   fmt.Sprintf("%s/payment-success", h.config.BaseURL),
		Description: fmt.Sprintf("Premium Lifetime Access - %s", user.Username),
		OrderID:     orderID,
	}

	// Create invoice with OxaPay
	invoice, err := h.oxaPay.CreateInvoice(invoiceReq)
	if err != nil {
		fmt.Printf("Error creating OxaPay invoice: %v\n", err)
		c.JSON(http.StatusInternalServerError, PaymentResponse{
			Success: false,
			Message: "Failed to create payment",
			Error:   err.Error(),
		})
		return
	}

	// Create payment record in database
	payment := h.oxaPay.ConvertToPaymentModel(invoice.TrackID, user.ID, req.PlanID, plan.Price, req.Currency)
	payment.OrderID = &orderID

	if err := h.db.Create(payment).Error; err != nil {
		fmt.Printf("Error saving payment to database: %v\n", err)
		c.JSON(http.StatusInternalServerError, PaymentResponse{
			Success: false,
			Message: "Failed to create payment record",
		})
		return
	}

	fmt.Printf("Created payment - ID: %d, TrackID: %s, User: %d\n", payment.ID, invoice.TrackID, user.ID)

	c.JSON(http.StatusCreated, PaymentResponse{
		Success: true,
		Message: "Payment created successfully",
		Data: gin.H{
			"payment_id":  payment.ID,
			"track_id":    invoice.TrackID,
			"pay_url":     invoice.PayLink,
			"amount":      fmt.Sprintf("%.2f", plan.Price),
			"currency":    req.Currency,
			"description": invoiceReq.Description,
			"expires_at":  invoice.ExpiredAt,
		},
	})
}

// GetPaymentStatus checks the status of a payment
func (h *PaymentHandler) GetPaymentStatus(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, PaymentResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	paymentIDStr := c.Param("id")
	paymentID, err := strconv.ParseUint(paymentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, PaymentResponse{
			Success: false,
			Message: "Invalid payment ID",
		})
		return
	}

	// Get payment from database
	var payment models.Payment
	if err := h.db.Where("id = ? AND user_id = ?", paymentID, user.ID).First(&payment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, PaymentResponse{
				Success: false,
				Message: "Payment not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, PaymentResponse{
			Success: false,
			Message: "Database error",
		})
		return
	}

	// If payment is still pending, check with OxaPay
	if payment.Status == "pending" && h.oxaPay != nil {
		trackID, _ := strconv.ParseInt(payment.ExternalID, 10, 64)
		if trackID > 0 {
			inquiry, err := h.oxaPay.InquirePayment(trackID)
			if err == nil {
				// Update payment status based on inquiry
				oldStatus := payment.Status
				switch strings.ToLower(inquiry.Status) {
				case "paid":
					payment.Status = "completed"
					payment.CompletedAt = &time.Time{}
					*payment.CompletedAt = time.Now()
					if inquiry.TxID != "" {
						payment.TransactionHash = &inquiry.TxID
					}
				case "expired":
					payment.Status = "expired"
				case "canceled":
					payment.Status = "cancelled"
				}

				// Save status update if changed
				if payment.Status != oldStatus {
					payment.UpdatedAt = time.Now()
					h.db.Save(&payment)

					// If payment completed, upgrade user to premium
					if payment.Status == "completed" {
						h.upgradeUserToPremium(user.ID)
					}
				}
			}
		}
	}

	c.JSON(http.StatusOK, PaymentResponse{
		Success: true,
		Message: "Payment status retrieved",
		Data: gin.H{
			"id":               payment.ID,
			"status":           payment.Status,
			"amount":           payment.Amount,
			"currency":         payment.Currency,
			"plan_id":          payment.PlanID,
			"created_at":       payment.CreatedAt,
			"completed_at":     payment.CompletedAt,
			"transaction_hash": payment.TransactionHash,
		},
	})
}

// ProcessWebhook handles OxaPay webhook notifications
func (h *PaymentHandler) ProcessWebhook(c *gin.Context) {
	if h.oxaPay == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Payment service not configured"})
		return
	}

	// Read webhook payload
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		fmt.Printf("Error reading webhook body: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	// Get HMAC signature from header
	signature := c.GetHeader("X-Webhook-Signature")
	if signature == "" {
		signature = c.GetHeader("X-OxaPay-Signature") // Alternative header name
	}

	// Verify webhook signature if signature is provided
	if signature != "" && !h.oxaPay.VerifyWebhook(body, signature) {
		fmt.Printf("Invalid webhook signature\n")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	// Parse webhook data
	var webhookData payments.WebhookData
	if err := json.Unmarshal(body, &webhookData); err != nil {
		fmt.Printf("Error parsing webhook JSON: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	fmt.Printf("Received webhook: TrackID=%d, Status=%s\n", webhookData.TrackID, webhookData.Status)

	// Find payment by external ID (track ID)
	var payment models.Payment
	trackIDStr := fmt.Sprintf("%d", webhookData.TrackID)
	if err := h.db.Where("external_id = ?", trackIDStr).First(&payment).Error; err != nil {
		fmt.Printf("Payment not found for TrackID: %d\n", webhookData.TrackID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// Update payment status
	oldStatus := payment.Status
	h.oxaPay.UpdatePaymentFromWebhook(&payment, &webhookData)

	// Save updated payment
	if err := h.db.Save(&payment).Error; err != nil {
		fmt.Printf("Error updating payment: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// If payment completed, upgrade user to premium
	if payment.Status == "completed" && oldStatus != "completed" {
		h.upgradeUserToPremium(payment.UserID)
		fmt.Printf("User %d upgraded to premium via payment %d\n", payment.UserID, payment.ID)
	}

	c.JSON(http.StatusOK, gin.H{"status": "processed"})
}

// upgradeUserToPremium upgrades a user to premium status
func (h *PaymentHandler) upgradeUserToPremium(userID uint) {
	// Update user plan in database
	err := h.db.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"plan":       "premium",
		"updated_at": time.Now(),
	}).Error

	if err != nil {
		fmt.Printf("Error upgrading user %d to premium: %v\n", userID, err)
		return
	}

	// Clear user cache to ensure fresh data
	if h.redisClient != nil {
		h.redisClient.InvalidateUserCache(userID)
		
		// Clear dashboard cache too
		dashboardCacheKey := fmt.Sprintf("dashboard:%d", userID)
		h.redisClient.Delete(dashboardCacheKey)
	}

	fmt.Printf("Successfully upgraded user %d to premium\n", userID)
}

// GetPricingPlans returns available pricing plans
func (h *PaymentHandler) GetPricingPlans(c *gin.Context) {
	if h.oxaPay == nil {
		c.JSON(http.StatusServiceUnavailable, PaymentResponse{
			Success: false,
			Message: "Payment service not configured",
		})
		return
	}

	plan := h.oxaPay.GetLifetimePlan()

	c.JSON(http.StatusOK, PaymentResponse{
		Success: true,
		Message: "Pricing plans retrieved successfully",
		Data: gin.H{
			"plans": []models.PricingPlan{plan},
		},
	})
}

// GetAvailableCurrencies returns supported payment currencies
func (h *PaymentHandler) GetAvailableCurrencies(c *gin.Context) {
	if h.oxaPay == nil {
		c.JSON(http.StatusServiceUnavailable, PaymentResponse{
			Success: false,
			Message: "Payment service not configured",
		})
		return
	}

	currencies := h.oxaPay.GetAvailableCurrencies()

	c.JSON(http.StatusOK, PaymentResponse{
		Success: true,
		Message: "Available currencies retrieved successfully",
		Data: gin.H{
			"currencies": currencies,
		},
	})
}

// GetUserPayments returns payment history for the authenticated user
func (h *PaymentHandler) GetUserPayments(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, PaymentResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	var payments []models.Payment
	if err := h.db.Where("user_id = ?", user.ID).Order("created_at DESC").Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, PaymentResponse{
			Success: false,
			Message: "Database error",
		})
		return
	}

	c.JSON(http.StatusOK, PaymentResponse{
		Success: true,
		Message: "Payment history retrieved successfully",
		Data: gin.H{
			"payments": payments,
		},
	})
}

// GetCurrentSubscription returns current subscription status (lifetime premium)
func (h *PaymentHandler) GetCurrentSubscription(c *gin.Context) {
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, PaymentResponse{
			Success: false,
			Message: "Authentication required",
		})
		return
	}

	// Check if user has premium
	isPremium := user.Plan == "premium"
	
	var subscriptionData gin.H
	if isPremium {
		// Find the completed payment that gave them premium
		var payment models.Payment
		err := h.db.Where("user_id = ? AND status = 'completed' AND plan_id = 'premium_lifetime'", user.ID).
			Order("completed_at DESC").First(&payment).Error
		
		if err == nil {
			subscriptionData = gin.H{
				"active":      true,
				"plan":        "premium_lifetime",
				"type":        "lifetime",
				"activated_at": payment.CompletedAt,
				"amount_paid": payment.Amount,
				"currency":    payment.Currency,
			}
		} else {
			subscriptionData = gin.H{
				"active": true,
				"plan":   "premium_lifetime",
				"type":   "lifetime",
			}
		}
	} else {
		subscriptionData = gin.H{
			"active": false,
			"plan":   "free",
			"type":   "free",
		}
	}

	c.JSON(http.StatusOK, PaymentResponse{
		Success: true,
		Message: "Subscription status retrieved successfully",
		Data: gin.H{
			"subscription": subscriptionData,
		},
	})
}

// PaymentSuccess handles the redirect after successful payment
func (h *PaymentHandler) PaymentSuccess(c *gin.Context) {
	// Get track_id from query parameters if provided
	trackID := c.Query("track_id")
	
	// Redirect to frontend dashboard
	frontendURL := fmt.Sprintf("%s/dashboard", h.config.FrontendURL)
	if trackID != "" {
		frontendURL += "?payment_success=true&track_id=" + trackID
	} else {
		frontendURL += "?payment_success=true"
	}
	
	c.Redirect(http.StatusFound, frontendURL)
}