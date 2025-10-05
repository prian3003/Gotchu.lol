import { API_BASE_URL } from '../config/api'

// Discord Presence service for real-time Discord status tracking
class DiscordPresenceService {
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
  getFetchOptions(method = 'GET') {
    return {
      method,
      credentials: 'include', // Include httpOnly cookies
      headers: this.getAuthHeaders()
    }
  }

  // Get presence status for a specific Discord user ID
  async getUserPresence(discordUserID) {
    try {
      const response = await fetch(`${this.baseURL}/discord-bot/presence/${discordUserID}`, this.getFetchOptions('GET'))

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
      const response = await fetch(`${this.baseURL}/discord-bot/presences`, this.getFetchOptions('GET'))

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

  // Get Discord badges for a specific Discord user ID
  async getUserBadges(discordUserID) {
    try {
      const response = await fetch(`${this.baseURL}/discord-bot/badges/${discordUserID}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get Discord badges')
      }

      return data.data
    } catch (error) {
      console.error('Failed to get Discord badges:', error)
      return { badges: [], count: 0 }
    }
  }

  // Get Discord user info for a specific Discord user ID
  async getDiscordUser(discordUserID) {
    try {
      const response = await fetch(`${this.baseURL}/discord-bot/user/${discordUserID}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get Discord user info')
      }

      return data.data
    } catch (error) {
      console.error('Failed to get Discord user info:', error)
      return null
    }
  }

  // Generate Discord avatar URL
  getDiscordAvatarURL(userID, avatarHash, size = 128) {
    if (!userID) return null
    
    if (!avatarHash || avatarHash === '') {
      // Default avatar - use modulo of user ID
      const defaultNum = (parseInt(userID) % 5)
      return `https://cdn.discordapp.com/embed/avatars/${defaultNum}.png`
    }

    // Check if it's an animated avatar
    const extension = avatarHash.startsWith('a_') ? 'gif' : 'png'
    return `https://cdn.discordapp.com/avatars/${userID}/${avatarHash}.${extension}?size=${size}`
  }

  // Get badge display information
  getBadgeDisplay(badge) {
    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      rarity: this.getBadgeRarity(badge.id)
    }
  }

  // Determine badge rarity based on badge type
  getBadgeRarity(badgeId) {
    const rarityMap = {
      'discord_employee': 'legendary',
      'discord_partner': 'epic',
      'certified_mod': 'epic',
      'bug_hunter_2': 'rare',
      'early_bot_dev': 'rare',
      'hypesquad_events': 'uncommon',
      'bug_hunter_1': 'uncommon',
      'early_supporter': 'uncommon',
      'house_bravery': 'common',
      'house_brilliance': 'common',
      'house_balance': 'common'
    }

    return rarityMap[badgeId] || 'common'
  }

  // Get rarity color for styling
  getRarityColor(rarity) {
    const rarityColors = {
      'legendary': '#ff8c00',
      'epic': '#9d5bd8',
      'rare': '#4a90e2',
      'uncommon': '#57c765',
      'common': '#747f8d'
    }

    return rarityColors[rarity] || '#747f8d'
  }
}

export default new DiscordPresenceService()