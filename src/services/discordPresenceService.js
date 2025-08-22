// Discord Presence service for real-time Discord status tracking
class DiscordPresenceService {
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

  // Get presence status for a specific Discord user ID
  async getUserPresence(discordUserID) {
    try {
      const response = await fetch(`${this.baseURL}/discord-bot/presence/${discordUserID}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get user presence')
      }

      return data.data
    } catch (error) {
      console.error('Failed to get Discord presence:', error)
      return null
    }
  }

  // Get all tracked presences (admin function)
  async getAllPresences() {
    try {
      const response = await fetch(`${this.baseURL}/discord-bot/presences`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get all presences')
      }

      return data.data
    } catch (error) {
      console.error('Failed to get all presences:', error)
      return {}
    }
  }

  // Get Discord bot status
  async getBotStatus() {
    try {
      const response = await fetch(`${this.baseURL}/discord-bot/status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get bot status')
      }

      return data.data
    } catch (error) {
      console.error('Failed to get bot status:', error)
      return { running: false }
    }
  }

  // Convert Discord status to display information
  getStatusDisplay(status) {
    const statusInfo = {
      online: {
        color: '#43b581',
        icon: '🟢',
        text: 'Online',
        description: 'User is online and active'
      },
      idle: {
        color: '#faa61a',
        icon: '🟡',
        text: 'Idle',
        description: 'User is away or inactive'
      },
      dnd: {
        color: '#f04747',
        icon: '🔴',
        text: 'Do Not Disturb',
        description: 'User does not want to be disturbed'
      },
      offline: {
        color: '#747f8d',
        icon: '⚫',
        text: 'Offline',
        description: 'User is offline or invisible'
      }
    }

    return statusInfo[status] || statusInfo.offline
  }

  // Get activity type display
  getActivityDisplay(activity) {
    const activityTypes = {
      0: { prefix: 'Playing', icon: '🎮' },
      1: { prefix: 'Streaming', icon: '🔴' },
      2: { prefix: 'Listening to', icon: '🎵' },
      3: { prefix: 'Watching', icon: '📺' },
      4: { prefix: '', icon: '💭' }, // Custom status
      5: { prefix: 'Competing in', icon: '🏆' }
    }

    const activityType = activityTypes[activity.type] || activityTypes[0]
    
    return {
      ...activityType,
      name: activity.name,
      url: activity.url
    }
  }

  // Format last seen time
  formatLastSeen(lastSeen) {
    if (!lastSeen) return 'Unknown'
    
    const now = new Date()
    const lastSeenDate = new Date(lastSeen)
    const diffMs = now - lastSeenDate
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return lastSeenDate.toLocaleDateString()
  }

  // Check if presence data is recent (within last 5 minutes)
  isPresenceRecent(updatedAt) {
    if (!updatedAt) return false
    
    const now = new Date()
    const updated = new Date(updatedAt)
    const diffMs = now - updated
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    return diffMinutes < 5
  }
}

export default new DiscordPresenceService()