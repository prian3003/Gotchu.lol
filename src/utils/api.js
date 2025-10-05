import { API_BASE_URL as BASE_URL } from '../config/api'

// Re-export for backward compatibility
export const API_BASE_URL = BASE_URL.replace('/api', '')

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