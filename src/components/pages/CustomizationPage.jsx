import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { useTheme } from '../../contexts/ThemeContext'
import { useToast } from '../ui/Toast'
import logger from '../../utils/logger'
import AudioManager from '../customization/AudioManager'
import AssetThumbnail from '../customization/AssetThumbnail'
import { deleteAsset, getAssetFilePath, getAssetTypeFromUrl } from '../../utils/assetUtils'
import { SimpleIconComponent } from '../../utils/simpleIconsHelper.jsx'
import { useDiscord } from '../../hooks/useDiscord'
import { useAuth } from '../../contexts/AuthContext'
import {
  HiUser,
  HiCog,
  HiSparkles,
  HiSpeakerWave,
  HiCamera,
  HiCursorArrowRays,
  HiArrowLeft,
  HiCheck,
  HiXMark,
  HiLightBulb,
  HiPaintBrush,
  HiMusicalNote,
  HiPhoto,
  HiAdjustmentsHorizontal,
  HiPresentationChartLine,
  HiStar,
  HiRocketLaunch,
  HiShieldCheck,
  HiGlobeAlt,
  HiExclamationTriangle,
  HiInformationCircle,
  HiClock,
  HiPencilSquare,
  HiDocumentText,HiEye,HiSwatch,HiEyeSlash
} from 'react-icons/hi2'

// Popular Google Fonts list
const GOOGLE_FONTS = [
  { name: 'Default', family: '', category: 'System' },
  { name: 'Inter', family: 'Inter', category: 'Sans Serif' },
  { name: 'Roboto', family: 'Roboto', category: 'Sans Serif' },
  { name: 'Open Sans', family: 'Open Sans', category: 'Sans Serif' },
  { name: 'Lato', family: 'Lato', category: 'Sans Serif' },
  { name: 'Poppins', family: 'Poppins', category: 'Sans Serif' },
  { name: 'Montserrat', family: 'Montserrat', category: 'Sans Serif' },
  { name: 'Source Sans Pro', family: 'Source Sans Pro', category: 'Sans Serif' },
  { name: 'Nunito', family: 'Nunito', category: 'Sans Serif' },
  { name: 'DM Sans', family: 'DM Sans', category: 'Sans Serif' },
  { name: 'Playfair Display', family: 'Playfair Display', category: 'Serif' },
  { name: 'Merriweather', family: 'Merriweather', category: 'Serif' },
  { name: 'Lora', family: 'Lora', category: 'Serif' },
  { name: 'PT Serif', family: 'PT Serif', category: 'Serif' },
  { name: 'Crimson Text', family: 'Crimson Text', category: 'Serif' },
  { name: 'Fira Code', family: 'Fira Code', category: 'Monospace' },
  { name: 'JetBrains Mono', family: 'JetBrains Mono', category: 'Monospace' },
  { name: 'Source Code Pro', family: 'Source Code Pro', category: 'Monospace' },
  { name: 'Space Mono', family: 'Space Mono', category: 'Monospace' },
  { name: 'Dancing Script', family: 'Dancing Script', category: 'Handwriting' },
  { name: 'Pacifico', family: 'Pacifico', category: 'Handwriting' },
  { name: 'Great Vibes', family: 'Great Vibes', category: 'Handwriting' },
  { name: 'Lobster', family: 'Lobster', category: 'Display' },
  { name: 'Bebas Neue', family: 'Bebas Neue', category: 'Display' },
  { name: 'Righteous', family: 'Righteous', category: 'Display' }
]

