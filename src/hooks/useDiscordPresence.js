import { useState, useEffect, useCallback } from 'react'
import discordPresenceService from '../services/discordPresenceService'

export const useDiscordPresence = (discordUserID) => {
  const [presence, setPresence] = useState(null)
  const [badges, setBadges] = useState({ badges: [], count: 0 })
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [badgesLoading, setBadgesLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch presence data
  const fetchPresence = useCallback(async () => {
    if (!discordUserID) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const presenceData = await discordPresenceService.getUserPresence(discordUserID)
      setPresence(presenceData)
    } catch (err) {
      setError(err.message)
      setPresence(null)
    } finally {
      setLoading(false)
    }
  }, [discordUserID])

  // Fetch Discord badges
  const fetchBadges = useCallback(async () => {
    if (!discordUserID) {
      setBadgesLoading(false)
      return
    }

    try {
      const badgesData = await discordPresenceService.getUserBadges(discordUserID)
      setBadges(badgesData)
    } catch (err) {
      console.error('Failed to fetch Discord badges:', err)
      setBadges({ badges: [], count: 0 })
    } finally {
      setBadgesLoading(false)
    }
  }, [discordUserID])

  // Fetch Discord user info
  const fetchUserInfo = useCallback(async () => {
    if (!discordUserID) {
      setUserLoading(false)
      return
    }

    try {
      const userData = await discordPresenceService.getDiscordUser(discordUserID)
      setUserInfo(userData)
    } catch (err) {
      console.error('Failed to fetch Discord user info:', err)
      setUserInfo(null)
    } finally {
      setUserLoading(false)
    }
  }, [discordUserID])

  // Initial fetch
  useEffect(() => {
    fetchPresence()
    fetchBadges()
    fetchUserInfo()
  }, [fetchPresence, fetchBadges, fetchUserInfo])

  // Auto-refresh presence every 30 seconds
  useEffect(() => {
    if (!discordUserID) return

    const interval = setInterval(() => {
      fetchPresence()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [discordUserID, fetchPresence])

  return {
    presence,
    badges,
    userInfo,
    loading,
    badgesLoading,
    userLoading,
    error,
    refetch: fetchPresence,
    refetchBadges: fetchBadges,
    refetchUserInfo: fetchUserInfo,
    // Helper functions
    getStatusDisplay: (status) => discordPresenceService.getStatusDisplay(status),
    getActivityDisplay: (activity) => discordPresenceService.getActivityDisplay(activity),
    formatLastSeen: (lastSeen) => discordPresenceService.formatLastSeen(lastSeen),
    isPresenceRecent: (updatedAt) => discordPresenceService.isPresenceRecent(updatedAt),
    getBadgeDisplay: (badge) => discordPresenceService.getBadgeDisplay(badge),
    getRarityColor: (rarity) => discordPresenceService.getRarityColor(rarity),
    getDiscordAvatarURL: (userID, avatarHash, size) => discordPresenceService.getDiscordAvatarURL(userID, avatarHash, size)
  }
}

// Hook for bot status
export const useDiscordBotStatus = () => {
  const [botStatus, setBotStatus] = useState({ running: false })
  const [loading, setLoading] = useState(true)

  const fetchBotStatus = useCallback(async () => {
    try {
      const status = await discordPresenceService.getBotStatus()
      setBotStatus(status)
    } catch (err) {
      console.error('Failed to fetch bot status:', err)
      setBotStatus({ running: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBotStatus()
    
    // Check bot status every minute
    const interval = setInterval(fetchBotStatus, 60000)
    return () => clearInterval(interval)
  }, [fetchBotStatus])

  return {
    botStatus,
    loading,
    refetch: fetchBotStatus
  }
}

// Hook for all presences (admin use)
export const useAllDiscordPresences = () => {
  const [presences, setPresences] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAllPresences = useCallback(async () => {
    try {
      setError(null)
      const allPresences = await discordPresenceService.getAllPresences()
      setPresences(allPresences)
    } catch (err) {
      setError(err.message)
      setPresences({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllPresences()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAllPresences, 30000)
    return () => clearInterval(interval)
  }, [fetchAllPresences])

  return {
    presences,
    loading,
    error,
    refetch: fetchAllPresences
  }
}