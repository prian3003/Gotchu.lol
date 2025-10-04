import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'
import { useTheme } from '../../contexts/ThemeContext'
import logger from '../../utils/logger'
import LivePreview from '../ui/LivePreview'
import {
  HiUser,
  HiCog,
  HiSparkles,
  HiSpeakerWave,
  HiCamera,
  HiCursorArrowRays,
  HiEye,
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
  HiPencilSquare
} from 'react-icons/hi2'

const CustomizationPage = ({ onBack }) => {
  const { colors, isDarkMode } = useTheme()
  const [activeTab, setActiveTab] = useState('appearance') // Temporarily restored for syntax
  const [previewMode, setPreviewMode] = useState(false)
  const [showAudioModal, setShowAudioModal] = useState(false)
  const [settings, setSettings] = useState({
    // Appearance
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
    autoPlay: false,
    // Discord Integration
    discordPresence: false,
    useDiscordAvatar: false,
    discordAvatarDecoration: false,
    // Advanced
    customCursor: ''
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
    { id: 'matrix', name: 'Matrix', preview: '🟢' },
    { id: 'waves', name: 'Waves', preview: '🌊' },
    { id: 'gradient', name: 'Gradient', preview: '🎨' },
    { id: 'geometric', name: 'Geometric', preview: '🔷' }
  ]

  const usernameEffects = [
    { id: 'none', name: 'None' },
    { id: 'glow', name: 'Glow' },
    { id: 'rainbow', name: 'Rainbow' },
    { id: 'typewriter', name: 'Typewriter' },
    { id: 'bounce', name: 'Bounce' },
    { id: 'fade', name: 'Fade In' }
  ]

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showSaveError, setShowSaveError] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [originalSettings, setOriginalSettings] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [isValidating, setIsValidating] = useState(false)
  const [uploading, setUploading] = useState({})
  const [currentBio, setCurrentBio] = useState('')
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
    iconColor: null
  })

  // Load settings on component mount 
  useEffect(() => {
    loadSettings()
  }, []) // Only run once on mount

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
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/customization/settings', {
        headers: {
          'X-Session-ID': sessionId
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
            customCursor: backendSettings.cursor_url || settings.customCursor,
            // Profile Information
            description: backendSettings.description || settings.description,
            bio: backendSettings.bio || settings.bio,
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
            discordAvatarDecoration: typeof backendSettings.discord_avatar_decoration === 'boolean' ? backendSettings.discord_avatar_decoration : settings.discordAvatarDecoration
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
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) {
        setSaveErrorMessage('No session found. Please log in again.')
        setShowSaveError(true)
        setTimeout(() => setShowSaveError(false), 5000)
        return false
      }

      logger.info('Attempting to save settings with session ID:', sessionId.substring(0, 8) + '...')

      const response = await fetch('/api/customization/settings', {
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
          cursor_url: settings.customCursor || ''
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setOriginalSettings(JSON.parse(JSON.stringify(settings)))
          setHasUnsavedChanges(false)
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
      setSaveErrorMessage(error.message || 'Failed to save settings. Please try again.')
      setShowSaveError(true)
      setTimeout(() => setShowSaveError(false), 5000)
      return false
    } finally {
      setSaving(false)
    }
  }

  // Direct save function for audio settings - bypasses unsaved changes dialog
  const saveAudioSettings = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) return

      const response = await fetch('/api/customization/settings', {
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

  // Detect changes but DON'T auto-show dialog - only show when user wants to leave
  useEffect(() => {
    if (!loading && originalSettings) {
      const currentSettingsStr = JSON.stringify(settings)
      const originalSettingsStr = JSON.stringify(originalSettings)
      const hasChanges = currentSettingsStr !== originalSettingsStr
      
      setHasUnsavedChanges(hasChanges)
      // Don't auto-show dialog - only show based on user action
    }
  }, [settings, loading, originalSettings])

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

  // File upload handlers - Fixed validation mapping
  const handleFileUpload = async (file, type) => {
    if (!file) return

    // Validate file size and type
    const maxSize = type === 'audio' ? 10 * 1024 * 1024 : 5 * 1024 * 1024 // 10MB for audio, 5MB for others
    if (file.size > maxSize) {
      setSaveErrorMessage(`File too large. Maximum size is ${type === 'audio' ? '10MB' : '5MB'}`)
      setShowSaveError(true)
      setTimeout(() => setShowSaveError(false), 5000)
      return
    }

    // Fixed: Use correct type mapping to match backend
    const allowedTypes = {
      backgroundImage: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      avatar: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a'],
      cursor: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml']
    }

    if (!allowedTypes[type]?.includes(file.type)) {
      setSaveErrorMessage(`Invalid file type for ${type}. Please select a valid file. Supported: PNG, JPG, WebP`)
      setShowSaveError(true)
      setTimeout(() => setShowSaveError(false), 5000)
      return
    }

    try {
      setUploading(prev => ({ ...prev, [type]: true }))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) {
        throw new Error('No session found. Please log in again.')
      }

      const response = await fetch('/api/upload/asset', {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId
        },
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
          cursor: 'cursorUrl'
        }[type]

        // Update settings
        setSettings(prev => ({ ...prev, [settingKey]: data.data.url }))
        
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

  return (
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
          <PreviewToggle 
            $active={previewMode} 
            onClick={() => setPreviewMode(!previewMode)}
          >
            <HiEye />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </PreviewToggle>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {/* Background Upload */}
                <div style={{ 
                  padding: settings.backgroundUrl ? '1rem' : '2rem', 
                  background: settings.backgroundUrl 
                    ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("${settings.backgroundUrl}")` 
                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: `2px dashed ${settings.backgroundUrl ? 'rgba(88, 164, 176, 0.6)' : 'rgba(88, 164, 176, 0.3)'}`, 
                  borderRadius: '12px', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  minHeight: settings.backgroundUrl ? '150px' : 'auto'
                }} 
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'rgba(88, 164, 176, 0.8)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = settings.backgroundUrl ? 'rgba(88, 164, 176, 0.6)' : 'rgba(88, 164, 176, 0.3)'
                  e.target.style.transform = 'translateY(0)'
                }}
                onClick={() => fileInputRefs.current.background?.click()}>
                  {settings.backgroundUrl ? (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%',
                      color: '#ffffff',
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                    }}>
                      <HiPhoto style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem' }}>Background Active</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                        {uploading.background ? 'Uploading new...' : 'Click to change'}
                      </div>
                    </div>
                  ) : (
                    <>
                      <HiPhoto style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#58A4B0' }} />
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', color: '#ffffff' }}>Background</div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                        {uploading.background ? 'Uploading...' : 'Click to upload a file'}
                      </div>
                    </>
                  )}
                  {settings.backgroundUrl && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: 'rgba(0,0,0,0.6)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      color: '#ffffff'
                    }} onClick={(e) => {
                      e.stopPropagation()
                      setSettings(prev => ({ ...prev, backgroundUrl: '' }))
                    }}>
                      <HiXMark />
                    </div>
                  )}
                  <input
                    ref={el => fileInputRefs.current.background = el}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'backgroundImage')}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Audio Upload */}
                <div style={{ 
                  padding: '2rem', 
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                  border: '2px dashed rgba(88, 164, 176, 0.3)', 
                  borderRadius: '12px', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }} 
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'rgba(88, 164, 176, 0.5)'
                  e.target.style.background = 'linear-gradient(145deg, rgba(88, 164, 176, 0.08), rgba(88, 164, 176, 0.03))'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'rgba(88, 164, 176, 0.3)'
                  e.target.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))'
                  e.target.style.transform = 'translateY(0)'
                }}
                onClick={() => setShowAudioModal(true)}>
                  <HiSpeakerWave style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#58A4B0' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', color: '#ffffff' }}>Audio</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    {uploading.audio ? 'Uploading...' : 'Click to open audio manager'}
                  </div>
                  <input
                    ref={el => fileInputRefs.current.audio = el}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'audio')}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Profile Avatar Upload */}
                <div style={{ 
                  padding: settings.avatarUrl ? '1rem' : '2rem', 
                  background: settings.avatarUrl 
                    ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("${settings.avatarUrl}")` 
                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: settings.avatarUrl 
                    ? '2px solid rgba(88, 164, 176, 0.4)' 
                    : '2px dashed rgba(88, 164, 176, 0.3)', 
                  borderRadius: '12px', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minHeight: settings.avatarUrl ? '120px' : 'auto',
                  position: 'relative',
                  overflow: 'hidden'
                }} 
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'rgba(88, 164, 176, 0.6)'
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 8px 25px rgba(88, 164, 176, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = settings.avatarUrl ? 'rgba(88, 164, 176, 0.4)' : 'rgba(88, 164, 176, 0.3)'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
                onClick={() => fileInputRefs.current.avatar?.click()}>
                  {settings.avatarUrl ? (
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ffffff', display: 'flex', alignItems: 'center' }}>
                          <HiUser style={{ marginRight: '0.5rem', fontSize: '1.1rem' }} />
                          Avatar Active
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSettings(prev => ({ ...prev, avatarUrl: '' }))
                          }}
                          style={{
                            background: 'rgba(220, 38, 38, 0.8)',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(220, 38, 38, 1)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(220, 38, 38, 0.8)'
                          }}
                        >
                          <HiXMark style={{ fontSize: '0.9rem' }} />
                          Remove
                        </button>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                        {uploading.avatar ? 'Uploading new avatar...' : 'Click to change avatar'}
                      </div>
                    </div>
                  ) : (
                    <>
                      {uploading.avatar ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            border: '3px solid rgba(88, 164, 176, 0.3)',
                            borderTop: '3px solid #58A4B0',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: '1rem'
                          }} />
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', color: '#58A4B0' }}>Uploading Avatar...</div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Please wait</div>
                        </div>
                      ) : (
                        <>
                          <HiUser style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#58A4B0' }} />
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', color: '#ffffff' }}>Profile Avatar</div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Click to upload avatar image</div>
                        </>
                      )}
                    </>
                  )}
                  <input
                    ref={el => fileInputRefs.current.avatar = el}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'avatar')}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Custom Cursor Upload */}
                <div style={{ 
                  padding: settings.cursorUrl ? '1rem' : '2rem', 
                  background: settings.cursorUrl 
                    ? 'linear-gradient(145deg, rgba(88, 164, 176, 0.15), rgba(88, 164, 176, 0.05))'
                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                  border: `2px dashed ${settings.cursorUrl ? 'rgba(88, 164, 176, 0.6)' : 'rgba(88, 164, 176, 0.3)'}`, 
                  borderRadius: '12px', 
                  textAlign: 'center', 
                  cursor: settings.cursorUrl ? `url(${settings.cursorUrl}), pointer` : 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  minHeight: settings.cursorUrl ? '120px' : 'auto'
                }} 
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'rgba(88, 164, 176, 0.8)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = settings.cursorUrl ? 'rgba(88, 164, 176, 0.6)' : 'rgba(88, 164, 176, 0.3)'
                  e.target.style.transform = 'translateY(0)'
                }}
                onClick={() => fileInputRefs.current.cursor?.click()}>
                  {settings.cursorUrl ? (
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ffffff', display: 'flex', alignItems: 'center' }}>
                          <HiCursorArrowRays style={{ marginRight: '0.5rem', fontSize: '1.1rem' }} />
                          Cursor Active
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSettings(prev => ({ ...prev, cursorUrl: '' }))
                          }}
                          style={{
                            background: 'rgba(220, 38, 38, 0.8)',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(220, 38, 38, 1)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(220, 38, 38, 0.8)'
                          }}
                        >
                          <HiXMark style={{ fontSize: '0.9rem' }} />
                          Remove
                        </button>
                      </div>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundImage: `url(${settings.cursorUrl})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        marginBottom: '0.5rem',
                        margin: '0 auto 0.5rem auto',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                      }} />
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                        {uploading.cursor ? 'Uploading new cursor...' : 'Click to change cursor'}
                      </div>
                    </div>
                  ) : (
                    <>
                      {uploading.cursor ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            border: '3px solid rgba(88, 164, 176, 0.3)',
                            borderTop: '3px solid #58A4B0',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: '1rem'
                          }} />
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', color: '#58A4B0' }}>Uploading Cursor...</div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Please wait</div>
                        </div>
                      ) : (
                        <>
                          <HiCursorArrowRays style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#58A4B0' }} />
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', color: '#ffffff' }}>Custom Cursor</div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Click to upload cursor file</div>
                        </>
                      )}
                    </>
                  )}
                  <input
                    ref={el => fileInputRefs.current.cursor = el}
                    type="file"
                    accept="image/png,image/gif"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'cursor')}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </SettingsGroup>

            {/* 2. Premium Banner */}
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

            {/* 3. General Customization Section */}
            <SectionHeader>
              <h2>General Customization</h2>
            </SectionHeader>
            
            <SettingsGroup>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
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

                {/* Discord Presence */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Discord Presence</label>
                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <HiGlobeAlt style={{ color: 'rgba(255,255,255,0.5)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                      Click here to connect your Discord and unlock this feature.
                    </span>
                  </div>
                </div>

                {/* Profile Opacity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Profile Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.profileOpacity || 90}
                    onChange={(e) => {
                      // Update settings locally without triggering side effects
                      setSettings(prev => ({ ...prev, profileOpacity: parseInt(e.target.value) }))
                    }}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    {[0, 25, 50, 75, 100].map(val => (
                      <span key={val} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{val}%</span>
                    ))}
                  </div>
                </div>

                {/* Profile Blur */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>Profile Blur</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={settings.profileBlur || 0}
                    onChange={(e) => {
                      // Update settings locally without triggering side effects  
                      setSettings(prev => ({ ...prev, profileBlur: parseInt(e.target.value) }))
                    }}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    {[0, 5, 10, 15, 20].map(val => (
                      <span key={val} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{val}px</span>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsGroup>

            {/* 4. Glow Settings */}
            <div style={{ margin: '2rem 0' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.9)' }}>Glow Settings</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: settings.glowUsername ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                    border: `1px solid ${settings.glowUsername ? 'rgba(88, 164, 176, 0.3)' : 'rgba(88, 164, 176, 0.15)'}`,
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = settings.glowUsername ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.3), rgba(88, 164, 176, 0.15))' : 'linear-gradient(145deg, rgba(88, 164, 176, 0.08), rgba(88, 164, 176, 0.03))'
                    e.target.style.borderColor = 'rgba(88, 164, 176, 0.4)'
                    e.target.style.transform = 'translateY(-1px)'
                    e.target.style.boxShadow = '0 4px 12px rgba(88, 164, 176, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = settings.glowUsername ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))'
                    e.target.style.borderColor = settings.glowUsername ? 'rgba(88, 164, 176, 0.3)' : 'rgba(88, 164, 176, 0.15)'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                  onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, glowUsername: !prev.glowUsername }))
                  }}
                >
                  <HiSparkles style={{ color: settings.glowUsername ? '#58A4B0' : 'rgba(88, 164, 176, 0.7)' }} />
                  Username
                </button>
                <button
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: settings.glowSocials ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                    border: `1px solid ${settings.glowSocials ? 'rgba(88, 164, 176, 0.3)' : 'rgba(88, 164, 176, 0.15)'}`,
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = settings.glowSocials ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.3), rgba(88, 164, 176, 0.15))' : 'linear-gradient(145deg, rgba(88, 164, 176, 0.08), rgba(88, 164, 176, 0.03))'
                    e.target.style.borderColor = 'rgba(88, 164, 176, 0.4)'
                    e.target.style.transform = 'translateY(-1px)'
                    e.target.style.boxShadow = '0 4px 12px rgba(88, 164, 176, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = settings.glowSocials ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))'
                    e.target.style.borderColor = settings.glowSocials ? 'rgba(88, 164, 176, 0.3)' : 'rgba(88, 164, 176, 0.15)'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                  onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, glowSocials: !prev.glowSocials }))
                  }}
                >
                  <HiGlobeAlt style={{ color: settings.glowSocials ? '#58A4B0' : 'rgba(88, 164, 176, 0.7)' }} />
                  Socials
                </button>
                <button
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: settings.glowBadges ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                    border: `1px solid ${settings.glowBadges ? 'rgba(88, 164, 176, 0.3)' : 'rgba(88, 164, 176, 0.15)'}`,
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = settings.glowBadges ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.3), rgba(88, 164, 176, 0.15))' : 'linear-gradient(145deg, rgba(88, 164, 176, 0.08), rgba(88, 164, 176, 0.03))'
                    e.target.style.borderColor = 'rgba(88, 164, 176, 0.4)'
                    e.target.style.transform = 'translateY(-1px)'
                    e.target.style.boxShadow = '0 4px 12px rgba(88, 164, 176, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = settings.glowBadges ? 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))'
                    e.target.style.borderColor = settings.glowBadges ? 'rgba(88, 164, 176, 0.3)' : 'rgba(88, 164, 176, 0.15)'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                  onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, glowBadges: !prev.glowBadges }))
                  }}
                >
                  <HiShieldCheck style={{ color: settings.glowBadges ? '#58A4B0' : 'rgba(88, 164, 176, 0.7)' }} />
                  Badges
                </button>
              </div>
            </div>

            {/* 5. Color Customization Section */}
            <SectionHeader>
              <h2>Color Customization</h2>
            </SectionHeader>
            
            <SettingsGroup>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
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

              {/* Use Discord Avatar */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)'
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
                    // Update settings locally without triggering side effects
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
                    // Update settings locally without triggering side effects
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
          </TabContent>
        </MainContent>

        {/* Live Preview Panel */}
        {previewMode && (
          <PreviewPanel>
            <PreviewHeader>
              <h3>Live Preview</h3>
              <button onClick={() => setPreviewMode(false)}>
                <HiXMark />
              </button>
            </PreviewHeader>
            <LivePreview settings={settings} />
          </PreviewPanel>
        )}
      </ContentWrapper>

      {/* Unsaved Changes Dialog - Only show when explicitly triggered */}

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
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
        </DialogOverlay>
      )}


      {/* Error Notification */}
      {showSaveError && (
        <ErrorNotification>
          <HiExclamationTriangle className="error-icon" />
          <div>
            <span>Failed to save settings</span>
            <p>{saveErrorMessage}</p>
          </div>
        </ErrorNotification>
      )}

      {/* Dynamic Save Changes Snackbar */}
      {hasUnsavedChanges && (
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
        </SaveSnackbar>
      )}

      {/* Audio Manager Modal */}
      {showAudioModal && (
        <AudioManagerModal>
          <AudioModalOverlay onClick={() => setShowAudioModal(false)} />
          <AudioModalContent>
            <AudioModalHeader>
              <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.5rem', fontWeight: '600' }}>
                <HiMusicalNote style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Audio Manager
              </h2>
              <button 
                onClick={() => setShowAudioModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '0.5rem'
                }}
              >
                <HiXMark />
              </button>
            </AudioModalHeader>

            <AudioModalBody>
              {/* Current Audio Section */}
              {settings.audioUrl ? (
                <CurrentAudioSection>
                  <h3 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '0.75rem' }}>Current Audio</h3>
                  <AudioPlayer controls src={settings.audioUrl} style={{ width: '100%', borderRadius: '8px' }} />
                  <AudioControls>
                    <AudioControlButton onClick={() => {
                      setSettings(prev => ({ ...prev, audioUrl: '' }))
                      // Auto-save immediately when removing audio
                      setTimeout(() => saveAudioSettings(), 100)
                    }}>
                      <HiXMark style={{ marginRight: '0.5rem' }} />
                      Remove
                    </AudioControlButton>
                  </AudioControls>
                </CurrentAudioSection>
              ) : (
                <EmptyAudioState>
                  <HiSpeakerWave style={{ fontSize: '2.5rem', color: '#58A4B0', marginBottom: '0.5rem' }} />
                  <h4 style={{ color: '#ffffff', marginBottom: '0.25rem', fontSize: '1rem' }}>No Audio Selected</h4>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0', fontSize: '0.85rem' }}>Upload an audio file to play on your profile</p>
                </EmptyAudioState>
              )}

              {/* Upload Section */}
              <UploadSection>
                <h3 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '0.75rem' }}>Upload New Audio</h3>
                <AudioUploadZone
                  onClick={() => fileInputRefs.current.audio?.click()}
                  style={{
                    border: uploading.audio ? '2px solid #58A4B0' : '2px dashed rgba(88, 164, 176, 0.3)',
                    padding: '1.5rem'
                  }}
                >
                  {uploading.audio ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        border: '2px solid rgba(88, 164, 176, 0.3)',
                        borderTop: '2px solid #58A4B0',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginRight: '0.75rem'
                      }} />
                      <p style={{ color: '#58A4B0', fontWeight: '600', margin: 0 }}>Uploading...</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HiSpeakerWave style={{ fontSize: '1.5rem', color: '#58A4B0', marginRight: '0.75rem' }} />
                      <div>
                        <h4 style={{ color: '#ffffff', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Drop audio file here</h4>
                        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0', fontSize: '0.8rem' }}>or click to browse</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={el => fileInputRefs.current.audio = el}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'audio')}
                    style={{ display: 'none' }}
                  />
                </AudioUploadZone>
                
                <AudioFormatInfo>
                  <HiInformationCircle style={{ marginRight: '0.5rem' }} />
                  MP3, WAV, OGG, M4A (Max: 10MB)
                </AudioFormatInfo>
              </UploadSection>
            </AudioModalBody>
          </AudioModalContent>
        </AudioManagerModal>
      )}
    </CustomizationWrapper>
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

const PreviewToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${props => props.$active ? 'rgba(88, 164, 176, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.$active ? 'rgba(88, 164, 176, 0.4)' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  
  &:hover {
    background: rgba(88, 164, 176, 0.25);
    border-color: rgba(88, 164, 176, 0.5);
  }
  
  svg {
    font-size: 1.1rem;
  }
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
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    outline: none;
    appearance: none;
    cursor: pointer;
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      background: #58A4B0;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(88, 164, 176, 0.4);
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(88, 164, 176, 0.6);
      }
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

const PreviewPanel = styled.div`
  width: 320px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  height: fit-content;
  position: sticky;
  top: 2rem;
  
  @media (max-width: 1200px) {
    display: none;
  }