// Function to load Google Fonts dynamically
const loadGoogleFont = (fontFamily) => {
  if (!fontFamily) return
  
  const existingLink = document.querySelector(`link[href*="${fontFamily.replace(/ /g, '+')}"]`)
  if (existingLink) return
  
  const link = document.createElement('link')
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

const CustomizationPage = ({ onBack }) => {
  const { colors, isDarkMode } = useTheme()
  const { user } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('appearance') // Temporarily restored for syntax
  const [showAudioModal, setShowAudioModal] = useState(false)
  const [showFontModal, setShowFontModal] = useState(false)
  const [tempSelectedFont, setTempSelectedFont] = useState('')
  const [showUsernameEffectsModal, setShowUsernameEffectsModal] = useState(false)
  const [tempSelectedUsernameEffect, setTempSelectedUsernameEffect] = useState('')
  
  // Discord integration
  const { discordStatus, connecting, connectDiscord, disconnectDiscord, disconnecting } = useDiscord()
  const [settings, setSettings] = useState({
    // Appearance
    theme: 'dark',
    accentColor: '#58A4B0',
    textColor: '#FFFFFF',
    backgroundColor: '#0F0F23',
    primaryColor: '#881c9c',
    secondaryColor: '#0d0d0d',
    iconColor: '#FFFFFF',
    backgroundUrl: '',
    avatarUrl: '',
    // Profile
    description: '',
    bio: '',
    username: '',
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
    autoPlay: false,
    // Discord Integration
    discordPresence: false,
    useDiscordAvatar: false,
    discordAvatarDecoration: false,
    // Advanced
    customCursor: '',
    // Typography
    textFont: '',
    
    // Splash Screen Settings
    enableSplashScreen: true,
    splashText: 'click here',
    splashFontSize: '3rem',
    splashAnimated: true,
    splashGlowEffect: false,
    splashShowParticles: true,
    splashAutoHide: false,
    splashAutoHideDelay: 5000,
    splashBackgroundVisible: true,
    splashBackgroundColor: '#0a0a0a',
    splashTransparent: false
  })

  // Removed tabs array since we're using a single page layout now - temporarily uncommented to fix syntax
  const tabs = [
    {
      id: 'appearance',
      label: 'Appearance',
      icon: HiPaintBrush,
      color: '#FF6B6B'
    },
    {
      id: 'effects',
      label: 'Effects',
      icon: HiSparkles,
      color: '#4ECDC4'
    },
    {
      id: 'media',
      label: 'Media',
      icon: HiMusicalNote,
      color: '#45B7D1'
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: HiAdjustmentsHorizontal,
      color: '#96CEB4'
    }
  ]

  const colorPresets = [
    { name: 'Ocean', color: '#58A4B0' },
    { name: 'Sunset', color: '#FF6B6B' },
    { name: 'Forest', color: '#4ECDC4' },
    { name: 'Royal', color: '#6C5CE7' },
    { name: 'Fire', color: '#FD79A8' },
    { name: 'Gold', color: '#FDCB6E' }
  ]

  const backgroundEffects = [
    { id: 'none', name: 'None', preview: '🚫' },
    { id: 'particles', name: 'Particles', preview: '✨' },
    { id: 'rain', name: 'Rain', preview: '🌧️' },
    { id: 'snow', name: 'Snow', preview: '❄️' }
  ]

  const usernameEffects = [
    { id: 'none', name: 'None', description: 'No special effects', free: true },
    { id: 'glow', name: 'Glow', description: 'Soft glowing effect', free: true },
    { id: 'rainbow', name: 'Rainbow', description: 'Multi-color gradient', free: false },
    { id: 'typewriter', name: 'Typewriter', description: 'Typing animation', free: false },
    { id: 'bounce', name: 'Bounce', description: 'Bouncing animation', free: false },
    { id: 'fade', name: 'Fade In', description: 'Fade-in animation', free: false },
    { id: 'sparkles', name: 'Green Sparkles', description: 'Sparkling particles', free: true }
  ]

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [originalSettings, setOriginalSettings] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [isValidating, setIsValidating] = useState(false)
  const [uploading, setUploading] = useState({})
  const [currentBio, setCurrentBio] = useState('')
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [showSaveError, setShowSaveError] = useState(false)
  const validationTimeoutRef = useRef(null)
  const fileInputRefs = useRef({
    backgroundImage: null,
    avatar: null,
    audio: null,
    cursor: null
  })
  
  const colorInputRefs = useRef({
    accentColor: null,
    textColor: null,
    backgroundColor: null,
    iconColor: null,
    primaryColor: null,
    secondaryColor: null
  })

  // Load settings on component mount 
  useEffect(() => {
    loadSettings()
  }, [])

  // Load Google Font when textFont setting changes
  useEffect(() => {
    if (settings.textFont) {
      loadGoogleFont(settings.textFont)
    }
  }, [settings.textFont]) // Only run once on mount

  // Setup beforeunload listener for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Add navigation handler to show unsaved dialog when navigating away
  const handleNavigation = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true)
      return false // Prevent navigation
    }
    return true // Allow navigation
  }, [hasUnsavedChanges])

  const loadSettings = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/customization/settings', {
        credentials: 'include', // Use httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.settings) {
          // Map backend snake_case fields to frontend camelCase fields
          const backendSettings = data.data.settings
          
          const loadedSettings = {
            ...settings,
            // Basic Theme
            theme: backendSettings.theme || settings.theme,
            accentColor: backendSettings.accent_color || settings.accentColor,
            textColor: backendSettings.text_color || settings.textColor,
            backgroundColor: backendSettings.background_color || settings.backgroundColor,
            primaryColor: backendSettings.primary_color || settings.primaryColor,
            secondaryColor: backendSettings.secondary_color || settings.secondaryColor,
            iconColor: backendSettings.icon_color || settings.iconColor,
            // Asset URLs
            backgroundUrl: backendSettings.background_url || settings.backgroundUrl,
            audioUrl: backendSettings.audio_url || settings.audioUrl,
            avatarUrl: backendSettings.avatar_url || data.data.user?.avatar_url || settings.avatarUrl,
            customCursor: backendSettings.cursor_url || settings.customCursor,
            // Typography
            textFont: backendSettings.text_font || settings.textFont,
            // Profile Information
            description: backendSettings.description || settings.description,
            bio: backendSettings.bio || settings.bio,
            username: data.data.user?.username || settings.username,
            // Effects
            backgroundEffect: backendSettings.background_effect || settings.backgroundEffect,
            usernameEffect: backendSettings.username_effect || settings.usernameEffect,
            showBadges: typeof backendSettings.show_badges === 'boolean' ? backendSettings.show_badges : settings.showBadges,
            // Visual Settings
            profileBlur: backendSettings.profile_blur !== undefined ? backendSettings.profile_blur : settings.profileBlur,
            profileOpacity: backendSettings.profile_opacity !== undefined ? backendSettings.profile_opacity : settings.profileOpacity,
            profileGradient: typeof backendSettings.profile_gradient === 'boolean' ? backendSettings.profile_gradient : settings.profileGradient,
            // Glow Effects
            glowUsername: typeof backendSettings.glow_username === 'boolean' ? backendSettings.glow_username : settings.glowUsername,
            glowSocials: typeof backendSettings.glow_socials === 'boolean' ? backendSettings.glow_socials : settings.glowSocials,
            glowBadges: typeof backendSettings.glow_badges === 'boolean' ? backendSettings.glow_badges : settings.glowBadges,
            // Animations & Effects
            enableAnimations: typeof backendSettings.animated_title === 'boolean' ? backendSettings.animated_title : settings.enableAnimations,
            monochromeIcons: typeof backendSettings.monochrome_icons === 'boolean' ? backendSettings.monochrome_icons : settings.monochromeIcons,
            swapBoxColors: typeof backendSettings.swap_box_colors === 'boolean' ? backendSettings.swap_box_colors : settings.swapBoxColors,
            // Audio
            volumeLevel: backendSettings.volume_level !== undefined ? backendSettings.volume_level : settings.volumeLevel,
            volumeControl: typeof backendSettings.volume_control === 'boolean' ? backendSettings.volume_control : settings.volumeControl,
            // Discord Integration
            discordPresence: typeof backendSettings.discord_presence === 'boolean' ? backendSettings.discord_presence : settings.discordPresence,
            useDiscordAvatar: typeof backendSettings.use_discord_avatar === 'boolean' ? backendSettings.use_discord_avatar : settings.useDiscordAvatar,
            discordAvatarDecoration: typeof backendSettings.discord_avatar_decoration === 'boolean' ? backendSettings.discord_avatar_decoration : settings.discordAvatarDecoration,
            
            // Splash Screen Settings
            enableSplashScreen: typeof backendSettings.enable_splash_screen === 'boolean' ? backendSettings.enable_splash_screen : settings.enableSplashScreen,
            splashText: backendSettings.splash_text || settings.splashText,
            splashFontSize: backendSettings.splash_font_size || settings.splashFontSize,
            splashAnimated: typeof backendSettings.splash_animated === 'boolean' ? backendSettings.splash_animated : settings.splashAnimated,
            splashGlowEffect: typeof backendSettings.splash_glow_effect === 'boolean' ? backendSettings.splash_glow_effect : settings.splashGlowEffect,
            splashShowParticles: typeof backendSettings.splash_show_particles === 'boolean' ? backendSettings.splash_show_particles : settings.splashShowParticles,
            splashAutoHide: typeof backendSettings.splash_auto_hide === 'boolean' ? backendSettings.splash_auto_hide : settings.splashAutoHide,
            splashAutoHideDelay: backendSettings.splash_auto_hide_delay !== undefined ? backendSettings.splash_auto_hide_delay : settings.splashAutoHideDelay,
            splashBackgroundVisible: typeof backendSettings.splash_background_visible === 'boolean' ? backendSettings.splash_background_visible : settings.splashBackgroundVisible,
            splashBackgroundColor: backendSettings.splash_background_color || settings.splashBackgroundColor,
            splashTransparent: typeof backendSettings.splash_transparent === 'boolean' ? backendSettings.splash_transparent : settings.splashTransparent
          }
          setSettings(loadedSettings)
          setOriginalSettings(JSON.parse(JSON.stringify(loadedSettings)))
          setCurrentBio(backendSettings.bio || '')
          setHasUnsavedChanges(false)
        }
      }
    } catch (error) {
      logger.error('Failed to load customization settings', error)
      setSaveErrorMessage('Failed to load settings from server')
      setShowSaveError(true)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (showNotification = true) => {
    try {
      setSaving(true)

      logger.info('Attempting to save settings...')

      const response = await fetch('http://localhost:8080/api/customization/settings', {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json'
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
          animated_title: settings.enableAnimations,
          monochrome_icons: settings.monochromeIcons,
          swap_box_colors: settings.swapBoxColors,
          // Audio
          volume_level: settings.volumeLevel,
          volume_control: settings.volumeControl,
          // Discord Integration
          discord_presence: settings.discordPresence,
          use_discord_avatar: settings.useDiscordAvatar,
          discord_avatar_decoration: settings.discordAvatarDecoration,
          // Asset URLs
          background_url: settings.backgroundUrl || '',
          audio_url: settings.audioUrl || '',
          cursor_url: settings.customCursor || '',
          
          // Typography
          text_font: settings.textFont || '',
          
          // Splash Screen Settings
          enable_splash_screen: settings.enableSplashScreen,
          splash_text: settings.splashText,
          splash_font_size: settings.splashFontSize,
          splash_animated: settings.splashAnimated,
          splash_glow_effect: settings.splashGlowEffect,
          splash_show_particles: settings.splashShowParticles,
          splash_auto_hide: settings.splashAutoHide,
          splash_auto_hide_delay: settings.splashAutoHideDelay,
          splash_background_visible: settings.splashBackgroundVisible,
          splash_background_color: settings.splashBackgroundColor,
          splash_transparent: settings.splashTransparent
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setOriginalSettings(JSON.parse(JSON.stringify(settings)))
          setHasUnsavedChanges(false)
          
          // Show success toast
          if (showNotification) {
            toast.success('Settings Saved', 'Your customization settings have been saved successfully!')
          }
          
          return true
        } else {
          throw new Error(data.message || 'Failed to save settings')
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        if (response.status === 401) {
          // Session expired or invalid
          localStorage.removeItem('sessionId')
          throw new Error('Session expired. Please refresh the page and log in again.')
        }
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      logger.error('Failed to save customization settings', error)
      
      // Show error toast instead of inline error
      if (showNotification) {
        toast.error('Save Failed', error.message || 'Failed to save settings. Please try again.')
      }
      
      return false
    } finally {
      setSaving(false)
    }
  }

  // Direct save function for audio settings - bypasses unsaved changes dialog
  const saveAudioSettings = async (silent = false) => {
    try {
      const response = await fetch('http://localhost:8080/api/customization/settings', {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json'
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
          cursor_url: settings.customCursor,
          
          // Typography
          text_font: settings.textFont || '',
          
          // Splash Screen Settings
          enable_splash_screen: settings.enableSplashScreen,
          splash_text: settings.splashText,
          splash_font_size: settings.splashFontSize,
          splash_animated: settings.splashAnimated,
          splash_glow_effect: settings.splashGlowEffect,
          splash_show_particles: settings.splashShowParticles,
          splash_auto_hide: settings.splashAutoHide,
          splash_auto_hide_delay: settings.splashAutoHideDelay,
          splash_background_visible: settings.splashBackgroundVisible,
          splash_background_color: settings.splashBackgroundColor,
          splash_transparent: settings.splashTransparent
        })
      })

      if (response.ok) {
        // Update originalSettings to reflect the saved state
        setOriginalSettings(JSON.parse(JSON.stringify(settings)))
        // Only clear unsaved changes if not called silently from audio manager
        if (!silent) {
          setHasUnsavedChanges(false)
        }
      }
    } catch (error) {
      logger.error('Failed to save audio settings:', error)
    }
  }

  // Callback for when AudioManager saves audio settings
  const handleAudioSaved = (newSettings) => {
    // Update originalSettings to reflect the saved state
    setOriginalSettings(JSON.parse(JSON.stringify(newSettings)))
  }

  // Simple debounce implementation for audio settings
  const debouncedSaveAudioSettings = useCallback(
    (() => {
      let timeoutId
      return () => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => saveAudioSettings(), 800)
      }
    })(),
    [settings.volumeLevel, settings.volumeControl]
  )

  // Filter out asset URLs that are auto-saved to database
  const getSettingsWithoutAssets = useCallback((settings) => {
    const { backgroundUrl, audioUrl, avatarUrl, customCursor, ...settingsWithoutAssets } = settings
    return settingsWithoutAssets
  }, [])

  // Detect changes but DON'T auto-show dialog - only show when user wants to leave
  // Only check non-asset settings since assets are auto-saved to database
  useEffect(() => {
    if (!loading && originalSettings) {
      const currentSettingsFiltered = getSettingsWithoutAssets(settings)
      const originalSettingsFiltered = getSettingsWithoutAssets(originalSettings)
      
      const currentSettingsStr = JSON.stringify(currentSettingsFiltered)
      const originalSettingsStr = JSON.stringify(originalSettingsFiltered)
      const hasChanges = currentSettingsStr !== originalSettingsStr
      
      setHasUnsavedChanges(hasChanges)
      // Don't auto-show dialog - only show based on user action
    }
  }, [settings, loading, originalSettings, getSettingsWithoutAssets])

  // Real-time validation function
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
      case 'backgroundUrl':
      case 'audioUrl':
      case 'avatarUrl':
      case 'customCursor':
        if (value && value.length > 0) {
          try {
            new URL(value)
          } catch {
            errors[key] = 'Must be a valid URL'
          }
        }
        break
    }
    
    return errors
  }, [])
  
  // Real-time settings validation
  useEffect(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }
    
    setIsValidating(true)
    
    validationTimeoutRef.current = setTimeout(() => {
      const allErrors = {}
      
      Object.entries(settings).forEach(([key, value]) => {
        const fieldErrors = validateSetting(key, value)
        Object.assign(allErrors, fieldErrors)
      })
      
      setValidationErrors(allErrors)
      setIsValidating(false)
    }, 300) // Debounce validation
    
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [settings, validateSetting])

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  // Discard changes function
  const discardChanges = () => {
    if (originalSettings) {
      setSettings({ ...originalSettings })
      setHasUnsavedChanges(false)
      setShowUnsavedDialog(false)
    }
  }

  const handleSaveButtonClick = async () => {
    // Check for validation errors first
    if (Object.keys(validationErrors).length > 0) {
      setSaveErrorMessage(`Please fix validation errors: ${Object.values(validationErrors).join(', ')}`)
      setShowSaveError(true)
      setTimeout(() => setShowSaveError(false), 5000)
      return
    }
    
    // Directly save the settings without showing any dialog
    if (hasUnsavedChanges) {
      await saveSettings(true) // true = show notification on error
    }
  }

  const handleSave = async () => {
    // Actually perform the save
    const success = await saveSettings(true)
    if (success) {
      setShowUnsavedDialog(false)
    }
  }

  const handleReset = () => {
    if (hasUnsavedChanges) {
      setShowResetDialog(true)
    } else {
      performReset()
    }
  }
  
  // Function to manually show unsaved dialog (for navigation, etc.)
  const showUnsavedChangesDialog = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true)
    }
  }

  const performReset = () => {
    const defaultSettings = {
      theme: 'dark',
      accentColor: '#58A4B0',
      backgroundUrl: '',
      avatarUrl: '',
      backgroundEffect: 'particles',
      usernameEffect: 'glow',
      enableAnimations: true,
      audioUrl: '',
      volumeLevel: 50,
      autoPlay: false,
      customCursor: '',
      profileOpacity: 90,
      profileBlur: 0,
      showBadges: true
    }
    setSettings(defaultSettings)
    setShowResetDialog(false)
  }

  // Helper function to get user ID
  const fetchUserId = async () => {
    try {

      const response = await fetch('http://localhost:8080/api/dashboard', {
        method: 'GET',
        credentials: 'include', // Use httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json'
        },
      })

      if (!response.ok) {
        console.error('Failed to fetch user data:', response.status)
        return null
      }

      const data = await response.json()
      
      if (data.success && data.data && data.data.user) {
        return data.data.user.id
      }
      
      return null
    } catch (error) {
      console.error('Error fetching user ID:', error)
      return null
    }
  }

  // Asset management functions
  const handleAssetRemove = async (assetType) => {
    try {
      const assetUrl = getAssetUrl(assetType)
      if (!assetUrl) return

      // Get user ID from dashboard API
      const userId = await fetchUserId()
      if (!userId) {
        console.error('User ID not found for asset removal')
        return
      }

      // For external URLs (OAuth avatars), pass the full URL
      // For local storage files, extract the file path
      let filePath = assetUrl
      if (!assetUrl.startsWith('http')) {
        filePath = getAssetFilePath(assetUrl, userId)
        if (!filePath) {
          console.error('Could not determine file path for asset removal')
          return
        }
      }

      const result = await deleteAsset(assetType, filePath)
      if (result.success) {
        // Update settings to remove the asset URL
        setSettings(prev => ({
          ...prev,
          [getAssetUrlKey(assetType)]: ''
        }))
        
        // Save settings silently
        setTimeout(async () => {
          await saveAudioSettings(true)
        }, 100)
        
      } else {
        console.error(`Failed to remove ${assetType}:`, result.error)
      }
    } catch (error) {
      console.error(`Error removing ${assetType}:`, error)
    }
  }

  const handleAssetChange = async (assetType) => {
    try {
      // Store existing asset info for background deletion after upload
      const existingAssetUrl = getAssetUrl(assetType)
      
      // Trigger file input click for new upload immediately
      const fileInput = fileInputRefs.current[assetType]
      if (fileInput) {
        fileInput.click()
      }
    } catch (error) {
      console.error(`Error during asset change for ${assetType}:`, error)
      // Still trigger file input as fallback
      const fileInput = fileInputRefs.current[assetType]
      if (fileInput) {
        fileInput.click()
      }
    }
  }

  const getAssetUrl = (assetType) => {
    switch (assetType) {
      case 'backgroundImage':
        return settings.backgroundUrl
      case 'avatar':
        return settings.avatarUrl
      case 'audio':
        return settings.audioUrl
      case 'cursor':
        return settings.customCursor
      default:
        return ''
    }
  }

  const getAssetUrlKey = (assetType) => {
    switch (assetType) {
      case 'backgroundImage':
        return 'backgroundUrl'
      case 'avatar':
        return 'avatarUrl'
      case 'audio':
        return 'audioUrl'
      case 'cursor':
        return 'customCursor'
      default:
        return ''
    }
  }

  // File upload handlers - Fixed validation mapping
  const handleFileUpload = async (file, type) => {
    if (!file) return

    // Store existing asset for background deletion after upload
    const existingAssetUrl = getAssetUrl(type)

    // Validate file size and type
    const getMaxSize = (type) => {
      switch (type) {
        case 'audio':
          return 10 * 1024 * 1024 // 10MB for audio
        case 'backgroundImage':
          return 15 * 1024 * 1024 // 15MB for background (images and videos)
        default:
          return 5 * 1024 * 1024 // 5MB for others
      }
    }

    const maxSize = getMaxSize(type)
    if (file.size > maxSize) {
      const sizeMB = Math.round(maxSize / (1024 * 1024))
      setSaveErrorMessage(`File too large. Maximum size is ${sizeMB}MB`)
      setShowSaveError(true)
      setTimeout(() => setShowSaveError(false), 5000)
      return
    }

    // Updated: Support video files for background
    const allowedTypes = {
      backgroundImage: [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        // Videos
        'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'
      ],
      avatar: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a', 'audio/opus'],
      cursor: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/gif', 'image/jpeg', 'image/jpg', 'image/webp']
    }

    if (!allowedTypes[type]?.includes(file.type)) {
      const supportedFormats = type === 'backgroundImage' 
        ? 'Images: PNG, JPG, WebP, GIF | Videos: MP4, WebM, OGG, AVI, MOV'
        : type === 'audio'
        ? 'MP3, WAV, OGG, M4A, OPUS'
        : type === 'cursor'
        ? 'PNG, ICO, SVG, GIF, JPG, WebP'
        : 'PNG, JPG, WebP, GIF'
      
      setSaveErrorMessage(`Invalid file type for ${type}. Supported formats: ${supportedFormats}`)
      setShowSaveError(true)
      setTimeout(() => setShowSaveError(false), 5000)
      return
    }

    try {
      setUploading(prev => ({ ...prev, [type]: true }))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('http://localhost:8080/api/upload/asset', {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookies for auth
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        // Update the appropriate setting with the uploaded file URL
        const settingKey = {
          backgroundImage: 'backgroundUrl',
          avatar: 'avatarUrl',
          audio: 'audioUrl',
          cursor: 'customCursor'
        }[type]

        // Update settings
        setSettings(prev => ({ ...prev, [settingKey]: data.data.url }))
        
        // Backend now handles old asset cleanup automatically
        
        // Auto-save immediately for audio uploads
        if (type === 'audio') {
          setTimeout(() => saveAudioSettings(), 200)
        }
      } else {
        throw new Error(data.message || 'Upload failed')
      }
    } catch (error) {
      logger.upload(file?.name || 'unknown', file?.size || 0, false, error)
      setSaveErrorMessage(error.message || 'Failed to upload file. Please try again.')
      setShowSaveError(true)
      setTimeout(() => setShowSaveError(false), 5000)
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }))
    }
  }

  const triggerFileUpload = (type) => {
    fileInputRefs.current[type]?.click()
  }

  const handleFileChange = (event, type) => {
    const file = event.target.files[0]
    if (file) {
      handleFileUpload(file, type)
    }
    // Reset the input so the same file can be selected again
    event.target.value = ''
  }

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <CustomizationWrapper style={{ background: colors.background }}>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading customization settings...</LoadingText>
        </LoadingContainer>
      </CustomizationWrapper>
    )
  }

  return (
    <>
      {/* Global Styles for Username Effects */}
      <style jsx global>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          25% { opacity: 1; transform: scale(1.2); }
          50% { opacity: 0.6; transform: scale(0.8); }
          75% { opacity: 1; transform: scale(1.1); }
        }
        
        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }
        
        @keyframes blink-caret {
          from, to { border-color: transparent; }
          50% { border-color: #58A4B0; }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
          40%, 43% { transform: translateY(-30px); }
          70% { transform: translateY(-15px); }
          90% { transform: translateY(-4px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      
      <CustomizationWrapper style={{ background: colors.background }}>
      {/* Header */}
      <Header>
        <HeaderLeft>
          <HeaderTitle>
            <h1>Customize Your Profile</h1>
            <p>Make your profile uniquely yours</p>
          </HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
        </HeaderRight>
      </Header>

      <ContentWrapper>
        {/* Main Content */}
        <MainContent>
          <TabContent>
            {/* 1. Assets Uploader Section */}
            <SectionHeader>
              <h2>Assets Uploader</h2>
            </SectionHeader>
            
            <SettingsGroup>
              <GroupTitle>Upload Your Assets</GroupTitle>
              <AssetsContainer>
                {/* Background Asset */}
                <AssetSection>
                  {settings.backgroundUrl ? (
                    <AssetThumbnail
                      assetType="backgroundImage"
                      assetUrl={settings.backgroundUrl}
                      onRemove={() => handleAssetRemove('backgroundImage')}
                      onChange={() => handleAssetChange('backgroundImage')}
                      loading={uploading.backgroundImage}
                    />
                  ) : (
                    <UploadZone onClick={() => fileInputRefs.current.backgroundImage?.click()}>
                      <HiPhoto style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#58A4B0' }} />
                      <UploadLabel>Background</UploadLabel>
                      <UploadSubtext>
                        {uploading.backgroundImage ? 'Uploading...' : 'Image or Video'}
                      </UploadSubtext>
                    </UploadZone>
                  )}
                  <input
                    ref={el => fileInputRefs.current.backgroundImage = el}
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'backgroundImage')}
                    style={{ display: 'none' }}
                  />
                </AssetSection>

                {/* Audio Asset */}
                <AssetSection>
                  {settings.audioUrl ? (
                    <AudioDisplay onClick={() => setShowAudioModal(true)}>
                      <AudioIcon>
                        <HiMusicalNote />
                      </AudioIcon>
                      <AudioInfo>
                        <AudioLabel>Audio Set</AudioLabel>
                        <AudioSubtext>Click to manage</AudioSubtext>
                      </AudioInfo>
                    </AudioDisplay>
                  ) : (
                    <UploadZone onClick={() => setShowAudioModal(true)}>
                      <HiSpeakerWave style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#58A4B0' }} />
                      <UploadLabel>Audio</UploadLabel>
                      <UploadSubtext>
                        {uploading.audio ? 'Uploading...' : 'Open manager'}
                      </UploadSubtext>
                    </UploadZone>
                  )}
                </AssetSection>

                {/* Avatar Asset */}
                <AssetSection>
                  {settings.avatarUrl ? (
                    <AssetThumbnail
                      assetType="avatar"
                      assetUrl={settings.avatarUrl}
                      onRemove={() => handleAssetRemove('avatar')}
                      onChange={() => handleAssetChange('avatar')}
                      loading={uploading.avatar}
                    />
                  ) : (
                    <UploadZone onClick={() => fileInputRefs.current.avatar?.click()}>
                      <HiUser style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#58A4B0' }} />
                      <UploadLabel>Avatar</UploadLabel>
                      <UploadSubtext>
                        {uploading.avatar ? 'Uploading...' : 'Click to upload'}
                      </UploadSubtext>
                    </UploadZone>
                  )}
                  <input
                    ref={el => fileInputRefs.current.avatar = el}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'avatar')}
                    style={{ display: 'none' }}
                  />
                </AssetSection>

                {/* Cursor Asset */}
                <AssetSection>
                  {settings.customCursor ? (
                    <AssetThumbnail
                      assetType="cursor"
                      assetUrl={settings.customCursor}
                      onRemove={() => handleAssetRemove('cursor')}
                      onChange={() => handleAssetChange('cursor')}
                      loading={uploading.cursor}
                    />
                  ) : (
                    <UploadZone onClick={() => fileInputRefs.current.cursor?.click()}>
                      <HiCursorArrowRays style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#58A4B0' }} />
                      <UploadLabel>Cursor</UploadLabel>
                      <UploadSubtext>
                        {uploading.cursor ? 'Uploading...' : 'Click to upload'}
                      </UploadSubtext>
                    </UploadZone>
                  )}
                  <input
                    ref={el => fileInputRefs.current.cursor = el}
                    type="file"
                    accept="image/png,image/gif,image/jpeg,image/jpg,image/webp,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'cursor')}
                    style={{ display: 'none' }}
                  />
                </AssetSection>
              </AssetsContainer>
            </SettingsGroup>

            {/* 2. Premium Banner - Hide if user is already premium */}
            {!user?.isPremium && !user?.is_premium && !['premium', 'pro', 'enterprise', 'admin', 'staff'].includes(user?.plan) && (
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.2), rgba(75, 0, 130, 0.1))', 
                border: '1px solid rgba(138, 43, 226, 0.3)',
                borderRadius: '12px', 
                padding: '1rem 1.5rem', 
                margin: '2rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#ffffff',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 0.3), rgba(75, 0, 130, 0.15))'
                e.target.style.borderColor = 'rgba(138, 43, 226, 0.5)'
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 16px rgba(138, 43, 226, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 0.2), rgba(75, 0, 130, 0.1))'
                e.target.style.borderColor = 'rgba(138, 43, 226, 0.3)'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}>
                <HiStar style={{ color: '#ffd700', fontSize: '1.2rem' }} />
                <span>Want exclusive features? Unlock more with 💎 Premium</span>
              </div>
            )}

            {/* 3. General Customization Section */}
            <SectionHeader>
              <h2>General Customization</h2>
            </SectionHeader>
            
            <SettingsGroup>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                {/* Bio */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Bio</label>
                  <div style={{ position: 'relative' }}>
                    <HiInformationCircle style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
                    <input
                      type="text"
                      placeholder={currentBio || 'Enter your bio...'}
                      value={settings.bio || ''}
                      onChange={(e) => {
                        // Update settings locally without triggering any side effects
                        setSettings(prev => ({ ...prev, bio: e.target.value }))
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>


                {/* Profile Opacity */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '0.75rem' 
                  }}>
                    <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: '600' }}>Profile Opacity</span>
                    <span style={{ color: '#58A4B0', fontWeight: '600' }}>{settings.profileOpacity || 90}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.profileOpacity || 90}
                    onChange={(e) => {
                      setSettings(prev => ({ ...prev, profileOpacity: parseInt(e.target.value) }))
                    }}
                    className="custom-slider"
                    style={{
                      width: '100%',
                      height: '6px',
                      background: `linear-gradient(to right, #58A4B0 0%, #58A4B0 ${settings.profileOpacity || 90}%, rgba(255, 255, 255, 0.2) ${settings.profileOpacity || 90}%, rgba(255, 255, 255, 0.2) 100%)`,
                      borderRadius: '3px',
                      outline: 'none',
                      WebkitAppearance: 'none',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                  />
                </div>

                {/* Profile Blur */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '0.75rem' 
                  }}>
                    <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: '600' }}>Profile Blur</span>
                    <span style={{ color: '#58A4B0', fontWeight: '600' }}>{settings.profileBlur || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={settings.profileBlur || 0}
                    onChange={(e) => {
                      setSettings(prev => ({ ...prev, profileBlur: parseInt(e.target.value) }))
                    }}
                    className="custom-slider"
                    style={{
                      width: '100%',
                      height: '6px',
                      background: `linear-gradient(to right, #58A4B0 0%, #58A4B0 ${(settings.profileBlur || 0) * 5}%, rgba(255, 255, 255, 0.2) ${(settings.profileBlur || 0) * 5}%, rgba(255, 255, 255, 0.2) 100%)`,
                      borderRadius: '3px',
                      outline: 'none',
                      WebkitAppearance: 'none',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                  />
                </div>

                {/* Background Effect */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Background Effect</label>
                  <select
                    value={settings.backgroundEffect || 'none'}
                    onChange={(e) => {
                      setSettings(prev => ({ ...prev, backgroundEffect: e.target.value }))
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="none" style={{ background: '#1a1a1a', color: '#ffffff' }}>None</option>
                    <option value="particles" style={{ background: '#1a1a1a', color: '#ffffff' }}>Particles</option>
                    <option value="rain" style={{ background: '#1a1a1a', color: '#ffffff' }}>Rain</option>
                    <option value="snow" style={{ background: '#1a1a1a', color: '#ffffff' }}>Snow</option>
                  </select>
                </div>

                {/* Username Effect */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Username Effect</label>
                  <button
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => {
                      setTempSelectedUsernameEffect('')
                      setShowUsernameEffectsModal(true)
                    }}
                  >
                    <HiSparkles style={{ color: 'rgba(88, 164, 176, 0.7)' }} />
                    {settings.usernameEffect ? usernameEffects.find(effect => effect.id === settings.usernameEffect)?.name || settings.usernameEffect : 'None'}
                  </button>
                </div>

                {/* Glow Username */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Glow Username</label>
                  <button
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: settings.glowUsername ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                      border: `1px solid ${settings.glowUsername ? 'rgba(88, 164, 176, 0.3)' : 'rgba(88, 164, 176, 0.15)'}`,
                      borderRadius: '8px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => {
                      setSettings(prev => ({ ...prev, glowUsername: !prev.glowUsername }))
                    }}
                  >
                    <HiSparkles style={{ color: settings.glowUsername ? '#58A4B0' : 'rgba(88, 164, 176, 0.7)' }} />
                    {settings.glowUsername ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Glow Socials */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Glow Socials</label>
                  <button
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: settings.glowSocials ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                      border: `1px solid ${settings.glowSocials ? 'rgba(88, 164, 176, 0.3)' : 'rgba(88, 164, 176, 0.15)'}`,
                      borderRadius: '8px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => {
                      setSettings(prev => ({ ...prev, glowSocials: !prev.glowSocials }))
                    }}
                  >
                    <SimpleIconComponent iconName="discord" size={20} customColor={settings.glowSocials ? '#58A4B0' : 'rgba(88, 164, 176, 0.7)'} />
                    {settings.glowSocials ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Glow Badges */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Glow Badges</label>
                  <button
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: settings.glowBadges ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                      border: `1px solid ${settings.glowBadges ? 'rgba(88, 164, 176, 0.3)' : 'rgba(88, 164, 176, 0.15)'}`,
                      borderRadius: '8px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => {
                      setSettings(prev => ({ ...prev, glowBadges: !prev.glowBadges }))
                    }}
                  >
                    <HiShieldCheck style={{ color: settings.glowBadges ? '#58A4B0' : 'rgba(88, 164, 176, 0.7)' }} />
                    {settings.glowBadges ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Show Badges */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Show Badges</label>
                  <button
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: settings.showBadges ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                      border: `1px solid ${settings.showBadges ? 'rgba(88, 164, 176, 0.3)' : 'rgba(88, 164, 176, 0.15)'}`,
                      borderRadius: '8px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => {
                      setSettings(prev => ({ ...prev, showBadges: !prev.showBadges }))
                    }}
                  >
                    <HiShieldCheck style={{ color: settings.showBadges ? '#58A4B0' : 'rgba(88, 164, 176, 0.7)' }} />
                    {settings.showBadges ? 'Show' : 'Hide'}
                  </button>
                </div>

                {/* Text Font */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Text Font</label>
                  <button
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                      border: '1px solid rgba(88, 164, 176, 0.15)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => {
                      setTempSelectedFont(settings.textFont || '')
                      setShowFontModal(true)
                    }}
                  >
                    <HiDocumentText style={{ color: 'rgba(88, 164, 176, 0.7)' }} />
                    {settings.textFont ? GOOGLE_FONTS.find(font => font.family === settings.textFont)?.name || settings.textFont : 'Default'}
                  </button>
                </div>
              </div>
            </SettingsGroup>

            {/* 4. Color Customization Section */}
            <SectionHeader>
              <h2>Color Customization</h2>
            </SectionHeader>
            
            <SettingsGroup>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                {/* Accent Color */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Accent Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div 
                      onClick={() => colorInputRefs.current.accentColor?.click()}
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '8px', 
                        background: settings.accentColor || '#58A4B0',
                        border: '2px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      ref={el => colorInputRefs.current.accentColor = el}
                      type="color"
                      value={settings.accentColor || '#58A4B0'}
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, accentColor: e.target.value }))
                      }}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                      {settings.accentColor || '#58A4B0'}
                    </span>
                    <HiPencilSquare 
                      onClick={() => colorInputRefs.current.accentColor?.click()}
                      style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} 
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Text Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div 
                      onClick={() => colorInputRefs.current.textColor?.click()}
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '8px', 
                        background: settings.textColor || '#ffffff',
                        border: '2px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      ref={el => colorInputRefs.current.textColor = el}
                      type="color"
                      value={settings.textColor || '#ffffff'}
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, textColor: e.target.value }))
                      }}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                      {settings.textColor || '#ffffff'}
                    </span>
                    <HiPencilSquare 
                      onClick={() => colorInputRefs.current.textColor?.click()}
                      style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} 
                    />
                  </div>
                </div>

                {/* Background Color */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Background Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div 
                      onClick={() => colorInputRefs.current.backgroundColor?.click()}
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '8px', 
                        background: settings.backgroundColor || '#0F0F23',
                        border: '2px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      ref={el => colorInputRefs.current.backgroundColor = el}
                      type="color"
                      value={settings.backgroundColor || '#0F0F23'}
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))
                      }}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                      {settings.backgroundColor || '#0F0F23'}
                    </span>
                    <HiPencilSquare 
                      onClick={() => colorInputRefs.current.backgroundColor?.click()}
                      style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} 
                    />
                  </div>
                </div>

                {/* Icon Color */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Icon Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div 
                      onClick={() => colorInputRefs.current.iconColor?.click()}
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '8px', 
                        background: settings.iconColor || '#ffffff',
                        border: '2px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      ref={el => colorInputRefs.current.iconColor = el}
                      type="color"
                      value={settings.iconColor || '#ffffff'}
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, iconColor: e.target.value }))
                      }}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                      {settings.iconColor || '#ffffff'}
                    </span>
                    <HiPencilSquare 
                      onClick={() => colorInputRefs.current.iconColor?.click()}
                      style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} 
                    />
                  </div>
                </div>
              </div>
            </SettingsGroup>

            {/* Enable Profile Gradient Button */}
            <div style={{ margin: '1.5rem 0' }}>
              <button
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: settings.profileGradient ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                  border: `1px solid ${settings.profileGradient ? 'rgba(88, 164, 176, 0.3)' : 'rgba(88, 164, 176, 0.15)'}`,
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = settings.profileGradient ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.3), rgba(88, 164, 176, 0.15))' : 'linear-gradient(145deg, rgba(88, 164, 176, 0.08), rgba(88, 164, 176, 0.03))'
                  e.target.style.borderColor = 'rgba(88, 164, 176, 0.4)'
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(88, 164, 176, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = settings.profileGradient ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))'
                  e.target.style.borderColor = settings.profileGradient ? 'rgba(88, 164, 176, 0.3)' : 'rgba(88, 164, 176, 0.15)'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
                onClick={() => {
                  // Update settings locally without triggering side effects
                  setSettings(prev => ({ ...prev, profileGradient: !prev.profileGradient }))
                }}
              >
                Enable Profile Gradient
              </button>
            </div>

            {/* Gradient Color Controls - Only show when profileGradient is enabled */}
            {settings.profileGradient && (
              <div style={{ 
                margin: '1.5rem 0',
                padding: '1.5rem',
                background: 'linear-gradient(145deg, rgba(136, 28, 156, 0.1), rgba(13, 13, 13, 0.1))',
                border: '1px solid rgba(136, 28, 156, 0.2)',
                borderRadius: '12px'
              }}>
                <h3 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600', 
                  marginBottom: '1rem',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`,
                    borderRadius: '4px'
                  }} />
                  Gradient Colors
                </h3>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {/* Primary Color */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Primary Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div 
                        onClick={() => colorInputRefs.current.primaryColor?.click()}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '8px', 
                          background: settings.primaryColor || '#881c9c',
                          border: '2px solid rgba(255,255,255,0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)'
                          e.target.style.borderColor = 'rgba(255,255,255,0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)'
                          e.target.style.borderColor = 'rgba(255,255,255,0.2)'
                        }}
                      />
                      <input
                        ref={el => colorInputRefs.current.primaryColor = el}
                        type="color"
                        value={settings.primaryColor || '#881c9c'}
                        onChange={(e) => {
                          setSettings(prev => ({ ...prev, primaryColor: e.target.value }))
                        }}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                        {settings.primaryColor || '#881c9c'}
                      </span>
                      <HiPencilSquare 
                        onClick={() => colorInputRefs.current.primaryColor?.click()}
                        style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} 
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Secondary Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div 
                        onClick={() => colorInputRefs.current.secondaryColor?.click()}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '8px', 
                          background: settings.secondaryColor || '#0d0d0d',
                          border: '2px solid rgba(255,255,255,0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)'
                          e.target.style.borderColor = 'rgba(255,255,255,0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)'
                          e.target.style.borderColor = 'rgba(255,255,255,0.2)'
                        }}
                      />
                      <input
                        ref={el => colorInputRefs.current.secondaryColor = el}
                        type="color"
                        value={settings.secondaryColor || '#0d0d0d'}
                        onChange={(e) => {
                          setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))
                        }}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                        {settings.secondaryColor || '#0d0d0d'}
                      </span>
                      <HiPencilSquare 
                        onClick={() => colorInputRefs.current.secondaryColor?.click()}
                        style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} 
                      />
                    </div>
                  </div>

                  {/* Gradient Preview */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Gradient Preview</label>
                    <div style={{
                      width: '100%',
                      height: '60px',
                      background: `linear-gradient(135deg, ${settings.primaryColor || '#881c9c'}, ${settings.secondaryColor || '#0d0d0d'})`,
                      borderRadius: '8px',
                      border: '2px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: '600',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    }}>
                      Your Gradient Preview
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Discord Customization Section */}
            <SectionHeader style={{ marginTop: '2rem' }}>
              <h2>Discord Customization</h2>
            </SectionHeader>
            
            <SettingsGroup>
              {/* Discord Presence */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Discord Presence</label>
                {discordStatus.connected ? (
                  <div>
                    {/* Discord User Info */}
                    <div style={{
                      background: 'rgba(88, 101, 242, 0.1)',
                      border: '1px solid rgba(88, 101, 242, 0.2)',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      {discordStatus.avatar_url ? (
                        <img 
                          src={discordStatus.avatar_url} 
                          alt="Discord Avatar"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'rgba(88, 101, 242, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <SimpleIconComponent iconName="discord" size={20} customColor="rgba(88,101,242,0.8)" />
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                        <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.9rem' }}>
                          {discordStatus.discord_username || 'Discord User'}
                        </span>
                        {discordStatus.is_booster && (
                          <span style={{ color: '#f093fb', fontSize: '0.75rem', fontWeight: '500' }}>
                            Server Booster
                          </span>
                        )}
                      </div>
                      <button
                        onClick={disconnectDiscord}
                        disabled={disconnecting}
                        style={{
                          background: 'rgba(220, 53, 69, 0.1)',
                          border: '1px solid rgba(220, 53, 69, 0.3)',
                          borderRadius: '8px',
                          color: '#dc3545',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          cursor: disconnecting ? 'not-allowed' : 'pointer',
                          opacity: disconnecting ? 0.6 : 1,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!disconnecting) {
                            e.target.style.background = 'rgba(220, 53, 69, 0.15)'
                            e.target.style.borderColor = 'rgba(220, 53, 69, 0.4)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!disconnecting) {
                            e.target.style.background = 'rgba(220, 53, 69, 0.1)'
                            e.target.style.borderColor = 'rgba(220, 53, 69, 0.3)'
                          }
                        }}
                      >
                        {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    </div>
                    
                    {/* Discord Presence Toggle */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      marginBottom: '1rem'
                    }}>
                      <span style={{ color: '#ffffff', fontSize: '0.95rem' }}>Discord Presence</span>
                      <div
                        style={{
                          width: '44px',
                          height: '24px',
                          background: settings.discordPresence ? '#58A4B0' : 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => {
                          setSettings(prev => ({ ...prev, discordPresence: !prev.discordPresence }))
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          background: '#ffffff',
                          borderRadius: '10px',
                          position: 'absolute',
                          top: '2px',
                          left: settings.discordPresence ? '22px' : '2px',
                          transition: 'all 0.3s ease'
                        }} />
                      </div>
                    </div>

                    {/* Use Discord Avatar */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      marginBottom: '1rem'
                    }}>
                      <span style={{ color: '#ffffff', fontSize: '0.95rem' }}>Use Discord Avatar</span>
                      <div
                        style={{
                          width: '44px',
                          height: '24px',
                          background: settings.useDiscordAvatar ? '#58A4B0' : 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => {
                          setSettings(prev => ({ ...prev, useDiscordAvatar: !prev.useDiscordAvatar }))
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          background: '#ffffff',
                          borderRadius: '10px',
                          position: 'absolute',
                          top: '2px',
                          left: settings.useDiscordAvatar ? '22px' : '2px',
                          transition: 'all 0.3s ease'
                        }} />
                      </div>
                    </div>

                    {/* Discord Avatar Decoration */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span style={{ color: '#ffffff', fontSize: '0.95rem' }}>Discord Avatar Decoration</span>
                      <div
                        style={{
                          width: '44px',
                          height: '24px',
                          background: settings.discordAvatarDecoration ? '#58A4B0' : 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => {
                          setSettings(prev => ({ ...prev, discordAvatarDecoration: !prev.discordAvatarDecoration }))
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          background: '#ffffff',
                          borderRadius: '10px',
                          position: 'absolute',
                          top: '2px',
                          left: settings.discordAvatarDecoration ? '22px' : '2px',
                          transition: 'all 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'rgba(88, 101, 242, 0.1)',
                      border: '1px solid rgba(88, 101, 242, 0.2)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={connectDiscord}
                  >
                    <SimpleIconComponent iconName="discord" size={20} customColor="rgba(255,255,255,0.5)" />
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                      {connecting ? 'Connecting to Discord...' : 'Click here to connect your Discord and unlock this feature.'}
                    </span>
                  </div>
                )}
              </div>
            </SettingsGroup>

            {/* 6. Other Customization Section */}
            <div style={{ marginTop: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '1rem',
                color: '#ffffff'
              }}>
                Other Customization
              </h2>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {/* Monochrome Icons */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ffffff', fontSize: '0.95rem' }}>Monochrome Icons</span>
                  <HiInformationCircle style={{ color: '#888', fontSize: '1rem' }} />
                </div>
                <div
                  style={{
                    width: '44px',
                    height: '24px',
                    background: settings.monochromeIcons ? '#58A4B0' : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, monochromeIcons: !prev.monochromeIcons }))
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: '#ffffff',
                    borderRadius: '10px',
                    position: 'absolute',
                    top: '2px',
                    left: settings.monochromeIcons ? '22px' : '2px',
                    transition: 'all 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Animated Title */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span style={{ color: '#ffffff', fontSize: '0.95rem' }}>Animated Title</span>
                <div
                  style={{
                    width: '44px',
                    height: '24px',
                    background: settings.enableAnimations ? '#58A4B0' : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, enableAnimations: !prev.enableAnimations }))
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: '#ffffff',
                    borderRadius: '10px',
                    position: 'absolute',
                    top: '2px',
                    left: settings.enableAnimations ? '22px' : '2px',
                    transition: 'all 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Swap Box Colors */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ffffff', fontSize: '0.95rem' }}>Swap Box Colors</span>
                  <HiInformationCircle style={{ color: '#888', fontSize: '1rem' }} />
                </div>
                <div
                  style={{
                    width: '44px',
                    height: '24px',
                    background: settings.swapBoxColors ? '#58A4B0' : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, swapBoxColors: !prev.swapBoxColors }))
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: '#ffffff',
                    borderRadius: '10px',
                    position: 'absolute',
                    top: '2px',
                    left: settings.swapBoxColors ? '22px' : '2px',
                    transition: 'all 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Volume Control */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span style={{ color: '#ffffff', fontSize: '0.95rem' }}>Volume Control</span>
                <div
                  style={{
                    width: '44px',
                    height: '24px',
                    background: settings.volumeControl ? '#58A4B0' : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, volumeControl: !prev.volumeControl }))
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: '#ffffff',
                    borderRadius: '10px',
                    position: 'absolute',
                    top: '2px',
                    left: settings.volumeControl ? '22px' : '2px',
                    transition: 'all 0.3s ease'
                  }} />
                </div>
              </div>

            </div>

            {/* 6. Splash Screen Section */}
            <SectionHeader style={{ marginTop: '2rem' }}>
              <h2>Profile Splash Screen</h2>
            </SectionHeader>
            
            {/* Profile Splash Screen Settings - Matching General Style */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {/* Enable Splash Screen */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Splash Screen</label>
                <button
                  onClick={() => {
                    setSettings(prev => ({ ...prev, enableSplashScreen: !prev.enableSplashScreen }))
                    setHasUnsavedChanges(true)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: settings.enableSplashScreen ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${settings.enableSplashScreen ? 'rgba(88, 164, 176, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <HiEye style={{ color: settings.enableSplashScreen ? '#58A4B0' : 'rgba(255,255,255,0.7)' }} />
                  {settings.enableSplashScreen ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Splash Text */}
              {settings.enableSplashScreen && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Splash Text</label>
                  <input
                    type="text"
                    value={settings.splashText || 'click here'}
                    onChange={(e) => {
                      setSettings(prev => ({ ...prev, splashText: e.target.value }))
                      setHasUnsavedChanges(true)
                    }}
                    placeholder="click here"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              )}

              {/* Font Size */}
              {settings.enableSplashScreen && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Font Size</label>
                  <select
                    value={settings.splashFontSize || '3rem'}
                    onChange={(e) => {
                      setSettings(prev => ({ ...prev, splashFontSize: e.target.value }))
                      setHasUnsavedChanges(true)
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="2rem" style={{ background: '#1a1a1a', color: '#ffffff' }}>Small (2rem)</option>
                    <option value="2.5rem" style={{ background: '#1a1a1a', color: '#ffffff' }}>Medium (2.5rem)</option>
                    <option value="3rem" style={{ background: '#1a1a1a', color: '#ffffff' }}>Large (3rem)</option>
                    <option value="3.5rem" style={{ background: '#1a1a1a', color: '#ffffff' }}>XL (3.5rem)</option>
                    <option value="4rem" style={{ background: '#1a1a1a', color: '#ffffff' }}>Huge (4rem)</option>
                  </select>
                </div>
              )}

              {/* Animation Toggle */}
              {settings.enableSplashScreen && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Text Animation</label>
                  <button
                    onClick={() => {
                      setSettings(prev => ({ ...prev, splashAnimated: !prev.splashAnimated }))
                      setHasUnsavedChanges(true)
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: settings.splashAnimated ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${settings.splashAnimated ? 'rgba(88, 164, 176, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <HiSparkles style={{ color: settings.splashAnimated ? '#58A4B0' : 'rgba(255,255,255,0.7)' }} />
                    {settings.splashAnimated ? 'Animated' : 'Static'}
                  </button>
                </div>
              )}

              {/* Glow Effect */}
              {settings.enableSplashScreen && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Glow Effect</label>
                  <button
                    onClick={() => {
                      setSettings(prev => ({ ...prev, splashGlowEffect: !prev.splashGlowEffect }))
                      setHasUnsavedChanges(true)
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: settings.splashGlowEffect ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${settings.splashGlowEffect ? 'rgba(88, 164, 176, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <HiSparkles style={{ color: settings.splashGlowEffect ? '#58A4B0' : 'rgba(255,255,255,0.7)' }} />
                    {settings.splashGlowEffect ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              )}

              {/* Background Visibility */}
              {settings.enableSplashScreen && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Background</label>
                  <button
                    onClick={() => {
                      setSettings(prev => ({ ...prev, splashBackgroundVisible: !prev.splashBackgroundVisible }))
                      setHasUnsavedChanges(true)
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: settings.splashBackgroundVisible ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${settings.splashBackgroundVisible ? 'rgba(88, 164, 176, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {settings.splashBackgroundVisible ? <HiEye /> : <HiEyeSlash />}
                    {settings.splashBackgroundVisible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              )}

              {/* Transparency */}
              {settings.enableSplashScreen && settings.splashBackgroundVisible && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Transparency</label>
                  <button
                    onClick={() => {
                      setSettings(prev => ({ ...prev, splashTransparent: !prev.splashTransparent }))
                      setHasUnsavedChanges(true)
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: settings.splashTransparent ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${settings.splashTransparent ? 'rgba(88, 164, 176, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <HiSwatch style={{ color: settings.splashTransparent ? '#58A4B0' : 'rgba(255,255,255,0.7)' }} />
                    {settings.splashTransparent ? 'Transparent' : 'Solid'}
                  </button>
                </div>
              )}

              {/* Background Color - Enhanced Color Picker */}
              {settings.enableSplashScreen && settings.splashBackgroundVisible && !settings.splashTransparent && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Background Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div 
                      onClick={() => colorInputRefs.current.splashBackgroundColor?.click()}
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '8px', 
                        background: settings.splashBackgroundColor || '#0a0a0a',
                        border: '2px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}
                    />
                    <input
                      ref={el => {
                        if (!colorInputRefs.current) colorInputRefs.current = {}
                        colorInputRefs.current.splashBackgroundColor = el
                      }}
                      type="color"
                      value={settings.splashBackgroundColor || '#0a0a0a'}
                      onChange={(e) => {
                        setSettings(prev => ({ ...prev, splashBackgroundColor: e.target.value }))
                        setHasUnsavedChanges(true)
                      }}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                      {settings.splashBackgroundColor || '#0a0a0a'}
                    </span>
                    <HiPencilSquare 
                      onClick={() => colorInputRefs.current.splashBackgroundColor?.click()}
                      style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} 
                    />
                  </div>
                </div>
              )}
            </div>

          </TabContent>
        </MainContent>

      </ContentWrapper>

      {/* Unsaved Changes Dialog - Only show when explicitly triggered */}




      </CustomizationWrapper>

      {/* Audio Manager Modal - Using Portal for proper viewport positioning */}
      {showAudioModal && createPortal(
        <AudioManager
          showAudioModal={showAudioModal}
          setShowAudioModal={setShowAudioModal}
          settings={settings}
          setSettings={setSettings}
          uploading={uploading}
          fileInputRefs={fileInputRefs}
          handleFileUpload={handleFileUpload}
          saveAudioSettings={saveAudioSettings}
          onAudioSaved={handleAudioSaved}
        />,
        document.body
      )}

      {/* Font Selector Modal - Using Portal for proper viewport positioning */}
      {showFontModal && createPortal(
        <FontModal>
          <FontModalContent>
            <FontModalHeader>
              <h3>Select Font</h3>
              <button onClick={() => {
                setShowFontModal(false)
                setTempSelectedFont('')
              }}>
                <HiXMark />
              </button>
            </FontModalHeader>
            
            <FontModalBody>
              <FontList>
                {GOOGLE_FONTS.map((font) => (
                  <FontItem
                    key={font.name}
                    onClick={() => {
                      setTempSelectedFont(font.family)
                      loadGoogleFont(font.family)
                    }}
                    $isSelected={tempSelectedFont === font.family || (!tempSelectedFont && settings.textFont === font.family)}
                  >
                    <FontPreview style={{ fontFamily: font.family }}>
                      {font.name}
                    </FontPreview>
                    <FontInfo>
                      <span className="font-name">{font.name}</span>
                      <span className="font-category">{font.category}</span>
                    </FontInfo>
                  </FontItem>
                ))}
              </FontList>
              
              <FontPreviewSection>
                <h4>Preview</h4>
                <PreviewText 
                  style={{ 
                    fontFamily: tempSelectedFont || settings.textFont || 'inherit',
                    fontSize: '2rem',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '1rem'
                  }}
                >
                  John Doe
                </PreviewText>
                <PreviewText 
                  style={{ 
                    fontFamily: tempSelectedFont || settings.textFont || 'inherit',
                    fontSize: '1.2rem',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '2rem'
                  }}
                >
                  Frontend Developer
                </PreviewText>
                
                <div style={{ 
                  display: 'flex',
                  gap: '0.75rem',
                  marginTop: 'auto'
                }}>
                  <button
                    onClick={() => {
                      setShowFontModal(false)
                      setTempSelectedFont('')
                    }}
                    style={{
                      flex: '1',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Allow saving even empty font (means Default)
                      setSettings(prev => ({ ...prev, textFont: tempSelectedFont }))
                      setHasUnsavedChanges(true)
                      setShowFontModal(false)
                      setTempSelectedFont('')
                    }}
                    style={{
                      flex: '1',
                      padding: '0.75rem 1rem',
                      background: '#58A4B0',
                      border: '1px solid #58A4B0',
                      borderRadius: '10px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}
                  >
                    Save Font
                  </button>
                </div>
              </FontPreviewSection>
            </FontModalBody>
          </FontModalContent>
        </FontModal>,
        document.body
      )}

      {/* Username Effects Modal - Clean Glassmorphism Design */}
      {showUsernameEffectsModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem 2rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <h3 style={{
                color: '#ffffff',
                fontSize: '1.25rem',
                fontWeight: '600',
                margin: 0
              }}>Username Effects</h3>
              <button
                onClick={() => {
                  setShowUsernameEffectsModal(false)
                  setTempSelectedUsernameEffect('')
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.12)'
                  e.target.style.color = '#ffffff'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.target.style.color = 'rgba(255, 255, 255, 0.8)'
                }}
              >
                <HiXMark size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '2rem',
              overflowY: 'auto',
              maxHeight: 'calc(80vh - 140px)',
              display: 'flex',
              gap: '2rem'
            }}>
              {/* Left Side - Effects Grid */}
              <div style={{ flex: '2' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                {usernameEffects.map((effect) => {
                  const isSelected = tempSelectedUsernameEffect === effect.id || (!tempSelectedUsernameEffect && settings.usernameEffect === effect.id)
                  return (
                    <div
                      key={effect.id}
                      onClick={() => setTempSelectedUsernameEffect(effect.id)}
                      style={{
                        padding: '1.25rem 1rem',
                        background: isSelected 
                          ? 'rgba(88, 164, 176, 0.15)' 
                          : 'rgba(255, 255, 255, 0.04)',
                        backdropFilter: 'blur(10px)',
                        border: isSelected 
                          ? '1px solid rgba(88, 164, 176, 0.4)' 
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'center',
                        position: 'relative',
                        transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: isSelected 
                          ? '0 8px 24px rgba(88, 164, 176, 0.2)' 
                          : '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                          e.target.style.transform = 'translateY(-1px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.target.style.background = 'rgba(255, 255, 255, 0.04)'
                          e.target.style.transform = 'translateY(0)'
                        }
                      }}
                    >
                      
                      {/* Effect Name */}
                      <div style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: '600',
                        color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}>
                        {effect.name}
                        {!effect.free && (
                          <span style={{
                            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                            color: '#000',
                            padding: '0.1rem 0.3rem',
                            borderRadius: '4px',
                            fontSize: '0.6rem',
                            fontWeight: '700'
                          }}>PRO</span>
                        )}
                      </div>
                      
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          width: '18px',
                          height: '18px',
                          background: '#58A4B0',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(88, 164, 176, 0.4)'
                        }}>
                          <HiCheck style={{ color: 'white', fontSize: '0.7rem' }} />
                        </div>
                      )}
                    </div>
                  )
                })}
                </div>
              </div>

              {/* Right Side - Preview Section */}
              <div style={{ flex: '1' }}>
                {(tempSelectedUsernameEffect || settings.usernameEffect) && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '16px',
                    padding: '2rem',
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    height: 'fit-content',
                    position: 'sticky',
                    top: '0'
                  }}>
                    <div style={{
                      fontSize: '0.9rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '1.5rem',
                      fontWeight: '500'
                    }}>Preview</div>
                    
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '600',
                      position: 'relative',
                      minHeight: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {(() => {
                        const currentEffect = tempSelectedUsernameEffect || settings.usernameEffect
                        const username = settings.username || 'Username'
                        
                        if (currentEffect === 'sparkles') {
                          return (
                            <div style={{ position: 'relative' }}>
                              <div style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                background: `
                                  radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.4) 1px, transparent 1px),
                                  radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.3) 1px, transparent 1px),
                                  radial-gradient(circle at 90% 80%, rgba(34, 197, 94, 0.4) 1px, transparent 1px),
                                  radial-gradient(circle at 10% 70%, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
                                `,
                                animation: 'sparkle 2s ease-in-out infinite'
                              }} />
                              <span style={{ color: '#00ff88', textShadow: '0 0 12px #00ff88', position: 'relative', zIndex: 1 }}>
                                {username} ✨
                              </span>
                            </div>
                          )
                        } else if (currentEffect === 'rainbow') {
                          return (
                            <span style={{ 
                              background: 'linear-gradient(45deg, #ff0000, #ff8800, #ffff00, #88ff00, #00ff00, #00ff88, #00ffff, #0088ff, #0000ff, #8800ff, #ff00ff, #ff0088)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                              {username}
                            </span>
                          )
                        } else if (currentEffect === 'typewriter') {
                          return (
                            <span style={{ 
                              color: '#ffffff',
                              overflow: 'hidden',
                              borderRight: '2px solid #58A4B0',
                              whiteSpace: 'nowrap',
                              animation: 'typing 3.5s steps(40, end), blink-caret 0.75s step-end infinite'
                            }}>
                              {username}
                            </span>
                          )
                        } else if (currentEffect === 'bounce') {
                          return (
                            <span style={{ 
                              color: '#ffffff',
                              animation: 'bounce 2s ease-in-out infinite'
                            }}>
                              {username}
                            </span>
                          )
                        } else if (currentEffect === 'fade') {
                          return (
                            <span style={{ 
                              color: '#ffffff',
                              animation: 'fade-in 2s ease-in-out'
                            }}>
                              {username}
                            </span>
                          )
                        } else if (currentEffect === 'glow') {
                          return (
                            <span style={{ 
                              color: '#ffffff', 
                              textShadow: '0 0 20px rgba(88, 164, 176, 0.8)' 
                            }}>
                              {username}
                            </span>
                          )
                        } else {
                          return <span style={{ color: '#ffffff' }}>{username}</span>
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex',
              gap: '0.75rem',
              padding: '0 2rem 2rem 2rem'
            }}>
                <button
                  onClick={() => {
                    setShowUsernameEffectsModal(false)
                    setTempSelectedUsernameEffect('')
                  }}
                  style={{
                    flex: '1',
                    padding: '0.875rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.12)'
                    e.target.style.color = '#ffffff'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                    e.target.style.color = 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (tempSelectedUsernameEffect) {
                      setSettings(prev => ({ ...prev, usernameEffect: tempSelectedUsernameEffect }))
                      setHasUnsavedChanges(true)
                    }
                    setShowUsernameEffectsModal(false)
                    setTempSelectedUsernameEffect('')
                  }}
                  disabled={!tempSelectedUsernameEffect}
                  style={{
                    flex: '1',
                    padding: '0.875rem 1.5rem',
                    background: tempSelectedUsernameEffect 
                      ? 'linear-gradient(135deg, #58A4B0, #4A9AA8)' 
                      : 'rgba(88, 164, 176, 0.3)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(88, 164, 176, 0.3)',
                    borderRadius: '12px',
                    color: tempSelectedUsernameEffect ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                    cursor: tempSelectedUsernameEffect ? 'pointer' : 'not-allowed',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: tempSelectedUsernameEffect ? '0 4px 16px rgba(88, 164, 176, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (tempSelectedUsernameEffect) {
                      e.target.style.background = 'linear-gradient(135deg, #4A9AA8, #3D8A98)'
                      e.target.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tempSelectedUsernameEffect) {
                      e.target.style.background = 'linear-gradient(135deg, #58A4B0, #4A9AA8)'
                      e.target.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  Apply Effect
                </button>
              </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reset Confirmation Dialog - Using Portal for proper viewport positioning */}
      {showResetDialog && createPortal(
        <DialogOverlay>
          <ConfirmationDialog>
            <div className="dialog-header">
              <HiExclamationTriangle className="warning-icon" />
              <div>
                <h3>Reset All Settings</h3>
                <p>Are you sure you want to reset all customization settings to default? This action cannot be undone.</p>
              </div>
            </div>
            <div className="dialog-actions">
              <button className="confirm-btn" onClick={performReset}>
                <HiCheck />
                Yes, Reset All
              </button>
              <button className="cancel-btn" onClick={() => setShowResetDialog(false)}>
                <HiXMark />
                Cancel
              </button>
            </div>
          </ConfirmationDialog>
        </DialogOverlay>,
        document.body
      )}

      {/* Dynamic Save Changes Snackbar - Using Portal for proper viewport positioning */}
      {hasUnsavedChanges && createPortal(
        <SaveSnackbar>
          <SaveSnackbarContent>
            <SaveSnackbarIcon>
              {saving ? <HiSparkles className="spinning" /> : <HiExclamationTriangle />}
            </SaveSnackbarIcon>
            <SaveSnackbarText>
              You have unsaved changes
            </SaveSnackbarText>
            <SaveSnackbarActions>
              <SaveSnackbarButton 
                onClick={handleSaveButtonClick}
                disabled={saving || Object.keys(validationErrors).length > 0}
                $primary={true}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </SaveSnackbarButton>
              <SaveSnackbarButton 
                onClick={() => {
                  setSettings(JSON.parse(JSON.stringify(originalSettings)))
                  setHasUnsavedChanges(false)
                }}
                disabled={saving}
                $primary={false}
              >
                Reset Changes
              </SaveSnackbarButton>
            </SaveSnackbarActions>
          </SaveSnackbarContent>
        </SaveSnackbar>,
        document.body
      )}
    </>
  )
}

// Styled Components
const CustomizationWrapper = styled.div`
  min-height: 100vh;
  position: relative;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const AssetsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const AssetSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`

const UploadZone = styled.div`
  width: 120px;
  height: 80px;
  padding: 1rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 2px dashed rgba(88, 164, 176, 0.3);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    border-color: rgba(88, 164, 176, 0.5);
    background: linear-gradient(145deg, rgba(88, 164, 176, 0.08), rgba(88, 164, 176, 0.03));
    transform: translateY(-2px);
  }
