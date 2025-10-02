// API configuration utility
const getBaseURL = () => {
  // In development, use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:8080'
  }
  
  // In production, use the same domain (relative URLs)
  return ''
}

export const API_BASE_URL = getBaseURL()

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  return fetch(url, { ...defaultOptions, ...options })
}

// Payment API endpoints
export const PaymentAPI = {
  getCurrencies: () => apiCall('/api/payments/currencies'),
  
  createPayment: (planId, currency) => 
    apiCall('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, currency })
    }),
  
  getPaymentStatus: (paymentId) => 
    apiCall(`/api/payments/${paymentId}/status`),
  
  getPlans: () => apiCall('/api/payments/plans'),
  
  getPaymentHistory: () => apiCall('/api/payments/history'),
  
  getSubscription: () => apiCall('/api/payments/subscription'),
}