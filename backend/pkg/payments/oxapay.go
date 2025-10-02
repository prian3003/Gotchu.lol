package payments

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"gotchu-backend/internal/models"
)

const (
	OxaPayBaseURL = "https://api.oxapay.com"
)

// OxaPayService handles OxaPay API interactions
type OxaPayService struct {
	merchantKey string
	apiKey      string
	baseURL     string
	client      *http.Client
}

// NewOxaPayService creates a new OxaPay service instance
func NewOxaPayService(merchantKey, apiKey string) *OxaPayService {
	return &OxaPayService{
		merchantKey: merchantKey,
		apiKey:      apiKey,
		baseURL:     OxaPayBaseURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// CreateInvoiceRequest represents the request structure for creating an invoice
type CreateInvoiceRequest struct {
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	LifeTime    int     `json:"lifeTime"`    // Invoice lifetime in seconds
	FeePaidBy   string  `json:"feePaidBy"`   // "customer" or "merchant"
	UnderPaid   float64 `json:"underPaid"`   // Percentage (0-99)
	CallbackURL string  `json:"callbackUrl"` // Webhook URL
	ReturnURL   string  `json:"returnUrl"`   // Redirect URL after payment
	Description string  `json:"description"`
	OrderID     string  `json:"orderId"` // Internal order ID
}

// CreateInvoiceResponse represents the response from OxaPay invoice creation
type CreateInvoiceResponse struct {
	Result    interface{} `json:"result"`    // Can be string "success" or error code number
	Message   string      `json:"message"`   // Success/error message
	TrackID   string      `json:"trackId"`   // OxaPay tracking ID (comes as string)
	PayLink   string      `json:"payLink"`   // Payment URL for customer
	Amount    string      `json:"amount"`    // Invoice amount
	Currency  string      `json:"currency"`  // Invoice currency
	ExpiredAt string      `json:"expiredAt"` // Expiration timestamp
}

// IsSuccess checks if the response indicates success
func (r *CreateInvoiceResponse) IsSuccess() bool {
	if str, ok := r.Result.(string); ok {
		return str == "success"
	}
	if num, ok := r.Result.(float64); ok {
		return num == 100 // OxaPay success code
	}
	return false
}

// InquiryRequest represents the request to check payment status
type InquiryRequest struct {
	TrackID     int64  `json:"trackId"`
	MerchantKey string `json:"merchant"`
}

// InquiryResponse represents the response from payment status inquiry
type InquiryResponse struct {
	Result      string  `json:"result"`
	TrackID     int64   `json:"trackId"`
	Amount      string  `json:"amount"`
	Currency    string  `json:"currency"`
	Date        string  `json:"date"`
	Status      string  `json:"status"` // "Waiting", "Paid", "Expired", "Canceled"
	PayDate     string  `json:"payDate,omitempty"`
	PayAmount   string  `json:"payAmount,omitempty"`
	PayCurrency string  `json:"payCurrency,omitempty"`
	Network     string  `json:"network,omitempty"`
	TxID        string  `json:"txId,omitempty"`
}

// WebhookData represents incoming webhook data from OxaPay
type WebhookData struct {
	TrackID     int64   `json:"trackId"`
	Amount      string  `json:"amount"`
	Currency    string  `json:"currency"`
	Date        string  `json:"date"`
	Status      string  `json:"status"`
	PayDate     string  `json:"payDate,omitempty"`
	PayAmount   string  `json:"payAmount,omitempty"`
	PayCurrency string  `json:"payCurrency,omitempty"`
	Network     string  `json:"network,omitempty"`
	TxID        string  `json:"txId,omitempty"`
	HMAC        string  `json:"hmac"` // HMAC signature for verification
}

// CreateInvoice creates a new payment invoice with OxaPay
func (o *OxaPayService) CreateInvoice(req *CreateInvoiceRequest) (*CreateInvoiceResponse, error) {
	// Prepare request payload
	payload := map[string]interface{}{
		"merchant":    o.merchantKey,
		"amount":      req.Amount,
		"currency":    req.Currency,
		"lifeTime":    req.LifeTime,
		"feePaidBy":   req.FeePaidBy,
		"underPaid":   req.UnderPaid,
		"callbackUrl": req.CallbackURL,
		"returnUrl":   req.ReturnURL,
		"description": req.Description,
		"orderId":     req.OrderID,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	// Create HTTP request
	url := fmt.Sprintf("%s/merchants/request", o.baseURL)
	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+o.apiKey)

	// Execute request
	resp, err := o.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	log.Printf("OxaPay CreateInvoice Response: %s", string(body))

	// Parse response
	var response CreateInvoiceResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	if !response.IsSuccess() {
		return nil, fmt.Errorf("invoice creation failed: %s", response.Message)
	}

	return &response, nil
}

// InquirePayment checks the status of a payment using trackId
func (o *OxaPayService) InquirePayment(trackID int64) (*InquiryResponse, error) {
	payload := InquiryRequest{
		TrackID:     trackID,
		MerchantKey: o.merchantKey,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal inquiry request: %v", err)
	}

	// Create HTTP request
	url := fmt.Sprintf("%s/merchants/inquiry", o.baseURL)
	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create inquiry request: %v", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+o.apiKey)

	// Execute request
	resp, err := o.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to execute inquiry request: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read inquiry response: %v", err)
	}

	log.Printf("OxaPay Inquiry Response: %s", string(body))

	// Parse response
	var response InquiryResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse inquiry response: %v", err)
	}

	return &response, nil
}