`

const UploadLabel = styled.div`
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`

const UploadSubtext = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.7rem;
`

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(-2px);
  }
  
  svg {
    font-size: 1.2rem;
  }
`

const HeaderTitle = styled.div`
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 0.25rem 0;
    background: linear-gradient(135deg, #ffffff, #a0a0a0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    font-size: 0.9rem;
    color: #a0a0a0;
    margin: 0;
  }
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`


const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: ${props => 
    props.$hasErrors 
      ? 'linear-gradient(135deg, #ff4757, #e74c3c)' 
      : props.$hasUnsavedChanges 
        ? 'linear-gradient(135deg, #FFA500, #FF8C00)' 
        : 'linear-gradient(135deg, #00b894, #00a085)'};
  border: none;
  border-radius: 12px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 500;
  position: relative;
  
  &:hover:not(:disabled) {
    background: ${props => 
      props.$hasErrors 
        ? 'linear-gradient(135deg, #e74c3c, #c0392b)' 
        : props.$hasUnsavedChanges 
          ? 'linear-gradient(135deg, #FF8C00, #FF7700)' 
          : 'linear-gradient(135deg, #00a085, #009070)'};
    transform: translateY(-1px);
    box-shadow: ${props => 
      props.$hasErrors 
        ? '0 4px 16px rgba(255, 71, 87, 0.4)' 
        : props.$hasUnsavedChanges 
          ? '0 4px 16px rgba(255, 165, 0, 0.4)' 
          : '0 4px 16px rgba(0, 184, 148, 0.4)'};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    font-size: 1.1rem;
  }
  
  ${props => props.hasUnsavedChanges && `
    &::after {
      content: '';
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      background: #ff4757;
      border: 2px solid #ffffff;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
  `}
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 200px);
`

const Sidebar = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  height: fit-content;
  position: sticky;
  top: 2rem;
  
  @media (max-width: 768px) {
    position: static;
    margin-bottom: 1rem;
  }
`

const TabsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
`

const TabItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  border-radius: 12px;
  color: ${props => props.$active ? '#ffffff' : '#a0a0a0'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  position: relative;
  text-align: left;
  width: 100%;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }
  
  svg {
    font-size: 1.3rem;
    color: ${props => props.$active ? props.color : 'inherit'};
  }
  
  span {
    font-weight: ${props => props.$active ? '600' : '400'};
  }
`

const ActiveIndicator = styled.div`
  position: absolute;
  right: 1rem;
  width: 6px;
  height: 6px;
  background: ${props => props.color};
  border-radius: 50%;
  box-shadow: 0 0 8px ${props => props.color}40;
`

const QuickActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: ${props => props.$variant === 'primary' 
    ? 'linear-gradient(135deg, #58A4B0, #4a9ba6)' 
    : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.$variant === 'primary' 
    ? 'transparent' 
    : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  
  &:hover {
    background: ${props => props.$variant === 'primary' 
      ? 'linear-gradient(135deg, #4a9ba6, #3d8b94)' 
      : 'rgba(255, 255, 255, 0.15)'};
    transform: translateY(-1px);
  }
  
  svg {
    font-size: 1rem;
  }
`

const MainContent = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.15);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(88, 164, 176, 0.2);
    background: linear-gradient(145deg, rgba(88, 164, 176, 0.03), rgba(255, 255, 255, 0.02));
  }
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`

const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  
  svg {
    font-size: 2rem;
    color: #58A4B0;
  }
  
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
  }
  
  p {
    font-size: 0.9rem;
    color: #a0a0a0;
    margin: 0.25rem 0 0 0;
  }
`

const SettingsGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const GroupTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const ColorPalette = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`

const ColorSwatch = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border: 2px solid ${props => props.$active ? props.color : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
  
  .color-preview {
    width: 40px;
    height: 40px;
    background: ${props => props.color};
    border-radius: 50%;
    box-shadow: 0 4px 16px ${props => props.color}40;
  }
  
  span {
    font-size: 0.85rem;
    color: #ffffff;
    font-weight: 500;
  }
  
  .check-icon {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 1rem;
    color: ${props => props.color};
  }
`

const ThemeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`

const ThemeOption = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border: 2px solid ${props => props.$active ? '#58A4B0' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
  
  .theme-preview {
    width: 60px;
    height: 40px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &.dark {
      background: #1a1a1a;
    }
    
    &.light {
      background: #ffffff;
    }
    
    &.auto {
      background: linear-gradient(45deg, #1a1a1a 50%, #ffffff 50%);
    }
    
    .theme-header {
      height: 12px;
      background: rgba(88, 164, 176, 0.3);
    }
    
    .theme-content {
      height: 28px;
      background: ${props => props.$active ? 'rgba(88, 164, 176, 0.1)' : 'transparent'};
    }
  }
  
  span {
    font-size: 0.85rem;
    color: #ffffff;
    font-weight: 500;
  }
`

