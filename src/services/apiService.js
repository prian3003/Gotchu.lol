const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:8080/api'

// Helper function to get auth headers - now uses cookie authentication
const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json'
  }
}

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

// Auth API calls
export const authAPI = {
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Use httpOnly cookies for auth
      body: JSON.stringify(credentials)
    })
    return handleResponse(response)
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Use httpOnly cookies for auth
      body: JSON.stringify(userData)
    })
    return handleResponse(response)
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include' // Use httpOnly cookies for auth
    })
    return handleResponse(response)
  },

  refreshToken: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include' // Use httpOnly cookies for auth
    })
    return handleResponse(response)
  }
}

// User API calls
export const userAPI = {
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include' // Use httpOnly cookies for auth
    })
    return handleResponse(response)
  },

  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include', // Use httpOnly cookies for auth
      body: JSON.stringify(profileData)
    })
    return handleResponse(response)
  },

  uploadAvatar: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/user/avatar`, {
      method: 'POST',
      credentials: 'include', // Use httpOnly cookies for auth
      body: formData
    })
    return handleResponse(response)
  },

  deleteAccount: async () => {
    const response = await fetch(`${API_BASE_URL}/user/delete`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include' // Use httpOnly cookies for auth
    })
    return handleResponse(response)
  },

  exportData: async () => {
    const response = await fetch(`${API_BASE_URL}/user/export`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include' // Use httpOnly cookies for auth
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Export failed' }))
      throw new Error(errorData.message || 'Failed to export data')
    }
    
    return response.blob()
  },

  getPublicProfile: async (username) => {
    const response = await fetch(`${API_BASE_URL}/users/${username}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Use httpOnly cookies for auth
    })
    return handleResponse(response)
  }
}

// Dashboard API calls
export const dashboardAPI = {
  getDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include' // Use httpOnly cookies for auth
    })
    return handleResponse(response)
  },

  getAnalytics: async (timeframe = '7d') => {
    const response = await fetch(`${API_BASE_URL}/analytics?timeframe=${timeframe}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include' // Use httpOnly cookies for auth
    })
    return handleResponse(response)
  }
}

// Links API calls
export const linksAPI = {
  getLinks: async () => {
    const response = await fetch(`${API_BASE_URL}/links`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include' // Use httpOnly cookies for auth
    })
    return handleResponse(response)
  },

  createLink: async (linkData) => {
    const response = await fetch(`${API_BASE_URL}/links`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include', // Use httpOnly cookies for auth
      body: JSON.stringify(linkData)
    })
    return handleResponse(response)
  },

  updateLink: async (linkId, linkData) => {
    const response = await fetch(`${API_BASE_URL}/links/${linkId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include', // Use httpOnly cookies for auth
      body: JSON.stringify(linkData)
    })
    return handleResponse(response)
  },

  deleteLink: async (linkId) => {
    const response = await fetch(`${API_BASE_URL}/links/${linkId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include' // Use httpOnly cookies for auth
    })
    return handleResponse(response)
  },

  trackClick: async (linkId, metadata = {}) => {
    const response = await fetch(`${API_BASE_URL}/links/${linkId}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_agent: navigator.userAgent,
        referer: window.location.href,
        ...metadata
      })
    })
    // Don't throw on click tracking errors - it's fire and forget
    return response.ok ? response.json() : null
  }
}

// Customization API calls
export const customizationAPI = {
  getSettings: async () => {
    const response = await fetch(`${API_BASE_URL}/customization`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include' // Use httpOnly cookies for auth
    })
    return handleResponse(response)
  },

  updateSettings: async (settings) => {
    const response = await fetch(`${API_BASE_URL}/customization`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include', // Use httpOnly cookies for auth
      body: JSON.stringify(settings)
    })
    return handleResponse(response)
  },

  uploadBackground: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/customization/background`, {
      method: 'POST',
      credentials: 'include', // Use httpOnly cookies for auth
      body: formData
    })
    return handleResponse(response)
  },

  uploadAudio: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/customization/audio`, {
      method: 'POST',
      credentials: 'include', // Use httpOnly cookies for auth
      body: formData
    })
    return handleResponse(response)
  },

  uploadCursor: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/customization/cursor`, {
      method: 'POST',
      credentials: 'include', // Use httpOnly cookies for auth
      body: formData
    })
    return handleResponse(response)
  },

  resetSettings: async () => {
    const response = await fetch(`${API_BASE_URL}/customization/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include' // Use httpOnly cookies for auth
    })
    return handleResponse(response)
  }
}

// Utility functions for common patterns
export const apiUtils = {
  // Retry mechanism for failed requests
  retryRequest: async (apiCall, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall()
      } catch (error) {
        if (i === maxRetries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  },

  // Batch requests helper
  batchRequests: async (requests) => {
    return Promise.allSettled(requests)
  },

  // Check if error is due to auth failure
  isAuthError: (error) => {
    return error.message.includes('401') || 
           error.message.includes('Unauthorized') ||
           error.message.includes('Invalid token')
  },

  // Format error messages for user display
  formatErrorMessage: (error) => {
    if (typeof error === 'string') return error
    if (error.message) return error.message
    return 'An unexpected error occurred'
  }
}

// Default export with all APIs grouped
const apiService = {
  auth: authAPI,
  user: userAPI,
  dashboard: dashboardAPI,
  links: linksAPI,
  customization: customizationAPI,
  utils: apiUtils
}

export default apiService