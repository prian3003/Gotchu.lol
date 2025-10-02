import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes, css } from 'styled-components'
import { useTheme } from '../../contexts/ThemeContext'
import ParticleBackground from '../effects/ParticleBackground'
import RainEffect from '../background_effect/RainEffect'
import { backgroundCache } from '../../utils/backgroundCache'

// Utility function to determine if a color is light or dark
const isLightColor = (color) => {
  if (!color) return false
  
  // Handle hex colors
  let hex = color.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

// Get optimal text color for splash screen
const getSplashTextColor = (backgroundColor, fallbackTextColor) => {
  // Always use white/light colors for splash screen for better visibility
  return '#ffffff'
}

// Modern Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(40px);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
`

const shimmerGradient = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

const glowEffect = keyframes`
  0%, 100% {
    text-shadow: 
      0 0 5px currentColor,
      0 0 10px currentColor,
      0 0 15px currentColor;
  }
  50% {
    text-shadow: 
      0 0 10px currentColor,
      0 0 20px currentColor,
      0 0 30px currentColor,
      0 0 40px currentColor;
  }
`

const floatUp = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`

const breatheAnimation = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
`

// Styled Components with proper prop filtering
const SplashContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['backgroundImageUrl', 'backgroundColor', 'profileBlur', 'customization', 'user', 'onEnter', 'splashText', 'fontSize', 'fontFamily', 'fontWeight', 'animated', 'glowEffect', 'showParticles', 'showRainEffect', 'autoHide', 'autoHideDelay', 'splashBackgroundVisible', 'splashBackgroundColor', 'splashTransparent', 'textColor'].includes(prop),
})`
  /* Position fixed with highest z-index to override parent */
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 2147483647 !important; /* Maximum z-index value */
  overflow: hidden !important;
  cursor: pointer !important;
  transition: none !important; /* No transitions for instant response */
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
  animation: none !important; /* Remove any inherited animations */
  
  /* Use splash background (could be color, gradient, or image with overlay) */
  background: ${props => 
    props.backgroundColor 
      ? props.backgroundColor 
      : 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 75%, #000000 100%)'
  } !important;
  
  /* Ensure background covers and centers properly for images */
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  
  /* Handle legacy backgroundImageUrl prop (keeping for compatibility) */
  ${props => props.backgroundImageUrl && css`
    background: 
      linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
      url(${props.backgroundImageUrl}) center/cover no-repeat !important;
  `}
  
  ${props => props.profileBlur && css`
    backdrop-filter: blur(${props.profileBlur}px) !important;
  `}
  
  /* Ensure no inheritance from parent */
  color: ${props => props.textColor || '#ffffff'} !important;
  font-family: inherit !important;
  
  &.exiting {
    display: none !important;
  }
  
  &:hover {
    /* Removed hover transform that might cause issues */
  }
  
  /* Force override any parent container styles */
  * {
    box-sizing: border-box !important;
  }
`

const ContentWrapper = styled.div`
  position: relative;
  text-align: center;
  z-index: 10;
  opacity: 1;
  transform: translateY(0);
  pointer-events: none; /* Allow clicks to pass through to parent container */
`

const SplashText = styled.div.withConfig({
  shouldForwardProp: (prop) => !['fontSize', 'fontWeight', 'fontFamily', 'textColor', 'accentColor', 'primaryColor', 'animated', 'glowEffect'].includes(prop),
})`
  font-size: ${props => props.fontSize || '2.5rem'};
  font-weight: ${props => props.fontWeight || '400'};
  color: ${props => props.textColor || '#ffffff'} !important;
  font-family: ${props => props.fontFamily ? `"${props.fontFamily}", system-ui, sans-serif` : '"Inter", system-ui, sans-serif'};
  position: relative;
  display: inline-block;
  letter-spacing: 0.1em;
  line-height: 1.2;
  transition: all 0.3s ease;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  user-select: none;
  pointer-events: none; /* Allow clicks to pass through to parent container */
  
  ${props => props.animated && css`
    background: linear-gradient(
      45deg,
      #ffffff 0%,
      ${props.accentColor || '#60A5FA'} 50%,
      #ffffff 100%
    );
    background-size: 200% 200%;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ${shimmerGradient} 3s ease-in-out infinite;
  `}
  
  ${props => props.glowEffect && css`
    color: ${props.accentColor || '#60A5FA'} !important;
    text-shadow: 
      0 0 20px currentColor,
      0 2px 10px rgba(0, 0, 0, 0.3);
    animation: ${glowEffect} 2s ease-in-out infinite;
  `}
  
  &:hover {
    transform: scale(1.05);
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }
  
  @media (max-width: 768px) {
    font-size: ${props => `calc(${props.fontSize || '2.5rem'} * 0.8)`};
  }
  
  @media (max-width: 480px) {
    font-size: ${props => `calc(${props.fontSize || '2.5rem'} * 0.7)`};
  }
`


const BackgroundEffectsContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
`

const BackgroundVideoContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
`

const BackgroundVideo = styled.video`
  position: absolute;
  top: 50%;
  left: 50%;
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  transform: translate(-50%, -50%);
  object-fit: cover;
  pointer-events: none;
`

const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4));
  z-index: 1;
  pointer-events: none;
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  pointer-events: none;
`


const ProgressBar = styled.div.withConfig({
  shouldForwardProp: (prop) => !['textColor'].includes(prop),
})`
  width: 200px;
  height: 4px;
  background: ${props => props.textColor ? `${props.textColor}20` : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 2px;
  overflow: hidden;
  position: relative;
`

const ProgressFill = styled.div.withConfig({
  shouldForwardProp: (prop) => !['progress', 'accentColor', 'primaryColor'].includes(prop),
})`
  height: 100%;
  background: ${props => {
    const accent = props.accentColor || '#60A5FA'
    const primary = props.primaryColor || '#A78BFA'
    return `linear-gradient(90deg, ${accent}, ${primary})`
  }};
  border-radius: 2px;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: ${shimmerGradient} 2s ease-in-out infinite;
  }
`

const LoadingText = styled.div.withConfig({
  shouldForwardProp: (prop) => !['textColor'].includes(prop),
})`
  color: ${props => props.textColor || 'rgba(255, 255, 255, 0.9)'};
  font-size: 0.9rem;
  font-family: 'Inter', system-ui, sans-serif;
  pointer-events: none;
  text-align: center;
  min-height: 1.2em;
`

const ProgressText = styled.div.withConfig({
  shouldForwardProp: (prop) => !['textColor'].includes(prop),
})`
  color: ${props => props.textColor ? `${props.textColor}80` : 'rgba(255, 255, 255, 0.7)'};
  font-size: 0.8rem;
  font-family: 'Inter', system-ui, sans-serif;
  pointer-events: none;
  margin-top: 0.5rem;
`

const ProfileSplashScreen = ({
  onEnter,
  customization = {},
  user = {},
  isVisible = true,
  splashText = "click here",
  isLoading = false,
  loadingProgress = 0,
  isDataReady = false,
  error = null,
  canHide = true,
  // These props are filtered out and not passed to DOM elements
  backgroundColor: _backgroundColor, // Renamed to avoid DOM forwarding
  textColor: _textColor, // Renamed to avoid DOM forwarding
  accentColor: _accentColor, // Renamed to avoid DOM forwarding
  primaryColor: _primaryColor, // Renamed to avoid DOM forwarding
  fontSize = "2.5rem",
  fontFamily,
  fontWeight = "400",
  animated = true,
  glowEffect = false,
  showParticles = false, // Always disabled for clean splash
  showRainEffect = false, // Always disabled for clean splash
  autoHide = false,
  autoHideDelay = 5000,
  splashBackgroundVisible = true,
  splashBackgroundColor = '#0a0a0a',
  splashTransparent = false,
  className = "",
  style = {},
  ...props
}) => {
  const { colors, isDarkMode } = useTheme()
  const [isExiting, setIsExiting] = useState(false)

  if (!isVisible) {
    return null
  }

  // Cache user data for faster username page loading
  useEffect(() => {
    if (user?.username && (customization || user?.customization)) {
      const userData = {
        ...user,
        customization: customization || user.customization
      }
      backgroundCache.setUserData(user.username, userData)
    }
  }, [user, customization])
  
  // Force element to be visible with direct style override
  useEffect(() => {
    const forceVisible = () => {
      const element = document.querySelector('.profile-splash-screen')
      if (element) {
        element.style.setProperty('opacity', '1', 'important')
        element.style.setProperty('visibility', 'visible', 'important')
        element.style.setProperty('display', 'flex', 'important')
      }
    }
    
    // Force immediately and then every 100ms to override any changes
    forceVisible()
    const interval = setInterval(forceVisible, 100)
    
    return () => clearInterval(interval)
  }, [isVisible])

  const handleEnter = () => {
    if (isExiting || !canHide) return // Don't allow interaction while loading
    
    // Instant transition - no animation delay
    onEnter?.()
  }

  // Get loading message based on progress
  const getLoadingMessage = () => {
    if (error) return `Error: ${error}`
    // Show nothing during loading
    return ""
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && isVisible && !isExiting && canHide) {
        e.preventDefault()
        handleEnter()
      }
      
      if (e.key === 'Escape' && isVisible && !isExiting && canHide) {
        e.preventDefault()
        handleEnter()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyPress)
      return () => document.removeEventListener('keydown', handleKeyPress)
    }
  }, [isVisible, isExiting, canHide])

  

  // Check if user background is a video
  const isUserBackgroundVideo = () => {
    const userBackgroundUrl = customization?.backgroundUrl
    if (!userBackgroundUrl || !splashTransparent) return false
    
    return userBackgroundUrl.toLowerCase().includes('.mp4') || 
           userBackgroundUrl.toLowerCase().includes('.webm') || 
           userBackgroundUrl.toLowerCase().includes('.ogg') || 
           userBackgroundUrl.toLowerCase().includes('.avi') || 
           userBackgroundUrl.toLowerCase().includes('.mov') ||
           userBackgroundUrl.toLowerCase().includes('video/')
  }

  // Calculate splash screen background
  const getSplashBackground = () => {
    if (!splashBackgroundVisible) {
      return 'transparent'
    }
    
    if (splashTransparent) {
      // When transparent, show user's background if available
      const userBackgroundUrl = customization?.backgroundUrl
      if (userBackgroundUrl && userBackgroundUrl.trim() !== '') {
        // For video backgrounds, we'll use a video element instead of CSS background
        if (isUserBackgroundVideo()) {
          return 'transparent' // Let the video element handle the background
        } else {
          // For image backgrounds, show with subtle overlay for text readability
          return `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${userBackgroundUrl}')`
        }
      }
      // If no user background, use light overlay
      return 'rgba(0, 0, 0, 0.1)'
    }
    
    // Use custom splash background color or fallback to dark gradient
    return splashBackgroundColor || 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 75%, #000000 100%)'
  }
  
  // Use customization text color or fallback to white
  const splashTextColor = customization?.textColor || '#ffffff'
  
  const finalCustomization = {
    ...customization,
    backgroundUrl: splashTransparent ? null : customization?.backgroundUrl, // Don't show background image if transparent
    backgroundColor: getSplashBackground(),
    textColor: splashTextColor,
    accentColor: _accentColor || customization.accentColor || '#60A5FA',
    primaryColor: _primaryColor || customization.primaryColor || '#A78BFA'
  }

  // Add global CSS override when splash is visible
  useEffect(() => {
    if (isVisible) {
      // Create style element to force visibility
      const styleElement = document.createElement('style')
      styleElement.id = 'splash-screen-override'
      styleElement.innerHTML = `
        /* Override all possible interferences */
        html, body, #root {
          overflow: hidden !important;
        }
        
        .profile-splash-screen {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 2147483647 !important;
          opacity: 1 !important;
          visibility: visible !important;
          display: flex !important;
          pointer-events: auto !important;
          background: ${getSplashBackground()} !important;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          color: ${splashTextColor} !important;
          align-items: center !important;
          justify-content: center !important;
          font-family: inherit !important;
          transform: none !important;
          filter: none !important;
          transition: none !important;
          animation: none !important;
          clip: unset !important;
          clip-path: none !important;
          mask: none !important;
          overflow: hidden !important;
        }
        
        /* Force opacity override */
        .profile-splash-screen[style*="opacity"] {
          opacity: 1 !important;
        }
        
        .profile-splash-screen {
          opacity: 1 !important;
        }
        
        div.profile-splash-screen {
          opacity: 1 !important;
        }
        
        [class*="profile-splash-screen"] {
          opacity: 1 !important;
        }
        
        .profile-splash-screen * {
          opacity: 1 !important;
          visibility: visible !important;
          color: inherit !important;
          z-index: inherit !important;
        }
        
        /* Hide ALL other content when splash is active (unless transparent) */
        ${!splashTransparent ? `
        body > div:not(:has(.profile-splash-screen)) {
          opacity: 0 !important;
          pointer-events: none !important;
        }` : `
        /* When transparent, ensure page content is visible behind splash */
        body > div:not(:has(.profile-splash-screen)) {
          opacity: 1 !important;
          pointer-events: none !important;
        }`}
        
        /* Force show only splash screen content */
        .profile-splash-screen,
        .profile-splash-screen * {
          opacity: 1 !important;
          visibility: visible !important;
          display: inherit !important;
          pointer-events: auto !important;
        }
      `
      document.head.appendChild(styleElement)
      
      // Force background on html, body, and root elements (only if not transparent)
      const originalHtmlBg = document.documentElement.style.backgroundColor
      const originalBodyBg = document.body.style.backgroundColor
      const rootElement = document.getElementById('root')
      const originalRootBg = rootElement ? rootElement.style.backgroundColor : null
      
      if (!splashTransparent && splashBackgroundVisible) {
        const bgColor = splashBackgroundColor || '#0a0a0a'
        document.documentElement.style.setProperty('background-color', bgColor, 'important')
        document.body.style.setProperty('background-color', bgColor, 'important')
        if (rootElement) {
          rootElement.style.setProperty('background-color', bgColor, 'important')
        }
      } else if (splashTransparent) {
        // When transparent, remove any background overrides to show the page behind
        document.documentElement.style.removeProperty('background-color')
        document.body.style.removeProperty('background-color')
        if (rootElement) {
          rootElement.style.removeProperty('background-color')
        }
      }
      
      return () => {
        // Remove the style element
        const style = document.getElementById('splash-screen-override')
        if (style) {
          style.remove()
        }
        
        // Restore original backgrounds when splash disappears
        document.documentElement.style.backgroundColor = originalHtmlBg
        document.body.style.backgroundColor = originalBodyBg
        if (rootElement) {
          rootElement.style.backgroundColor = originalRootBg
        }
      }
    }
  }, [isVisible, splashTransparent, splashBackgroundVisible, splashBackgroundColor, customization?.backgroundUrl])

  // Render using React Portal to bypass any parent stacking contexts
  return createPortal(
    <SplashContainer
      className={`profile-splash-screen ${isExiting ? 'exiting' : ''} ${className}`}
      onClick={handleEnter}
      backgroundImageUrl={finalCustomization.backgroundUrl}
      backgroundColor={finalCustomization.backgroundColor}
      profileBlur={customization?.profileBlur}
      textColor={splashTextColor}
      style={{
        ...style,
        opacity: '1 !important',
        visibility: 'visible !important',
        display: 'flex !important',
        position: 'fixed !important',
        zIndex: '2147483647 !important'
      }}
      role="button"
      tabIndex={0}
      aria-label={splashText}
      {...props}
    >
      {/* Video Background for transparent splash screens with video backgrounds */}
      {isUserBackgroundVideo() && (
        <BackgroundVideoContainer>
          <BackgroundVideo
            src={customization?.backgroundUrl}
            muted
            playsInline
            preload="metadata"
          />
          <VideoOverlay />
        </BackgroundVideoContainer>
      )}

      {/* Background Effects - Disabled for clean splash */}
      {false && (
        <BackgroundEffectsContainer>
          <ParticleBackground />
          <RainEffect />
        </BackgroundEffectsContainer>
      )}

      {/* Content - Loading or Ready Text */}
      <ContentWrapper>
        {isLoading ? (
          <LoadingContainer>
            <LoadingText textColor={splashTextColor}>
              {getLoadingMessage()}
            </LoadingText>
          </LoadingContainer>
        ) : error ? (
          <LoadingContainer>
            <LoadingText textColor="#ff6b6b">
              {error}
            </LoadingText>
            <LoadingText textColor={splashTextColor} style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Click to continue anyway
            </LoadingText>
          </LoadingContainer>
        ) : (
          <SplashText
            fontSize={fontSize}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            textColor={splashTextColor}
            accentColor={finalCustomization.accentColor}
            primaryColor={finalCustomization.primaryColor}
            animated={animated}
            glowEffect={glowEffect}
          >
            {splashText}
          </SplashText>
        )}
      </ContentWrapper>
    </SplashContainer>,
    document.body // Render directly in body to bypass all parent stacking contexts
  )
}

export default ProfileSplashScreen