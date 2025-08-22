import React, { useState, useEffect, useRef } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { IoEye, IoVolumeHigh, IoVolumeMute, IoPlay, IoPause } from 'react-icons/io5'
import { Icon } from '@iconify/react'
import ParticleBackground from '../effects/ParticleBackground'
import RainEffect from '../background_effect/RainEffect.jsx'
import UserLinks from '../profile/UserLinks'
import { useTheme } from '../../contexts/ThemeContext'
import logger from '../../utils/logger'

// Custom hook for typewriter animation
const useTypewriter = (text, speed = 100, enabled = false) => {
  const [displayText, setDisplayText] = useState('')
  const indexRef = useRef(0)
  const isDeletingRef = useRef(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayText(text || '')
      return
    }

    // Reset refs when text changes
    indexRef.current = 0
    isDeletingRef.current = false
    setDisplayText('')

    const typewriter = () => {
      const currentIndex = indexRef.current
      const isDeleting = isDeletingRef.current

      if (!isDeleting && currentIndex < text.length) {
        // Typing forward
        indexRef.current = currentIndex + 1
        setDisplayText(text.slice(0, currentIndex + 1))
        timeoutRef.current = setTimeout(typewriter, speed)
      } else if (!isDeleting && currentIndex === text.length) {
        // Pause at full text, then start deleting
        timeoutRef.current = setTimeout(() => {
          isDeletingRef.current = true
          typewriter()
        }, 2000)
      } else if (isDeleting && currentIndex > 1) {
        // Deleting backwards (keep @ symbol)
        indexRef.current = currentIndex - 1
        setDisplayText(text.slice(0, currentIndex - 1))
        timeoutRef.current = setTimeout(typewriter, speed / 2)
      } else if (isDeleting && currentIndex === 1) {
        // Reset cycle - start typing again
        timeoutRef.current = setTimeout(() => {
          isDeletingRef.current = false
          indexRef.current = 1
          typewriter()
        }, 500)
      }
    }

    // Start the animation
    timeoutRef.current = setTimeout(typewriter, speed)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [text, speed, enabled])

  return displayText
}

// Audio Controller Component
const AudioController = ({ audioUrl, volumeLevel, videoElement, showControls = true }) => {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentVolume, setCurrentVolume] = useState(volumeLevel || 50)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = currentVolume / 100
    }
  }, [currentVolume])

  // Enhanced autoplay effect with multiple strategies
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      const audio = audioRef.current
      
      const playAudio = async () => {
        try {
          // Multiple attempts with different strategies
          const attemptPlay = async (delay = 0) => {
            await new Promise(resolve => setTimeout(resolve, delay))
            if (audio && !audio.paused) return true // Already playing
            
            try {
              await audio.play()
              setIsPlaying(true)
              console.log('✅ Audio autoplay successful')
              return true
            } catch (err) {
              return false
            }
          }

          // Strategy 1: Immediate play
          if (await attemptPlay(0)) return

          console.log('⚠️ Immediate autoplay failed, trying fallback strategies...')
          
          // Strategy 2: Short delay
          if (await attemptPlay(100)) return
          
          // Strategy 3: Medium delay  
          if (await attemptPlay(500)) return
          
          // Strategy 4: After page interaction
          console.log('🔒 Autoplay blocked, waiting for user interaction...')
          const handleFirstInteraction = async (event) => {
            try {
              await audio.play()
              setIsPlaying(true)
              console.log('✅ Audio started after user interaction')
              // Remove all listeners
              document.removeEventListener('click', handleFirstInteraction, { capture: true })
              document.removeEventListener('keydown', handleFirstInteraction, { capture: true })
              document.removeEventListener('touchstart', handleFirstInteraction, { capture: true })
              document.removeEventListener('scroll', handleFirstInteraction, { capture: true })
            } catch (playErr) {
              console.log('❌ Audio play failed even after interaction:', playErr)
            }
          }
          
          // Listen for various user interactions
          document.addEventListener('click', handleFirstInteraction, { capture: true })
          document.addEventListener('keydown', handleFirstInteraction, { capture: true })
          document.addEventListener('touchstart', handleFirstInteraction, { capture: true })
          document.addEventListener('scroll', handleFirstInteraction, { capture: true })
          
        } catch (err) {
          console.log('❌ Audio setup failed:', err)
        }
      }
      
      // Start playback attempt with promise error handling
      try {
        playAudio().catch(err => {
          console.log('🔇 Audio autoplay silently failed (expected):', err.name)
        })
      } catch (err) {
        console.log('❌ Audio setup synchronous error:', err)
      }
      
      // Cleanup function
      return () => {
        try {
          if (audio) {
            audio.pause()
            audio.currentTime = 0
          }
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    }
  }, [audioUrl]) // Only depend on audioUrl changes, not volume

  // Sync audio with video playback
  useEffect(() => {
    if (videoElement && audioRef.current) {
      const handleVideoPlay = () => {
        if (audioRef.current && !isPlaying) {
          audioRef.current.play().then(() => setIsPlaying(true))
        }
      }
      
      const handleVideoPause = () => {
        if (audioRef.current && isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        }
      }

      videoElement.addEventListener('play', handleVideoPlay)
      videoElement.addEventListener('pause', handleVideoPause)
      
      return () => {
        videoElement.removeEventListener('play', handleVideoPlay)
        videoElement.removeEventListener('pause', handleVideoPause)
      }
    }
  }, [videoElement, isPlaying])

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value)
    setCurrentVolume(newVolume)
  }

  return (
    <>
      {/* Audio element - always rendered for playback */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        autoPlay
        muted={false}
        playsInline
        onPlay={() => {
          setIsPlaying(true)
          console.log('🎵 Audio started playing')
        }}
        onPause={() => {
          setIsPlaying(false)
          console.log('⏸️ Audio paused')
        }}
        onCanPlay={() => {
          // Try to play when audio is ready for playback
          if (audioRef.current && !isPlaying) {
            audioRef.current.play().catch(err => console.log('⚠️ CanPlay autoplay failed:', err))
          }
        }}
        onCanPlayThrough={() => {
          // Try to play when audio is fully loaded
          if (audioRef.current && !isPlaying) {
            audioRef.current.play().catch(err => console.log('⚠️ CanPlayThrough autoplay failed:', err))
          }
        }}
        onLoadedData={() => {
          // Try to play when data is loaded
          if (audioRef.current && !isPlaying) {
            audioRef.current.play().catch(err => console.log('⚠️ LoadedData autoplay failed:', err))
          }
        }}
        onError={(e) => {
          console.log('❌ Audio error:', e)
        }}
      >
        <source src={audioUrl} type="audio/mpeg" />
        <source src={audioUrl} type="audio/wav" />
        <source src={audioUrl} type="audio/ogg" />
        <source src={audioUrl} type="audio/opus" />
        <source src={audioUrl} type="audio/webm" />
        <source src={audioUrl} type="audio/mp4" />
        Your browser does not support the audio element.
      </audio>
      
      {/* Audio controls - only shown if showControls is true */}
      {showControls && (
        <AudioControlsWrapper
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AudioIcon onClick={togglePlayPause} isPlaying={isPlaying}>
            {currentVolume === 0 ? (
              <IoVolumeMute />
            ) : isPlaying ? (
              <IoVolumeHigh />
            ) : (
              <IoPlay />
            )}
          </AudioIcon>
          
          <VolumeSlider isVisible={isHovered}>
            <input
              type="range"
              min="0"
              max="100"
              value={currentVolume}
              onChange={handleVolumeChange}
            />
            <VolumeValue>{currentVolume}%</VolumeValue>
          </VolumeSlider>
        </AudioControlsWrapper>
      )}
    </>
  )
}