const AssetUploader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const UploadCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: rgba(88, 164, 176, 0.4);
    background: rgba(88, 164, 176, 0.05);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(88, 164, 176, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  .upload-area {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    svg {
      font-size: 2rem;
      color: #58A4B0;
    }
    
    h3 {
      font-size: 1rem;
      color: #ffffff;
      margin: 0 0 0.25rem 0;
    }
    
    p {
      font-size: 0.85rem;
      color: #a0a0a0;
      margin: 0;
      
      &.current-file {
        font-size: 0.75rem;
        color: #58A4B0;
        font-weight: 500;
        margin-top: 0.25rem;
        word-break: break-all;
      }
    }
  }
`

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #58A4B0, #4a9ba6);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  font-weight: 500;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #4a9ba6, #3d8b94);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    font-size: 1rem;
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`

const EffectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`

const EffectCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border: 2px solid ${props => props.$active ? '#58A4B0' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
  
  .effect-preview {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  span {
    font-size: 0.85rem;
    color: #ffffff;
    font-weight: 500;
  }
  
  .check-icon {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 1rem;
    color: #58A4B0;
  }
`

const DropdownSelect = styled.div`
  select {
    width: 100%;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    color: #ffffff;
    font-size: 0.9rem;
    cursor: pointer;
    
    &:focus {
      outline: none;
      border-color: #58A4B0;
      box-shadow: 0 0 0 3px rgba(88, 164, 176, 0.1);
    }
    
    option {
      background: #2a2a2a;
      color: #ffffff;
      padding: 0.5rem;
    }
  }
`

const ToggleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const ToggleItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    svg {
      font-size: 1.5rem;
      color: #58A4B0;
    }
    
    h3 {
      font-size: 1rem;
      color: #ffffff;
      margin: 0 0 0.25rem 0;
    }
    
    p {
      font-size: 0.85rem;
      color: #a0a0a0;
      margin: 0;
    }
  }
