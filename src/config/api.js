// Centralized API configuration
const isDev = import.meta.env.DEV
export const API_BASE_URL = import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:8080/api' : 'https://gotchu-lol.onrender.com/api')

// Debug logging
console.log('API Configuration:', {
  isDev,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL
})

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    ...options,
  }

  const response = await fetch(url, defaultOptions)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

// Export for backward compatibility
export default API_BASE_URL