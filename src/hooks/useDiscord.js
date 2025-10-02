import { useState, useEffect, useCallback } from 'react'
import discordService from '../services/discordService'

// Global cache for Discord status to prevent unnecessary API calls
let globalDiscordCache = null
let cacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

export const useDiscord = () => {
  const [discordStatus, setDiscordStatus] = useState({
    connected: false,
    discord_id: null,
    discord_username: null,
    is_booster: false,
    boosting_since: null,
    avatar_url: null,
    use_discord_avatar: false,
    discord_presence: false,
    avatar_decoration: false,
    loading: true,
    error: null
  })

  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    return globalDiscordCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)
  }, [])

  // Fetch Discord status with caching
  const fetchDiscordStatus = useCallback(async (forceRefresh = false) => {
    try {
      // Use cache if valid and not forcing refresh
      if (!forceRefresh && isCacheValid()) {
        setDiscordStatus(prev => ({ ...prev, ...globalDiscordCache, loading: false }))
        return
      }

      setDiscordStatus(prev => ({ ...prev, loading: true, error: null }))
      const status = await discordService.getDiscordStatus()
      
      // Update global cache
      globalDiscordCache = status
      cacheTimestamp = Date.now()
      
      setDiscordStatus(prev => ({ ...prev, ...status, loading: false }))
    } catch (error) {
      console.error('Failed to fetch Discord status:', error)
      setDiscordStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to fetch Discord status'
      }))
    }
  }, [isCacheValid])

  // Connect Discord account
  const connectDiscord = useCallback(async () => {
    try {
      setConnecting(true)
      await discordService.initiateDiscordAuth()
      // The service will redirect to Discord, so no need to update state here
    } catch (error) {
      console.error('Failed to connect Discord:', error)
      setDiscordStatus(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to connect Discord'
      }))
      setConnecting(false)
    }
  }, [])

  // Disconnect Discord account
  const disconnectDiscord = useCallback(async () => {
    try {
      setDisconnecting(true)
      await discordService.disconnectDiscord()
      
      // Invalidate cache
      globalDiscordCache = null
      cacheTimestamp = null
      
      // Immediately update status to reflect disconnection
      setDiscordStatus(prev => ({
        ...prev,
        connected: false,
        discord_id: null,
        discord_username: null,
        is_booster: false,
        boosting_since: null,
        avatar_url: null,
        use_discord_avatar: false,
        discord_presence: false,
        avatar_decoration: false,
        error: null
      }))

      // Force refresh from server to ensure consistency
      setTimeout(() => {
        fetchDiscordStatus(true) // Force refresh
      }, 100)
    } catch (error) {
      console.error('Failed to disconnect Discord:', error)
      setDiscordStatus(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to disconnect Discord'
      }))
    } finally {
      setDisconnecting(false)
    }
  }, [fetchDiscordStatus])

  // Refresh Discord data
  const refreshDiscordData = useCallback(async () => {
    try {
      // Invalidate cache since we're refreshing
      globalDiscordCache = null
      cacheTimestamp = null
      
      const refreshedData = await discordService.refreshDiscordData()
      
      // Update cache with fresh data
      globalDiscordCache = refreshedData
      cacheTimestamp = Date.now()
      
      setDiscordStatus(prev => ({ 
        ...prev, 
        ...refreshedData,
        error: null
      }))
      return refreshedData
    } catch (error) {
      console.error('Failed to refresh Discord data:', error)
      setDiscordStatus(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to refresh Discord data'
      }))
      throw error
    }
  }, [])

  // Check for successful connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      // Check if we just returned from Discord OAuth
      if (discordService.checkConnectionSuccess()) {
        // Invalidate cache and force refresh after successful connection
        globalDiscordCache = null
        cacheTimestamp = null
        setTimeout(() => fetchDiscordStatus(true), 500) // Force refresh with delay
      } else {
        // Normal mount - use cache if available
        fetchDiscordStatus(false) // Don't force refresh, use cache
      }
    }

    checkConnection()
  }, [fetchDiscordStatus])

  return {
    discordStatus,
    connecting,
    disconnecting,
    connectDiscord,
    disconnectDiscord,
    refreshDiscordData,
    refetchStatus: fetchDiscordStatus,
    forceRefreshStatus: () => fetchDiscordStatus(true), // Force refresh bypassing cache
    clearCache: () => {
      globalDiscordCache = null
      cacheTimestamp = null
    }
  }
}