// VerifyWebhook verifies the HMAC signature of a webhook payload using API key
func (o *OxaPayService) VerifyWebhook(payload []byte, signature string) bool {
	// Create HMAC-SHA512 signature using API key (as per OxaPay docs)
	mac := hmac.New(sha512.New, []byte(o.apiKey))
	mac.Write(payload)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))
	
	// Compare signatures (case-insensitive)
	return strings.EqualFold(expectedSignature, signature)
}

// ConvertToPaymentModel converts OxaPay data to internal payment model
func (o *OxaPayService) ConvertToPaymentModel(trackID string, userID uint, planID string, amount float64, currency string) *models.Payment {
	return &models.Payment{
		UserID:           userID,
		PlanID:           planID,
		Amount:           amount,
		Currency:         currency,
		Status:           "pending",
		PaymentMethod:    "oxapay",
		ExternalID:       trackID,
		ExternalData:     nil,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
}

// UpdatePaymentFromWebhook updates payment status based on webhook data
func (o *OxaPayService) UpdatePaymentFromWebhook(payment *models.Payment, webhookData *WebhookData) {
	// Update payment status based on OxaPay status
	switch strings.ToLower(webhookData.Status) {
	case "paid":
		payment.Status = "completed"
		payment.CompletedAt = &time.Time{}
		*payment.CompletedAt = time.Now()
		if webhookData.TxID != "" {
			payment.TransactionHash = &webhookData.TxID
		}
	case "expired":
		payment.Status = "expired"
	case "canceled":
		payment.Status = "cancelled"
	default:
		payment.Status = "pending"
	}

	// Store additional payment data
	if webhookData.PayAmount != "" || webhookData.PayCurrency != "" || webhookData.Network != "" {
		extraData := map[string]interface{}{
			"payAmount":   webhookData.PayAmount,
			"payCurrency": webhookData.PayCurrency,
			"network":     webhookData.Network,
			"payDate":     webhookData.PayDate,
		}
		
		jsonData, err := json.Marshal(extraData)
		if err == nil {
			jsonStr := string(jsonData)
			payment.ExternalData = &jsonStr
		}
	}

	payment.UpdatedAt = time.Now()
}

// GetAvailableCurrencies returns supported currencies for OxaPay
func (o *OxaPayService) GetAvailableCurrencies() []string {
	// OxaPay supported cryptocurrencies
	return []string{
		"BTC",    // Bitcoin
		"ETH",    // Ethereum
		"USDT",   // Tether (TRC20/ERC20/BEP20)
		"USDC",   // USD Coin
		"LTC",    // Litecoin
		"BCH",    // Bitcoin Cash
		"BNB",    // Binance Coin
		"TRX",    // TRON
		"DOGE",   // Dogecoin
		"ADA",    // Cardano
		"XRP",    // Ripple
		"SOL",    // Solana
		"MATIC",  // Polygon
		"AVAX",   // Avalanche
		"DOT",    // Polkadot
	}
}

// GetLifetimePlan returns the single lifetime premium plan
func (o *OxaPayService) GetLifetimePlan() models.PricingPlan {
	return models.PricingPlan{
		ID:          "premium_lifetime",
		Name:        "Premium Lifetime",
		Description: "One-time payment for lifetime premium access",
		Price:       5.00,
		Currency:    "USD",
		Interval:    "lifetime",
		Features: []string{
			"Lifetime premium access",
			"Unlimited profile views",
			"Advanced analytics (30 days)",
			"Priority support",
			"Custom themes",
			"No branding",
			"All future premium features",
		},
	}
}