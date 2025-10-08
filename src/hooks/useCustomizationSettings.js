import { useState, useEffect, useCallback } from 'react'
import logger from '../utils/logger'
import { API_BASE_URL } from '../config/api'

const defaultSettings = {
  // Basic Theme
  theme: 'dark',
  accentColor: '#58A4B0',
  textColor: '#FFFFFF',
  backgroundColor: '#0F0F23',
  primaryColor: '#58A4B0',
  secondaryColor: '#EC4899',
  iconColor: '#FFFFFF',
  backgroundUrl: '',
  avatarUrl: '',
  // Profile
  description: '',
  bio: '',
  // Effects
  backgroundEffect: 'particles',
  usernameEffect: 'glow',
  enableAnimations: true,
  // Visual Settings
  profileOpacity: 90,
  profileBlur: 0,
  profileGradient: true,
  // Glow Effects
  glowUsername: false,
  glowSocials: false,
  glowBadges: false,
  showBadges: true,
  // Advanced Effects
  monochromeIcons: false,
  swapBoxColors: false,
  // Audio
  audioUrl: '',
  volumeLevel: 50,
  volumeControl: true,
  // Discord Integration
  discordPresence: false,
  useDiscordAvatar: false,
  discordAvatarDecoration: false,
  // Cursor
  cursorUrl: ''
}

export const useCustomizationSettings = () => {
  const [settings, setSettings] = useState(defaultSettings)
  const [originalSettings, setOriginalSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  // Load settings from API
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) {
        throw new Error('No session found')
      }

      const response = await fetch(`${API_BASE_URL}/customization/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success && data.data && data.data.settings) {
        const loadedSettings = { ...defaultSettings, ...data.data.settings }
        setSettings(loadedSettings)
        setOriginalSettings(JSON.parse(JSON.stringify(loadedSettings)))
      }
    } catch (error) {
      logger.error('Failed to load customization settings:', error)
      setSettings(defaultSettings)
      setOriginalSettings(JSON.parse(JSON.stringify(defaultSettings)))
    } finally {
      setLoading(false)
    }
  }, [])

  // Save settings to API
  const saveSettings = useCallback(async (showNotification = true) => {
    try {
      setSaving(true)
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) {
        throw new Error('No session found. Please log in again.')
      }

      const response = await fetch(`${API_BASE_URL}/customization/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          // Basic Theme
          theme: settings.theme,
          accent_color: settings.accentColor,
          text_color: settings.textColor,
          background_color: settings.backgroundColor,
          primary_color: settings.primaryColor,
          secondary_color: settings.secondaryColor,
          icon_color: settings.iconColor,
          // Profile Information
          description: settings.description || '',
          bio: settings.bio || '',
          // Effects
          background_effect: settings.backgroundEffect,
          username_effect: settings.usernameEffect,
          show_badges: settings.showBadges,
          // Visual Settings
          profile_blur: settings.profileBlur,
          profile_opacity: settings.profileOpacity,
          profile_gradient: settings.profileGradient,
          // Glow Effects
          glow_username: settings.glowUsername,
          glow_socials: settings.glowSocials,
          glow_badges: settings.glowBadges,
          // Animations & Effects
          animated_title: settings.animatedTitle,
          monochrome_icons: settings.monochromeIcons,
          swap_box_colors: settings.swapBoxColors,
          // Audio
          audio_url: settings.audioUrl,
          volume_level: settings.volumeLevel,
          volume_control: settings.volumeControl,
          // Discord Integration
          discord_presence: settings.discordPresence,
          use_discord_avatar: settings.useDiscordAvatar,
          discord_avatar_decoration: settings.discordAvatarDecoration,
          // Asset URLs
          background_url: settings.backgroundUrl,
          cursor_url: settings.cursorUrl
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Save failed' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        setOriginalSettings(JSON.parse(JSON.stringify(settings)))
        setHasUnsavedChanges(false)
        return true
      } else {
        throw new Error(data.message || 'Save failed')
      }
    } catch (error) {
      logger.error('Failed to save customization settings', error)
      return false
    } finally {
      setSaving(false)
    }
  }, [settings])

  // Direct save function for audio settings - bypasses unsaved changes dialog
  const saveAudioSettings = useCallback(async () => {
    try {
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) return

      const response = await fetch(`${API_BASE_URL}/customization/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          // Only save audio-related fields
          audio_url: settings.audioUrl,
          volume_level: settings.volumeLevel,
          volume_control: settings.volumeControl,
          // Include other required fields to avoid validation errors
          theme: settings.theme,
          accent_color: settings.accentColor,
          text_color: settings.textColor,
          background_color: settings.backgroundColor,
          primary_color: settings.primaryColor,
          secondary_color: settings.secondaryColor,
          icon_color: settings.iconColor,
          description: settings.description || '',
          bio: settings.bio || '',
          background_effect: settings.backgroundEffect,
          username_effect: settings.usernameEffect,
          show_badges: settings.showBadges,
          profile_blur: settings.profileBlur,
          profile_opacity: settings.profileOpacity,
          profile_gradient: settings.profileGradient,
          glow_username: settings.glowUsername,
          glow_socials: settings.glowSocials,
          glow_badges: settings.glowBadges,
          animated_title: settings.animatedTitle,
          monochrome_icons: settings.monochromeIcons,
          swap_box_colors: settings.swapBoxColors,
          discord_presence: settings.discordPresence,
          use_discord_avatar: settings.useDiscordAvatar,
          discord_avatar_decoration: settings.discordAvatarDecoration,
          background_url: settings.backgroundUrl,
          cursor_url: settings.cursorUrl
        })
      })

      if (response.ok) {
        // Update originalSettings to reflect the saved state
        setOriginalSettings(JSON.parse(JSON.stringify(settings)))
        setHasUnsavedChanges(false)
      }
    } catch (error) {
      logger.error('Failed to save audio settings:', error)
    }
  }, [settings])

  // Validation function
  const validateSetting = useCallback((key, value) => {
    const errors = {}
    
    switch (key) {
      case 'accentColor':
      case 'textColor':
      case 'backgroundColor':
        if (value && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
          errors[key] = 'Must be a valid hex color (e.g., #FF0000)'
        }
        break
      case 'profileOpacity':
        if (value < 0 || value > 100) {
          errors[key] = 'Opacity must be between 0 and 100'
        }
        break
      case 'profileBlur':
        if (value < 0 || value > 50) {
          errors[key] = 'Blur must be between 0 and 50'
        }
        break
      case 'volumeLevel':
        if (value < 0 || value > 100) {
          errors[key] = 'Volume must be between 0 and 100'
        }
        break
    }
    
    setValidationErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }, [])

  // Detect changes
  useEffect(() => {
    if (!loading && originalSettings) {
      const currentSettingsStr = JSON.stringify(settings)
      const originalSettingsStr = JSON.stringify(originalSettings)
      const hasChanges = currentSettingsStr !== originalSettingsStr
      
      setHasUnsavedChanges(hasChanges)
    }
  }, [settings, loading, originalSettings])

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    setSettings,
    originalSettings,
    loading,
    saving,
    hasUnsavedChanges,
    validationErrors,
    saveSettings,
    saveAudioSettings,
    validateSetting,
    loadSettings
  }
}