// Function to load Google Fonts dynamically with Promise support
const loadGoogleFont = (fontFamily) => {
  return new Promise((resolve, reject) => {
    if (!fontFamily) {
      resolve()
      return
    }
    
    const existingLink = document.querySelector(`link[href*="${fontFamily.replace(/ /g, '+')}"]`)
    if (existingLink) {
      resolve()
      return
    }
    
    const link = document.createElement('link')
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`
    link.rel = 'stylesheet'
    link.onload = resolve
    link.onerror = reject
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(), 5000)
    
    document.head.appendChild(link)
  })
}

const UserProfile = () => {
  const { username } = useParams()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState('Initializing...')
  const [error, setError] = useState(null)
  const [templateData, setTemplateData] = useState(null)
  const [isTemplatePreview, setIsTemplatePreview] = useState(false)
  const [badges, setBadges] = useState([])
  const [badgesLoading, setBadgesLoading] = useState(true)
  const { colors, isDarkMode } = useTheme()
  const videoRef = useRef(null)

  // Typewriter animation for document title only (always use username for title)
  const animatedTitle = useTypewriter(
    user?.username ? `@${user.username}` : '', 
    120, // Speed in ms
    user?.customization?.animatedTitle === true
  )

  // Set document title with typewriter animation and metadata
  useEffect(() => {
    if (user?.username) {
      // Always use username for document title
      const usernameTitle = `@${user.username}`
      if (user?.customization?.animatedTitle) {
        document.title = animatedTitle || usernameTitle
      } else {
        document.title = usernameTitle
      }
      
      // Set meta description (use username for consistency)
      const metaDescription = document.querySelector('meta[name="description"]')
      const metaContent = `Check out @${user.username}'s profile on Gotchu`
      if (metaDescription) {
        metaDescription.setAttribute('content', metaContent)
      } else {
        const newMeta = document.createElement('meta')
        newMeta.name = 'description'
        newMeta.content = metaContent
        document.head.appendChild(newMeta)
      }
    }

    return () => {
      // Reset title when component unmounts
      document.title = 'Gotchu'
    }
  }, [user?.username, animatedTitle, user?.customization?.animatedTitle])

  // Check for template preview parameters
  const urlParams = new URLSearchParams(location.search)
  const templatePreview = urlParams.get('templatePreview') === 'true'
  const templateId = urlParams.get('templateId')

  useEffect(() => {
    // Optimize data fetching - fetch all data in parallel and only show page when ready
    const fetchAllData = async () => {
      try {
        setLoading(true)
        setError(null)
        setLoadingStatus('Loading profile data...')

        // Fetch user profile, badges, and template data in parallel
        const promises = [fetchUserProfile(), fetchUserBadges()]
        
        if (templatePreview && templateId) {
          setLoadingStatus('Loading template preview...')
          promises.push(fetchTemplateData())
        }

        // Wait for all data fetching to complete
        await Promise.all(promises)

        setLoadingStatus('Optimizing assets...')
        
        // Small delay to show the final status
        await new Promise(resolve => setTimeout(resolve, 200))

        // Only set loading to false when everything is ready
        setLoading(false)
      } catch (err) {
        logger.error('Data fetching failed', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchAllData()

    // Add global handler for unhandled promise rejections from audio
    const handleUnhandledRejection = (event) => {
      if (event.reason && event.reason.name === 'NotAllowedError' && event.reason.message.includes('play()')) {
        console.log('🔇 Prevented audio autoplay error from crashing app')
        event.preventDefault()
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [username, templatePreview, templateId])

  // Apply template customization when both user and template data are loaded
  useEffect(() => {
    if (user && templateData && isTemplatePreview) {
      applyTemplateCustomization(user)
    }
  }, [user, templateData, isTemplatePreview])

  // Try to enable autoplay for audio when user data is loaded
  useEffect(() => {
    if (user && user.customization?.audioUrl) {
      // Add a global click listener to start audio on first user interaction
      const enableAudio = () => {
        const audioElements = document.querySelectorAll('audio')
        audioElements.forEach(audio => {
          if (audio.paused) {
            audio.play().catch(err => console.log('Global audio play failed:', err))
          }
        })
        document.removeEventListener('click', enableAudio)
        document.removeEventListener('touchstart', enableAudio)
        document.removeEventListener('keydown', enableAudio)
      }
      
      document.addEventListener('click', enableAudio)
      document.addEventListener('touchstart', enableAudio)
      document.addEventListener('keydown', enableAudio)
      
      return () => {
        document.removeEventListener('click', enableAudio)
        document.removeEventListener('touchstart', enableAudio)
        document.removeEventListener('keydown', enableAudio)
      }
    }
  }, [user])

  // Cleanup cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [])

  // Handle global background override for video backgrounds
  useEffect(() => {
    const hasBackgroundAsset = user?.customization?.backgroundUrl && user.customization.backgroundUrl.trim() !== ''
    const isBackgroundVideo = hasBackgroundAsset && 
      (user.customization.backgroundUrl.toLowerCase().includes('.mp4') || 
       user.customization.backgroundUrl.toLowerCase().includes('.webm') || 
       user.customization.backgroundUrl.toLowerCase().includes('.ogg') || 
       user.customization.backgroundUrl.toLowerCase().includes('.avi') || 
       user.customization.backgroundUrl.toLowerCase().includes('.mov') ||
       user.customization.backgroundUrl.toLowerCase().includes('video/'))

    if (isBackgroundVideo) {
      // Create and inject CSS to override ALL background styles with maximum specificity
      const styleElement = document.createElement('style')
      styleElement.id = 'video-background-override'
      styleElement.textContent = `
        html, html *, body, body *, #root, #root * {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
        }
        html.dark-mode, html.dark-mode *, html.dark-mode body, html.dark-mode body *,
        html.dark-mode #root, html.dark-mode #root *,
        html.light-mode, html.light-mode *, html.light-mode body, html.light-mode body *,
        html.light-mode #root, html.light-mode #root * {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
        }
        /* Specifically target the ProfileWrapper to ensure no background interference */
        [class*="ProfileWrapper"], [class*="profile"] {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
        }
        /* Ensure video fits full viewport without scroll */
        html, body {
          height: 100vh !important;
          overflow-x: hidden !important;
        }
        #root {
          height: 100vh !important;
          overflow-x: hidden !important;
        }
      `
      document.head.appendChild(styleElement)

      return () => {
        // Remove the override style when component unmounts
        const existingStyle = document.getElementById('video-background-override')
        if (existingStyle) {
          existingStyle.remove()
        }
      }
    }
  }, [user?.customization?.backgroundUrl])

  const fetchTemplateData = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      const data = await response.json()
      
      if (data.success) {
        setTemplateData(data.data.template)
        setIsTemplatePreview(true)
        console.log('🎨 Template preview loaded:', data.data.template.name)
      } else {
        console.error('Failed to fetch template:', data.error)
      }
    } catch (error) {
      console.error('Error fetching template:', error)
    }
  }

  const applyTemplateCustomization = (userData) => {
    if (!templateData) {
      console.log('❌ No template data available for customization')
      return
    }

    console.log('🔍 Template data received:', templateData)
    console.log('🔍 Template background_url:', templateData.background_url)
    console.log('🔍 Template audio_url:', templateData.audio_url)
    console.log('🔍 User current background:', userData.customization.backgroundUrl)

    // Merge user data with template customization, keeping user's profile info but applying template styling
    const mergedCustomization = {
      ...userData.customization,
      // Apply template colors and styling
      accentColor: templateData.accent_color || userData.customization.accentColor,
      textColor: templateData.text_color || userData.customization.textColor,
      backgroundColor: templateData.background_color || userData.customization.backgroundColor,
      primaryColor: templateData.primary_color || userData.customization.primaryColor,
      secondaryColor: templateData.secondary_color || userData.customization.secondaryColor,
      iconColor: templateData.icon_color || userData.customization.iconColor,
      
      // Apply template effects
      backgroundEffect: templateData.background_effect || userData.customization.backgroundEffect,
      usernameEffect: templateData.username_effect || userData.customization.usernameEffect,
      
      // Apply template settings
      profileBlur: templateData.profile_blur ?? userData.customization.profileBlur,
      profileOpacity: templateData.profile_opacity ?? userData.customization.profileOpacity,
      profileGradient: templateData.profile_gradient ?? userData.customization.profileGradient,
      
      // Apply template glow effects
      glowUsername: templateData.glow_username ?? userData.customization.glowUsername,
      glowSocials: templateData.glow_socials ?? userData.customization.glowSocials,
      glowBadges: templateData.glow_badges ?? userData.customization.glowBadges,
      
      // Apply template animations
      animatedTitle: templateData.animated_title ?? userData.customization.animatedTitle,
      monochromeIcons: templateData.monochrome_icons ?? userData.customization.monochromeIcons,
      swapBoxColors: templateData.swap_box_colors ?? userData.customization.swapBoxColors,
      
      // Apply template audio settings
      volumeLevel: templateData.volume_level ?? userData.customization.volumeLevel,
      volumeControl: templateData.volume_control ?? userData.customization.volumeControl,
      
      // Apply template assets - prioritize template assets over user assets
      backgroundUrl: templateData.background_url || userData.customization.backgroundUrl,
      audioUrl: templateData.audio_url || userData.customization.audioUrl,
      cursorUrl: templateData.custom_cursor_url || userData.customization.cursorUrl
    }

    console.log('🎨 Merged background URL:', mergedCustomization.backgroundUrl)
    console.log('🎨 Merged audio URL:', mergedCustomization.audioUrl)

    const updatedUserData = {
      ...userData,
      customization: mergedCustomization
    }

    setUser(updatedUserData)
    console.log('✅ Template customization applied:', templateData.name)
    console.log('✅ Final user data:', updatedUserData)
  }

  // Preload critical assets for better performance
  const preloadAssets = async (userData) => {
    const promises = []
    const assetNames = []
    
    // Preload fonts if specified
    if (userData.customization?.textFont) {
      promises.push(loadGoogleFont(userData.customization.textFont))
      assetNames.push('font')
    }
    
    // Preload background image if it exists
    if (userData.customization?.backgroundUrl) {
      promises.push(preloadImage(userData.customization.backgroundUrl))
      assetNames.push('background')
    }
    
    // Preload avatar image if it exists
    if (userData.avatar_url) {
      promises.push(preloadImage(userData.avatar_url))
      assetNames.push('avatar')
    }
    
    // Apply cursor immediately if set
    if (userData.customization?.cursorUrl) {
      document.body.style.cursor = `url(${userData.customization.cursorUrl}), auto`
    }
    
    // Wait for all preloading to complete
    try {
      if (promises.length > 0) {
        setLoadingStatus(`Loading assets (${assetNames.join(', ')})...`)
        await Promise.all(promises)
      }
    } catch (error) {
      console.warn('Some assets failed to preload:', error)
      // Don't throw - preloading failure shouldn't block page display
    }
  }

  // Helper function to preload images
  const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = reject
      img.src = src
      
      // Timeout after 3 seconds to prevent blocking
      setTimeout(() => resolve(), 3000)
    })
  }

  const fetchUserProfile = async () => {
    try {
      // Fetch real user data from backend API
      const response = await fetch(`/api/users/${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found')
        } else if (response.status === 403) {
          throw new Error('This profile is private')
        } else {
          throw new Error('Failed to load profile')
        }
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load profile')
      }
      
      const userData = data.data.user
      
      // Map API response to expected format with customization settings
      const profileData = {
        id: userData.id,
        username: userData.username,
        displayName: userData.display_name || userData.username,
        bio: userData.bio || `Welcome to ${userData.username}'s profile!`,
        avatar_url: userData.avatar_url,
        is_verified: userData.is_verified,
        plan: userData.plan,
        theme: userData.theme,
        uid: userData.id.toString(),
        joinedDate: userData.created_at,
        profileViews: userData.profile_views || 0,
        links: userData.links ? userData.links.map(link => ({
          id: link.id,
          title: link.title,
          url: link.url,
          icon: link.icon || '🔗',
          clicks: link.clicks || 0
        })) : [],
        stats: {
          totalClicks: userData.total_clicks || 0,
          totalViews: userData.profile_views || 0,
          linksCount: userData.links ? userData.links.length : 0
        },
        // Include customization settings
        customization: userData.customization ? {
          // Colors & Theme
          accentColor: userData.customization.accent_color || '#58A4B0',
          textColor: userData.customization.text_color || '#FFFFFF',
          backgroundColor: userData.customization.background_color || '#0F0F23',
          primaryColor: userData.customization.primary_color || '#1bbd9a',
          secondaryColor: userData.customization.secondary_color || '#EC4899',
          iconColor: userData.customization.icon_color || '#FFFFFF',
          
          // Effects
          backgroundEffect: userData.customization.background_effect || '',
          usernameEffect: userData.customization.username_effect || '',
          showBadges: userData.customization.show_badges ?? true,
          
          // Visual Settings
          profileBlur: userData.customization.profile_blur || 0,
          profileOpacity: userData.customization.profile_opacity || 90,
          profileGradient: userData.customization.profile_gradient ?? true,
          
          // Glow Effects
          glowUsername: userData.customization.glow_username || false,
          glowSocials: userData.customization.glow_socials || false,
          glowBadges: userData.customization.glow_badges || false,
          
          // Animations & Effects
          animatedTitle: userData.customization.animated_title || false,
          monochromeIcons: userData.customization.monochrome_icons || false,
          swapBoxColors: userData.customization.swap_box_colors || false,
          
          // Audio
          volumeLevel: userData.customization.volume_level || 50,
          volumeControl: userData.customization.volume_control ?? true,
          
          // Asset URLs
          backgroundUrl: userData.customization.background_url || '',
          audioUrl: userData.customization.audio_url || '',
          cursorUrl: userData.customization.cursor_url || '',
          
          // Typography
          textFont: userData.customization.text_font || ''
        } : {
          // Default customization if none provided
          accentColor: '#58A4B0',
          textColor: '#FFFFFF',
          backgroundColor: '#0F0F23',
          primaryColor: '#1bbd9a',
          secondaryColor: '#EC4899',
          iconColor: '#FFFFFF',
          backgroundEffect: '',
          usernameEffect: '',
          showBadges: true,
          profileBlur: 0,
          profileOpacity: 90,
          profileGradient: true,
          glowUsername: false,
          glowSocials: false,
          glowBadges: false,
          animatedTitle: false,
          monochromeIcons: false,
          swapBoxColors: false,
          volumeLevel: 50,
          volumeControl: true,
          backgroundUrl: '',
          audioUrl: '',
          cursorUrl: '',
          textFont: ''
        }
      }
      
      setUser(profileData);
      
      // Preload critical assets to improve performance
      await preloadAssets(profileData);
      
      // Template customization will be applied in separate useEffect when templateData is ready
    } catch (err) {
      logger.error('Profile fetch failed', err);
      throw err; // Re-throw to be handled by the main fetchAllData function
    }
  }

  const fetchUserBadges = async () => {
    try {
      setBadgesLoading(true)
      console.log('🔍 Fetching badges for username:', username)
      
      // First try to get showcased badges
      let response = await fetch(`/api/users/${username}/badges/showcased`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      console.log('📡 Showcased badges API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('📊 Showcased badges API response data:', data)
        
        if (data.success && data.data.badges && data.data.badges.length > 0) {
          console.log('🎖️ Found showcased badges:', data.data.badges)
          
          // Convert badges to display format
          const displayBadges = data.data.badges.map(badgeData => {
            console.log('🔧 Processing showcased badge:', badgeData.badge)
            const icon = getIconFromBadge(badgeData.badge)
            console.log('🎨 Generated icon for', badgeData.badge.name, ':', icon)
            
            const badge = {
              id: badgeData.badge.id,
              name: badgeData.badge.name,
              description: badgeData.badge.description,
              icon: icon,
              bgColor: getColorFromBadge(badgeData.badge),
              rarity: badgeData.badge.rarity,
              category: badgeData.badge.category,
              rarityEffects: getRarityEffects(badgeData.badge.rarity)
            }
            console.log('✅ Final showcased badge object:', badge)
            return badge
          });
          
          console.log('🎯 Setting showcased badges:', displayBadges)
          setBadges(displayBadges);
          return; // Exit early if we found showcased badges
        } else {
          console.log('❌ No showcased badges found, trying all earned badges...')
        }
      }

      // Fallback: try to get all earned badges if no showcased badges
      console.log('🔄 Fetching all user badges as fallback...')
      response = await fetch(`/api/users/${username}/badges`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      console.log('📡 All badges API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('📊 All badges API response data:', data)
        
        if (data.success && data.data.badges) {
          // Filter to only earned badges and take first 3
          const earnedBadges = data.data.badges.filter(badgeData => badgeData.is_earned)
          console.log('🎖️ Found earned badges:', earnedBadges)
          
          if (earnedBadges.length > 0) {
            // Convert badges to display format
            const displayBadges = earnedBadges.slice(0, 3).map(badgeData => {
              console.log('🔧 Processing earned badge:', badgeData.badge)
              const icon = getIconFromBadge(badgeData.badge)
              console.log('🎨 Generated icon for', badgeData.badge.name, ':', icon)
              
              const badge = {
                id: badgeData.badge.id,
                name: badgeData.badge.name,
                description: badgeData.badge.description,
                icon: icon,
                bgColor: getColorFromBadge(badgeData.badge),
                rarity: badgeData.badge.rarity,
                category: badgeData.badge.category,
                rarityEffects: getRarityEffects(badgeData.badge.rarity)
              }
              console.log('✅ Final earned badge object:', badge)
              return badge
            });
            
            console.log('🎯 Setting earned badges (fallback):', displayBadges)
            setBadges(displayBadges);
          } else {
            console.log('❌ No earned badges found, adding test badge')
            // Add a test badge to verify the rendering works
            setBadges([
              {
                id: 'test-badge',
                name: 'Test Badge',
                description: 'Test badge for debugging',
                icon: 'mdi:star',
                bgColor: '#f59e0b',
                rarity: 'COMMON',
                category: 'TEST',
                rarityEffects: getRarityEffects('COMMON')
              }
            ]);
          }
        } else {
          console.log('❌ No badges found in all badges response')
          setBadges([]);
        }
      } else {
        const errorData = await response.text()
        console.error('❌ All badges API error:', response.status, errorData)
        setBadges([]);
      }
    } catch (err) {
      console.error('💥 Failed to fetch user badges:', err)
      setBadges([]);
    } finally {
      setBadgesLoading(false)
    }
  }

  // Helper functions for badge data conversion
  const getIconFromBadge = (badge) => {
    console.log('🔍 getIconFromBadge called with:', badge)
    
    // Map badge names to Iconify icons
    const badgeIconMap = {
      'staff': 'mdi:star-shooting',
      'helper': 'mdi:help-circle',
      'premium': 'mdi:diamond',
      'verified': 'mdi:check-decagram',
      'donor': 'mdi:gift',
      'og': 'mdi:trophy',
      'gifter': 'mdi:gift-outline',
      'server booster': 'mdi:rocket',
      'serverbooster': 'mdi:rocket',
      'winner': 'mdi:trophy-variant',
      'second place': 'mdi:medal',
      'secondplace': 'mdi:medal',
      'third place': 'mdi:medal-outline',
      'thirdplace': 'mdi:medal-outline',
      'image host': 'mdi:image',
      'imagehost': 'mdi:image',
      'bug hunter': 'mdi:bug',
      'bughunter': 'mdi:bug',
      'easter 2025': 'mdi:egg-easter',
      'easter2025': 'mdi:egg-easter',
      'christmas 2024': 'mdi:pine-tree',
      'christmas2024': 'mdi:pine-tree'
    }
    
    // First try to match by badge name
    const badgeName = badge.name?.toLowerCase()
    console.log('🏷️ Badge name (lowercase):', badgeName)
    
    if (badgeName && badgeIconMap[badgeName]) {
      const mappedIcon = badgeIconMap[badgeName]
      console.log('✅ Found mapped icon:', mappedIcon)
      return mappedIcon
    }
    
    // Fallback to original logic for custom badges
    console.log('🔄 Checking badge icon_type:', badge.icon_type)
    console.log('🔄 Badge icon_value:', badge.icon_value)
    
    if (badge.icon_type === 'EMOJI') {
      console.log('😊 Using emoji icon:', badge.icon_value)
      return badge.icon_value
    } else if (badge.icon_type === 'LUCIDE') {
      const lucideIcon = `lucide:${badge.icon_value}`
      console.log('🎨 Using lucide icon:', lucideIcon)
      return lucideIcon
    }
    
    console.log('⭐ Using default icon: mdi:star')
    return 'mdi:star' // default icon
  }

  const getColorFromBadge = (badge) => {
    if (badge.icon_color) return badge.icon_color
    if (badge.gradient_from) return badge.gradient_from
    
    // Default colors based on rarity
    const rarityColors = {
      COMMON: '#6b7280',
      UNCOMMON: '#10b981',
      RARE: '#3b82f6',
      EPIC: '#8b5cf6',
      LEGENDARY: '#f59e0b',
      MYTHIC: '#ef4444'
    }
    return rarityColors[badge.rarity] || '#6b7280'
  }

  // Get rarity effects for badge styling
  const getRarityEffects = (rarity) => {
    const effects = {
      COMMON: { glow: 'none', animation: 'none', borderGlow: 'rgba(255, 255, 255, 0.25)' },
      UNCOMMON: { glow: '0 0 8px rgba(16, 185, 129, 0.4)', animation: 'none', borderGlow: 'rgba(16, 185, 129, 0.5)' },
      RARE: { glow: '0 0 10px rgba(59, 130, 246, 0.5)', animation: 'none', borderGlow: 'rgba(59, 130, 246, 0.6)' },
      EPIC: { glow: '0 0 12px rgba(139, 92, 246, 0.6)', animation: 'pulse 2s infinite', borderGlow: 'rgba(139, 92, 246, 0.7)' },
      LEGENDARY: { glow: '0 0 15px rgba(245, 158, 11, 0.7)', animation: 'pulse 1.5s infinite', borderGlow: 'rgba(245, 158, 11, 0.8)' },
      MYTHIC: { glow: '0 0 18px rgba(239, 68, 68, 0.8)', animation: 'pulse 1s infinite', borderGlow: 'rgba(239, 68, 68, 0.9)' }
    }
    return effects[rarity] || effects.COMMON
  }

  const handleLinkClick = async (link) => {
    try {
      // Track click analytics (fire and forget - TODO: implement backend endpoint)
      fetch(`/api/links/${link.id}/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_agent: navigator.userAgent,
          referer: window.location.href,
        }),
      }).catch(err => {
        // Silently fail if endpoint doesn't exist yet
        logger.debug('Link click tracking not implemented yet', err)
      })
      
      // Open link
      if (link.url) {
        window.open(link.url, '_blank')
      }
    } catch (err) {
      logger.error('Link click failed', err)
      // Still open the link even if tracking fails
      if (link.url) {
        window.open(link.url, '_blank')
      }
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        width: '100%',
        background: colors.background,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff'
      }}>
        <ParticleBackground />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          zIndex: 10
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(88, 164, 176, 0.2)',
            borderTop: '3px solid #58A4B0',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }} />
          <p>{loadingStatus}</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div style={{ 
        minHeight: '100vh',
        width: '100%',
        background: colors.background,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff'
      }}>
        <ParticleBackground />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          zIndex: 10
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '2rem' }}>Profile Not Found</h2>
          <p>The user "{username}" doesn't exist or their profile is private.</p>
          <button 
            style={{
              marginTop: '1rem',
              padding: '12px 24px',
              background: '#58A4B0',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => window.location.href = '/'}
            onMouseEnter={(e) => {
              e.target.style.background = '#4A8C96'
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#58A4B0'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Get customization settings for styling
  const customization = user?.customization || {}
  const hasBackgroundAsset = customization.backgroundUrl && customization.backgroundUrl.trim() !== ''
  
  // Detect if background is a video
  const isBackgroundVideo = hasBackgroundAsset && 
    (customization.backgroundUrl.toLowerCase().includes('.mp4') || 
     customization.backgroundUrl.toLowerCase().includes('.webm') || 
     customization.backgroundUrl.toLowerCase().includes('.ogg') || 
     customization.backgroundUrl.toLowerCase().includes('.avi') || 
     customization.backgroundUrl.toLowerCase().includes('.mov') ||
     customization.backgroundUrl.toLowerCase().includes('video/'))
  
  const profileStyles = {
    background: isBackgroundVideo
      ? 'transparent'
      : (hasBackgroundAsset && !isBackgroundVideo)
      ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("${customization.backgroundUrl}")`
      : customization.backgroundColor || colors.background,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'scroll',
    minHeight: '100vh',
    height: isBackgroundVideo ? '100vh' : '100vh',
    width: '100%',
    color: customization.textColor || '#ffffff',
    position: 'relative',
    overflow: isBackgroundVideo ? 'hidden' : 'visible'
  }


  return (
    <ProfileWrapper style={profileStyles} customization={customization}>
      {/* Template Preview Banner */}
      {isTemplatePreview && templateData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, rgba(88, 164, 176, 0.95), rgba(74, 144, 164, 0.95))',
          backdropFilter: 'blur(10px)',
          color: '#ffffff',
          padding: '0.75rem 1rem',
          textAlign: 'center',
          zIndex: 1000,
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          🎨 Template Preview: <strong>{templateData.name}</strong> by @{templateData.creator?.username}
          <span style={{ margin: '0 1rem', opacity: 0.7 }}>•</span>
          This is how your profile would look with this template
        </div>
      )}
      
      {/* Video Background */}
      {isBackgroundVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            minWidth: '100vw',
            minHeight: '100vh',
            objectFit: 'cover',
            objectPosition: 'center center',
            zIndex: -10,
            pointerEvents: 'none',
            transform: 'scale(1.01)' // Slight scale to prevent any edge gaps
          }}
        >
          <source src={customization.backgroundUrl} type="video/mp4" />
          <source src={customization.backgroundUrl} type="video/webm" />
          <source src={customization.backgroundUrl} type="video/ogg" />
          Your browser does not support video backgrounds.
        </video>
      )}
      
      {/* Video Overlay */}
      {isBackgroundVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4))',
          zIndex: -1,
          pointerEvents: 'none'
        }} />
      )}
      
      {/* Background Effects */}
      {customization.backgroundEffect === 'particles' && <ParticleBackground />}
      {customization.backgroundEffect === 'rain' && <RainEffect />}
      
      {/* Audio Controls - Always render if audioUrl exists, but hide controls based on volumeControl */}
      {customization.audioUrl && (
        <AudioController
          audioUrl={customization.audioUrl}
          volumeLevel={customization.volumeLevel}
          videoElement={isBackgroundVideo ? videoRef.current : null}
          showControls={customization.volumeControl}
        />
      )}
      

      {/* Profile Content */}
      <div className="profile-container" style={{
        marginTop: isTemplatePreview ? '60px' : '0' // Add top margin for preview banner
      }}>
        {/* Header Section */}
        <div className="profile-header">
          {user.avatar_url && (
            <div className="avatar-section">
              <img src={user.avatar_url} alt={user.username} className="avatar" />
              {user.is_verified && (
                <div className="verified-badge">✓</div>
              )}
            </div>
          )}
          
          <div className="user-info">
            <div className="username-section">
              <h1>{user.displayName || `@${user.username}`}</h1>
              
              {/* Badges Section - Beside username */}
              {badges.length > 0 && customization.showBadges !== false && (
                <div className="user-badges-inline">
                  {badges.slice(0, 3).map((badge) => (
                    <div key={badge.id} className="badge-item-inline" title={`${badge.name} - ${badge.description}`}>
                      <div 
                        className="badge-icon-inline" 
                        style={{ 
                          background: badge.bgColor,
                          border: `2px solid ${badge.rarityEffects?.borderGlow || 'rgba(255, 255, 255, 0.25)'}`,
                          boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)${badge.rarityEffects?.glow !== 'none' ? `, ${badge.rarityEffects.glow}` : ''}`,
                          animation: badge.rarityEffects?.animation || 'none'
                        }}
                      >
                        {typeof badge.icon === 'string' && badge.icon.length <= 2 && !badge.icon.includes(':') ? (
                          <span className="badge-emoji">{badge.icon}</span>
                        ) : (
                          <Icon icon={badge.icon} />
                        )}
                      </div>
                    </div>
                  ))}
                  {badges.length > 3 && (
                    <div className="badge-item-inline" title={`+${badges.length - 3} more badges`}>
                      <div className="badge-icon-inline badge-more">
                        <span>+{badges.length - 3}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <p className="bio">{user.bio}</p>
            
            {/* User Links Section - Inside the profile card, after badges */}
            <UserLinks username={user.username} monochromeIcons={customization.monochromeIcons} />
            
          </div>
          
          {/* Profile Views - Bottom Left of Card */}
          <div className="profile-views-bottom">
            <IoEye className="views-icon" />
            <span className="views-count">{user.stats.totalViews}</span>
          </div>
        </div>

      </div>
    </ProfileWrapper>
  )
}

// Audio Controller Styled Components
const AudioControlsWrapper = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 25px;
  padding: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: rgba(169, 204, 62, 0.3);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
`

const AudioIcon = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.isPlaying ? '#A9CC3E' : '#ffffff'};
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(169, 204, 62, 0.2);
    color: #A9CC3E;
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`

const VolumeSlider = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: ${props => props.isVisible ? 1 : 0};
  width: ${props => props.isVisible ? 'auto' : '0'};
  overflow: hidden;
  transition: all 0.3s ease;
  
  input[type="range"] {
    width: 80px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.2);
    outline: none;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #A9CC3E;
      cursor: pointer;
      border: 1px solid #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 1px 6px rgba(169, 204, 62, 0.4);
      }
    }
    
    &::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #A9CC3E;
      cursor: pointer;
      border: 1px solid #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }
`

const VolumeValue = styled.span`
  font-size: 12px;
  color: #A9CC3E;
  font-weight: 600;
  min-width: 35px;
  text-align: center;
  white-space: nowrap;
`

const ProfileWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow-x: hidden;
  /* Background is set via inline styles to support background images */
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  background-attachment: scroll !important;
  color: ${props => props.customization?.textColor || '#ffffff'};
  
  /* Apply blur effect if enabled */
  ${props => props.customization?.profileBlur > 0 && `
    backdrop-filter: blur(${props.customization.profileBlur}px);
  `}
  
  /* Apply custom cursor if set */
  ${props => props.customization?.cursorUrl && `
    cursor: url(${props.customization.cursorUrl}), auto;
    * { cursor: url(${props.customization.cursorUrl}), auto; }
  `}
  

  .loading-container,
  .error-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #ffffff;
    z-index: 10;
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid ${props => props.customization?.accentColor ? `${props.customization.accentColor}30` : 'rgba(88, 164, 176, 0.2)'};
      border-top: 3px solid ${props => props.customization?.accentColor || '#58A4B0'};
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    h2 {
      margin-bottom: 1rem;
      font-size: 2rem;
    }
    
    .cta-button {
      margin-top: 1rem;
      padding: 12px 24px;
      background: ${props => props.customization?.accentColor || '#58A4B0'};
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: ${props => props.customization?.accentColor ? `${props.customization.accentColor}DD` : '#4A8C96'};
        transform: translateY(-2px);
        box-shadow: 0 4px 15px ${props => props.customization?.accentColor ? `${props.customization.accentColor}50` : 'rgba(88, 164, 176, 0.3)'};
      }
    }
  }

  .profile-container {
    position: relative;
    z-index: 10;
    max-width: 600px;
    width: 90%;
    margin: 0 auto;
    padding: 3rem 1.5rem 2rem 1.5rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    
    @media (max-width: 1024px) {
      max-width: 550px;
      width: 85%;
    }
    
    @media (max-width: 768px) {
      padding: 2rem 1rem;
      max-width: 95%;
      width: 95%;
    }
  }

  .profile-header {
    position: relative;
    overflow: hidden;
    width: 100%;
    background: ${props => {
      if (props.customization?.profileGradient && props.customization?.primaryColor && props.customization?.secondaryColor) {
        const opacity = (props.customization?.profileOpacity || 90) / 100;
        const primary = props.customization.primaryColor;
        const secondary = props.customization.secondaryColor;
        // Convert hex to rgba for opacity control
        const hexToRgba = (hex, alpha) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        return `linear-gradient(135deg, ${hexToRgba(primary, 0.15 * opacity)}, ${hexToRgba(secondary, 0.10 * opacity)})`;
      } else {
        const opacity = (props.customization?.profileOpacity || 90) / 100;
        const baseOpacity = 0.08 * opacity;
        return `rgba(255, 255, 255, ${baseOpacity})`;
      }
    }};
    border: 1px solid ${props => {
      if (props.customization?.profileGradient && props.customization?.primaryColor) {
        const opacity = (props.customization?.profileOpacity || 90) / 100;
        const primary = props.customization.primaryColor;
        const r = parseInt(primary.slice(1, 3), 16);
        const g = parseInt(primary.slice(3, 5), 16);
        const b = parseInt(primary.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${0.3 * opacity})`;
      } else {
        const opacity = (props.customization?.profileOpacity || 90) / 100;
        const borderOpacity = 0.15 * opacity;
        return `rgba(255, 255, 255, ${borderOpacity})`;
      }
    }};
    border-radius: 32px;
    padding: 4rem 3rem;
    backdrop-filter: blur(${props => (props.customization?.profileBlur || 0) + 20}px);
    -webkit-backdrop-filter: blur(${props => (props.customization?.profileBlur || 0) + 20}px);
    margin-bottom: 2rem;
    text-align: center;
    opacity: ${props => (props.customization?.profileOpacity || 90) / 100};
    box-shadow: 
      0 20px 64px rgba(0, 0, 0, ${props => 0.15 * ((props.customization?.profileOpacity || 90) / 100)}),
      0 8px 32px rgba(0, 0, 0, ${props => 0.12 * ((props.customization?.profileOpacity || 90) / 100)}),
      inset 0 1px 0 rgba(255, 255, 255, ${props => 0.2 * ((props.customization?.profileOpacity || 90) / 100)}),
      0 0 0 1px rgba(255, 255, 255, ${props => 0.05 * ((props.customization?.profileOpacity || 90) / 100)});
    
    /* Glass morphism gradient overlay - adapts to user settings */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${props => {
        if (props.customization?.profileGradient && props.customization?.primaryColor && props.customization?.secondaryColor) {
          const opacity = (props.customization?.profileOpacity || 90) / 100;
          const primary = props.customization.primaryColor;
          const secondary = props.customization.secondaryColor;
          // Convert hex to rgba for overlay effect
          const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          };
          return `linear-gradient(135deg, ${hexToRgba(primary, 0.1 * opacity)} 0%, ${hexToRgba(secondary, 0.05 * opacity)} 50%, transparent 100%)`;
        } else {
          return `linear-gradient(135deg, rgba(255, 255, 255, ${0.1 * ((props.customization?.profileOpacity || 90) / 100)}) 0%, rgba(255, 255, 255, ${0.05 * ((props.customization?.profileOpacity || 90) / 100)}) 50%, rgba(255, 255, 255, ${0.02 * ((props.customization?.profileOpacity || 90) / 100)}) 100%)`;
        }
      }};
      border-radius: 32px;
      pointer-events: none;
      z-index: -1;
    }
    
    @media (max-width: 1024px) {
      padding: 3rem 2rem;
      border-radius: 28px;
      
      &::before {
        border-radius: 28px;
      }
    }
    
    @media (max-width: 768px) {
      padding: 2rem 1.5rem;
      border-radius: 24px;
      
      &::before {
        border-radius: 24px;
      }
    }
    
    .avatar-section {
      position: relative;
      display: inline-block;
      margin-bottom: 2rem;
      
      .avatar {
        width: 140px;
        height: 140px;
        border-radius: 50%;
        border: none;
        object-fit: cover;
        transition: all 0.3s ease;
        ${props => props.customization?.glowUsername && `
          box-shadow: 0 0 30px ${props.customization.accentColor || '#58A4B0'};
        `}
        
        @media (max-width: 768px) {
          width: 120px;
          height: 120px;
        }
      }
      
      .avatar-placeholder {
        width: 140px;
        height: 140px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, ${props => props.customization?.accentColor || '#58A4B0'}, ${props => props.customization?.primaryColor || '#4A8C96'});
        transition: all 0.3s ease;
        ${props => props.customization?.glowUsername && `
          box-shadow: 0 0 30px ${props.customization.accentColor || '#58A4B0'};
        `}
        
        @media (max-width: 768px) {
          width: 120px;
          height: 120px;
        }
      }
      
      .verified-badge {
        position: absolute;
        bottom: 10px;
        right: 10px;
        width: 40px;
        height: 40px;
        background: ${props => props.customization?.accentColor || '#58A4B0'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        font-weight: bold;
        border: 4px solid ${props => props.customization?.backgroundColor || '#1a1a1a'};
        ${props => props.customization?.glowBadges && props.customization?.showBadges && `
          box-shadow: 0 0 20px ${props.customization.accentColor || '#58A4B0'};
        `}
        display: ${props => props.customization?.showBadges !== false ? 'flex' : 'none'};
        
        @media (max-width: 768px) {
          width: 36px;
          height: 36px;
          font-size: 18px;
          border-width: 3px;
          bottom: 8px;
          right: 8px;
        }
      }
    }
    
    .user-info {
      .username-section {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        
        h1 {
          font-size: 3rem;
          font-weight: 800;
          color: ${props => props.customization?.textColor || '#ffffff'};
          margin: 0;
          letter-spacing: -0.02em;
          ${props => props.customization?.textFont && `
            font-family: '${props.customization.textFont}', inherit;
          `}
          ${props => props.customization?.glowUsername && `
            text-shadow: 0 0 25px ${props.customization.accentColor || '#58A4B0'};
          `}
          
          @media (max-width: 1024px) {
            font-size: 2.5rem;
          }
          
          @media (max-width: 768px) {
            font-size: 2.2rem;
          }
        }
        
        .user-badges-inline {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          
          .badge-item-inline {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            cursor: pointer;
            
            &:hover {
              transform: translateY(-2px) scale(1.05);
              
              .badge-icon-inline {
                ${props => props.customization?.glowBadges && `
                  box-shadow: 0 0 20px currentColor, 0 4px 16px rgba(0, 0, 0, 0.3);
                `}
              }
            }
            
            .badge-icon-inline {
              width: 36px;
              height: 36px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: white;
              transition: all 0.3s ease;
              border: 2px solid rgba(255, 255, 255, 0.25);
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              box-shadow: 
                0 4px 12px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.25);
              
              ${props => props.customization?.glowBadges && `
                box-shadow: 
                  0 4px 12px rgba(0, 0, 0, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.25),
                  0 0 12px currentColor;
              `}
              
              &.badge-more {
                background: linear-gradient(135deg, ${props => props.customization?.accentColor || '#58A4B0'}, ${props => props.customization?.primaryColor || '#4A8C96'}) !important;
                font-size: 11px;
                font-weight: 600;
                
                span {
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }
              }
              
              .badge-emoji {
                font-size: 14px;
              }
              
              @media (max-width: 768px) {
                width: 32px;
                height: 32px;
                font-size: 14px;
                border-radius: 8px;
                
                &.badge-more {
                  font-size: 10px;
                }
                
                .badge-emoji {
                  font-size: 12px;
                }
              }
            }
          }
          
          @media (max-width: 768px) {
            gap: 6px;
          }
        }
        
        @media (max-width: 768px) {
          gap: 1rem;
          flex-direction: column;
          
          .user-badges-inline {
            order: 2;
            margin-top: 0.5rem;
          }
        }
      }
      
      .display-name {
        font-size: 1.8rem;
        font-weight: 500;
        color: ${props => props.customization?.accentColor ? `${props.customization.accentColor}DD` : '#a0a0a0'};
        margin: 0 0 1.5rem 0;
        letter-spacing: -0.01em;
        ${props => props.customization?.textFont && `
          font-family: '${props.customization.textFont}', inherit;
        `}
        
        @media (max-width: 768px) {
          font-size: 1.5rem;
        }
      }
      
      .bio {
        font-size: 1.25rem;
        color: ${props => props.customization?.textColor || '#ffffff'};
        line-height: 1.7;
        margin-bottom: 2.5rem;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
        font-weight: 400;
        opacity: 0.9;
        
        @media (max-width: 768px) {
          font-size: 1.1rem;
          line-height: 1.6;
          max-width: 500px;
        }
      }
    }
    
    .user-badges {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin: 1.5rem 0 2rem 0;
      padding: 1rem 0;
      
      .badge-item {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        cursor: pointer;
        
        &:hover {
          transform: translateY(-2px);
          
          .badge-icon {
            transform: scale(1.1);
            ${props => props.customization?.glowBadges && `
              box-shadow: 0 0 20px currentColor;
            `}
          }
        }
        
        .badge-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          transition: all 0.3s ease;
          border: 2px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          
          ${props => props.customization?.glowBadges && `
            box-shadow: 
              0 4px 16px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              0 0 15px currentColor;
          `}
          
          .badge-emoji {
            font-size: 18px;
          }
          
          @media (max-width: 768px) {
            width: 40px;
            height: 40px;
            font-size: 18px;
            
            .badge-emoji {
              font-size: 16px;
            }
          }
        }
      }
      
      @media (max-width: 768px) {
        gap: 10px;
        margin: 1rem 0 1.5rem 0;
      }
    }
    
    .profile-views-bottom {
      position: absolute;
      bottom: 1.5rem;
      left: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      z-index: 10;
      padding: 0.75rem 1rem;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid ${props => props.customization?.accentColor ? `${props.customization.accentColor}60` : 'rgba(255, 255, 255, 0.2)'};
      border-radius: 24px;
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(0, 0, 0, 0.5);
        border-color: ${props => props.customization?.accentColor ? `${props.customization.accentColor}80` : 'rgba(255, 255, 255, 0.3)'};
        transform: translateY(-1px);
      }
      
      .views-icon {
        font-size: 1.3rem;
        color: ${props => props.customization?.accentColor || '#58A4B0'};
        display: flex;
        align-items: center;
      }
      
      .views-count {
        font-weight: 600;
        color: ${props => props.customization?.textColor || '#ffffff'};
        font-size: 1rem;
        display: flex;
        align-items: center;
        line-height: 1;
      }
      
      @media (max-width: 768px) {
        bottom: 1rem;
        left: 1rem;
        gap: 0.4rem;
        padding: 0.6rem 0.8rem;
        
        .views-icon {
          font-size: 1.1rem;
        }
        
        .views-count {
          font-size: 0.9rem;
        }
      }
    }
  }

  /* Typewriter cursor animation */
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  /* Badge rarity animations */
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.02); }
  }

`

export default UserProfile