`

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    font-size: 1rem;
    color: #ffffff;
    margin: 0;
  }
  
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 0, 0, 0.2);
      border-color: rgba(255, 0, 0, 0.4);
    }
    
    svg {
      font-size: 1rem;
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
  z-index: 1000;
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
  bottom: 20px;
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
  animation: slideInUp 0.3s ease-out;
  
  @keyframes slideInUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
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
    bottom: 10px;
    right: 10px;
    left: 10px;
    text-align: center;
  }
`

const ErrorNotification = styled.div`
  position: fixed;
  bottom: 20px;
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
  animation: slideInUp 0.3s ease-out;
  
  @keyframes slideInUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
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
    bottom: 10px;
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
  z-index: 1000;
  animation: slideUpFade 0.3s ease-out;
  max-width: calc(100vw - 60px);

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

// Audio Manager Modal Styled Components
const AudioManagerModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`

const AudioModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
`

const AudioModalContent = styled.div`
  position: relative;
  background: linear-gradient(145deg, rgba(15, 15, 35, 0.95), rgba(20, 20, 40, 0.95));
  border: 1px solid rgba(88, 164, 176, 0.2);
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 70vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
`

const AudioModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(88, 164, 176, 0.2);
  background: linear-gradient(135deg, rgba(88, 164, 176, 0.1), rgba(88, 164, 176, 0.05));
`

