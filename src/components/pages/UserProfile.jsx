import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import ParticleBackground from '../effects/ParticleBackground'
import ShinyText from '../effects/ShinyText'
import { useTheme } from '../../contexts/ThemeContext'

const UserProfile = () => {
  const { username } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { colors, isDarkMode } = useTheme()

  useEffect(() => {
    fetchUserProfile()
  }, [username])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      
      // For now, let's use mock data
      setUser({
        id: 1,
        username: username || 'testuser',
        displayName: 'Test User',
        bio: 'Welcome to my profile! I love coding and creating amazing things.',
        avatar_url: null,
        is_verified: true,
        plan: 'free',
        theme: 'dark',
        uid: '772,558',
        joinedDate: '2024-01-15',
        profileViews: 7,
        links: [
          { id: 1, title: 'Twitter', url: 'https://twitter.com/testuser', icon: '🐦', clicks: 45 },
          { id: 2, title: 'GitHub', url: 'https://github.com/testuser', icon: '🐙', clicks: 32 },
          { id: 3, title: 'Website', url: 'https://testuser.dev', icon: '🌐', clicks: 28 },
          { id: 4, title: 'YouTube', url: 'https://youtube.com/testuser', icon: '📺', clicks: 15 }
        ],
        stats: {
          totalClicks: 120,
          totalViews: 456,
          linksCount: 4
        }
      })
      
      setLoading(false)
    } catch (err) {
      console.error('Profile fetch error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleLinkClick = (link) => {
    // Track click and open link
    console.log(`Clicked on ${link.title}`)
    window.open(link.url, '_blank')
  }

  if (loading) {
    return (
      <ProfileWrapper style={{ background: colors.background }}>
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
      <ProfileWrapper style={{ background: colors.background }}>
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

  return (
    <ProfileWrapper style={{ background: colors.background }}>
      <ParticleBackground />
      
      {/* Large Background Text */}
      <div className="background-text">
        <ShinyText
          size="4xl"
          weight="extrabold"
          speed={4}
          baseColor={isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(19, 21, 21, 0.03)"}
          shineColor={isDarkMode ? "rgba(88, 164, 176, 0.15)" : "rgba(88, 164, 176, 0.2)"}
          intensity={1}
          direction="left-to-right"
          shineWidth={30}
          repeat="infinite"
          className="bg-text"
        >
          {user.username}
        </ShinyText>
      </div>

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
            
            <div className="user-stats">
              <div className="stat-item">
                <span className="stat-value">{user.stats.totalViews}</span>
                <span className="stat-label">Profile Views</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{user.stats.totalClicks}</span>
                <span className="stat-label">Total Clicks</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{user.stats.linksCount}</span>
                <span className="stat-label">Links</span>
              </div>
            </div>
            
            <div className="user-meta">
              <div className="meta-item">
                <span className="meta-icon">🆔</span>
                <span>UID: {user.uid}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">📅</span>
                <span>Joined {new Date(user.joinedDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="links-section">
          <h3>Links</h3>
          <div className="links-grid">
            {user.links.map((link) => (
              <div 
                key={link.id} 
                className="link-card"
                onClick={() => handleLinkClick(link)}
              >
                <div className="link-icon">{link.icon}</div>
                <div className="link-content">
                  <div className="link-title">{link.title}</div>
                  <div className="link-url">{link.url}</div>
                </div>
                <div className="link-stats">
                  <span className="click-count">{link.clicks}</span>
                  <span className="click-label">clicks</span>
                </div>
                <div className="link-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="profile-footer">
          <div className="powered-by">
            <span>Powered by</span>
            <strong>gotchu.lol</strong>
          </div>
          <div className="footer-actions">
            <button className="action-btn">
              <span className="action-icon">📊</span>
              View Analytics
            </button>
            <button className="action-btn">
              <span className="action-icon">📤</span>
              Share Profile
            </button>
            <button className="action-btn primary">
              <span className="action-icon">🚀</span>
              Create Your Own
            </button>
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
  background: #1a1a1a;
  
  .background-text {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 1;
    
    .bg-text {
      font-size: clamp(6rem, 15vw, 20rem);
      font-family: 'DM Serif Text', serif;
      font-weight: 800;
      line-height: 1;
      text-transform: lowercase;
      letter-spacing: -0.02em;
    }
  }

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
    margin: 0 auto;
    padding: 2rem;
    
    @media (max-width: 768px) {
      padding: 1rem;
    }
  }

  .profile-header {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 3rem;
    backdrop-filter: blur(10px);
    margin-bottom: 2rem;
    text-align: center;
    
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
        border: 4px solid #58A4B0;
        object-fit: cover;
      }
      
      .avatar-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #58A4B0, #4A8C96);
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
        background: #58A4B0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        font-weight: bold;
        border: 3px solid #1a1a1a;
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
          color: #ffffff;
          margin: 0;
          
          @media (max-width: 768px) {
            font-size: 2rem;
          }
        }
        
        .plan-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #58A4B0, #4A8C96);
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
      
      .user-stats {
        display: flex;
        justify-content: center;
        gap: 3rem;
        margin-bottom: 2rem;
        
        @media (max-width: 768px) {
          gap: 1.5rem;
        }
        
        .stat-item {
          text-align: center;
          
          .stat-value {
            display: block;
            font-size: 2rem;
            font-weight: 700;
            color: #58A4B0;
            margin-bottom: 0.25rem;
            
            @media (max-width: 768px) {
              font-size: 1.5rem;
            }
          }
          
          .stat-label {
            font-size: 0.9rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }
      }
      
      .user-meta {
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #a0a0a0;
          font-size: 0.9rem;
          
          .meta-icon {
            font-size: 1rem;
          }
        }
      }
    }
  }

  .links-section {
    margin-bottom: 3rem;
    
    h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    
    .links-grid {
      display: grid;
      gap: 1rem;
      
      .link-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        backdrop-filter: blur(10px);
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(88, 164, 176, 0.1);
          border-color: #58A4B0;
          transform: translateY(-2px);
        }
        
        .link-icon {
          font-size: 2rem;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(88, 164, 176, 0.2);
          border-radius: 12px;
          flex-shrink: 0;
        }
        
        .link-content {
          flex: 1;
          min-width: 0;
          
          .link-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 0.25rem;
          }
          
          .link-url {
            font-size: 0.9rem;
            color: #666;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
        
        .link-stats {
          text-align: center;
          margin-right: 1rem;
          
          .click-count {
            display: block;
            font-size: 1.2rem;
            font-weight: 700;
            color: #58A4B0;
            margin-bottom: 0.25rem;
          }
          
          .click-label {
            font-size: 0.8rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }
        
        .link-arrow {
          color: #58A4B0;
          transition: transform 0.3s ease;
        }
        
        &:hover .link-arrow {
          transform: translateX(4px);
        }
      }
    }
  }

  .profile-footer {
    text-align: center;
    padding: 2rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    
    .powered-by {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 2rem;
      
      strong {
        color: #58A4B0;
        margin-left: 0.5rem;
      }
    }
    
    .footer-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
      
      .action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #ffffff;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
        font-weight: 500;
        
        &:hover {
          background: rgba(88, 164, 176, 0.1);
          border-color: #58A4B0;
          transform: translateY(-2px);
        }
        
        &.primary {
          background: linear-gradient(135deg, #58A4B0, #4A8C96);
          border-color: #58A4B0;
          
          &:hover {
            background: linear-gradient(135deg, #4A8C96, #3A7A84);
          }
        }
        
        .action-icon {
          font-size: 1rem;
        }
      }
    }
  }
`

export default UserProfile