import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import logger from '../../utils/logger'

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
  
  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData()
  }, [])
  
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
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

      const { user: userData } = data.data

      // Map API response to expected format
      const mappedUser = {
        id: userData.id,
        username: userData.username || 'User',
        email: userData.email,
        alias: userData.alias || userData.username,
        uid: userData.uid || userData.id,
        profileViews: userData.profile_views || 0,
        profileCompletion: userData.profile_completion || 50,
        joinedDate: userData.created_at,
        isPremium: userData.is_premium || false,
        settings: userData.settings || {}
      }

      setUser(mappedUser)
      setIsLoading(false)
    } catch (error) {
      logger.error('Error fetching dashboard data:', error)
      setError(error.message)
      setIsLoading(false)
      
      if (error.message === 'No authentication found') {
        window.location.href = '/signin'
      }
    }
  }
  
  // Fetch links when links section is active
  useEffect(() => {
    if (activeSection === 'links') {
      fetchLinks()
    }
  }, [activeSection])
  
  const fetchLinks = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId')
      
      const response = await fetch('http://localhost:8080/api/links', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Session-ID': sessionId || ''
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
  }
  
  // Handle account logout
  const handleLogout = useCallback(async () => {
    try {
      const sessionId = localStorage.getItem('sessionId')
      const authToken = localStorage.getItem('authToken')
      
      if (sessionId) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'X-Session-ID': sessionId
          }
        })
      }
    } catch (error) {
      logger.error('Logout request failed:', error)
    } finally {
      localStorage.removeItem('sessionId')
      localStorage.removeItem('authToken')
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
      const sessionId = localStorage.getItem('sessionId')
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'X-Session-ID': sessionId
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
      
      const sessionId = localStorage.getItem('sessionId')
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
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
      const sessionId = localStorage.getItem('sessionId')
      const method = editingLink ? 'PUT' : 'POST'
      const url = editingLink ? `/api/links/${editingLink.id}` : '/api/links'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
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
      const sessionId = localStorage.getItem('sessionId')
      const response = await fetch('/api/upload/icon', {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId
        },
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
    fetchLinks
  }
}