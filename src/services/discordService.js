import { API_BASE_URL } from '../config/api'

// Discord service for handling Discord OAuth2 integration
class DiscordService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  // Get authorization headers for httpOnly cookie authentication
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json'
    }
  }
  
  // Get fetch options with credentials for httpOnly cookies
  getFetchOptions(method = 'GET', body = null) {
    const options = {
      method,
      credentials: 'include', // Include httpOnly cookies
      headers: this.getAuthHeaders()
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    return options
  }

  // Initiate Discord OAuth2 flow
  async initiateDiscordAuth() {
    try {
      const response = await fetch(`${this.baseURL}/discord/auth`, this.getFetchOptions('POST'))

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate Discord authentication')
      }

      if (data.success && data.data.auth_url) {
        // Open Discord OAuth2 URL in the same window
        window.location.href = data.data.auth_url
        return { success: true, authUrl: data.data.auth_url }
      }

      throw new Error('Invalid response from server')
    } catch (error) {
      console.error('Discord auth initiation failed:', error)
      throw error
    }
  }

  // Get current Discord connection status
  async getDiscordStatus() {
    try {
      const response = await fetch(`${this.baseURL}/discord/status`, this.getFetchOptions('GET'))

      const data = await response.json()


      if (!response.ok) {
        throw new Error(data.message || 'Failed to get Discord status')
      }

      return data.data
    } catch (error) {
      console.error('Failed to get Discord status:', error)
      throw error
    }
  }

  // Disconnect Discord account
  async disconnectDiscord() {
    try {
      const response = await fetch(`${this.baseURL}/discord/disconnect`, this.getFetchOptions('POST'))

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to disconnect Discord')
      }

      return data
    } catch (error) {
      console.error('Failed to disconnect Discord:', error)
      throw error
    }
  }

  // Refresh Discord data (booster status, etc.)
  async refreshDiscordData() {
    try {
      const response = await fetch(`${this.baseURL}/discord/refresh`, this.getFetchOptions('POST'))

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to refresh Discord data')
      }

      return data.data
    } catch (error) {
      console.error('Failed to refresh Discord data:', error)
      throw error
    }
  }

  // Check if Discord connection was successful (for redirect handling)
  checkConnectionSuccess() {
    const urlParams = new URLSearchParams(window.location.search)
    const connected = urlParams.get('discord_connected')
    
    if (connected === 'true') {
      // Clean up URL
      const url = new URL(window.location)
      url.searchParams.delete('discord_connected')
      window.history.replaceState({}, document.title, url.toString())
      
      return true
    }
    
    return false
  }
}

export default new DiscordService()