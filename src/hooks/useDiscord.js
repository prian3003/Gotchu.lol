import { useState, useEffect, useCallback } from 'react'
import discordService from '../services/discordService'

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

  // Fetch Discord status
  const fetchDiscordStatus = useCallback(async () => {
    try {
      setDiscordStatus(prev => ({ ...prev, loading: true, error: null }))
      const status = await discordService.getDiscordStatus()
      setDiscordStatus(prev => ({ ...prev, ...status, loading: false }))
    } catch (error) {
      console.error('Failed to fetch Discord status:', error)
      setDiscordStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to fetch Discord status'
      }))
    }
  }, [])

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

      // Also fetch fresh status from server to ensure consistency
      setTimeout(() => {
        fetchDiscordStatus()
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
      const refreshedData = await discordService.refreshDiscordData()
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
        // Refresh status after successful connection
        setTimeout(fetchDiscordStatus, 500) // Small delay to ensure backend is updated
      } else {
        fetchDiscordStatus()
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
    refetchStatus: fetchDiscordStatus
  }
}