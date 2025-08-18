import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { IoEye } from 'react-icons/io5'
import ParticleBackground from '../effects/ParticleBackground'
import { useTheme } from '../../contexts/ThemeContext'
import logger from '../../utils/logger'

const UserProfile = () => {
  const { username } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { colors, isDarkMode } = useTheme()

  useEffect(() => {
    fetchUserProfile()
  }, [username])

  // Apply custom cursor if set - moved to top to follow Rules of Hooks
  useEffect(() => {
    if (user?.customization?.cursorUrl) {
      document.body.style.cursor = `url(${user.customization.cursorUrl}), auto`
      return () => {
        document.body.style.cursor = 'auto'
      }
    }
  }, [user?.customization?.cursorUrl])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
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
          cursorUrl: userData.customization.cursor_url || ''
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
          cursorUrl: ''
        }
      }
      
      setUser(profileData)
      setLoading(false)
    } catch (err) {
      logger.error('Profile fetch failed', err)
      setError(err.message)
      setLoading(false)
    }
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
      <ProfileWrapper style={{ 
        background: colors.background,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <ParticleBackground />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </ProfileWrapper>
    )
  }

  if (error || !user) {
    return (
      <ProfileWrapper style={{ 
        background: colors.background,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <ParticleBackground />
        <div className="error-container">
          <h2>Profile Not Found</h2>
          <p>The user "{username}" doesn't exist or their profile is private.</p>
          <button 
            className="cta-button"
            onClick={() => window.location.href = '/'}
          >
            Go Home
          </button>
        </div>
      </ProfileWrapper>
    )
  }

  // Get customization settings for styling
  const customization = user?.customization || {}
  const hasBackgroundImage = customization.backgroundUrl && customization.backgroundUrl.trim() !== ''
  const profileStyles = {
    background: hasBackgroundImage
      ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("${customization.backgroundUrl}")`
      : customization.backgroundColor || colors.background,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    minHeight: '100vh'
  }


  return (
    <ProfileWrapper style={profileStyles} customization={customization}>
      {/* Background Effects */}
      {customization.backgroundEffect === 'particles' && <ParticleBackground />}
      
      {/* Audio Element */}
      {customization.audioUrl && customization.volumeControl && (
        <audio
          controls
          autoPlay
          loop
          volume={customization.volumeLevel / 100}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <source src={customization.audioUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
      

      {/* Profile Content */}
      <div className="profile-container">
        {/* Header Section */}
        <div className="profile-header">
          <div className="avatar-section">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="avatar" />
            ) : (
              <div className="avatar-placeholder">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            {user.is_verified && (
              <div className="verified-badge">✓</div>
            )}
          </div>
          
          <div className="user-info">
            <div className="username-section">
              <h1>@{user.username}</h1>
              <span className="plan-badge">{user.plan}</span>
            </div>
            
            {user.displayName && user.displayName !== user.username && (
              <h2 className="display-name">{user.displayName}</h2>
            )}
            
            <p className="bio">{user.bio}</p>
            
          </div>
          
          {/* Profile Views - Bottom Left of Card */}
          <div className="profile-views-bottom">
            <IoEye className="views-icon" /><span className="views-count">{user.stats.totalViews}</span>
          </div>
        </div>


      </div>
    </ProfileWrapper>
  )
}

const ProfileWrapper = styled.div`
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  /* Background is set via inline styles to support background images */
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
      border: 3px solid rgba(88, 164, 176, 0.2);
      border-top: 3px solid #58A4B0;
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
      background: #58A4B0;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: #4A8C96;
        transform: translateY(-2px);
      }
    }
  }

  .profile-container {
    position: relative;
    z-index: 10;
    max-width: 800px;
    margin: 10vh auto 0;
    padding: 2rem;
    
    @media (max-width: 768px) {
      padding: 1rem;
      margin: 5vh auto 0;
    }
  }

  .profile-header {
    position: relative;
    background: ${props => props.customization?.profileGradient 
      ? `linear-gradient(135deg, ${props.customization.accentColor || '#58A4B0'}20, ${props.customization.primaryColor || '#1bbd9a'}20)`
      : 'rgba(255, 255, 255, 0.05)'
    };
    border-radius: 20px;
    padding: 3rem;
    backdrop-filter: blur(10px);
    margin-bottom: 2rem;
    text-align: center;
    opacity: ${props => (props.customization?.profileOpacity || 90) / 100};
    
    @media (max-width: 768px) {
      padding: 2rem 1rem;
    }
    
    .avatar-section {
      position: relative;
      display: inline-block;
      margin-bottom: 2rem;
      
      .avatar,
      .avatar-placeholder {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 4px solid ${props => props.customization?.accentColor || '#58A4B0'};
        object-fit: cover;
        ${props => props.customization?.glowUsername && `
          box-shadow: 0 0 20px ${props.customization.accentColor || '#58A4B0'};
        `}
      }
      
      .avatar-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, ${props => props.customization?.accentColor || '#58A4B0'}, ${props => props.customization?.primaryColor || '#4A8C96'});
        color: white;
        font-size: 3rem;
        font-weight: bold;
      }
      
      .verified-badge {
        position: absolute;
        bottom: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        background: ${props => props.customization?.accentColor || '#58A4B0'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        font-weight: bold;
        border: 3px solid ${props => props.customization?.backgroundColor || '#1a1a1a'};
        ${props => props.customization?.glowBadges && props.customization?.showBadges && `
          box-shadow: 0 0 15px ${props.customization.accentColor || '#58A4B0'};
        `}
        display: ${props => props.customization?.showBadges !== false ? 'flex' : 'none'};
      }
    }
    
    .user-info {
      .username-section {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
        
        h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: ${props => props.customization?.textColor || '#ffffff'};
          margin: 0;
          ${props => props.customization?.glowUsername && `
            text-shadow: 0 0 20px ${props.customization.accentColor || '#58A4B0'};
          `}
          
          @media (max-width: 768px) {
            font-size: 2rem;
          }
        }
        
        .plan-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, ${props => props.customization?.accentColor || '#58A4B0'}, ${props => props.customization?.primaryColor || '#4A8C96'});
          color: white;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }
      
      .display-name {
        font-size: 1.5rem;
        font-weight: 400;
        color: #a0a0a0;
        margin: 0 0 1rem 0;
      }
      
      .bio {
        font-size: 1.1rem;
        color: #ffffff;
        line-height: 1.6;
        margin-bottom: 2rem;
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
        
        @media (max-width: 768px) {
          font-size: 1rem;
        }
      }
      
      .profile-views-bottom {
        position: absolute;
        bottom: 1rem;
        left: 1rem;
        
        .views-icon {
          font-size: 1.2rem;
          color: ${props => props.customization?.accentColor || '#58A4B0'};
        }
        
        .views-count {
          font-weight: 600;
          color: ${props => props.customization?.textColor || '#ffffff'};
          font-size: 0.9rem;
          margin-left: 0.3rem;
        }
      }
    }
  }


`

export default UserProfile