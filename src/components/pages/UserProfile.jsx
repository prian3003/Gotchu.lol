import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { IoEye, IoVolumeHigh, IoVolumeMute, IoPlay, IoPause } from 'react-icons/io5'
import { Icon } from '@iconify/react'
import ParticleBackground from '../effects/ParticleBackground'
import RainEffect from '../background_effect/RainEffect.jsx'
import SnowEffect from '../effects/SnowEffect'
import UserLinks from '../profile/UserLinks'
import { useTheme } from '../../contexts/ThemeContext'
import { SimpleIconComponent } from '../../utils/simpleIconsHelper.jsx'
import logger from '../../utils/logger'
import { useDiscordPresence } from '../../hooks/useDiscordPresence'
import DiscordBadges from '../discord/DiscordBadges'
import ProfileSplashScreen from '../profile/ProfileSplashScreen'
import { backgroundCache } from '../../utils/backgroundCache'
import useSplashScreen from '../../hooks/useSplashScreen'
import { API_BASE_URL } from '../../config/api'

// Custom Tooltip Component
const CustomTooltip = ({ children, content, customization }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const tooltipRef = useRef(null)

  const handleMouseEnter = (e) => {
    setPosition({
      x: e.clientX,
      y: e.clientY - 40
    })
    setShowTooltip(true)
  }

  const handleMouseMove = (e) => {
    setPosition({
      x: e.clientX,
      y: e.clientY - 40
    })
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  return (
    <>
      <span 
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'relative', display: 'inline-block' }}
      >
        {children}
      </span>
      {showTooltip && (
        <TooltipContainer
          ref={tooltipRef}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
          customization={customization}
        >
          <TooltipContent customization={customization}>
            {content}
          </TooltipContent>
          <TooltipArrow customization={customization} />
        </TooltipContainer>
      )}
    </>
  )
}

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
        // Typing forward - use requestAnimationFrame to avoid batching
        indexRef.current = currentIndex + 1
        setDisplayText(prevText => text.slice(0, currentIndex + 1))
        timeoutRef.current = setTimeout(() => {
          requestAnimationFrame(typewriter)
        }, speed / 0.2)
      } else if (!isDeleting && currentIndex === text.length) {
        // Pause at full text, then start deleting
        timeoutRef.current = setTimeout(() => {
          isDeletingRef.current = true
          typewriter()
        }, 0)
      } else if (isDeleting && currentIndex > 1) {
        // Deleting backwards (keep @ symbol) - use requestAnimationFrame to avoid batching
        indexRef.current = currentIndex - 1
        setDisplayText(prevText => text.slice(0, currentIndex - 1))
        timeoutRef.current = setTimeout(() => {
          requestAnimationFrame(typewriter)
        }, speed / 0.2)
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
const AudioController = ({ audioUrl, volumeLevel, videoElement, showControls = true, accentColor, preventAutoPlay = false }) => {
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
    if (audioRef.current && audioUrl && !preventAutoPlay) {
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
              return true
            } catch (err) {
              return false
            }
          }

          // Strategy 1: Immediate play
          if (await attemptPlay(0)) return

          
          // Strategy 2: Short delay
          if (await attemptPlay(100)) return
          
          // Strategy 3: Medium delay  
          if (await attemptPlay(500)) return
          
          // Strategy 4: After page interaction
          const handleFirstInteraction = async (event) => {
            try {
              await audio.play()
              setIsPlaying(true)
              // Remove all listeners
              document.removeEventListener('click', handleFirstInteraction, { capture: true })
              document.removeEventListener('keydown', handleFirstInteraction, { capture: true })
              document.removeEventListener('touchstart', handleFirstInteraction, { capture: true })
              document.removeEventListener('scroll', handleFirstInteraction, { capture: true })
            } catch (playErr) {
            }
          }
          
          // Listen for various user interactions
          document.addEventListener('click', handleFirstInteraction, { capture: true })
          document.addEventListener('keydown', handleFirstInteraction, { capture: true })
          document.addEventListener('touchstart', handleFirstInteraction, { capture: true })
          document.addEventListener('scroll', handleFirstInteraction, { capture: true })
          
        } catch (err) {
        }
      }
      
      // Start playback attempt with promise error handling
      try {
        playAudio().catch(err => {
        })
      } catch (err) {
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
  }, [audioUrl, preventAutoPlay]) // Only depend on audioUrl changes and preventAutoPlay, not volume

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
        }}
        onPause={() => {
          setIsPlaying(false)
        }}
        onCanPlay={() => {
          // Try to play when audio is ready for playback
          if (audioRef.current && !isPlaying) {
            audioRef.current.play().catch(() => {})
          }
        }}
        onCanPlayThrough={() => {
          // Try to play when audio is fully loaded
          if (audioRef.current && !isPlaying) {
            audioRef.current.play().catch(() => {})
          }
        }}
        onLoadedData={() => {
          // Try to play when data is loaded
          if (audioRef.current && !isPlaying) {
            audioRef.current.play().catch(() => {})
          }
        }}
        onError={(e) => {
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
          <AudioIcon onClick={togglePlayPause} isPlaying={isPlaying} accentColor={accentColor}>
            {currentVolume === 0 ? (
              <IoVolumeMute />
            ) : isPlaying ? (
              <IoVolumeHigh />
            ) : (
              <IoPlay />
            )}
          </AudioIcon>
          
          <VolumeSlider isVisible={isHovered} style={{ color: accentColor || '#58A4B0' }}>
            <input
              type="range"
              min="0"
              max="100"
              value={currentVolume}
              onChange={handleVolumeChange}
              style={{
                background: `linear-gradient(to right, ${accentColor || '#58A4B0'} 0%, ${accentColor || '#58A4B0'} ${currentVolume}%, rgba(255,255,255,0.3) ${currentVolume}%, rgba(255,255,255,0.3) 100%)`
              }}
            />
            <VolumeValue accentColor={accentColor}>{currentVolume}%</VolumeValue>
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
    
    const fontUrl = fontFamily.replace(/ /g, '+')
    const existingLink = document.querySelector(`link[href*="${fontUrl}"]`)
    if (existingLink) {
      resolve()
      return
    }
    
    const link = document.createElement('link')
    link.href = `https://fonts.googleapis.com/css2?family=${fontUrl}:wght@300;400;500;600;700;800&display=swap`
    link.rel = 'stylesheet'
    link.onload = () => {
      resolve()
    }
    link.onerror = (error) => {
      reject(error)
    }
    
    // Timeout after 5 seconds
    setTimeout(() => {
      resolve()
    }, 5000)
    
    document.head.appendChild(link)
  })
}

