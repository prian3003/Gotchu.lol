import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import ParticleBackground from '../effects/ParticleBackground'
import { useTheme } from '../../contexts/ThemeContext'
import { 
  HiUser, 
  HiCog, 
  HiLink, 
  HiStar, 
  HiChevronDown,
  HiChevronUp,
  HiQuestionMarkCircle,
  HiArrowTopRightOnSquare,
  HiArrowRightOnRectangle,
  HiBars3,
  HiXMark,
  HiHome,
  HiChartBar,
  HiShieldCheck,
  HiAdjustmentsHorizontal,
  HiPencilSquare,
  HiIdentification,
  HiEye,
  HiCalendarDays,
  HiExclamationTriangle,
  HiCamera,
  HiDocumentText,
  HiChatBubbleLeftEllipsis,
  HiCommandLine,
  HiFingerPrint,
  HiUserPlus,
  HiGem,
  HiChatBubbleLeftRight,
  HiShare,
  HiSpeakerWave,
  HiCursorArrowRays,
  HiShieldExclamation,
  HiTv,
  HiSparkles,
  HiMapPin
} from 'react-icons/hi2'
import { 
  RiDashboardLine,
  RiBrushLine,
  RiLinksLine,
  RiVipCrownLine,
  RiAppsLine,
  RiFocusLine
} from 'react-icons/ri'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { colors, isDarkMode } = useTheme()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId')
      
      if (!token && !sessionId) {
        throw new Error('No authentication found')
      }

      // For now, let's use mock data that matches the example
      setUser({
        id: 1,
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
        is_verified: true,
        plan: 'free',
        avatar_url: null,
        uid: '772,558',
        alias: 'Unavailable',
        profileViews: 7,
        profileCompletion: 40
      })
      
      setStats({
        profileViews: 7,
        totalClicks: 156,
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        uid: '772,558',
        profileCompletion: 40
      })
      
      setLoading(false)
    } catch (err) {
      console.error('Dashboard error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId')
      
      if (sessionId) {
        await fetch('http://localhost:8080/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId
          }
        })
      }
      
      localStorage.removeItem('authToken')
      localStorage.removeItem('sessionId')
      window.location.href = '/signin'
      
    } catch (err) {
      console.error('Logout error:', err)
      // Force logout even if API call fails
      localStorage.removeItem('authToken')
      localStorage.removeItem('sessionId')
      window.location.href = '/signin'
    }
  }

  const sidebarItems = [
    { 
      id: 'overview', 
      icon: RiDashboardLine, 
      label: 'Account', 
      hasDropdown: true,
      dropdownItems: [
        { id: 'overview', icon: HiHome, label: 'Overview' },
        { id: 'analytics', icon: HiChartBar, label: 'Analytics' },
        { id: 'badges', icon: HiShieldCheck, label: 'Badges' },
        { id: 'settings', icon: HiAdjustmentsHorizontal, label: 'Settings' }
      ]
    },
    { id: 'customize', icon: RiBrushLine, label: 'Customize' },
    { id: 'links', icon: RiLinksLine, label: 'Links' },
    { id: 'premium', icon: RiVipCrownLine, label: 'Premium' },
    { id: 'templates', icon: RiAppsLine, label: 'Templates' }
  ]

  if (loading) {
    return (
      <DashboardWrapper style={{ background: colors.background }}>
        <ParticleBackground />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </DashboardWrapper>
    )
  }

  if (error || !user) {
    return (
      <DashboardWrapper style={{ background: colors.background }}>
        <ParticleBackground />
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>{error || 'You need to be logged in to view this page'}</p>
          <button 
            className="cta-button"
            onClick={() => window.location.href = '/signin'}
          >
            Sign In
          </button>
        </div>
      </DashboardWrapper>
    )
  }

  return (
    <DashboardWrapper style={{ background: colors.background }}>
      <ParticleBackground />
      
      {/* Sidebar */}
      <Sidebar className={sidebarCollapsed ? 'collapsed' : ''}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo">
            <RiFocusLine className="logo-icon" />
            {!sidebarCollapsed && <span className="logo-text">gotchu.lol</span>}
          </div>
          <button 
            className="collapse-button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <HiBars3 /> : <HiXMark />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="nav-menu">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon
            return (
              <div key={item.id} className="nav-item">
                <div 
                  className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection(item.id)
                    if (item.hasDropdown) {
                      setAccountDropdownOpen(!accountDropdownOpen)
                    } else {
                      setAccountDropdownOpen(false)
                    }
                  }}
                >
                  <div className="nav-link-content">
                    <IconComponent className="nav-icon" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="nav-label">{item.label}</span>
                        {item.hasDropdown && (
                          <div className={`dropdown-arrow ${accountDropdownOpen ? 'open' : ''}`}>
                            {accountDropdownOpen ? <HiChevronUp /> : <HiChevronDown />}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {item.hasDropdown && accountDropdownOpen && !sidebarCollapsed && (
                  <div className="dropdown-menu">
                    {item.dropdownItems.map((dropdownItem) => {
                      const DropdownIcon = dropdownItem.icon
                      return (
                        <div 
                          key={dropdownItem.id}
                          className="dropdown-item"
                          onClick={() => setActiveSection(dropdownItem.id)}
                        >
                          <DropdownIcon className="dropdown-icon" />
                          <span>{dropdownItem.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          {!sidebarCollapsed && (
            <>
              <div className="help-section">
                <p className="help-text">Have a question or need support?</p>
                <button className="help-button">
                  <HiQuestionMarkCircle className="help-icon" />
                  <span>Help Center</span>
                </button>
              </div>
              
              <div className="my-page-section">
                <p className="my-page-text">Check out your page</p>
                <button 
                  className="my-page-button"
                  onClick={() => window.open(`/${user.username}`, '_blank')}
                >
                  <HiArrowTopRightOnSquare className="share-icon" />
                  <span>My Page</span>
                </button>
              </div>
            </>
          )}

          {/* User Profile */}
          <div className="user-profile">
            <div className="user-avatar">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} />
              ) : (
                <div className="avatar-placeholder">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <div className="username">{user.username}</div>
                <div className="user-uid">UID {user.uid}</div>
              </div>
            )}
            <button className="user-menu-button" onClick={handleLogout}>
              <HiArrowRightOnRectangle />
            </button>
          </div>
        </div>
      </Sidebar>

      {/* Main Content */}
      <MainContent>
        {activeSection === 'overview' && (
          <>
            {/* Header */}
            <div className="content-header">
              <h1>Account Overview</h1>
            </div>

            {/* Overview Cards */}
            <div className="overview-cards">
              <div className="overview-card">
                <div className="card-header">
                  <div className="card-header-content">
                    <HiUser className="card-icon" />
                    <h3>Username</h3>
                  </div>
                  <button className="edit-button">
                    <HiPencilSquare />
                  </button>
                </div>
                <div className="card-value">{user.username}</div>
                <div className="card-description">Change available now</div>
              </div>

              <div className="overview-card">
                <div className="card-header">
                  <div className="card-header-content">
                    <HiStar className="card-icon" />
                    <h3>Alias</h3>
                  </div>
                  <button className="edit-button premium">
                    <HiStar />
                  </button>
                </div>
                <div className="card-value">{user.alias}</div>
                <div className="card-description">Premium Only</div>
              </div>

              <div className="overview-card">
                <div className="card-header">
                  <div className="card-header-content">
                    <HiIdentification className="card-icon" />
                    <h3>UID</h3>
                  </div>
                  <button className="edit-button disabled">
                    <HiCalendarDays />
                  </button>
                </div>
                <div className="card-value">{user.uid}</div>
                <div className="card-description">Joined after 84% of all users</div>
              </div>

              <div className="overview-card">
                <div className="card-header">
                  <div className="card-header-content">
                    <HiEye className="card-icon" />
                    <h3>Profile Views</h3>
                  </div>
                  <button className="edit-button">
                    <HiChartBar />
                  </button>
                </div>
                <div className="card-value">{user.profileViews}</div>
                <div className="card-description">+0 views since last 7 days</div>
              </div>
            </div>

            {/* Account Statistics */}
            <div className="account-statistics">
              <h2>Account Statistics</h2>
              
              <div className="profile-completion">
                <div className="completion-header">
                  <h3>Profile Completion</h3>
                  <span className="completion-percentage">{user.profileCompletion}% completed</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${user.profileCompletion}%` }}
                  ></div>
                </div>
                <div className="completion-alert">
                  <HiExclamationTriangle className="alert-icon" />
                  <span>Your profile isn't complete yet!</span>
                </div>
                <p className="completion-description">
                  Complete your profile to make it more discoverable and appealing.
                </p>
                
                <div className="completion-tasks">
                  <div className="task-item">
                    <HiCamera className="task-icon" />
                    <span className="task-text">Upload An Avatar</span>
                    <HiArrowTopRightOnSquare className="task-arrow" />
                  </div>
                  <div className="task-item completed">
                    <HiShieldCheck className="task-icon completed" />
                    <span className="task-text">Add A Description</span>
                  </div>
                  <div className="task-item">
                    <HiChatBubbleLeftEllipsis className="task-icon" />
                    <span className="task-text">Link Discord Account</span>
                    <HiArrowTopRightOnSquare className="task-arrow" />
                  </div>
                  <div className="task-item completed">
                    <HiShieldCheck className="task-icon completed" />
                    <span className="task-text">Add Socials</span>
                  </div>
                  <div className="task-item">
                    <HiFingerPrint className="task-icon" />
                    <span className="task-text">Enable 2FA</span>
                    <HiArrowTopRightOnSquare className="task-arrow" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="right-panel">
              <div className="manage-account">
                <h3>Manage your account</h3>
                <p>Change your email, username and more.</p>
                
                <div className="account-actions">
                  <button className="action-button">
                    <HiPencilSquare className="action-icon" />
                    Change Username
                  </button>
                  <button className="action-button">
                    <HiUserPlus className="action-icon" />
                    Change Display Name
                  </button>
                  <button className="action-button premium">
                    <HiGem className="action-icon" />
                    Want more? Unlock with Premium
                  </button>
                  <button className="action-button">
                    <HiAdjustmentsHorizontal className="action-icon" />
                    Account Settings
                  </button>
                </div>
              </div>

              <div className="connections">
                <h3>Connections</h3>
                <p>Link your Discord account to guns.lol</p>
                <button className="connect-button">
                  <HiChatBubbleLeftRight className="discord-icon" />
                  Connect Discord
                </button>
              </div>
            </div>
          </>
        )}

        {activeSection === 'customize' && (
          <>
            {/* Header */}
            <div className="content-header">
              <h1>Customize</h1>
            </div>

            {/* Assets Uploader */}
            <div className="customize-section">
              <h2>Assets Uploader</h2>
              <div className="upload-grid">
                <div className="upload-card">
                  <div className="upload-area">
                    <HiCamera className="upload-icon" />
                    <span className="upload-text">Click to upload a file</span>
                  </div>
                  <h3>Background</h3>
                </div>
                <div className="upload-card">
                  <div className="upload-area">
                    <HiSpeakerWave className="upload-icon" />
                    <span className="upload-text">Click to open audio manager</span>
                  </div>
                  <h3>Audio</h3>
                </div>
                <div className="upload-card">
                  <div className="upload-area">
                    <HiUser className="upload-icon" />
                    <span className="upload-text">Click to upload a file</span>
                  </div>
                  <h3>Profile Avatar</h3>
                </div>
                <div className="upload-card">
                  <div className="upload-area">
                    <HiCursorArrowRays className="upload-icon" />
                    <span className="upload-text">Click to upload a file</span>
                  </div>
                  <h3>Custom Cursor</h3>
                </div>
              </div>
            </div>

            {/* Premium Banner */}
            <div className="premium-banner">
              <HiStar className="premium-icon" />
              <span>Want exclusive features? Unlock more with</span>
              <strong>Premium</strong>
            </div>

            {/* General Customization */}
            <div className="customize-section">
              <h2>General Customization</h2>
              <div className="customization-grid">
                <div className="customize-card">
                  <h3>Description</h3>
                  <div className="input-group">
                    <HiExclamationTriangle className="warning-icon" />
                    <input type="text" placeholder="dsadsadasdsa" className="custom-input" />
                  </div>
                </div>
                
                <div className="customize-card">
                  <h3>Discord Presence</h3>
                  <div className="discord-toggle">
                    <HiShieldExclamation className="discord-icon" />
                    <span>Click here to connect your Discord and unlock this feature.</span>
                  </div>
                </div>

                <div className="customize-card">
                  <h3>Profile Opacity</h3>
                  <div className="slider-container">
                    <input type="range" min="0" max="100" defaultValue="50" className="custom-slider" />
                    <div className="slider-dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot active"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                </div>

                <div className="customize-card">
                  <h3>Profile Blur</h3>
                  <div className="slider-container">
                    <input type="range" min="0" max="100" defaultValue="75" className="custom-slider" />
                    <div className="slider-dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot active"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                </div>

                <div className="customize-card">
                  <h3>Background Effects</h3>
                  <div className="dropdown-container">
                    <HiTv className="dropdown-icon" />
                    <select className="custom-select">
                      <option>Old TV</option>
                      <option>None</option>
                      <option>Matrix</option>
                      <option>Particles</option>
                    </select>
                    <HiChevronDown className="chevron-icon" />
                  </div>
                </div>

                <div className="customize-card">
                  <h3>Username Effects</h3>
                  <div className="dropdown-container">
                    <HiSparkles className="dropdown-icon" />
                    <select className="custom-select">
                      <option>Choose Username Effects</option>
                      <option>Glow</option>
                      <option>Rainbow</option>
                      <option>Typewriter</option>
                    </select>
                    <HiChevronDown className="chevron-icon" />
                  </div>
                </div>

                <div className="customize-card">
                  <h3>Location</h3>
                  <div className="input-group">
                    <HiMapPin className="location-icon" />
                    <input type="text" placeholder="kontol haha" className="custom-input" />
                  </div>
                </div>

                <div className="customize-card">
                  <h3>Glow Settings</h3>
                  <div className="glow-buttons">
                    <button className="glow-button active">
                      <HiUser className="glow-icon" />
                      Username
                    </button>
                    <button className="glow-button">
                      <HiShare className="glow-icon" />
                      Socials
                    </button>
                    <button className="glow-button active">
                      <HiShieldCheck className="glow-icon" />
                      Badges
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Customization */}
            <div className="customize-section">
              <h2>Color Customization</h2>
              <div className="color-grid">
                <div className="color-card">
                  <h3>Accent Color</h3>
                  <div className="color-picker">
                    <div className="color-swatch" style={{ background: '#c96c01' }}></div>
                    <span className="color-code">#c96c01</span>
                    <HiPencilSquare className="edit-icon" />
                  </div>
                </div>
                
                <div className="color-card">
                  <h3>Text Color</h3>
                  <div className="color-picker">
                    <div className="color-swatch" style={{ background: '#eb0000' }}></div>
                    <span className="color-code">#eb0000</span>
                    <HiPencilSquare className="edit-icon" />
                  </div>
                </div>
                
                <div className="color-card">
                  <h3>Background Color</h3>
                  <div className="color-picker">
                    <div className="color-swatch" style={{ background: '#c96c01' }}></div>
                    <span className="color-code">#c96c01</span>
                    <HiPencilSquare className="edit-icon" />
                  </div>
                </div>
                
                <div className="color-card">
                  <h3>Icon Color</h3>
                  <div className="color-picker">
                    <div className="color-swatch" style={{ background: '#b50000' }}></div>
                    <span className="color-code">#b50000</span>
                    <HiPencilSquare className="edit-icon" />
                  </div>
                </div>
              </div>
              
              <button className="gradient-button">
                Enable Profile Gradient
              </button>
            </div>

            {/* Other Customization */}
            <div className="customize-section">
              <h2>Other Customization</h2>
              <div className="toggles-grid">
                <div className="toggle-card">
                  <div className="toggle-header">
                    <h3>Monochrome Icons</h3>
                    <HiQuestionMarkCircle className="info-icon" />
                  </div>
                  <div className="toggle-switch active">
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                
                <div className="toggle-card">
                  <h3>Animated Title</h3>
                  <div className="toggle-switch active">
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                
                <div className="toggle-card">
                  <div className="toggle-header">
                    <h3>Swap Box Colors</h3>
                    <HiQuestionMarkCircle className="info-icon" />
                  </div>
                  <div className="toggle-switch active">
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                
                <div className="toggle-card">
                  <h3>Volume Control</h3>
                  <div className="toggle-switch">
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                
                <div className="toggle-card">
                  <h3>Use Discord Avatar</h3>
                  <div className="toggle-switch active">
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                
                <div className="toggle-card">
                  <h3>Discord Avatar Decoration</h3>
                  <div className="toggle-switch active">
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === 'links' && (
          <div className="section-content">
            <h1>Links</h1>
            <p>Manage your social links and external profiles.</p>
          </div>
        )}

        {activeSection === 'premium' && (
          <div className="section-content">
            <h1>Premium</h1>
            <p>Upgrade to premium for exclusive features and customization options.</p>
          </div>
        )}

        {activeSection === 'templates' && (
          <div className="section-content">
            <h1>Templates</h1>
            <p>Choose from pre-made templates for your profile.</p>
          </div>
        )}
      </MainContent>
    </DashboardWrapper>
  )
}

const DashboardWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
  background: #1a1a1a;

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
`

const Sidebar = styled.div`
  width: 260px;
  background: linear-gradient(145deg, rgba(15, 15, 25, 0.98), rgba(25, 25, 35, 0.95));
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(88, 164, 176, 0.15);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  
  &.collapsed {
    width: 64px;
    
    .sidebar-header .logo .logo-text {
      opacity: 0;
      transform: translateX(-10px);
    }
    
    .nav-menu .nav-item .nav-link .nav-link-content {
      justify-content: center;
    }
  }
  
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1rem;
    border-bottom: 1px solid rgba(88, 164, 176, 0.1);
    background: linear-gradient(145deg, rgba(88, 164, 176, 0.08), rgba(88, 164, 176, 0.03));
    
    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      .logo-icon {
        font-size: 1.4rem;
        color: #58A4B0;
        filter: drop-shadow(0 0 6px rgba(88, 164, 176, 0.3));
        transition: all 0.3s ease;
        
        &:hover {
          transform: rotate(15deg) scale(1.1);
          filter: drop-shadow(0 0 10px rgba(88, 164, 176, 0.5));
        }
      }
      
      .logo-text {
        font-size: 1rem;
        font-weight: 700;
        background: linear-gradient(135deg, #58A4B0, #4A8C96);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        transition: all 0.3s ease;
      }
    }
    
    .collapse-button {
      background: rgba(88, 164, 176, 0.1);
      border: 1px solid rgba(88, 164, 176, 0.2);
      border-radius: 6px;
      padding: 0.4rem;
      color: #58A4B0;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background: rgba(88, 164, 176, 0.2);
        border-color: rgba(88, 164, 176, 0.4);
        transform: scale(1.05);
      }
      
      svg {
        font-size: 1rem;
      }
    }
  }
  
  .nav-menu {
    flex: 1;
    padding: 0.5rem 0;
    
    .nav-item {
      margin: 0.15rem 0;
      position: relative;
      
      .nav-link {
        margin: 0 0.75rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(88, 164, 176, 0.1), rgba(88, 164, 176, 0.05));
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: 12px;
        }
        
        &:hover::before {
          opacity: 1;
        }
        
        &.active {
          background: linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1));
          border: 1px solid rgba(88, 164, 176, 0.3);
          box-shadow: 0 4px 12px rgba(88, 164, 176, 0.15);
          
          &::after {
            content: '';
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 24px;
            background: linear-gradient(180deg, #58A4B0, #4A8C96);
            border-radius: 2px;
          }
        }
        
        .nav-link-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.85rem;
          color: #a0a0a0;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
          
          .nav-icon {
            font-size: 1.1rem;
            transition: all 0.3s ease;
            flex-shrink: 0;
          }
          
          .nav-label {
            font-size: 0.85rem;
            font-weight: 500;
            flex: 1;
            transition: all 0.3s ease;
          }
          
          .dropdown-arrow {
            transition: all 0.3s ease;
            opacity: 0.7;
            
            &.open {
              transform: rotate(180deg);
              opacity: 1;
            }
            
            svg {
              font-size: 1rem;
            }
          }
        }
        
        &:hover .nav-link-content {
          color: #ffffff;
          
          .nav-icon {
            color: #58A4B0;
            transform: scale(1.1);
          }
        }
        
        &.active .nav-link-content {
          color: #58A4B0;
          
          .nav-icon {
            color: #58A4B0;
            filter: drop-shadow(0 0 6px rgba(88, 164, 176, 0.4));
          }
          
          .nav-label {
            color: #ffffff;
          }
        }
      }
      
      .dropdown-menu {
        background: linear-gradient(145deg, rgba(20, 20, 30, 0.95), rgba(30, 30, 40, 0.9));
        margin: 0.15rem 1rem 0 1rem;
        border-radius: 8px;
        padding: 0.3rem 0;
        border: 1px solid rgba(88, 164, 176, 0.15);
        backdrop-filter: blur(10px);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
        animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.75rem;
          color: #a0a0a0;
          cursor: pointer;
          font-size: 0.8rem;
          margin: 0 0.25rem;
          border-radius: 6px;
          transition: all 0.3s ease;
          
          .dropdown-icon {
            font-size: 0.9rem;
            transition: all 0.3s ease;
          }
          
          &:hover {
            background: rgba(88, 164, 176, 0.1);
            color: #ffffff;
            transform: translateX(4px);
            
            .dropdown-icon {
              color: #58A4B0;
              transform: scale(1.1);
            }
          }
        }
      }
    }
  }
  
  .sidebar-bottom {
    border-top: 1px solid rgba(88, 164, 176, 0.1);
    padding: 0.5rem;
    background: linear-gradient(145deg, rgba(88, 164, 176, 0.03), rgba(88, 164, 176, 0.01));
    
    .help-section, .my-page-section {
      margin-bottom: 0.35rem;
      
      p {
        font-size: 0.65rem;
        color: #666;
        margin-bottom: 0.3rem;
        line-height: 1.2;
      }
      
      button {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        width: 100%;
        padding: 0.5rem 0.6rem;
        background: linear-gradient(135deg, rgba(88, 164, 176, 0.1), rgba(88, 164, 176, 0.05));
        border: 1px solid rgba(88, 164, 176, 0.2);
        border-radius: 8px;
        color: #58A4B0;
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        
        .help-icon, .share-icon {
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        
        &:hover {
          background: linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1));
          border-color: rgba(88, 164, 176, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(88, 164, 176, 0.15);
          
          .help-icon, .share-icon {
            transform: scale(1.05);
          }
        }
      }
    }
    
    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem;
      background: linear-gradient(135deg, rgba(30, 30, 40, 0.8), rgba(25, 25, 35, 0.6));
      border-radius: 10px;
      border: 1px solid rgba(88, 164, 176, 0.15);
      transition: all 0.3s ease;
      
      &:hover {
        border-color: rgba(88, 164, 176, 0.3);
        box-shadow: 0 4px 16px rgba(88, 164, 176, 0.1);
      }
      
      .user-avatar {
        position: relative;
        
        .avatar-placeholder {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #58A4B0, #4A8C96);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.9rem;
          box-shadow: 0 3px 8px rgba(88, 164, 176, 0.3);
          transition: all 0.3s ease;
        }
        
        img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(88, 164, 176, 0.3);
          transition: all 0.3s ease;
        }
        
        &:hover .avatar-placeholder,
        &:hover img {
          transform: scale(1.05);
          box-shadow: 0 4px 10px rgba(88, 164, 176, 0.4);
        }
      }
      
      .user-info {
        flex: 1;
        min-width: 0;
        
        .username {
          font-size: 0.8rem;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 0.15rem;
        }
        
        .user-uid {
          font-size: 0.65rem;
          color: #666;
          font-weight: 500;
        }
      }
      
      .user-menu-button {
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.2);
        border-radius: 6px;
        padding: 0.4rem;
        color: #ff6b6b;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover {
          background: rgba(255, 107, 107, 0.2);
          border-color: rgba(255, 107, 107, 0.4);
          transform: scale(1.05);
          box-shadow: 0 3px 8px rgba(255, 107, 107, 0.2);
        }
        
        svg {
          font-size: 1rem;
        }
      }
    }
  }
  
  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    
    &.mobile-open {
      transform: translateX(0);
    }
  }
`

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  position: relative;
  z-index: 10;
  
  .content-header {
    margin-bottom: 2rem;
    
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }
  }
  
  .overview-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
    
    .overview-card {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(145deg, rgba(88, 164, 176, 0.03), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }
      
      &:hover {
        border-color: rgba(88, 164, 176, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        
        &::before {
          opacity: 1;
        }
      }
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        
        .card-header-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          
          .card-icon {
            font-size: 1.2rem;
            color: #58A4B0;
            background: rgba(88, 164, 176, 0.1);
            padding: 0.5rem;
            border-radius: 8px;
            border: 1px solid rgba(88, 164, 176, 0.2);
            transition: all 0.3s ease;
            
            &:hover {
              background: rgba(88, 164, 176, 0.2);
              border-color: rgba(88, 164, 176, 0.4);
              transform: scale(1.05);
            }
          }
          
          h3 {
            font-size: 0.9rem;
            color: #a0a0a0;
            margin: 0;
            font-weight: 500;
          }
        }
        
        .edit-button {
          background: rgba(88, 164, 176, 0.05);
          border: 1px solid rgba(88, 164, 176, 0.1);
          color: #58A4B0;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          
          &:hover {
            background: rgba(88, 164, 176, 0.15);
            border-color: rgba(88, 164, 176, 0.3);
            transform: scale(1.05);
            box-shadow: 0 2px 8px rgba(88, 164, 176, 0.2);
          }
          
          &.premium {
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.05));
            border-color: rgba(255, 215, 0, 0.3);
            color: #ffd700;
            
            &:hover {
              background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 193, 7, 0.1));
              border-color: rgba(255, 215, 0, 0.5);
              box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
            }
          }
          
          &.disabled {
            background: rgba(100, 100, 100, 0.1);
            border-color: rgba(100, 100, 100, 0.2);
            color: #666;
            cursor: not-allowed;
            
            &:hover {
              transform: none;
              box-shadow: none;
            }
          }
          
          svg {
            font-size: 1rem;
          }
        }
      }
      
      .card-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 0.5rem;
      }
      
      .card-description {
        font-size: 0.8rem;
        color: #666;
      }
    }
  }
  
  .account-statistics {
    margin-bottom: 2rem;
    
    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 1.5rem;
    }
    
    .profile-completion {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 2rem;
      backdrop-filter: blur(10px);
      
      .completion-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        
        h3 {
          font-size: 1.1rem;
          color: #ffffff;
          margin: 0;
        }
        
        .completion-percentage {
          font-size: 0.9rem;
          color: #58A4B0;
          font-weight: 600;
        }
      }
      
      .progress-bar {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        margin-bottom: 1rem;
        overflow: hidden;
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #58A4B0, #4A8C96);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
      }
      
      .completion-alert {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        color: #ffa500;
        font-size: 0.9rem;
        font-weight: 600;
        
        .alert-icon {
          font-size: 1.1rem;
          color: #ffa500;
        }
      }
      
      .completion-description {
        color: #a0a0a0;
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
      }
      
      .completion-tasks {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 0.75rem;
        
        .task-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover {
            background: rgba(88, 164, 176, 0.1);
          }
          
          &.completed {
            opacity: 0.6;
            cursor: default;
            
            &:hover {
              background: rgba(255, 255, 255, 0.05);
            }
          }
          
          .task-icon {
            font-size: 1.1rem;
            color: #58A4B0;
            transition: all 0.3s ease;
            
            &.completed {
              color: #4ade80;
            }
          }
          
          .task-text {
            flex: 1;
            color: #ffffff;
            font-size: 0.9rem;
          }
          
          .task-arrow {
            color: #58A4B0;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            
            &:hover {
              transform: translateX(2px);
            }
          }
        }
      }
    }
  }
  
  .right-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    
    .manage-account, .connections {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(145deg, rgba(88, 164, 176, 0.02), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }
      
      &:hover {
        border-color: rgba(88, 164, 176, 0.15);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        
        &::before {
          opacity: 1;
        }
      }
      
      h3 {
        font-size: 1.1rem;
        color: #ffffff;
        margin-bottom: 0.5rem;
      }
      
      p {
        color: #a0a0a0;
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
      }
      
      .account-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        
        .action-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.9rem;
          font-weight: 500;
          position: relative;
          overflow: hidden;
          
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(88, 164, 176, 0.1), transparent);
            transition: left 0.5s ease;
          }
          
          &:hover::before {
            left: 100%;
          }
          
          &:hover {
            background: linear-gradient(135deg, rgba(88, 164, 176, 0.15), rgba(88, 164, 176, 0.08));
            border-color: rgba(88, 164, 176, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(88, 164, 176, 0.15);
          }
          
          &.premium {
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.05));
            border-color: rgba(255, 215, 0, 0.3);
            color: #ffd700;
            
            &:hover {
              background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 193, 7, 0.1));
              border-color: rgba(255, 215, 0, 0.5);
              box-shadow: 0 4px 16px rgba(255, 215, 0, 0.2);
            }
            
            &::before {
              background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.2), transparent);
            }
          }
          
          .action-icon {
            font-size: 1rem;
            transition: all 0.3s ease;
          }
          
          &:hover .action-icon {
            transform: scale(1.1);
          }
        }
      }
      
      .connect-button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: #5865F2;
        border: none;
        border-radius: 8px;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
        font-weight: 600;
        width: 100%;
        
        &:hover {
          background: #4752C4;
        }
        
        .discord-icon {
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        
        &:hover .discord-icon {
          transform: scale(1.1);
        }
      }
    }
  }
  
  .section-content {
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 1rem;
    }
    
    p {
      color: #a0a0a0;
      font-size: 1rem;
    }
  }
  
  /* Customize Page Styles */
  .customize-section {
    margin-bottom: 2rem;
    
    h2 {
      font-size: 1.3rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 1.5rem;
    }
  }
  
  .upload-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    
    .upload-card {
      text-align: center;
      
      .upload-area {
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
        border: 2px dashed rgba(88, 164, 176, 0.3);
        border-radius: 12px;
        padding: 2rem 1rem;
        margin-bottom: 0.75rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        
        &:hover {
          border-color: rgba(88, 164, 176, 0.5);
          background: linear-gradient(145deg, rgba(88, 164, 176, 0.08), rgba(88, 164, 176, 0.03));
          transform: translateY(-2px);
        }
        
        .upload-icon {
          font-size: 2rem;
          color: #58A4B0;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
        }
        
        .upload-text {
          display: block;
          font-size: 0.8rem;
          color: #a0a0a0;
        }
      }
      
      h3 {
        font-size: 0.9rem;
        color: #ffffff;
        margin: 0;
        font-weight: 500;
      }
    }
  }
  
  .premium-banner {
    background: linear-gradient(135deg, rgba(138, 43, 226, 0.2), rgba(75, 0, 130, 0.1));
    border: 1px solid rgba(138, 43, 226, 0.3);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #ffffff;
    font-size: 0.9rem;
    
    .premium-icon {
      font-size: 1.2rem;
      color: #ffd700;
    }
    
    strong {
      color: #ffd700;
      margin-left: 0.25rem;
    }
  }
  
  .customization-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
  }
  
  .customize-card {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.25rem;
    backdrop-filter: blur(10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      border-color: rgba(88, 164, 176, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    
    h3 {
      font-size: 0.9rem;
      color: #ffffff;
      margin-bottom: 0.75rem;
      font-weight: 500;
    }
  }
  
  .input-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.5rem;
    
    .warning-icon, .location-icon {
      font-size: 1rem;
      color: #ffa500;
    }
    
    .custom-input {
      flex: 1;
      background: none;
      border: none;
      color: #ffffff;
      font-size: 0.85rem;
      outline: none;
      
      &::placeholder {
        color: #666;
      }
    }
  }
  
  .discord-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(88, 101, 242, 0.1);
    border: 1px solid rgba(88, 101, 242, 0.2);
    border-radius: 8px;
    cursor: pointer;
    
    .discord-icon {
      font-size: 1rem;
      color: #5865F2;
    }
    
    span {
      font-size: 0.8rem;
      color: #a0a0a0;
    }
  }
  
  .slider-container {
    .custom-slider {
      width: 100%;
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.1);
      outline: none;
      margin-bottom: 0.5rem;
      appearance: none;
      
      &::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #58A4B0;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(88, 164, 176, 0.3);
      }
      
      &::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #58A4B0;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 6px rgba(88, 164, 176, 0.3);
      }
    }
    
    .slider-dots {
      display: flex;
      justify-content: space-between;
      padding: 0 8px;
      
      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transition: all 0.3s ease;
        
        &.active {
          background: #58A4B0;
          transform: scale(1.2);
        }
      }
    }
  }
  
  .dropdown-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.5rem;
    
    .dropdown-icon {
      font-size: 1rem;
      color: #58A4B0;
    }
    
    .custom-select {
      flex: 1;
      background: none;
      border: none;
      color: #ffffff;
      font-size: 0.85rem;
      outline: none;
      appearance: none;
      cursor: pointer;
      
      option {
        background: #1a1a1a;
        color: #ffffff;
      }
    }
    
    .chevron-icon {
      font-size: 0.8rem;
      color: #a0a0a0;
      pointer-events: none;
    }
  }
  
  .glow-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    
    .glow-button {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #a0a0a0;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &.active {
        background: rgba(76, 175, 80, 0.2);
        border-color: rgba(76, 175, 80, 0.4);
        color: #4caf50;
      }
      
      &:hover {
        border-color: rgba(88, 164, 176, 0.3);
        color: #ffffff;
      }
      
      .glow-icon {
        font-size: 0.9rem;
      }
    }
  }
  
  .color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .color-card {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.25rem;
    backdrop-filter: blur(10px);
    
    h3 {
      font-size: 0.9rem;
      color: #ffffff;
      margin-bottom: 0.75rem;
      font-weight: 500;
    }
    
    .color-picker {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      
      .color-swatch {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          transform: scale(1.05);
          border-color: rgba(255, 255, 255, 0.4);
        }
      }
      
      .color-code {
        flex: 1;
        font-size: 0.85rem;
        color: #a0a0a0;
        font-family: 'Monaco', 'Consolas', monospace;
      }
      
      .edit-icon {
        font-size: 1rem;
        color: #58A4B0;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          color: #ffffff;
          transform: scale(1.1);
        }
      }
    }
  }
  
  .gradient-button {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: linear-gradient(135deg, #b91c1c, #991b1b);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }
  }
  
  .toggles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .toggle-card {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.25rem;
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .toggle-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      h3 {
        font-size: 0.9rem;
        color: #ffffff;
        margin: 0;
        font-weight: 500;
      }
      
      .info-icon {
        font-size: 0.9rem;
        color: #a0a0a0;
        cursor: help;
      }
    }
    
    h3 {
      font-size: 0.9rem;
      color: #ffffff;
      margin: 0;
      font-weight: 500;
    }
    
    .toggle-switch {
      position: relative;
      width: 44px;
      height: 24px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &.active {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        
        .toggle-slider {
          transform: translateX(20px);
        }
      }
      
      .toggle-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transition: transform 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }
  }

  @media (max-width: 768px) {
    padding: 1rem;
    
    .overview-cards {
      grid-template-columns: 1fr;
    }
    
    .right-panel {
      grid-template-columns: 1fr;
    }
    
    .upload-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
    
    .customization-grid {
      grid-template-columns: 1fr;
    }
    
    .color-grid {
      grid-template-columns: 1fr;
    }
    
    .toggles-grid {
      grid-template-columns: 1fr;
    }
  }
`

export default Dashboard