`

const ToggleSwitch = styled.button`
  width: 60px;
  height: 32px;
  background: ${props => props.$active ? '#58A4B0' : 'rgba(255, 255, 255, 0.2)'};
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  .toggle-slider {
    width: 24px;
    height: 24px;
    background: #ffffff;
    border-radius: 50%;
    position: absolute;
    top: 4px;
    left: ${props => props.$active ? '32px' : '4px'};
    transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
`

const SliderControl = styled.div`
  .slider-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    
    span {
      font-size: 0.9rem;
      color: #ffffff;
      
      &:last-child {
        color: #58A4B0;
        font-weight: 600;
      }
    }
  }
  
  .slider {
    width: 100%;
    height: 6px;
    background: transparent;
    border-radius: 3px;
    outline: none;
    appearance: none;
    cursor: pointer;
    
    &::-webkit-slider-runnable-track {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      background: #58A4B0;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(88, 164, 176, 0.4);
      transition: all 0.3s ease;
      margin-top: -7px;
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(88, 164, 176, 0.6);
      }
    }
    
    &::-moz-range-track {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      border: none;
    }
    
    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
      background: #58A4B0;
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 8px rgba(88, 164, 176, 0.4);
    }
  }
`


const NotificationOverlay = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  pointer-events: none;
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    left: 10px;
  }
`