const UserProfile = () => {
  const { username } = useParams()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Main loading state for user data
  const [initialLoad, setInitialLoad] = useState(true) // Prevent premature error display
  const [error, setError] = useState(null)
  const [templateData, setTemplateData] = useState(null)
  const [isTemplatePreview, setIsTemplatePreview] = useState(false)
  const [badges, setBadges] = useState([])
  const [badgesLoading, setBadgesLoading] = useState(true)
  const { colors, isDarkMode } = useTheme()
  const videoRef = useRef(null)

  // Smart splash screen with pre-fetching and rate limit handling
  const smartDataFetcher = useCallback(async (username, progressCallback) => {
    try {
      progressCallback(10)
      
      // Check cache first
      const cachedData = backgroundCache.getUserData(username)
      if (cachedData) {
        progressCallback(100)
        return cachedData
      }
      
      progressCallback(30)
      
      // Add delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Fetch fresh data with retry logic
      let attempts = 0
      const maxAttempts = 3
      
      while (attempts < maxAttempts) {
        try {
          const response = await fetch(`${API_BASE_URL}/users/${username}`, {
            // No credentials for public endpoints
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          progressCallback(60 + (attempts * 10))
          
          if (response.status === 429) {
            // Rate limited, wait and retry
            attempts++
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
              continue
            } else {
              throw new Error('Rate limited - too many requests')
            }
          }
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const userData = await response.json()
          progressCallback(90)
          
          return userData
        } catch (error) {
          if (attempts >= maxAttempts - 1) {
            throw error
          }
          attempts++
          await new Promise(resolve => setTimeout(resolve, 500 * attempts))
        }
      }
    } catch (error) {
      console.error('Smart data fetcher error:', error)
      throw error
    }
  }, [])

  // FORCE SPLASH SCREEN - Simple state management
  const [isSplashVisible, setIsSplashVisible] = useState(true)
  const [splashLoading, setSplashLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isDataReady, setIsDataReady] = useState(false)
  const [splashError, setSplashError] = useState(null)
  const [cachedSplashText, setCachedSplashText] = useState("click here")
  const canHide = true


  const handleEnterProfile = () => {
    // Hide splash immediately
    setIsSplashVisible(false)
    
    // Trigger audio playback immediately after splash hides
    setTimeout(() => {
      if (customization?.audioUrl) {
        const audioElements = document.querySelectorAll('audio')
        audioElements.forEach(audio => {
          if (audio.paused) {
            audio.play().catch(() => {
              // If autoplay fails, add click listener for next user interaction
              const enableAudio = () => {
                audio.play().catch(() => {})
                document.removeEventListener('click', enableAudio, { once: true })
                document.removeEventListener('touchstart', enableAudio, { once: true })
              }
              document.addEventListener('click', enableAudio, { once: true })
              document.addEventListener('touchstart', enableAudio, { once: true })
            })
          }
        })
      }
      
      // Trigger any background effects that should start
      if (customization?.backgroundEffect) {
        // Background effects should already be rendered, but ensure they're active
        const effectElements = document.querySelectorAll('[class*="effect"], [class*="background-effect"]')
        effectElements.forEach(element => {
          if (element.style) {
            element.style.opacity = '1'
            element.style.visibility = 'visible'
          }
        })
      }
    }, 100) // Small delay to ensure splash transition completes
  }

  // Start data fetching when component mounts
  useEffect(() => {
    if (username && isSplashVisible) {
      setSplashLoading(true)
      setLoadingProgress(10)
      
      smartDataFetcher(username, (progress) => {
        setLoadingProgress(progress)
      }).then(() => {
        setIsDataReady(true)
        setSplashLoading(false)
        setLoadingProgress(100)
      }).catch((error) => {
        setSplashError(error.message)
        setSplashLoading(false)
        setIsDataReady(true)
      })
    }
  }, [username, isSplashVisible])


  // Typewriter animation for document title only (always use username for title)
  const animatedTitle = useTypewriter(
    user?.username ? `@${user?.username}` : '', 
    120, // Speed in ms
    user?.customization?.animatedTitle === true
  )

  // Set document title with typewriter animation and metadata
  useEffect(() => {
    if (user?.username) {
      // Always use username for document title
      const usernameTitle = `@${user?.username}`
      if (user?.customization?.animatedTitle) {
        document.title = animatedTitle || usernameTitle
      } else {
        document.title = usernameTitle
      }
      
      // Set meta description (use username for consistency)
      const metaDescription = document.querySelector('meta[name="description"]')
      const metaContent = `Check out @${user?.username}'s profile on Gotchu`
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
        setError(null)

        // Fetch user profile, badges, and template data in parallel
        const promises = [fetchUserProfile(), fetchUserBadges()]
        
        if (templatePreview && templateId) {
          promises.push(fetchTemplateData())
        }

        // Wait for all data fetching to complete
        await Promise.all(promises)

        // Mark initial load as complete
        setInitialLoad(false)
        
        // DON'T auto-hide splash screen when data loads - it's a standby screen, not a loader

        // Preload assets in background (non-blocking)
        if (user) {
          preloadAssets(user).catch(err => 
            logger.error('Asset preloading failed:', err)
          )
        }
      } catch (err) {
        logger.error('Data fetching failed', err)
        setError(err.message)
        setInitialLoad(false) // Allow error display after failed load attempt
      }
    }

    fetchAllData()

    // Add global handler for unhandled promise rejections from audio
    const handleUnhandledRejection = (event) => {
      if (event.reason && event.reason.name === 'NotAllowedError' && event.reason.message.includes('play()')) {
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
    if (user && user?.customization?.audioUrl) {
      // Add a global click listener to start audio on first user interaction
      const enableAudio = () => {
        const audioElements = document.querySelectorAll('audio')
        audioElements.forEach(audio => {
          if (audio.paused) {
            audio.play().catch(() => {})
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
      (user?.customization?.backgroundUrl?.toLowerCase().includes('.mp4') || 
       user?.customization?.backgroundUrl?.toLowerCase().includes('.webm') || 
       user?.customization?.backgroundUrl?.toLowerCase().includes('.ogg') || 
       user?.customization?.backgroundUrl?.toLowerCase().includes('.avi') || 
       user?.customization?.backgroundUrl?.toLowerCase().includes('.mov') ||
       user?.customization?.backgroundUrl?.toLowerCase().includes('video/'))

    if (isBackgroundVideo) {
      // Create and inject CSS to override background styles while preserving text visibility
      const styleElement = document.createElement('style')
      styleElement.id = 'video-background-override'
      styleElement.textContent = `
        /* Make container backgrounds transparent for video but preserve text readability */
        html, body, #root {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
        }
        
        /* Override container backgrounds only, exclude text elements */
        html.dark-mode, html.dark-mode body, html.dark-mode #root,
        html.light-mode, html.light-mode body, html.light-mode #root {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
        }
        
        /* Target layout containers but preserve text element backgrounds */
        [class*="ProfileWrapper"] > *:not(h1):not(h2):not(h3):not(p):not(span):not(.username-section):not(.user-info) {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
        }
        
        /* Ensure text elements have proper visibility over video backgrounds */
        .username-section h1 {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8) !important;
        }
        
        /* Ensure other text elements are also visible */
        .bio, .views-count {
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7) !important;
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
      } else {
      }
    } catch (error) {
    }
  }

  const applyTemplateCustomization = (userData) => {
    if (!templateData) {
      return
    }


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
      cursor_url: templateData.custom_cursor_url || userData.customization.cursor_url
    }


    const updatedUserData = {
      ...userData,
      customization: mergedCustomization
    }

    setUser(updatedUserData)
  }

  // Preload critical assets for better performance
  const preloadAssets = async (userData) => {
    const promises = []
    const assetNames = []
    
    // Preload fonts if specified
    if (userData.customization?.textFont) {
      promises.push(loadGoogleFont(userData.customization.textFont))
      assetNames.push('font')
    } else {
    }
    
    // Preload background image if it exists and not already cached
    if (userData.customization?.backgroundUrl) {
      if (!backgroundCache.isBackgroundPreloaded(username)) {
        promises.push(backgroundCache.preloadBackground(username, userData.customization.backgroundUrl))
        assetNames.push('background')
      } else {
        logger.info('Background already preloaded from cache')
      }
    }
    
    // Preload avatar image if it exists
    if (userData.avatar_url) {
      promises.push(preloadImage(userData.avatar_url))
      assetNames.push('avatar')
    }
    
    // Preload and apply cursor if set with hotspot coordinates for better animation support
    if (userData.customization?.cursor_url) {
      // Preload cursor image to ensure animations work properly
      promises.push(preloadImage(userData.customization.cursor_url))
      assetNames.push('cursor')
      
      // Apply cursor immediately with hotspot coordinates (center of cursor) for better animation and click precision
      document.body.style.cursor = `url(${userData.customization.cursor_url}) 16 16, auto`
    }
    
    // Wait for all preloading to complete
    try {
      if (promises.length > 0) {
        // Assets loading silently in background
        await Promise.all(promises)
      }
    } catch (error) {
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
      setLoading(true) // Start loading
      
      // Check cache first for faster loading
      const cachedData = backgroundCache.getUserData(username)
      if (cachedData) {
        logger.info(`🚀 Fast loading: Using cached data for ${username}`)
        
        // Use cached data immediately for faster rendering
        setUser(cachedData)
        setLoading(false)
        
        // Preload assets from cached data
        await preloadAssets(cachedData)
        
        // Still fetch fresh data in background for accuracy (but less urgently)
        setTimeout(() => fetchFreshUserData(), 500)
        return
      }
      
      await fetchFreshUserData()
    } catch (error) {
      logger.error('Error fetching user profile:', error)
      setError('Failed to load user profile')
      setLoading(false)
    }
  }

  const fetchFreshUserData = async () => {
    try {
      // Fetch user data from public endpoint (includes full customization data)
      const response = await fetch(`${API_BASE_URL}/users/${username}`, {
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
        bio: userData.customization?.bio || userData.bio || `Welcome to ${userData.username}'s profile!`,
        avatar_url: userData.avatar_url,
        is_verified: userData.is_verified,
        plan: userData.plan,
        theme: userData.theme,
        uid: userData.id.toString(),
        joinedDate: userData.created_at,
        profileViews: userData.profile_views || 0,
        // Discord data
        discord: {
          connected: userData.discord_id !== null && userData.discord_id !== undefined,
          discord_id: userData.discord_id,
          discord_username: userData.discord_username,
          is_booster: userData.is_booster || false,
          boosting_since: userData.boosting_since,
          avatar_url: (userData.discord_avatar && userData.discord_id) 
            ? `https://cdn.discordapp.com/avatars/${userData.discord_id}/${userData.discord_avatar}.png?size=128` 
            : null
        },
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
          
          // Discord Integration
          discordPresence: userData.customization.discord_presence || false,
          useDiscordAvatar: userData.customization.use_discord_avatar || false,
          discordAvatarDecoration: userData.customization.discord_avatar_decoration || false,
          
          // Asset URLs
          backgroundUrl: userData.customization.background_url || '',
          audioUrl: userData.customization.audio_url || '',
          cursor_url: userData.customization.cursor_url || '',
          
          // Typography
          textFont: userData.customization.text_font || '',
          
          // Splash Screen Settings
          enableSplashScreen: userData.customization.enable_splash_screen ?? true,
          splashText: userData.customization.splash_text ?? 'click here',
          splashFontSize: userData.customization.splash_font_size ?? '3rem',
          splashAnimated: userData.customization.splash_animated ?? true,
          splashGlowEffect: userData.customization.splash_glow_effect ?? false,
          splashShowParticles: userData.customization.splash_show_particles ?? true,
          splashAutoHide: userData.customization.splash_auto_hide ?? false,
          splashAutoHideDelay: userData.customization.splash_auto_hide_delay ?? 5000,
          splashBackgroundVisible: userData.customization.splash_background_visible ?? true,
          splashBackgroundColor: userData.customization.splash_background_color ?? '#0a0a0a',
          splashTransparent: userData.customization.splash_transparent ?? false
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
          discordPresence: false,
          useDiscordAvatar: false,
          discordAvatarDecoration: false,
          backgroundUrl: '',
          audioUrl: '',
          cursor_url: '',
          textFont: '',
          
          // Default Splash Screen Settings
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
        }
      }
      
      
      setUser(profileData);
      
      // Update cache with fresh data
      backgroundCache.setUserData(username, profileData)
      
      // Preload critical assets to improve performance
      await preloadAssets(profileData);
      
      // Template customization will be applied in separate useEffect when templateData is ready
    } catch (err) {
      logger.error('Profile fetch failed', err);
      throw err; // Re-throw to be handled by the main fetchAllData function
    } finally {
      setLoading(false)
    }
  }

  const fetchUserBadges = async () => {
    setBadgesLoading(true)
    
    try {
      // STRATEGY 1: Try showcased badges endpoint (public)
      let response = await fetch(`${API_BASE_URL}/users/${username}/badges/showcased`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.data?.badges && data.data.badges.length > 0) {
          const displayBadges = data.data.badges.map(badgeData => {
            const icon = getIconFromBadge(badgeData.badge)
            return {
              id: badgeData.badge.id,
              name: badgeData.badge.name,
              description: badgeData.badge.description,
              icon: icon,
              bgColor: getColorFromBadge(badgeData.badge),
              rarity: badgeData.badge.rarity,
              category: badgeData.badge.category,
              rarityEffects: getRarityEffects(badgeData.badge.rarity)
            }
          });
          
          setBadges(displayBadges);
          return;
        }
      } else {
      }

      // STRATEGY 2: Try all earned badges endpoint (public)
      response = await fetch(`${API_BASE_URL}/users/${username}/badges`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.data?.badges) {
          const earnedBadges = data.data.badges.filter(badgeData => badgeData.is_earned)
          
          if (earnedBadges.length > 0) {
            const displayBadges = earnedBadges.slice(0, 3).map(badgeData => {
              const icon = getIconFromBadge(badgeData.badge)
              return {
                id: badgeData.badge.id,
                name: badgeData.badge.name,
                description: badgeData.badge.description,
                icon: icon,
                bgColor: getColorFromBadge(badgeData.badge),
                rarity: badgeData.badge.rarity,
                category: badgeData.badge.category,
                rarityEffects: getRarityEffects(badgeData.badge.rarity)
              }
            });
            
            setBadges(displayBadges);
            return;
          }
        }
      } else {
      }

      // STRATEGY 3: Try legacy/alternative endpoints with error handling
      const alternativeEndpoints = [
        `${API_BASE_URL}/badges/user/${username}`,
        `${API_BASE_URL}/user/${username}/badges`,
        `${API_BASE_URL}/v1/users/${username}/badges`
      ]

      for (const endpoint of alternativeEndpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })

          if (response.ok) {
            const data = await response.json()
            
            // Try to extract badges from various response formats
            let badgesArray = null
            if (data.badges) badgesArray = data.badges
            else if (data.data?.badges) badgesArray = data.data.badges
            else if (Array.isArray(data)) badgesArray = data
            
            if (badgesArray && badgesArray.length > 0) {
              const displayBadges = badgesArray.slice(0, 3).map((badgeData, index) => {
                const badge = badgeData.badge || badgeData
                const icon = getIconFromBadge(badge)
                return {
                  id: badge.id || `alt-${index}`,
                  name: badge.name || 'Badge',
                  description: badge.description || 'User badge',
                  icon: icon,
                  bgColor: getColorFromBadge(badge),
                  rarity: badge.rarity || 'COMMON',
                  category: badge.category || 'general',
                  rarityEffects: getRarityEffects(badge.rarity || 'COMMON')
                }
              });
              
              setBadges(displayBadges);
              return;
            }
          }
        } catch (err) {
        }
      }

      // No badges found - set empty array
      setBadges([]);
      
    } catch (err) {
      console.error('[fetchUserBadges] ❌ FATAL ERROR - All strategies failed:', err)
      
      // Last resort: empty badges array
      setBadges([]);
    } finally {
      setBadgesLoading(false)
    }
  }

  // Helper functions for badge data conversion
  const getIconFromBadge = (badge) => {
    
    // Map badge names to Iconify icons
    const badgeIconMap = {
      'staff': 'lucide:star',
      'helper': 'lucide:help-circle',
      'premium': 'lucide:gem',
      'verified': 'lucide:badge-check',
      'donor': 'lucide:gift',
      'og': 'lucide:trophy',
      'gifter': 'lucide:gift',
      'server booster': 'lucide:rocket',
      'serverbooster': 'lucide:rocket',
      'winner': 'lucide:trophy',
      'second place': 'lucide:medal',
      'secondplace': 'lucide:medal',
      'third place': 'lucide:medal',
      'thirdplace': 'lucide:medal',
      'image host': 'lucide:image',
      'imagehost': 'lucide:image',
      'bug hunter': 'lucide:bug',
      'bughunter': 'lucide:bug',
      'welcome': 'lucide:user-plus',
      'first link': 'lucide:link',
      'popular': 'lucide:eye',
      'easter 2025': 'mdi:egg-easter',
      'easter2025': 'mdi:egg-easter',
      'christmas 2024': 'mdi:pine-tree',
      'christmas2024': 'mdi:pine-tree'
    }
    
    // First try to match by badge name
    const badgeName = badge.name?.toLowerCase()
    
    if (badgeName && badgeIconMap[badgeName]) {
      const mappedIcon = badgeIconMap[badgeName]
      return mappedIcon
    }
    
    // Fallback to original logic for custom badges
    
    if (badge.icon_type === 'EMOJI') {
      return badge.icon_value
    } else if (badge.icon_type === 'LUCIDE') {
      const lucideIcon = `lucide:${badge.icon_value}`
      return lucideIcon
    }
    
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

  // No separate loading UI needed - splash screen handles the loading state

  // TIMING-FIX: Only show error after initial load is complete, splash is hidden, AND there's an actual error
  // Added extra safety check to prevent any flash during initial render
  const shouldShowError = error && !initialLoad && !isSplashVisible && user === null

  if (shouldShowError) {
    return (
      <div style={{ 
        minHeight: '100vh',
        width: '100%',
        backgroundColor: colors.background,
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
  
  // Update cached splash text when customization loads
  useEffect(() => {
    if (customization?.splashText || customization?.splash_text) {
      setCachedSplashText(customization.splashText || customization.splash_text)
    }
  }, [customization?.splashText, customization?.splash_text])
  
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
    backgroundColor: isBackgroundVideo
      ? 'transparent'
      : customization.backgroundColor || colors.background,
    backgroundImage: (!isBackgroundVideo && hasBackgroundAsset)
      ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("${customization.backgroundUrl}")`
      : 'none',
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
    <>
      {/* Smart Profile Splash Screen with Pre-fetching */}
      {isSplashVisible && (
        <ProfileSplashScreen
          onEnter={handleEnterProfile}
          customization={customization}
          user={user}
          isVisible={isSplashVisible}
          isLoading={splashLoading}
          loadingProgress={loadingProgress}
          isDataReady={isDataReady}
          error={splashError}
          canHide={canHide}
          key="smart-splash"
          splashText={cachedSplashText}
          backgroundColor={customization?.backgroundColor}
          textColor={customization?.textColor}
          accentColor={customization?.accentColor}
          primaryColor={customization?.primaryColor}
          fontSize={customization?.splashFontSize ?? "3rem"}
          fontFamily={customization?.textFont ?? ""}
          animated={customization?.splashAnimated ?? true}
          glowEffect={customization?.splashGlowEffect ?? false}
          showParticles={customization?.splashShowParticles ?? true}
          splashBackgroundVisible={customization?.splashBackgroundVisible ?? true}
          splashBackgroundColor={customization?.splashBackgroundColor ?? '#0a0a0a'}
          splashTransparent={customization?.splashTransparent ?? false}
          showRainEffect={user?.customization?.backgroundEffect === 'rain'}
          autoHide={false}
          autoHideDelay={0}
        />
      )}
      
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
      
      {/* Main Profile Content - Only show when splash screen has been dismissed AND user data is loaded */}
      {!isSplashVisible && user && (
        <>
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
      {customization.backgroundEffect === 'snow' && <SnowEffect enabled={true} />}
      
      {/* Audio Controls - Always render if audioUrl exists, but hide controls based on volumeControl */}
      {customization.audioUrl && (
        <AudioController
          audioUrl={customization.audioUrl}
          volumeLevel={customization.volumeLevel}
          videoElement={isBackgroundVideo ? videoRef.current : null}
          showControls={customization.volumeControl}
          accentColor={customization.accentColor}
          preventAutoPlay={isSplashVisible}
        />
      )}
      

      {/* Profile Content */}
      <div className="profile-container" style={{
        marginTop: isTemplatePreview ? '60px' : '0' // Add top margin for preview banner
      }}>
        {/* Header Section */}
        <div className="profile-header">
          {(user?.avatar_url || (customization.useDiscordAvatar && user?.discord?.avatar_url)) && (
            <div className="avatar-section">
              <AvatarWithStatus 
                user={user} 
                customization={customization} 
              />
            </div>
          )}
          
          <div className="user-info">
            <div className="username-section">
              <CustomTooltip 
                content={`UID: ${user?.id || user?.uid || 'Not available'}`}
                customization={customization}
              >
                <h1>{user?.displayName || `@${user?.username}`}</h1>
              </CustomTooltip>
              
            </div>
            
            {/* Badges Section - Below username */}
            {badges.length > 0 && customization.showBadges !== false && (
              <div className="user-badges-below">
                {badges.slice(0, 6).map((badge) => (
                  <CustomTooltip
                    key={badge.id}
                    content={badge.name}
                    customization={customization}
                  >
                    <div className="badge-item-below">
                      <div 
                        className="badge-icon-below" 
                        style={{ 
                          background: 'transparent',
                          border: 'none',
                          boxShadow: 'none',
                          animation: badge.rarityEffects?.animation || 'none'
                        }}
                      >
                        {typeof badge.icon === 'string' && badge.icon.length <= 2 && !badge.icon.includes(':') ? (
                          <span className="badge-emoji">{badge.icon}</span>
                        ) : (
                          <Icon icon={badge.icon} style={{ color: '#ffffff' }} />
                        )}
                      </div>
                    </div>
                  </CustomTooltip>
                ))}
                {badges.length > 6 && (
                  <CustomTooltip
                    content={`+${badges.length - 6} more badges`}
                    customization={customization}
                  >
                    <div className="badge-item-below">
                      <div 
                        className="badge-icon-below badge-more" 
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
                          border: 'none',
                          color: '#ffffff'
                        }}
                      >
                        <span style={{fontSize: '0.75rem', fontWeight: '600'}}>+{badges.length - 6}</span>
                      </div>
                    </div>
                  </CustomTooltip>
                )}
              </div>
            )}
            
            <p className="bio">{user?.bio}</p>
            
            {/* Discord Presence Section - Only show if there's actual activity */}
            <DiscordPresenceSection 
              user={user} 
              customization={customization} 
            />
            
            {/* User Links Section - Inside the profile card, after badges */}
            <UserLinks username={user?.username} monochromeIcons={customization.monochromeIcons} />
            
          </div>
          
          {/* Profile Views - Bottom Left of Card */}
          <div className="profile-views-bottom">
            <IoEye className="views-icon" />
            <span className="views-count">{user?.stats?.totalViews}</span>
          </div>
        </div>

      </div>
        </>
      )}
    </ProfileWrapper>
    </>
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
  background: transparent;
  border-radius: 25px;
  padding: 8px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  
  &:hover {
    background: transparent;
    border-color: transparent;
  }
`

const AudioIcon = styled.button.withConfig({
  shouldForwardProp: (prop) => !['isPlaying', 'accentColor'].includes(prop),
})`
  background: transparent;
  border: none;
  color: ${props => props.isPlaying ? (props.accentColor || '#58A4B0') : '#ffffff'};
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  filter: none !important;
  -webkit-filter: none !important;
  
  &:hover {
    background: ${props => `${props.accentColor || '#58A4B0'}33`};
    color: ${props => props.accentColor || '#58A4B0'};
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`

const VolumeSlider = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isVisible'].includes(prop),
})`
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
    background: transparent;
    outline: none;
    cursor: pointer;
    transition: all 0.3s ease;
    appearance: none;
    
    &::-webkit-slider-runnable-track {
      width: 100%;
      height: 4px;
      background: transparent;
      border-radius: 2px;
    }
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: currentColor;
      cursor: pointer;
      border: 1px solid #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      margin-top: -4px;
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 1px 6px currentColor;
      }
    }
    
    &::-moz-range-track {
      width: 100%;
      height: 4px;
      background: transparent;
      border-radius: 2px;
      border: none;
    }
    
    &::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: currentColor;
      cursor: pointer;
      border: 1px solid #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }
`

const VolumeValue = styled.span.withConfig({
  shouldForwardProp: (prop) => !['accentColor'].includes(prop),
})`
  font-size: 12px;
  color: ${props => props.accentColor || '#58A4B0'};
  font-weight: 600;
  min-width: 35px;
  text-align: center;
  white-space: nowrap;
  filter: none !important;
  -webkit-filter: none !important;
`

const ProfileWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => !['customization'].includes(prop),
})`
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
  
  /* Apply custom cursor if set with hotspot coordinates for better animation support */
  ${props => props.customization?.cursor_url && `
    cursor: url(${props.customization.cursor_url}) 16 16, auto;
    
    /* Apply cursor to all elements for consistent animation */
    *, *::before, *::after {
      cursor: url(${props.customization.cursor_url}) 16 16, auto !important;
    }
    
    /* Override pointer cursors with custom cursor */
    a, button, [role="button"], .cursor-pointer {
      cursor: url(${props.customization.cursor_url}) 16 16, pointer !important;
    }
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
    background: transparent;
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
    padding: 3rem 2.5rem;
    margin-bottom: 2rem;
    text-align: center;
    position: relative;
    
    // Card background with opacity effect - only affects background, not content
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${props => {
        if (props.customization?.profileGradient && props.customization?.primaryColor && props.customization?.secondaryColor) {
          return `linear-gradient(135deg, 
            ${props.customization.primaryColor}40 0%, 
            ${props.customization.secondaryColor}30 100%)`;
        } else {
          return `rgba(255, 255, 255, 0.08)`;
        }
      }};
      border-radius: inherit;
      backdrop-filter: blur(${props => (props.customization?.profileBlur || 0) + 20}px);
      -webkit-backdrop-filter: blur(${props => (props.customization?.profileBlur || 0) + 20}px);
      opacity: ${props => (props.customization?.profileOpacity || 90) / 100};
      pointer-events: none;
      z-index: -1;
    }
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
      padding: 2.5rem 1.75rem;
      border-radius: 28px;
      
      &::before {
        border-radius: 28px;
      }
    }
    
    @media (max-width: 768px) {
      padding: 1.75rem 1.25rem;
      border-radius: 24px;
      
      &::before {
        border-radius: 24px;
      }
    }
    
    .avatar-section {
      position: relative;
      display: inline-block;
      margin-bottom: 1.25rem;
      
      .avatar-container {
        position: relative;
        display: inline-block;
      }
      
      .avatar {
        width: 140px;
        height: 140px;
        border-radius: 50%;
        border: none;
        object-fit: cover;
        transition: all 0.3s ease;
        
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
        margin-bottom: 0.75rem;
        flex-wrap: wrap;
        
        h1 {
          font-size: 3rem;
          font-weight: 800;
          color: ${props => props.customization?.textColor || '#ffffff'};
          margin: 0;
          letter-spacing: -0.02em;
          ${props => {
            if (props.customization?.textFont) {
              return `font-family: '${props.customization.textFont}', inherit;`
            }
            return ''
          }}
          /* Username Effects */
          ${props => {
            const effect = props.customization?.usernameEffect || 'none'
            const accentColor = props.customization?.accentColor || '#58A4B0'
            
            switch (effect) {
              case 'glow':
                return `text-shadow: 0 0 25px ${accentColor};`
              case 'rainbow':
                return `
                  background: linear-gradient(45deg, #ff0000, #ff8800, #ffff00, #88ff00, #00ff00, #00ff88, #00ffff, #0088ff, #0000ff, #8800ff, #ff00ff, #ff0088);
                  background-size: 200% 200%;
                  background-clip: text;
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  animation: rainbow-shift 3s ease-in-out infinite;
                `
              case 'sparkles':
                return `
                  position: relative;
                  color: #ffffff;
                  &::before {
                    content: '';
                    position: absolute;
                    top: -10px;
                    left: -10px;
                    right: -10px;
                    bottom: -10px;
                    background: 
                      radial-gradient(circle at 15% 25%, rgba(34, 197, 94, 0.6) 2px, transparent 2px),
                      radial-gradient(circle at 75% 15%, rgba(34, 197, 94, 0.4) 1px, transparent 1px),
                      radial-gradient(circle at 85% 75%, rgba(34, 197, 94, 0.5) 1.5px, transparent 1.5px),
                      radial-gradient(circle at 25% 85%, rgba(34, 197, 94, 0.3) 1px, transparent 1px),
                      radial-gradient(circle at 95% 35%, rgba(34, 197, 94, 0.4) 1px, transparent 1px),
                      radial-gradient(circle at 5% 65%, rgba(34, 197, 94, 0.5) 1.5px, transparent 1.5px);
                    animation: sparkle 2s ease-in-out infinite;
                    pointer-events: none;
                    z-index: -1;
                  }
                `
              case 'typewriter':
                return `
                  overflow: hidden;
                  border-right: 2px solid ${accentColor};
                  white-space: nowrap;
                  animation: typing 3.5s steps(40, end), blink-caret 0.75s step-end infinite;
                `
              case 'bounce':
                return `animation: bounce 2s ease-in-out infinite;`
              case 'fade':
                return `animation: fade-in 2s ease-in-out;`
              default:
                return ''
            }
          }}
          
          /* Fallback for old glowUsername setting */
          ${props => props.customization?.glowUsername && !props.customization?.usernameEffect && `
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
        font-size: 1.5rem;
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
      
      .user-badges-below {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.1rem;
        margin: 0.25rem 0 1.5rem 0;
        flex-wrap: wrap;
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
        
        .badge-item-below {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          
          &:hover {
            transform: translateY(-3px) scale(1.1);
            
            .badge-icon-below {
              ${props => props.customization?.glowBadges && `
                box-shadow: 0 0 24px currentColor, 0 8px 20px rgba(0, 0, 0, 0.4);
                filter: brightness(1.2);
              `}
            }
          }
          
          .badge-icon-below {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            
            &.badge-more {
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05)) !important;
              border: none !important;
              
              span {
                font-size: 0.75rem;
                font-weight: 600;
                color: #ffffff;
              }
            }
            
            .badge-emoji {
              font-size: 1.1rem;
              line-height: 1;
            }
            
            // Rarity glow effects
            ${props => props.customization?.glowBadges && `
              &:hover {
                filter: brightness(1.1) saturate(1.2);
              }
            `}
          }
        }
        
        @media (max-width: 768px) {
          gap: 0.4rem;
          margin: 0.2rem 0 1.25rem 0;
          max-width: 400px;
          
          .badge-item-below {
            .badge-icon-below {
              width: 36px;
              height: 36px;
              font-size: 1.1rem;
              
              .badge-emoji {
                font-size: 1rem;
              }
            }
          }
        }
      }
      
      .bio {
        font-size: 1.25rem;
        color: ${props => props.customization?.textColor || '#ffffff'};
        line-height: 1.7;
        margin-bottom: 1.5rem;
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
      
      .platform-activity-card {
        background: #2f3136;
        border: 1px solid;
        border-radius: 12px;
        padding: 12px 20px;
        margin: 0 auto 1rem auto;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        transition: all 0.2s ease;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        max-width: 380px;
        min-width: 320px;
        width: fit-content;
        min-height: 56px;
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        
        .discord-avatar-container {
          position: relative;
          flex-shrink: 0;
          
          .discord-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
            background: #36393f;
          }
        }
        
        .platform-icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          flex-shrink: 0;
        }
        
        .platform-details {
          flex: 1;
          overflow: hidden;
          text-align: left;
          
          .discord-username {
            font-size: 13px;
            font-weight: 600;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 200px;
            margin-bottom: 1px;
          }
          
          .platform-name {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            margin-bottom: 1px;
            opacity: 0.8;
          }
          
          .activity-title {
            font-size: 11px;
            font-weight: 500;
            color: #ffffff;
            margin-bottom: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 200px;
          }
          
          .activity-subtitle {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.7);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 200px;
          }
        }
        
        .presence-loading-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
          flex-shrink: 0;
        }
        
        @media (max-width: 768px) {
          padding: 10px 16px;
          max-width: 320px;
          min-width: 280px;
          gap: 16px;
          
          .discord-avatar-container {
            .discord-avatar {
              width: 28px;
              height: 28px;
            }
          }
          
          .platform-icon-container {
            width: 20px;
            height: 20px;
          }
          
          .platform-details {
            .discord-username {
              font-size: 12px;
              max-width: 140px;
            }
            
            .platform-name {
              font-size: 9px;
            }
            
            .activity-title {
              font-size: 10px;
              max-width: 140px;
            }
            
            .activity-subtitle {
              font-size: 9px;
              max-width: 140px;
            }
          }
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
      background: transparent;
      border: 1px solid transparent;
      border-radius: 24px;
      transition: all 0.3s ease;
      
      &:hover {
        background: transparent;
        border-color: transparent;
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
  
  /* Username Effect Animations */
  @keyframes rainbow-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
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
    50% { border-color: currentColor; }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
  
  @keyframes fade-in {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .discord-presence-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 12px 20px;
    margin: 0 auto 1rem auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    transition: all 0.2s ease;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    max-width: 380px;
    width: fit-content;
    min-width: 320px;
    min-height: 56px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
    
    .discord-avatar-container {
      position: relative;
      flex-shrink: 0;
      
      .discord-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        background: #36393f;
      }
      
      .discord-status-dot {
        position: absolute;
        bottom: -1px;
        right: -1px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid #2f3136;
        transition: all 0.2s ease;
      }
    }
    
    .discord-info {
      flex: 1;
      min-width: 0;
      text-align: center;
      
      .discord-username-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 1px;
        justify-content: center;
        
        .discord-username {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
        
        .discord-badges-inline {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
      }
      
      .discord-last-seen {
        font-size: 12px;
        color: #b9bbbe;
        font-style: italic;
        white-space: nowrap;
        overflow: visible;
        text-overflow: clip;
        line-height: 1.2;
      }
    }
    
    @media (max-width: 768px) {
      padding: 10px 16px;
      gap: 16px;
      max-width: 320px;
      min-width: 280px;
      
      .discord-avatar-container {
        .discord-avatar {
          width: 28px;
          height: 28px;
        }
        
        .discord-status-dot {
          width: 8px;
          height: 8px;
          border-width: 2px;
        }
      }
      
      .discord-info {
        .discord-username-row {
          .discord-username {
            font-size: 13px;
            max-width: 120px;
          }
        }
        
        .discord-last-seen {
          font-size: 11px;
          line-height: 1.3;
        }
      }
    }

    /* Skeleton loading styles */
    .discord-avatar-skeleton {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(90deg, #40444b 25%, #4f545c 50%, #40444b 75%);
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s infinite;
    }

    .discord-username-skeleton {
      width: 100px;
      height: 14px;
      background: linear-gradient(90deg, #40444b 25%, #4f545c 50%, #40444b 75%);
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s infinite;
      border-radius: 4px;
      margin: 0 auto 2px auto;
    }

    .discord-last-seen-skeleton {
      width: 60px;
      height: 11px;
      background: linear-gradient(90deg, #40444b 25%, #4f545c 50%, #40444b 75%);
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s infinite;
      border-radius: 4px;
      margin: 0 auto;
    }

    @keyframes skeleton-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    @media (max-width: 768px) {
      .discord-avatar-skeleton {
        width: 28px;
        height: 28px;
      }
      
      .discord-username-skeleton {
        width: 80px;
        height: 13px;
      }
      
      .discord-last-seen-skeleton {
        width: 50px;
        height: 10px;
      }
    }
  }

`

// Avatar with Discord Status Indicator
const AvatarWithStatus = ({ user, customization }) => {
  const {
    presence,
    getStatusDisplay,
    isPresenceRecent
  } = useDiscordPresence(user?.discord?.discord_id)

  const statusDisplay = presence?.status ? getStatusDisplay(presence.status) : null
  const isRecent = presence?.updated_at ? isPresenceRecent(presence.updated_at) : false
  
  // Determine which avatar to show (Discord avatar takes priority if useDiscordAvatar is enabled)
  const avatarUrl = customization.useDiscordAvatar && user?.discord?.avatar_url ? user?.discord?.avatar_url : user?.avatar_url
  
  // Show Discord decoration if:
  // 1. discordAvatarDecoration is enabled AND
  // 2. Either we're using Discord avatar OR Discord presence is active (show on any avatar)
  const showDiscordDecoration = customization.discordAvatarDecoration && 
    (customization.useDiscordAvatar || customization.discordPresence) && 
    user?.discord?.connected

  return (
    <div className="avatar-container">
      <img 
        src={avatarUrl} 
        alt={user?.username} 
        className="avatar" 
        style={{
          border: showDiscordDecoration ? '3px solid #5865f2' : undefined
        }}
      />
    </div>
  )
}

// Discord Presence Component with Real-time Status
const DiscordPresenceSection = ({ user, customization }) => {
  // Use Discord presence hook for real-time status updates
  const {
    presence,
    loading,
    error,
    getStatusDisplay,
    getActivityDisplay,
    formatLastSeen,
    isPresenceRecent
  } = useDiscordPresence(user?.discord?.discord_id)

  // Helper function to get platform-specific icon and details
  const getPlatformDetails = (activity) => {
    if (!activity) return null
    
    // Platform-specific handling
    const activityName = activity.name?.toLowerCase()
    
    // Spotify detection (type 2 = listening, or name contains spotify)
    if (activityName?.includes('spotify') || activity.name === 'Spotify' || activity.type === 2) {
      // Show Spotify activity if we have meaningful data
      if (activity.details && activity.details !== 'Unknown Track') {
        return {
          platform: 'spotify',
          icon: <SimpleIconComponent iconName="spotify" size={24} />,
          title: activity.details,
          subtitle: activity.state ? `by ${activity.state}` : '',
          platformName: 'Listening on Spotify'
        }
      }
    }
    
    // YouTube Music detection
    if (activityName?.includes('youtube') || activityName?.includes('youtube music')) {
      return {
        platform: 'youtube',
        icon: <SimpleIconComponent iconName="youtube" size={24} />,
        title: activity.details || activity.name,
        subtitle: activity.state || '',
        platformName: 'Watching on YouTube'
      }
    }
    
    if (activityName?.includes('discord')) {
      return null // Don't show Discord app activity
    }
    
    // Game activities (Playing)
    if (activity.type === 0) {
      return {
        platform: 'gaming',
        icon: '🎮',
        title: activity.name,
        subtitle: activity.details || activity.state || '',
        platformName: 'Playing'
      }
    }
    
    // Streaming
    if (activity.type === 1) {
      return {
        platform: 'streaming',
        icon: '📺',
        title: activity.name,
        subtitle: activity.details || activity.url || '',
        platformName: 'Streaming'
      }
    }
    
    // Generic listening activities (Music/Audio)
    if (activity.type === 2) {
      return {
        platform: 'music',
        icon: '🎵',
        title: activity.details || activity.name,
        subtitle: activity.state || '',
        platformName: 'Listening'
      }
    }
    
    // Watching activities  
    if (activity.type === 3) {
      return {
        platform: 'watching',
        icon: '📺',
        title: activity.details || activity.name,
        subtitle: activity.state || '',
        platformName: 'Watching'
      }
    }
    
    return null // Don't show other activities
  }

  // Get status display information
  const statusDisplay = presence?.status ? getStatusDisplay(presence.status) : null
  const activity = presence?.activities?.[0] // Get primary activity
  const activityDisplay = activity ? getActivityDisplay(activity) : null
  const isOnline = presence?.status && presence.status !== 'offline'
  const isRecent = presence?.updated_at ? isPresenceRecent(presence.updated_at) : false
  
  // Get platform-specific details
  const platformDetails = activity ? getPlatformDetails(activity) : null
  
  // Show Discord presence if:
  // 1. Discord presence is enabled in customization
  // 2. User has Discord connected
  // 3. Either there's meaningful platform activity OR we should show offline state
  const shouldShow = customization.discordPresence && user?.discord?.connected && (
    platformDetails || // Has active activity
    user?.discord?.discord_id // Always show if user has Discord connected (regardless of presence data state)
  )
  
  // Don't render anything if Discord presence is disabled or user isn't connected
  if (!shouldShow) {
    return null
  }

  // Show loading state briefly to prevent flickering
  if (loading && !presence) {
    return (
      <div className="discord-presence-card">
        <div className="discord-avatar-container">
          <div className="discord-avatar-skeleton" />
          <div className="discord-status-dot" style={{ backgroundColor: '#747f8d' }} />
        </div>
        <div className="discord-info">
          <div className="discord-username-skeleton" />
          <div className="discord-last-seen-skeleton" />
        </div>
      </div>
    )
  }

  // Get platform-specific colors
  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'spotify': return '#1DB954'
      case 'youtube': return '#FF0000'
      case 'gaming': return '#00D9FF'
      case 'streaming': return '#9146FF'
      case 'music': return '#FF6B35'
      case 'watching': return '#9146FF'
      default: return '#5865f2'
    }
  }

  // If user has active activity, show platform activity card with Discord user info
  if (platformDetails) {
    const platformColor = getPlatformColor(platformDetails.platform)
    const discordAvatar = user?.discord?.avatar_url || `https://cdn.discordapp.com/embed/avatars/${(parseInt(user?.discord?.discord_id || '0') % 5)}.png`

    return (
      <div className="platform-activity-card" style={{ borderColor: `${platformColor}40` }}>
        {/* Discord Avatar */}
        <div className="discord-avatar-container">
          <img 
            src={discordAvatar}
            alt="Discord Avatar"
            className="discord-avatar"
          />
        </div>
        
        {/* Platform Details */}
        <div className="platform-details">
          <div className="discord-username">
            {user?.discord?.discord_username || user?.username}
          </div>
          <div className="platform-name" style={{ color: platformColor }}>
            {platformDetails.platformName}
          </div>
          <div className="activity-title">{platformDetails.title}</div>
          {platformDetails.subtitle && (
            <div className="activity-subtitle">{platformDetails.subtitle}</div>
          )}
        </div>
        
        {/* Platform Activity Icon - moved to right */}
        <div className="platform-icon-container" style={{ backgroundColor: `${platformColor}20` }}>
          {platformDetails.icon}
        </div>
        
        {loading && <div className="presence-loading-dot" style={{ backgroundColor: platformColor }} />}
      </div>
    )
  }

  // Discord-style compact presence card
  const statusColor = statusDisplay?.color || '#747f8d'
  const discordAvatar = user?.discord?.avatar_url || `https://cdn.discordapp.com/embed/avatars/${(parseInt(user?.discord?.discord_id || '0') % 5)}.png`
  
  return (
    <div className="discord-presence-card">
      <div className="discord-avatar-container">
        <img 
          src={discordAvatar}
          alt="Discord Avatar"
          className="discord-avatar"
        />
        <div 
          className="discord-status-dot"
          style={{ backgroundColor: statusColor }}
        />
      </div>
      
      <div className="discord-info">
        <div className="discord-username-row">
          <span className="discord-username">
            {user?.discord?.discord_username || user?.username}
          </span>
          {/* Discord badges inline */}
          {user?.discord?.discord_id && (
            <div className="discord-badges-inline">
              <DiscordBadges 
                discordUserID={user?.discord?.discord_id} 
                compact={true}
                maxVisible={2}
              />
            </div>
          )}
        </div>
        
        <div className="discord-last-seen">
          {presence?.last_seen ? `last seen ${formatLastSeen(presence.last_seen)}` : (presence === null ? 'offline' : 'checking...')}
        </div>
      </div>
    </div>
  )
}

// Styled Components for Custom Tooltip
const TooltipContainer = styled.div`
  position: fixed;
  z-index: 10000;
  pointer-events: none;
  transform: translateX(-50%);
  animation: tooltipFadeIn 0.1s ease-out;
  
  @keyframes tooltipFadeIn {
    from { 
      opacity: 0;
      transform: translateX(-50%) translateY(5px);
    }
    to { 
      opacity: 1;
      transform: translateX(-50%) translateY(0px);
    }
  }
`

const TooltipContent = styled.div`
  background: rgba(0, 0, 0, 0.15);
  color: ${props => props.customization?.textColor || '#ffffff'};
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  position: relative;
  transition: all 0.1s ease;
`

const TooltipArrow = styled.div`
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid rgba(0, 0, 0, 0.15);
  
  &::before {
    content: '';
    position: absolute;
    bottom: 1px;
    left: -5px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid ${props => props.customization?.accentColor ? `${props.customization.accentColor}40` : 'rgba(255, 255, 255, 0.2)'};
  }
`

export default UserProfile