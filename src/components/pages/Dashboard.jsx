import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'
import ParticleBackground from '../effects/ParticleBackground'
import CustomizationPage from './CustomizationPage'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import logger from '../../utils/logger'
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
  HiSparkles,
  HiChatBubbleLeftRight,
  HiShare,
  HiSpeakerWave,
  HiCursorArrowRays,
  HiShieldExclamation,
  HiTv,
  HiMapPin,
  HiClock,
  HiCheck,
  HiCheckCircle,
  HiXCircle,
  HiPlus,
  HiTrash,
  HiViewfinderCircle,
  HiExclamationTriangle as HiWarning
} from 'react-icons/hi2'
import { 
  RiDashboardLine,
  RiBrushLine,
  RiLinksLine,
  RiVipCrownLine,
  RiAppsLine,
  RiFocusLine
} from 'react-icons/ri'

const Dashboard = ({ defaultSection = 'overview' }) => {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState(defaultSection)
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNewCustomization, setShowNewCustomization] = useState(false)
  const { colors, isDarkMode } = useTheme()
  const { logout } = useAuth()

  // Customization state
  const [settings, setSettings] = useState({
    // Appearance
    theme: 'dark',
    accentColor: '#c96c01',
    textColor: '#eb0000',
    backgroundColor: '#c96c01',
    iconColor: '#b50000',
    backgroundUrl: '',
    avatarUrl: '',
    // Effects
    backgroundEffect: 'particles',
    usernameEffect: 'glow',
    enableAnimations: true,
    // Audio
    audioUrl: '',
    volumeLevel: 50,
    autoPlay: false,
    // Advanced
    customCursor: '',
    profileOpacity: 90,
    profileBlur: 0,
    showBadges: true,
    description: '',
    location: '',
    discordPresence: false,
    glowUsername: true,
    glowSocials: false,
    glowBadges: true
  })
  
  const [loading2, setLoading2] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showSaveError, setShowSaveError] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [originalSettings, setOriginalSettings] = useState(null)
  const [uploading, setUploading] = useState({})
  
  // Links management state
  const [userLinks, setUserLinks] = useState([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [currentLink, setCurrentLink] = useState({
    title: '',
    url: '',
    description: '',
    type: 'DEFAULT',
    color: '#58A4B0',
    icon: '',
    isActive: true
  })
  
  const fileInputRefs = useRef({
    backgroundImage: null,
    avatar: null,
    audio: null,
    cursor: null
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Update active section when defaultSection prop changes (for direct route navigation)
  useEffect(() => {
    setActiveSection(defaultSection)
  }, [defaultSection])

  // Fetch links when links section is active
  useEffect(() => {
    if (activeSection === 'links') {
      fetchLinks()
    }
  }, [activeSection])

  const fetchLinks = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId')
      const response = await fetch('/api/links', {
        headers: {
          'X-Session-ID': sessionId
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setUserLinks(data.data.links || [])
      } else {
        logger.error('Failed to fetch links', new Error(data.message))
      }
    } catch (error) {
      logger.error('Failed to fetch links', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId')
      
      if (!token && !sessionId) {
        throw new Error('No authentication found')
      }

      // Fetch real dashboard data from backend API
      const response = await fetch('/api/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Session-ID': sessionId || '',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Clear auth tokens and redirect to login
          localStorage.removeItem('authToken')
          localStorage.removeItem('sessionId')
          window.location.href = '/signin'
          return
        }
        throw new Error('Failed to load dashboard data')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load dashboard data')
      }

      const { user: userData, stats: statsData } = data.data

      // Map API response to expected format
      setUser({
        id: userData.id,
        username: userData.username,
        displayName: userData.display_name || userData.username,
        email: userData.email,
        is_verified: userData.is_verified,
        plan: userData.plan || 'free',
        avatar_url: userData.avatar_url,
        uid: userData.id.toString(),
        alias: userData.alias || 'Unavailable',
        profileViews: statsData.profile_views || 0,
        theme: userData.theme || 'dark',
        profileCompletion: calculateProfileCompletion(userData)
      })
      
      setStats({
        profileViews: statsData.profile_views || 0,
        totalClicks: statsData.total_clicks || 0,
        linksCount: statsData.links_count || 0,
        filesCount: statsData.files_count || 0,
        joinDate: userData.created_at,
        lastActive: statsData.last_active,
        uid: userData.id.toString(),
        profileCompletion: calculateProfileCompletion(userData)
      })
      
      setLoading(false)
    } catch (err) {
      logger.error('Dashboard data fetch failed', err)
      setError(err.message)
      setLoading(false)
    }
  }

  // Load customization settings
  const loadSettings = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) {
        setLoading2(false)
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
          const loadedSettings = { ...settings, ...data.data.settings }
          setSettings(loadedSettings)
          setOriginalSettings(JSON.parse(JSON.stringify(loadedSettings)))
          setHasUnsavedChanges(false)
        }
      }
    } catch (error) {
      logger.error('Failed to load customization settings', error)
      setSaveErrorMessage('Failed to load settings from server')
      setShowSaveError(true)
    } finally {
      setLoading2(false)
    }
  }

  // Save settings
  const saveSettings = async (showNotification = true) => {
    try {
      setSaving(true)
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) {
        setSaveErrorMessage('No session found. Please log in again.')
        setShowSaveError(true)
        return false
      }

      const response = await fetch('/api/customization/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          theme: settings.theme,
          accent_color: settings.accentColor,
          text_color: settings.textColor,
          background_color: settings.backgroundColor,
          primary_color: settings.accentColor,
          secondary_color: '#EC4899',
          icon_color: settings.iconColor,
          background_effect: settings.backgroundEffect,
          username_effect: settings.usernameEffect,
          show_badges: settings.showBadges,
          profile_blur: settings.profileBlur,
          profile_opacity: settings.profileOpacity,
          profile_gradient: true,
          glow_username: settings.glowUsername,
          glow_socials: settings.glowSocials,
          glow_badges: settings.glowBadges,
          animated_title: settings.enableAnimations,
          monochrome_icons: false,
          swap_box_colors: false,
          volume_level: settings.volumeLevel,
          volume_control: true,
          discord_presence: settings.discordPresence,
          use_discord_avatar: false,
          discord_avatar_decoration: false,
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
          if (showNotification) {
            setShowSaveSuccess(true)
            setTimeout(() => setShowSaveSuccess(false), 3000)
          }
          return true
        } else {
          throw new Error(data.message || 'Failed to save settings')
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
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

  const resetSettings = () => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)))
      setHasUnsavedChanges(false)
    }
  }

  // File upload handler
  const handleFileUpload = async (file, type) => {
    if (!file) return

    const maxSize = type === 'audio' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      setSaveErrorMessage(`File too large. Maximum size is ${type === 'audio' ? '10MB' : '5MB'}`)
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
      const response = await fetch('/api/upload/asset', {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const settingKey = {
            backgroundImage: 'backgroundUrl',
            avatar: 'avatarUrl',
            audio: 'audioUrl',
            cursor: 'customCursor'
          }[type]

          // Update settings locally without triggering side effects
          setSettings(prev => ({ ...prev, [settingKey]: data.data.url }))
          setShowSaveSuccess(true)
          setTimeout(() => setShowSaveSuccess(false), 3000)
        }
      }
    } catch (error) {
      setSaveErrorMessage('Failed to upload file. Please try again.')
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
    event.target.value = ''
  }

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  // Load settings on mount (but not for customize section which handles its own)
  useEffect(() => {
    if (activeSection !== 'customize') {
      loadSettings()
    }
  }, [activeSection])

  // Detect changes (only when not in customize mode)
  useEffect(() => {
    if (!loading2 && originalSettings && activeSection !== 'customize') {
      const currentSettingsStr = JSON.stringify(settings)
      const originalSettingsStr = JSON.stringify(originalSettings)
      const hasChanges = currentSettingsStr !== originalSettingsStr
      
      setHasUnsavedChanges(hasChanges)
    } else if (activeSection === 'customize') {
      // Reset unsaved changes when entering customize mode (CustomizationPage handles its own)
      setHasUnsavedChanges(false)
    }
  }, [settings, loading2, originalSettings, activeSection])

  // Calculate profile completion percentage
  const calculateProfileCompletion = (userData) => {
    let completedFields = 0
    const totalFields = 5
    
    if (userData.display_name) completedFields++
    if (userData.bio) completedFields++
    if (userData.avatar_url) completedFields++
    if (userData.email) completedFields++
    if (userData.is_verified) completedFields++
    
    return Math.round((completedFields / totalFields) * 100)
  }

  const handleLogout = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId')
      
      if (sessionId) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId
          }
        })
      }
      
      // Use auth context to handle logout
      logout()
      window.location.href = '/signin'
      
    } catch (err) {
      logger.auth('logout', false, err)
      // Force logout even if API call fails
      logout()
      window.location.href = '/signin'
    }
  }

  // Link management handlers
  const handleAddLink = () => {
    setCurrentLink({
      title: '',
      url: '',
      description: '',
      type: 'DEFAULT',
      color: '#58A4B0',
      icon: '',
      isActive: true
    })
    setEditingLink(null)
    setShowLinkModal(true)
  }

  const handleEditLink = (link) => {
    setCurrentLink({ ...link })
    setEditingLink(link)
    setShowLinkModal(true)
  }

  const handleDeleteLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return
    
    try {
      const sessionId = localStorage.getItem('sessionId')
      const response = await fetch(`/api/links/${linkId}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setUserLinks(prev => prev.filter(link => link.id !== linkId))
        logger.userAction('link_deleted', { linkId })
      } else {
        throw new Error(data.message || 'Failed to delete link')
      }
    } catch (error) {
      logger.error('Failed to delete link', error)
      alert('Failed to delete link. Please try again.')
    }
  }

  const handleToggleLink = async (linkId) => {
    try {
      const currentLink = userLinks.find(link => link.id === linkId)
      if (!currentLink) return

      const sessionId = localStorage.getItem('sessionId')
      const response = await fetch(`/api/links/${linkId}`, { 
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({ is_active: !currentLink.isActive })
      })
      
      const data = await response.json()
      if (data.success) {
        setUserLinks(prev => prev.map(link => 
          link.id === linkId 
            ? { ...link, isActive: !link.isActive }
            : link
        ))
      } else {
        throw new Error(data.message || 'Failed to toggle link')
      }
    } catch (error) {
      logger.error('Failed to toggle link', error)
      alert('Failed to toggle link. Please try again.')
    }
  }

  const handlePreviewLink = (link) => {
    if (link.url) {
      window.open(link.url, '_blank')
    }
  }

  const handleSaveLink = async () => {
    if (!currentLink.title || !currentLink.url) {
      alert('Please fill in the title and URL fields')
      return
    }

    try {
      const sessionId = localStorage.getItem('sessionId')
      
      if (editingLink) {
        // Update existing link
        const response = await fetch(`/api/links/${editingLink.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId
          },
          body: JSON.stringify({
            title: currentLink.title,
            url: currentLink.url,
            description: currentLink.description || null,
            type: currentLink.type || 'DEFAULT',
            color: currentLink.color || '#58A4B0',
            icon: currentLink.icon || null,
            is_active: currentLink.isActive !== false
          })
        })
        
        const data = await response.json()
        if (data.success) {
          setUserLinks(prev => prev.map(link => 
            link.id === editingLink.id 
              ? data.data.link
              : link
          ))
        } else {
          throw new Error(data.message || 'Failed to update link')
        }
      } else {
        // Create new link
        const response = await fetch('/api/links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId
          },
          body: JSON.stringify({
            title: currentLink.title,
            url: currentLink.url,
            description: currentLink.description || null,
            type: currentLink.type || 'DEFAULT',
            color: currentLink.color || '#58A4B0',
            icon: currentLink.icon || null,
            is_active: currentLink.isActive !== false
          })
        })
        
        const data = await response.json()
        if (data.success) {
          setUserLinks(prev => [...prev, data.data.link])
        } else {
          throw new Error(data.message || 'Failed to create link')
        }
      }
      
      setShowLinkModal(false)
      setCurrentLink({
        title: '',
        url: '',
        description: '',
        type: 'DEFAULT',
        color: '#58A4B0',
        icon: '',
        isActive: true
      })
      setEditingLink(null)
      
    } catch (error) {
      logger.error('Failed to save link', error)
      alert('Failed to save link. Please try again.')
    }
  }

  const handleCloseModal = () => {
    setShowLinkModal(false)
    setEditingLink(null)
    setCurrentLink({
      title: '',
      url: '',
      description: '',
      type: 'DEFAULT',
      color: '#58A4B0',
      icon: '',
      isActive: true
    })
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

  // Show new customization page if enabled
  if (showNewCustomization) {
    return <CustomizationPage onBack={() => setShowNewCustomization(false)} />
  }

  return (
    <DashboardWrapper style={{ background: colors.background }}>
      <ParticleBackground />
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar className={`${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo">
            <img src="/favicon.ico" alt="gotchu.lol" className="logo-icon" />
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
      <MainContent className={sidebarCollapsed ? 'sidebar-collapsed' : ''}>
        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <HiBars3 />
        </button>
        
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
                    <HiSparkles className="action-icon" />
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
          <div className="section-content">
            <CustomizationPage />
          </div>
        )}

        {/* REMOVED LARGE CUSTOMIZATION SECTION - NOW HANDLED BY /customize ROUTE */}
        {false && (
          <>
            {/* Header */}
            <div className="content-header">
              <div className="header-content">
                <h1>Customize</h1>
                <button 
                  className="new-customization-btn"
                  onClick={() => setShowNewCustomization(true)}
                >
                  <HiSparkles className="btn-icon" />
                  New Experience
                </button>
              </div>
            </div>

            {/* Assets Uploader */}
            <div className="customize-section">
              <h2>Assets Uploader</h2>
              <div className="upload-grid">
                <div className="upload-card" onClick={() => triggerFileUpload('backgroundImage')}>
                  <div className="upload-area">
                    <HiCamera className="upload-icon" />
                    <span className="upload-text">
                      {uploading.backgroundImage ? 'Uploading...' : 'Click to upload a file'}
                    </span>
                    {uploading.backgroundImage && <HiClock className="upload-spinner" />}
                  </div>
                  <h3>Background</h3>
                  {settings.backgroundUrl && (
                    <div className="upload-preview">Current: {settings.backgroundUrl.split('/').pop()}</div>
                  )}
                  <input
                    type="file"
                    ref={el => fileInputRefs.current.backgroundImage = el}
                    onChange={(e) => handleFileChange(e, 'backgroundImage')}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="upload-card" onClick={() => triggerFileUpload('audio')}>
                  <div className="upload-area">
                    <HiSpeakerWave className="upload-icon" />
                    <span className="upload-text">
                      {uploading.audio ? 'Uploading...' : 'Click to open audio manager'}
                    </span>
                    {uploading.audio && <HiClock className="upload-spinner" />}
                  </div>
                  <h3>Audio</h3>
                  {settings.audioUrl && (
                    <div className="upload-preview">Current: {settings.audioUrl.split('/').pop()}</div>
                  )}
                  <input
                    type="file"
                    ref={el => fileInputRefs.current.audio = el}
                    onChange={(e) => handleFileChange(e, 'audio')}
                    accept="audio/*"
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="upload-card" onClick={() => triggerFileUpload('avatar')}>
                  <div className="upload-area">
                    <HiUser className="upload-icon" />
                    <span className="upload-text">
                      {uploading.avatar ? 'Uploading...' : 'Click to upload a file'}
                    </span>
                    {uploading.avatar && <HiClock className="upload-spinner" />}
                  </div>
                  <h3>Profile Avatar</h3>
                  {settings.avatarUrl && (
                    <div className="upload-preview">Current: {settings.avatarUrl.split('/').pop()}</div>
                  )}
                  <input
                    type="file"
                    ref={el => fileInputRefs.current.avatar = el}
                    onChange={(e) => handleFileChange(e, 'avatar')}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="upload-card" onClick={() => triggerFileUpload('cursor')}>
                  <div className="upload-area">
                    <HiCursorArrowRays className="upload-icon" />
                    <span className="upload-text">
                      {uploading.cursor ? 'Uploading...' : 'Click to upload a file'}
                    </span>
                    {uploading.cursor && <HiClock className="upload-spinner" />}
                  </div>
                  <h3>Custom Cursor</h3>
                  {settings.customCursor && (
                    <div className="upload-preview">Current: {settings.customCursor.split('/').pop()}</div>
                  )}
                  <input
                    type="file"
                    ref={el => fileInputRefs.current.cursor = el}
                    onChange={(e) => handleFileChange(e, 'cursor')}
                    accept=".png,.ico,.cur"
                    style={{ display: 'none' }}
                  />
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
                    <input 
                      type="text" 
                      placeholder="Add your description" 
                      className="custom-input"
                      value={settings.description}
                      onChange={(e) => {
                        // Update settings locally without triggering any side effects
                        setSettings(prev => ({ ...prev, description: e.target.value }))
                      }}
                    />
                  </div>
                </div>
                
                <div className="customize-card">
                  <h3>Discord Presence</h3>
                  <div 
                    className={`discord-toggle ${settings.discordPresence ? 'active' : ''}`}
                    onClick={() => {
                      // Update settings locally without triggering side effects
                      setSettings(prev => ({ ...prev, discordPresence: !prev.discordPresence }))
                    }}
                  >
                    <HiShieldExclamation className="discord-icon" />
                    <span>
                      {settings.discordPresence 
                        ? 'Discord presence enabled' 
                        : 'Click here to connect your Discord and unlock this feature.'
                      }
                    </span>
                  </div>
                </div>

                <div className="customize-card">
                  <h3>Profile Opacity</h3>
                  <div className="slider-container">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={settings.profileOpacity}
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, profileOpacity: parseInt(e.target.value) }))
                      }}
                      className="custom-slider" 
                    />
                    <div className="slider-value">{settings.profileOpacity}%</div>
                  </div>
                </div>

                <div className="customize-card">
                  <h3>Profile Blur</h3>
                  <div className="slider-container">
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      value={settings.profileBlur}
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, profileBlur: parseInt(e.target.value) }))
                      }}
                      className="custom-slider" 
                    />
                    <div className="slider-value">{settings.profileBlur}px</div>
                  </div>
                </div>

                <div className="customize-card">
                  <h3>Background Effects</h3>
                  <div className="dropdown-container">
                    <HiTv className="dropdown-icon" />
                    <select 
                      className="custom-select"
                      value={settings.backgroundEffect}
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, backgroundEffect: e.target.value }))
                      }}
                    >
                      <option value="none">None</option>
                      <option value="particles">Particles</option>
                      <option value="matrix">Matrix</option>
                      <option value="waves">Waves</option>
                      <option value="gradient">Gradient</option>
                      <option value="geometric">Geometric</option>
                    </select>
                    <HiChevronDown className="chevron-icon" />
                  </div>
                </div>

                <div className="customize-card">
                  <h3>Username Effects</h3>
                  <div className="dropdown-container">
                    <HiSparkles className="dropdown-icon" />
                    <select 
                      className="custom-select"
                      value={settings.usernameEffect}
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, usernameEffect: e.target.value }))
                      }}
                    >
                      <option value="none">Choose Username Effects</option>
                      <option value="glow">Glow</option>
                      <option value="rainbow">Rainbow</option>
                      <option value="typewriter">Typewriter</option>
                      <option value="bounce">Bounce</option>
                      <option value="fade">Fade In</option>
                    </select>
                    <HiChevronDown className="chevron-icon" />
                  </div>
                </div>

                <div className="customize-card">
                  <h3>Location</h3>
                  <div className="input-group">
                    <HiMapPin className="location-icon" />
                    <input 
                      type="text" 
                      placeholder="Add your location" 
                      className="custom-input"
                      value={settings.location}
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, location: e.target.value }))
                      }}
                    />
                  </div>
                </div>

                <div className="customize-card">
                  <h3>Glow Settings</h3>
                  <div className="glow-buttons">
                    <button 
                      className={`glow-button ${settings.glowUsername ? 'active' : ''}`}
                      onClick={() => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, glowUsername: !prev.glowUsername }))
                      }}
                    >
                      <HiUser className="glow-icon" />
                      Username
                    </button>
                    <button 
                      className={`glow-button ${settings.glowSocials ? 'active' : ''}`}
                      onClick={() => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, glowSocials: !prev.glowSocials }))
                      }}
                    >
                      <HiShare className="glow-icon" />
                      Socials
                    </button>
                    <button 
                      className={`glow-button ${settings.glowBadges ? 'active' : ''}`}
                      onClick={() => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, glowBadges: !prev.glowBadges }))
                      }}
                    >
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
                    <div className="color-swatch" style={{ background: settings.accentColor }}></div>
                    <input 
                      type="color" 
                      value={settings.accentColor} 
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, accentColor: e.target.value }))
                      }}
                      className="color-input"
                    />
                    <span className="color-code">{settings.accentColor}</span>
                    <HiPencilSquare className="edit-icon" />
                  </div>
                </div>
                
                <div className="color-card">
                  <h3>Text Color</h3>
                  <div className="color-picker">
                    <div className="color-swatch" style={{ background: settings.textColor }}></div>
                    <input 
                      type="color" 
                      value={settings.textColor} 
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, textColor: e.target.value }))
                      }}
                      className="color-input"
                    />
                    <span className="color-code">{settings.textColor}</span>
                    <HiPencilSquare className="edit-icon" />
                  </div>
                </div>
                
                <div className="color-card">
                  <h3>Background Color</h3>
                  <div className="color-picker">
                    <div className="color-swatch" style={{ background: settings.backgroundColor }}></div>
                    <input 
                      type="color" 
                      value={settings.backgroundColor} 
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))
                      }}
                      className="color-input"
                    />
                    <span className="color-code">{settings.backgroundColor}</span>
                    <HiPencilSquare className="edit-icon" />
                  </div>
                </div>
                
                <div className="color-card">
                  <h3>Icon Color</h3>
                  <div className="color-picker">
                    <div className="color-swatch" style={{ background: settings.iconColor }}></div>
                    <input 
                      type="color" 
                      value={settings.iconColor} 
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, iconColor: e.target.value }))
                      }}
                      className="color-input"
                    />
                    <span className="color-code">{settings.iconColor}</span>
                    <HiPencilSquare className="edit-icon" />
                  </div>
                </div>
              </div>
              
              <div className="color-grid">
                <div className="color-card">
                  <h3>Primary Color</h3>
                  <div className="color-picker">
                    <div className="color-swatch" style={{ background: settings.primaryColor }}></div>
                    <input 
                      type="color" 
                      value={settings.primaryColor} 
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, primaryColor: e.target.value }))
                      }}
                      className="color-input"
                    />
                    <span className="color-code">{settings.primaryColor}</span>
                    <HiPencilSquare className="edit-icon" />
                  </div>
                </div>
                
                <div className="color-card">
                  <h3>Secondary Color</h3>
                  <div className="color-picker">
                    <div className="color-swatch" style={{ background: settings.secondaryColor }}></div>
                    <input 
                      type="color" 
                      value={settings.secondaryColor} 
                      onChange={(e) => {
                        // Update settings locally without triggering side effects
                        setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))
                      }}
                      className="color-input"
                    />
                    <span className="color-code">{settings.secondaryColor}</span>
                    <HiPencilSquare className="edit-icon" />
                  </div>
                </div>
              </div>
              
              <button 
                className={`gradient-button ${settings.profileGradient ? 'active' : ''}`}
                onClick={() => {
                  // Update settings locally without triggering side effects
                  setSettings(prev => ({ ...prev, profileGradient: !prev.profileGradient }))
                }}
              >
                {settings.profileGradient ? 'Disable' : 'Enable'} Profile Gradient
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
                  <div 
                    className={`toggle-switch ${settings.monochromeIcons ? 'active' : ''}`}
                    onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, monochromeIcons: !prev.monochromeIcons }))
                  }}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                
                <div className="toggle-card">
                  <h3>Animated Title</h3>
                  <div 
                    className={`toggle-switch ${settings.animatedTitle ? 'active' : ''}`}
                    onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, animatedTitle: !prev.animatedTitle }))
                  }}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                
                <div className="toggle-card">
                  <div className="toggle-header">
                    <h3>Swap Box Colors</h3>
                    <HiQuestionMarkCircle className="info-icon" />
                  </div>
                  <div 
                    className={`toggle-switch ${settings.swapBoxColors ? 'active' : ''}`}
                    onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, swapBoxColors: !prev.swapBoxColors }))
                  }}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                
                <div className="toggle-card">
                  <h3>Volume Control</h3>
                  <div 
                    className={`toggle-switch ${settings.volumeControl ? 'active' : ''}`}
                    onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, volumeControl: !prev.volumeControl }))
                  }}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                
                <div className="toggle-card">
                  <h3>Use Discord Avatar</h3>
                  <div 
                    className={`toggle-switch ${settings.useDiscordAvatar ? 'active' : ''}`}
                    onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, useDiscordAvatar: !prev.useDiscordAvatar }))
                  }}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                
                <div className="toggle-card">
                  <h3>Discord Avatar Decoration</h3>
                  <div 
                    className={`toggle-switch ${settings.discordAvatarDecoration ? 'active' : ''}`}
                    onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, discordAvatarDecoration: !prev.discordAvatarDecoration }))
                  }}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                
                <div className="toggle-card">
                  <h3>Discord Presence</h3>
                  <div 
                    className={`toggle-switch ${settings.discordPresence ? 'active' : ''}`}
                    onClick={() => {
                      // Update settings locally without triggering side effects
                      setSettings(prev => ({ ...prev, discordPresence: !prev.discordPresence }))
                    }}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                
                <div className="toggle-card">
                  <h3>Show Badges</h3>
                  <div 
                    className={`toggle-switch ${settings.showBadges ? 'active' : ''}`}
                    onClick={() => {
                    // Update settings locally without triggering side effects
                    setSettings(prev => ({ ...prev, showBadges: !prev.showBadges }))
                  }}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Unsaved Changes Popup (only show when not in customize mode) */}
            {hasUnsavedChanges && activeSection !== 'customize' && (
              <div className="unsaved-changes-popup">
                <div className="popup-content">
                  <div className="popup-header">
                    <HiExclamationTriangle className="warning-icon" />
                    <h3>Unsaved Changes</h3>
                  </div>
                  <p>You have unsaved changes that need to be saved.</p>
                  <div className="popup-actions">
                    <button 
                      className="save-now-btn"
                      onClick={saveSettings}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Now'}
                    </button>
                    <button 
                      className="discard-btn"
                      onClick={resetSettings}
                    >
                      Discard Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Success Notification */}
            {showSaveSuccess && (
              <div className="save-notification success">
                <HiCheckCircle className="notification-icon" />
                <span>Settings saved successfully!</span>
              </div>
            )}

            {/* Save Error Notification */}
            {showSaveError && (
              <div className="save-notification error">
                <HiXCircle className="notification-icon" />
                <span>Failed to save settings: {saveErrorMessage}</span>
              </div>
            )}
          </>
        )}

        {activeSection === 'links' && (
          <div className="section-content">
            <h1>Links Management</h1>
            <p>Create, edit, and organize your social links and external profiles.</p>
            
            {/* Add New Link Button */}
            <div className="links-header">
              <button className="add-link-btn" onClick={handleAddLink}>
                <HiPlus className="add-icon" />
                Add New Link
              </button>
              <div className="links-stats">
                <span className="stat-item">
                  <HiLink className="stat-icon" />
                  {userLinks.length} Links
                </span>
                <span className="stat-item">
                  <HiEye className="stat-icon" />
                  {userLinks.reduce((total, link) => total + (link.clicks || 0), 0)} Total Clicks
                </span>
              </div>
            </div>

            {/* Links List */}
            <div className="links-container">
              {userLinks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <HiLink />
                  </div>
                  <h3>No links yet</h3>
                  <p>Create your first link to get started with your profile.</p>
                  <button className="primary-btn" onClick={handleAddLink}>
                    <HiPlus />
                    Create First Link
                  </button>
                </div>
              ) : (
                <div className="links-grid">
                  {userLinks.map((link, index) => (
                    <div key={link.id || index} className="link-card">
                      <div className="link-header">
                        <div className="link-info">
                          <div className="link-icon" style={{ background: link.color || '#58A4B0' }}>
                            {link.icon ? (
                              <img src={link.icon} alt="" className="icon-img" />
                            ) : (
                              <HiLink className="default-icon" />
                            )}
                          </div>
                          <div className="link-details">
                            <h4 className="link-title">{link.title || 'Untitled Link'}</h4>
                            <p className="link-url">{link.url || 'No URL'}</p>
                          </div>
                        </div>
                        <div className="link-actions">
                          <button className="action-btn" onClick={() => handleEditLink(link)}>
                            <HiPencilSquare />
                          </button>
                          <button className="action-btn" onClick={() => handleDeleteLink(link.id)}>
                            <HiTrash />
                          </button>
                          <button className="action-btn drag-handle">
                            <HiViewfinderCircle />
                          </button>
                        </div>
                      </div>

                      <div className="link-body">
                        {link.description && (
                          <p className="link-description">{link.description}</p>
                        )}
                        <div className="link-meta">
                          <span className="link-type">
                            {link.type === 'HEADER' && 'Header'}
                            {link.type === 'PRODUCT' && 'Product'}
                            {link.type === 'SERVICE' && 'Service'}
                            {link.type === 'MARKETPLACE' && 'Marketplace'}
                            {(!link.type || link.type === 'DEFAULT') && 'Default'}
                          </span>
                          <span className="link-clicks">
                            <HiEye className="click-icon" />
                            {link.clicks || 0} clicks
                          </span>
                          <span className={`link-status ${link.isActive ? 'active' : 'inactive'}`}>
                            {link.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="link-footer">
                        <div className="link-toggle">
                          <span className="toggle-label">Visible</span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={link.isActive || false}
                              onChange={() => handleToggleLink(link.id)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                        <button className="preview-btn" onClick={() => handlePreviewLink(link)}>
                          <HiEye />
                          Preview
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Link Modal */}
            {showLinkModal && (
              <div className="modal-overlay" onClick={handleCloseModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{editingLink ? 'Edit Link' : 'Add New Link'}</h3>
                    <button className="close-btn" onClick={handleCloseModal}>
                      <HiXMark />
                    </button>
                  </div>

                  <div className="modal-body">
                    <div className="form-group">
                      <label>Link Title</label>
                      <input
                        type="text"
                        placeholder="Enter link title"
                        value={currentLink.title || ''}
                        onChange={(e) => setCurrentLink(prev => ({ ...prev, title: e.target.value }))}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>URL</label>
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={currentLink.url || ''}
                        onChange={(e) => setCurrentLink(prev => ({ ...prev, url: e.target.value }))}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Description (Optional)</label>
                      <textarea
                        placeholder="Brief description of this link"
                        value={currentLink.description || ''}
                        onChange={(e) => setCurrentLink(prev => ({ ...prev, description: e.target.value }))}
                        className="form-textarea"
                        rows="3"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Link Type</label>
                        <div className="select-wrapper">
                          <select
                            value={currentLink.type || 'DEFAULT'}
                            onChange={(e) => setCurrentLink(prev => ({ ...prev, type: e.target.value }))}
                            className="form-select"
                          >
                            <option value="DEFAULT">Default</option>
                            <option value="HEADER">Header</option>
                            <option value="PRODUCT">Product</option>
                            <option value="SERVICE">Service</option>
                            <option value="MARKETPLACE">Marketplace</option>
                          </select>
                          <HiChevronDown className="select-arrow" />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Color</label>
                        <div className="color-picker-group">
                          <div
                            className="color-preview"
                            style={{ background: currentLink.color || '#58A4B0' }}
                          ></div>
                          <input
                            type="color"
                            value={currentLink.color || '#58A4B0'}
                            onChange={(e) => setCurrentLink(prev => ({ ...prev, color: e.target.value }))}
                            className="color-input"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Icon URL (Optional)</label>
                      <input
                        type="url"
                        placeholder="https://example.com/icon.png"
                        value={currentLink.icon || ''}
                        onChange={(e) => setCurrentLink(prev => ({ ...prev, icon: e.target.value }))}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={currentLink.isActive !== false}
                          onChange={(e) => setCurrentLink(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="checkbox-input"
                        />
                        <span className="checkbox-custom"></span>
                        Make this link visible on profile
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button className="secondary-btn" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button className="primary-btn" onClick={handleSaveLink}>
                      {editingLink ? 'Update Link' : 'Create Link'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'premium' && (
          <div className="section-content">
            <h1>Premium Plans</h1>
            <p>Upgrade to premium for exclusive features and customization options.</p>
            {/* Premium content will be implemented here */}
          </div>
        )}

        {activeSection === 'templates' && (
          <div className="section-content">
            <h1>Profile Templates</h1>
            <p>Choose from our collection of professionally designed templates.</p>
            {/* Templates content will be implemented here */}
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

  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 15;
    backdrop-filter: blur(4px);
    
    @media (min-width: 769px) {
      display: none;
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
`

const Sidebar = styled.div`
  width: 260px;
  height: 100vh;
  background: linear-gradient(145deg, rgba(15, 15, 25, 0.98), rgba(25, 25, 35, 0.95));
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(88, 164, 176, 0.15);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(88, 164, 176, 0.3) transparent;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(88, 164, 176, 0.3);
    border-radius: 3px;
    
    &:hover {
      background: rgba(88, 164, 176, 0.5);
    }
  }
  
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
  
  @media (max-width: 768px) {
    transform: translateX(-100%);
    z-index: 20;
    
    &.mobile-open {
      transform: translateX(0);
    }
    
    &.collapsed {
      width: 260px;
      transform: translateX(-100%);
      
      &.mobile-open {
        transform: translateX(0);
      }
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
        text-decoration: none;
        color: inherit;
        display: block;
        
        &:visited, &:hover, &:focus, &:active {
          text-decoration: none;
          color: inherit;
        }
        
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
  margin-left: 260px;
  padding: 2rem;
  overflow-y: auto;
  position: relative;
  z-index: 5;
  min-height: 100vh;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.sidebar-collapsed {
    margin-left: 64px;
  }
  
  @media (max-width: 768px) {
    margin-left: 0;
    
    &.sidebar-collapsed {
      margin-left: 0;
    }
  }
  
  .mobile-menu-toggle {
    display: none;
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 15;
    width: 48px;
    height: 48px;
    background: linear-gradient(145deg, rgba(15, 15, 25, 0.95), rgba(25, 25, 35, 0.9));
    backdrop-filter: blur(20px);
    border: 1px solid rgba(88, 164, 176, 0.2);
    border-radius: 12px;
    color: #58A4B0;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    
    &:hover {
      background: linear-gradient(145deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1));
      transform: scale(1.05);
    }
    
    svg {
      font-size: 1.5rem;
    }
    
    @media (max-width: 768px) {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
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
  
  /* Header Content Styles */
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
  }
  
  .new-customization-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
    border: none;
    border-radius: 12px;
    color: #ffffff;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
    
    &:hover {
      background: linear-gradient(135deg, #FF5252, #26C6DA);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
    }
    
    &:active {
      transform: translateY(0);
    }
    
    .btn-icon {
      font-size: 1.1rem;
      animation: sparkle 2s ease-in-out infinite;
    }
    
    @keyframes sparkle {
      0%, 100% { 
        transform: scale(1) rotate(0deg);
        opacity: 1;
      }
      50% { 
        transform: scale(1.1) rotate(180deg);
        opacity: 0.8;
      }
    }
    
    @media (max-width: 768px) {
      width: 100%;
      justify-content: center;
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

    .links-header {
      flex-direction: column;
      gap: 1rem;
      
      .links-stats {
        justify-content: center;
        gap: 1rem;
      }
    }

    .links-grid {
      grid-template-columns: 1fr;
    }

    .link-card {
      .link-header {
        flex-direction: column;
        gap: 1rem;
        
        .link-info {
          .link-details {
            .link-url {
              word-break: break-all;
            }
          }
        }
        
        .link-actions {
          justify-content: center;
        }
      }

      .link-footer {
        flex-direction: column;
        gap: 1rem;
        align-items: center;
      }
    }

    .modal-content {
      margin: 1rem;
      width: calc(100% - 2rem);
      max-height: calc(100vh - 2rem);
      
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  }

  /* Links Management Styles */
  .links-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
    border: 1px solid rgba(88, 164, 176, 0.15);
    border-radius: 12px;
    backdrop-filter: blur(10px);

    .add-link-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #58A4B0, #4a8a94);
      border: none;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(88, 164, 176, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(88, 164, 176, 0.4);
        background: linear-gradient(135deg, #4a8a94, #3c7278);
      }

      .add-icon {
        font-size: 1.1rem;
      }
    }

    .links-stats {
      display: flex;
      gap: 2rem;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #a0a0a0;
        font-size: 0.9rem;

        .stat-icon {
          color: #58A4B0;
          font-size: 1.1rem;
        }
      }
    }
  }

  .links-container {
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
      border: 2px dashed rgba(88, 164, 176, 0.2);
      border-radius: 16px;

      .empty-icon {
        font-size: 3rem;
        color: #58A4B0;
        margin-bottom: 1rem;
      }

      h3 {
        color: #ffffff;
        margin-bottom: 0.5rem;
        font-size: 1.5rem;
      }

      p {
        color: #a0a0a0;
        margin-bottom: 2rem;
        font-size: 1rem;
      }

      .primary-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #58A4B0, #4a8a94);
        border: none;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(88, 164, 176, 0.4);
        }
      }
    }

    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .link-card {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        border-color: rgba(88, 164, 176, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      }

      .link-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;

        .link-info {
          display: flex;
          align-items: center;
          gap: 1rem;

          .link-icon {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;

            .icon-img {
              width: 24px;
              height: 24px;
              border-radius: 4px;
            }

            .default-icon {
              color: white;
              font-size: 1.5rem;
            }
          }

          .link-details {
            .link-title {
              color: #ffffff;
              font-size: 1.1rem;
              font-weight: 600;
              margin-bottom: 0.25rem;
              word-break: break-word;
            }

            .link-url {
              color: #58A4B0;
              font-size: 0.9rem;
              text-decoration: none;
              word-break: break-all;

              &:hover {
                text-decoration: underline;
              }
            }
          }
        }

        .link-actions {
          display: flex;
          gap: 0.5rem;

          .action-btn {
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.1);
            color: #a0a0a0;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;

            &:hover {
              background: rgba(88, 164, 176, 0.2);
              color: #58A4B0;
            }
          }
        }
      }

      .link-body {
        margin-bottom: 1rem;

        .link-description {
          color: #c0c0c0;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .link-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;

          .link-type {
            padding: 0.25rem 0.5rem;
            background: rgba(88, 164, 176, 0.2);
            color: #58A4B0;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
          }

          .link-clicks {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            color: #a0a0a0;
            font-size: 0.8rem;

            .click-icon {
              font-size: 0.9rem;
            }
          }

          .link-status {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;

            &.active {
              background: rgba(34, 197, 94, 0.2);
              color: #22c55e;
            }

            &.inactive {
              background: rgba(239, 68, 68, 0.2);
              color: #ef4444;
            }
          }
        }
      }

      .link-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);

        .link-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .toggle-label {
            color: #a0a0a0;
            font-size: 0.9rem;
          }

          .toggle-switch {
            position: relative;
            width: 44px;
            height: 24px;
            cursor: pointer;

            input {
              opacity: 0;
              width: 0;
              height: 0;

              &:checked + .toggle-slider {
                background: #58A4B0;

                &::before {
                  transform: translateX(20px);
                }
              }
            }

            .toggle-slider {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: #333;
              border-radius: 12px;
              transition: all 0.3s ease;

              &::before {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                transition: transform 0.3s ease;
              }
            }
          }
        }

        .preview-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: #a0a0a0;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: rgba(88, 164, 176, 0.2);
            border-color: rgba(88, 164, 176, 0.3);
            color: #58A4B0;
          }
        }
      }
    }
  }

  /* Modal Styles */
  .modal-overlay {
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
  }

  .modal-content {
    background: linear-gradient(145deg, rgba(25, 25, 35, 0.98), rgba(15, 15, 25, 0.95));
    border: 1px solid rgba(88, 164, 176, 0.2);
    border-radius: 16px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    backdrop-filter: blur(20px);

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      h3 {
        color: #ffffff;
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
      }

      .close-btn {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.1);
        color: #a0a0a0;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
      }
    }

    .modal-body {
      padding: 2rem;

      .form-group {
        margin-bottom: 1.5rem;

        label {
          display: block;
          color: #ffffff;
          font-weight: 500;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 0.9rem;
          transition: all 0.3s ease;

          &:focus {
            outline: none;
            border-color: #58A4B0;
            box-shadow: 0 0 0 3px rgba(88, 164, 176, 0.1);
          }

          &::placeholder {
            color: #666;
          }
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .select-wrapper {
          position: relative;

          .select-arrow {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: #a0a0a0;
            pointer-events: none;
          }
        }

        .color-picker-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;

          .color-preview {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            border: 2px solid rgba(255, 255, 255, 0.2);
          }

          .color-input {
            width: 60px;
            height: 40px;
            border: none;
            border-radius: 8px;
            cursor: pointer;

            &::-webkit-color-swatch {
              border: none;
              border-radius: 6px;
            }

            &::-webkit-color-swatch-wrapper {
              padding: 0;
              border: none;
              border-radius: 6px;
            }
          }
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          margin-bottom: 0;

          .checkbox-input {
            display: none;

            &:checked + .checkbox-custom {
              background: #58A4B0;
              border-color: #58A4B0;

              &::after {
                opacity: 1;
              }
            }
          }

          .checkbox-custom {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            background: transparent;
            position: relative;
            transition: all 0.3s ease;

            &::after {
              content: '✓';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: white;
              font-size: 12px;
              opacity: 0;
              transition: opacity 0.3s ease;
            }
          }
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);

      .secondary-btn,
      .primary-btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .secondary-btn {
        background: rgba(255, 255, 255, 0.1);
        color: #a0a0a0;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }
      }

      .primary-btn {
        background: linear-gradient(135deg, #58A4B0, #4a8a94);
        color: white;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(88, 164, 176, 0.3);
        }
      }
    }
  }
`

export default Dashboard