const UnsavedChangesDialog = styled.div`
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(255, 165, 0, 0.1);
  pointer-events: auto;
  max-width: 400px;
  animation: slideInRight 0.3s ease-out;
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .dialog-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    
    .warning-icon {
      font-size: 1.5rem;
      color: #FFA500;
      flex-shrink: 0;
      margin-top: 0.25rem;
    }
    
    h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
      margin: 0 0 0.5rem 0;
    }
    
    p {
      font-size: 0.9rem;
      color: #a0a0a0;
      margin: 0;
      line-height: 1.4;
    }
  }
  
  .dialog-actions {
    display: flex;
    gap: 0.75rem;
    
    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.85rem;
      font-weight: 500;
      
      svg {
        font-size: 1rem;
      }
      
      &.save-now-btn {
        background: linear-gradient(135deg, #58A4B0, #4a9ba6);
        color: #ffffff;
        flex: 1;
        
        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #4a9ba6, #3d8b94);
          transform: translateY(-1px);
        }
        
        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }
      }
      
      &.discard-btn {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.2);
        
        &:hover {
          background: rgba(255, 0, 0, 0.2);
          border-color: rgba(255, 0, 0, 0.4);
        }
      }
    }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 2rem;
  animation: fadeIn 0.3s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const ConfirmationDialog = styled.div`
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 100%;
  animation: scaleIn 0.3s ease-out;
  
  @keyframes scaleIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .dialog-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 2rem;
    
    .warning-icon {
      font-size: 2rem;
      color: #FFA500;
      flex-shrink: 0;
      margin-top: 0.25rem;
    }
    
    h3 {
      font-size: 1.3rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 0.75rem 0;
    }
    
    p {
      font-size: 1rem;
      color: #a0a0a0;
      margin: 0;
      line-height: 1.5;
    }
  }
  
  .dialog-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    
    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
      font-weight: 600;
      
      svg {
        font-size: 1.1rem;
      }
      
      &.confirm-btn {
        background: linear-gradient(135deg, #ff4757, #e74c3c);
        color: #ffffff;
        
        &:hover {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(255, 71, 87, 0.3);
        }
      }
      
      &.cancel-btn {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.2);
        
        &:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      }
    }
  }
