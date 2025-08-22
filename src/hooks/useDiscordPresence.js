import { useState, useEffect, useCallback } from 'react'
import discordPresenceService from '../services/discordPresenceService'

export const useDiscordPresence = (discordUserID) => {
  const [presence, setPresence] = useState(null)
  const [loading, setLoading] = useState(true)
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

  // Initial fetch
  useEffect(() => {
    fetchPresence()
  }, [fetchPresence])

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
    loading,
    error,
    refetch: fetchPresence,
    // Helper functions
    getStatusDisplay: (status) => discordPresenceService.getStatusDisplay(status),
    getActivityDisplay: (activity) => discordPresenceService.getActivityDisplay(activity),
    formatLastSeen: (lastSeen) => discordPresenceService.formatLastSeen(lastSeen),
    isPresenceRecent: (updatedAt) => discordPresenceService.isPresenceRecent(updatedAt)
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