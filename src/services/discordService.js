// Discord service for handling Discord OAuth2 integration
class DiscordService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
  }

  // Get authorization headers
  getAuthHeaders() {
    const token = localStorage.getItem('authToken')
    const sessionId = localStorage.getItem('sessionId')
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Session-ID': sessionId || ''
    }
  }

  // Initiate Discord OAuth2 flow
  async initiateDiscordAuth() {
    try {
      const response = await fetch(`${this.baseURL}/discord/auth`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      })

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
      const response = await fetch(`${this.baseURL}/discord/status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()

      console.log('DEBUG: Discord status response:', response.status, data)

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get Discord status')
      }

      console.log('DEBUG: Discord status data:', data.data)
      return data.data
    } catch (error) {
      console.error('Failed to get Discord status:', error)
      throw error
    }
  }

  // Disconnect Discord account
  async disconnectDiscord() {
    try {
      const response = await fetch(`${this.baseURL}/discord/disconnect`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      })

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
      const response = await fetch(`${this.baseURL}/discord/refresh`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      })

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