`

const SuccessNotification = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #00b894, #00a085);
  color: #ffffff;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 8px 32px rgba(0, 184, 148, 0.3);
  backdrop-filter: blur(10px);
  z-index: 1000;
  animation: slideInRight 0.3s ease-out;
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .success-icon {
    font-size: 1.2rem;
    color: #ffffff;
  }
  
  span {
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    left: 10px;
    text-align: center;
  }
`

const ErrorNotification = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #ff4757, #e74c3c);
  color: #ffffff;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  box-shadow: 0 8px 32px rgba(255, 71, 87, 0.3);
  backdrop-filter: blur(10px);
  z-index: 1000;
  max-width: 400px;
  animation: slideInRight 0.3s ease-out;
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .error-icon {
    font-size: 1.2rem;
    color: #ffffff;
    flex-shrink: 0;
    margin-top: 0.25rem;
  }
  
  div {
    span {
      font-size: 0.9rem;
      font-weight: 600;
      display: block;
      margin-bottom: 0.25rem;
    }
    
    p {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
      line-height: 1.4;
    }
  }
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    left: 10px;
  }
`

// Save Snackbar Styled Components
const SaveSnackbar = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  animation: slideUpFade 0.3s ease-out;
  max-width: calc(100vw - 60px);
  pointer-events: auto;

  @keyframes slideUpFade {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @media (max-width: 768px) {
    left: 15px;
    right: 15px;
    transform: none;
    max-width: none;
    bottom: 15px;
  }
`

const SaveSnackbarContent = styled.div`
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px 40px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 650px;
  width: 100%;
  min-height: 70px;

  @media (max-width: 768px) {
    padding: 16px 24px;
    gap: 16px;
    border-radius: 12px;
    max-width: none;
    flex-wrap: wrap;
    min-height: 60px;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 20px;
    min-height: auto;
  }
`

const SaveSnackbarIcon = styled.div`
  color: #fbbf24;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  flex-shrink: 0;

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @media (max-width: 480px) {
    align-self: center;
  }
`

const SaveSnackbarText = styled.span`
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  flex: 1;
  letter-spacing: 0.025em;

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
  
  @media (max-width: 480px) {
    text-align: center;
    font-size: 1rem;
  }
`

const SaveSnackbarActions = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 100%;
    justify-content: space-between;
    gap: 12px;
  }
`

const SaveSnackbarButton = styled.button`
  background: ${props => props.$primary ? '#10b981' : 'rgba(255, 255, 255, 0.1)'};
  color: #ffffff;
  border: ${props => props.$primary ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'};
  border-radius: 10px;
  padding: 12px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  white-space: nowrap;
  min-height: 44px;

  &:hover:not(:disabled) {
    background: ${props => props.$primary ? '#059669' : 'rgba(255, 255, 255, 0.15)'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 0.85rem;
    min-height: 40px;
  }
  
  @media (max-width: 480px) {
    flex: 1;
    min-width: 0;
    padding: 12px 16px;
    font-size: 0.9rem;
    min-height: 44px;
  }
`

// Font Modal Styled Components
const FontModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`

const FontModalContent = styled.div`
  background: linear-gradient(145deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 45, 0.95));
  border: 1px solid rgba(88, 164, 176, 0.2);
  border-radius: 20px;
  width: 100%;
  max-width: 900px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
`

const FontModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid rgba(88, 164, 176, 0.1);

  h3 {
    color: #ffffff;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #ffffff;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 77, 77, 0.2);
      border-color: rgba(255, 77, 77, 0.3);
      color: #ff4d4d;
    }

    svg {
      font-size: 20px;
    }
  }
`

const FontModalBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  height: 500px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    height: auto;
  }
`

const FontList = styled.div`
  padding: 20px;
  overflow-y: auto;
  border-right: 1px solid rgba(88, 164, 176, 0.1);

  @media (max-width: 768px) {
    border-right: none;
    border-bottom: 1px solid rgba(88, 164, 176, 0.1);
    max-height: 300px;
  }
`

const FontItem = styled.div`
  padding: 16px;
  border: 1px solid ${props => props.$isSelected ? 'rgba(88, 164, 176, 0.4)' : 'rgba(88, 164, 176, 0.1)'};
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.$isSelected ? 'rgba(88, 164, 176, 0.1)' : 'transparent'};

  &:hover {
    border-color: rgba(88, 164, 176, 0.3);
    background: rgba(88, 164, 176, 0.05);
    transform: translateY(-2px);
  }

  &:last-child {
    margin-bottom: 0;
  }
`

const FontPreview = styled.div`
  font-size: 1.2rem;
  color: #ffffff;
  margin-bottom: 8px;
  font-weight: 500;
`

const FontInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .font-name {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .font-category {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem;
    background: rgba(88, 164, 176, 0.2);
    padding: 4px 8px;
    border-radius: 4px;
  }
`

const FontPreviewSection = styled.div`
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  height: 100%;

  h4 {
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 20px 0;
  }

  @media (max-width: 768px) {
    padding: 20px;
  }
`

const PreviewText = styled.div`
  text-align: center;
  padding: 20px;
  background: rgba(88, 164, 176, 0.05);
  border: 1px solid rgba(88, 164, 176, 0.1);
  border-radius: 12px;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`

// Audio Display Components
const AudioDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  height: 100px;
  background: linear-gradient(135deg, rgba(88, 164, 176, 0.1), rgba(88, 164, 176, 0.05));
  border: 1px solid rgba(88, 164, 176, 0.3);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: linear-gradient(135deg, rgba(88, 164, 176, 0.15), rgba(88, 164, 176, 0.08));
    border-color: rgba(88, 164, 176, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(88, 164, 176, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`

const AudioIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #58A4B0, #4A8A94);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(88, 164, 176, 0.3);
`

const AudioInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  overflow: hidden;
`

const AudioLabel = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #58A4B0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const AudioSubtext = styled.div`
  font-size: 0.85rem;
  color: rgba(88, 164, 176, 0.8);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

// Loading Components
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1.5rem;
`

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(88, 164, 176, 0.2);
  border-top: 4px solid #58A4B0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const LoadingText = styled.div`
  color: #58A4B0;
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
`

// Add global styles for custom-slider
const GlobalStyle = `
  .custom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #58A4B0;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(88, 164, 176, 0.4);
    transition: all 0.3s ease;
    margin-top: -7px;
  }
  
  .custom-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(88, 164, 176, 0.6);
  }
  
  .custom-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #58A4B0;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(88, 164, 176, 0.4);
  }
  
  .custom-slider::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 3px;
    background: transparent;
  }
  
  .custom-slider::-moz-range-track {
    height: 6px;
    border-radius: 3px;
    background: transparent;
    border: none;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.getElementById('custom-slider-styles') || document.createElement('style');
  styleElement.id = 'custom-slider-styles';
  styleElement.textContent = GlobalStyle;
  if (!document.getElementById('custom-slider-styles')) {
    document.head.appendChild(styleElement);
  }
}

export default CustomizationPage