const AudioModalBody = styled.div`
  padding: 2rem;
  max-height: calc(80vh - 100px);
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #58A4B0;
    border-radius: 4px;
    
    &:hover {
      background: #4A8C96;
    }
  }
`

const AudioModalMainContent = styled.div`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`

const AudioModalLeft = styled.div`
  flex: 1;
`

const AudioModalRight = styled.div`
  flex: 1;
`

const CurrentAudioSection = styled.div`
  background: linear-gradient(145deg, rgba(88, 164, 176, 0.1), rgba(88, 164, 176, 0.05));
  border: 1px solid rgba(88, 164, 176, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`

const AudioPlayer = styled.audio`
  width: 100%;
  height: 40px;
  
  &::-webkit-media-controls-panel {
    background-color: rgba(88, 164, 176, 0.2);
  }
`

const AudioControls = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`

const AudioControlButton = styled.button`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(220, 38, 127, 0.1);
  border: 1px solid rgba(220, 38, 127, 0.3);
  border-radius: 8px;
  color: #ff6b9d;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(220, 38, 127, 0.2);
    border-color: rgba(220, 38, 127, 0.5);
    transform: translateY(-2px);
  }
`

const EmptyAudioState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
  border: 2px dashed rgba(88, 164, 176, 0.3);
  border-radius: 12px;
  margin-bottom: 2rem;
`

const UploadSection = styled.div`
  margin-bottom: 2rem;
`

const AudioUploadZone = styled.div`
  padding: 3rem 2rem;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
  
  &:hover {
    border-color: rgba(88, 164, 176, 0.6) !important;
    background: linear-gradient(145deg, rgba(88, 164, 176, 0.08), rgba(88, 164, 176, 0.03));
    transform: translateY(-2px);
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const AudioUploadButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #58A4B0, #4A8C96);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #4A8C96, #3A7A84);
    transform: translateY(-2px);
  }
`

const AudioFormatInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(88, 164, 176, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(88, 164, 176, 0.1);
`

const AudioSettingsSection = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
`

const AudioSetting = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  input[type="range"] {
    &::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #58A4B0;
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    
    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #58A4B0;
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
  }
`

export default CustomizationPage