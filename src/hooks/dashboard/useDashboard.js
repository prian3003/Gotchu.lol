import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import logger from '../../utils/logger'
import { API_BASE_URL } from '../../config/api'

// Global flag to prevent multiple concurrent dashboard fetches
let globalDashboardFetching = false

export const useDashboard = (defaultSection = 'profile') => {
  const { logout } = useAuth()
  
  // UI State
  const [activeSection, setActiveSection] = useState(defaultSection)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Links Management State
  const [userLinks, setUserLinks] = useState([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [currentLink, setCurrentLink] = useState({
    title: '',
    url: '',
    description: '',
    type: 'DEFAULT',
    color: '#58A4B0',
    icon: null,
    isActive: true
  })
  
  // User State
  const [user, setUser] = useState(null)
  
  // Loading and Error States
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Refs
  const mountedRef = useRef(true)
  
  // Set default section on mount
  useEffect(() => {
    setActiveSection(defaultSection)
  }, [defaultSection])
  
  // Define fetchLinks with useCallback to avoid dependency issues
  const fetchLinks = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/links`, {
        credentials: 'include', // Use httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success && data.data) {
        // Handle both null and array cases
        const links = data.data.links || []
        setUserLinks(links)
      } else {
        setUserLinks([]) // Ensure empty array is set
        logger.error('Failed to fetch links:', data.message)
      }
    } catch (error) {
      logger.error('Error fetching links:', error)
    }
  }, [])

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData()
    fetchLinks() // Also fetch links on mount for profile completion
  }, [fetchLinks])
  
  const fetchDashboardData = async () => {
    if (globalDashboardFetching) return // Prevent multiple concurrent calls
    
    try {
      globalDashboardFetching = true
      setIsLoading(true)
      setError(null)

      // Fetch real dashboard data from backend API using cookies
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        method: 'GET',
        credentials: 'include', // Use httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login for unauthorized access
          logout()
          return
        }
        throw new Error('Failed to load dashboard data')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load dashboard data')
      }

      const { user: userData } = data.data
      
      // Debug: Log the raw user data from backend

      // Map API response to expected format
      const mappedUser = {
        id: userData.id,
        username: userData.username || 'User',
        email: userData.email,
        displayName: userData.display_name,
        bio: userData.bio,
        alias: userData.alias,
        avatarUrl: userData.avatar_url,
        avatar_url: userData.avatar_url,
        uid: userData.uid || userData.id,
        profileViews: userData.profile_views || 0,
        profileCompletion: userData.profile_completion || 50,
        joinedDate: userData.created_at,
        isPremium: userData.is_premium || false,
        plan: userData.plan || 'free',
        mfaEnabled: userData.mfa_enabled || false,
        twoFactorEnabled: userData.mfa_enabled || false,
        settings: userData.settings || {},
        // Discord data
        discord: {
          connected: !!userData.discord_id,
          discord_id: userData.discord_id,
          discord_username: userData.discord_username,
          discord_avatar: userData.discord_avatar,
          avatar_url: userData.discord_id && userData.discord_avatar ? 
            `https://cdn.discordapp.com/avatars/${userData.discord_id}/${userData.discord_avatar}.png?size=128` : 
            userData.discord_id ? `https://cdn.discordapp.com/embed/avatars/${(parseInt(userData.discord_id) % 5)}.png` : null,
          is_booster: userData.is_booster || false,
          boosting_since: userData.boosting_since || null,
          presence: userData.discord_presence || null
        }
      }

      setUser(mappedUser)
      setIsLoading(false)
    } catch (error) {
      logger.error('Error fetching dashboard data:', error)
      setError(error.message)
      setIsLoading(false)
      
      if (error.message === 'No authentication found') {
        logout()
      }
    } finally {
      globalDashboardFetching = false
    }
  }
  
  // Fetch links when links section is active
  useEffect(() => {
    if (activeSection === 'links') {
      fetchLinks()
    }
  }, [activeSection, fetchLinks])
  
  // Handle account logout
  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      logger.error('Logout request failed:', error)
    } finally {
      logout()
    }
  }, [logout])
  
  // Link management functions
  const handleAddLink = useCallback(() => {
    setEditingLink(null)
    setCurrentLink({
      title: '',
      url: '',
      description: '',
      type: 'DEFAULT',
      color: '#58A4B0',
      icon: null,
      isActive: true
    })
    setShowLinkModal(true)
  }, [])
  
  const handleEditLink = useCallback((link) => {
    setEditingLink(link)
    setCurrentLink({ ...link })
    setShowLinkModal(true)
  }, [])
  
  const handleDeleteLink = useCallback(async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/links/${linkId}`, {
        method: 'DELETE',
        credentials: 'include', // Use httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setUserLinks(prev => prev.filter(link => link.id !== linkId))
        logger.info('Link deleted successfully')
      } else {
        logger.error('Failed to delete link:', data.message)
      }
    } catch (error) {
      logger.error('Error deleting link:', error)
    }
  }, [])
  
  const handleToggleLink = useCallback(async (linkId) => {
    try {
      const link = userLinks.find(l => l.id === linkId)
      if (!link) return
      
      const response = await fetch(`${API_BASE_URL}/links/${linkId}`, {
        method: 'PUT',
        credentials: 'include', // Use httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...link,
          isActive: !link.isActive
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setUserLinks(prev => prev.map(l => 
          l.id === linkId ? { ...l, isActive: !l.isActive } : l
        ))
      } else {
        logger.error('Failed to toggle link:', data.message)
      }
    } catch (error) {
      logger.error('Error toggling link:', error)
    }
  }, [userLinks])
  
  const handleSaveLink = useCallback(async () => {
    if (!currentLink.title || !currentLink.url) {
      alert('Please fill in all required fields')
      return
    }
    
    try {
      const method = editingLink ? 'PUT' : 'POST'
      const url = editingLink ? `${API_BASE_URL}/links/${editingLink.id}` : `${API_BASE_URL}/links`
      
      const response = await fetch(url, {
        method,
        credentials: 'include', // Use httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentLink)
      })
      
      const data = await response.json()
      if (data.success) {
        if (editingLink) {
          setUserLinks(prev => prev.map(link => 
            link.id === editingLink.id ? data.data.link : link
          ))
        } else {
          setUserLinks(prev => [...prev, data.data.link])
        }
        setShowLinkModal(false)
        setEditingLink(null)
        logger.info(`Link ${editingLink ? 'updated' : 'created'} successfully`)
      } else {
        logger.error(`Failed to ${editingLink ? 'update' : 'create'} link:`, data.message)
      }
    } catch (error) {
      logger.error(`Error ${editingLink ? 'updating' : 'creating'} link:`, error)
    }
  }, [currentLink, editingLink])
  
  const handleCloseModal = useCallback(() => {
    setShowLinkModal(false)
    setEditingLink(null)
    setCurrentLink({
      title: '',
      url: '',
      description: '',
      type: 'DEFAULT',
      color: '#58A4B0',
      icon: null,
      isActive: true
    })
  }, [])
  
  const handleIconUpload = useCallback(async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch(`${API_BASE_URL}/upload/icon`, {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookies for auth
        body: formData
      })
      
      const data = await response.json()
      if (data.success) {
        setCurrentLink(prev => ({ ...prev, icon: data.url }))
      } else {
        logger.error('Failed to upload icon:', data.message)
      }
    } catch (error) {
      logger.error('Error uploading icon:', error)
    }
  }, [])
  
  const handlePreviewLink = useCallback((link) => {
    window.open(link.url, '_blank')
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])
  
  return {
    // State
    user,
    setUser,
    activeSection,
    setActiveSection,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    accountDropdownOpen,
    setAccountDropdownOpen,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    userLinks,
    setUserLinks,
    showLinkModal,
    setShowLinkModal,
    editingLink,
    setEditingLink,
    currentLink,
    setCurrentLink,
    isLoading,
    setIsLoading,
    error,
    setError,
    
    // Actions
    handleLogout,
    handleAddLink,
    handleEditLink,
    handleDeleteLink,
    handleToggleLink,
    handleSaveLink,
    handleCloseModal,
    handleIconUpload,
    handlePreviewLink,
    fetchLinks,
    fetchDashboardData
  }
}