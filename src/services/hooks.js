import { useState, useEffect, useCallback, useRef } from 'react'
import apiService from './apiService'

// Custom hook for API calls with loading, error, and data states
export const useAPI = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      abortControllerRef.current = new AbortController()
      
      const result = await apiCall()
      setData(result)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(apiService.utils.formatErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    fetchData()
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

// Custom hook for dashboard data
export const useDashboard = () => {
  const { data, loading, error, refetch } = useAPI(() => apiService.dashboard.getDashboard())
  
  return {
    dashboardData: data,
    loading,
    error,
    refetchDashboard: refetch
  }
}

// Custom hook for user profile data
export const useUserProfile = () => {
  const { data, loading, error, refetch } = useAPI(() => apiService.user.getProfile())
  
  return {
    user: data?.data?.user || null,
    loading,
    error,
    refetchProfile: refetch
  }
}

// Custom hook for links management
export const useLinks = () => {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.links.getLinks()
      setLinks(response.data || [])
    } catch (err) {
      setError(apiService.utils.formatErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const addLink = useCallback(async (linkData) => {
    try {
      const response = await apiService.links.createLink(linkData)
      if (response.success) {
        setLinks(prev => [...prev, response.data])
        return response.data
      }
      throw new Error(response.message || 'Failed to create link')
    } catch (err) {
      setError(apiService.utils.formatErrorMessage(err))
      throw err
    }
  }, [])

  const updateLink = useCallback(async (linkId, linkData) => {
    try {
      const response = await apiService.links.updateLink(linkId, linkData)
      if (response.success) {
        setLinks(prev => prev.map(link => 
          link.id === linkId ? response.data : link
        ))
        return response.data
      }
      throw new Error(response.message || 'Failed to update link')
    } catch (err) {
      setError(apiService.utils.formatErrorMessage(err))
      throw err
    }
  }, [])

  const deleteLink = useCallback(async (linkId) => {
    try {
      await apiService.links.deleteLink(linkId)
      setLinks(prev => prev.filter(link => link.id !== linkId))
    } catch (err) {
      setError(apiService.utils.formatErrorMessage(err))
      throw err
    }
  }, [])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  return {
    links,
    loading,
    error,
    addLink,
    updateLink,
    deleteLink,
    refetchLinks: fetchLinks
  }
}

// Custom hook for customization settings
export const useCustomization = () => {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.customization.getSettings()
      setSettings(response.data || {})
      setHasUnsavedChanges(false)
    } catch (err) {
      setError(apiService.utils.formatErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (newSettings) => {
    try {
      const response = await apiService.customization.updateSettings(newSettings)
      if (response.success) {
        setSettings(response.data)
        setHasUnsavedChanges(false)
        return response.data
      }
      throw new Error(response.message || 'Failed to update settings')
    } catch (err) {
      setError(apiService.utils.formatErrorMessage(err))
      throw err
    }
  }, [])

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }, [])

  const resetSettings = useCallback(async () => {
    try {
      const response = await apiService.customization.resetSettings()
      if (response.success) {
        setSettings(response.data || {})
        setHasUnsavedChanges(false)
        return response.data
      }
      throw new Error(response.message || 'Failed to reset settings')
    } catch (err) {
      setError(apiService.utils.formatErrorMessage(err))
      throw err
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    hasUnsavedChanges,
    updateSettings,
    updateSetting,
    resetSettings,
    refetchSettings: fetchSettings
  }
}

// Custom hook for analytics data
export const useAnalytics = (timeframe = '7d') => {
  const { data, loading, error, refetch } = useAPI(
    () => apiService.dashboard.getAnalytics(timeframe),
    [timeframe]
  )
  
  return {
    analytics: data?.data || null,
    loading,
    error,
    refetchAnalytics: refetch
  }
}

// Custom hook for file uploads
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadFile = useCallback(async (file, uploadType, onProgress) => {
    try {
      setUploading(true)
      setUploadError(null)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('file', file)

      let uploadFunction
      switch (uploadType) {
        case 'avatar':
          uploadFunction = apiService.user.uploadAvatar
          break
        case 'background':
          uploadFunction = apiService.customization.uploadBackground
          break
        case 'audio':
          uploadFunction = apiService.customization.uploadAudio
          break
        case 'cursor':
          uploadFunction = apiService.customization.uploadCursor
          break
        default:
          throw new Error('Invalid upload type')
      }

      // Simulate progress for now - in a real app you'd track actual progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = Math.min(prev + Math.random() * 30, 95)
          if (onProgress) onProgress(next)
          return next
        })
      }, 200)

      const response = await uploadFunction(formData)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      if (onProgress) onProgress(100)
      
      return response
    } catch (err) {
      setUploadError(apiService.utils.formatErrorMessage(err))
      throw err
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [])

  return {
    uploading,
    uploadError,
    uploadProgress,
    uploadFile
  }
}

// Custom hook for debouncing values
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Custom hook for local storage with JSON serialization
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

// Custom hook for intersection observer (for scroll animations)
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
      ...options
    })

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [options])

  return [targetRef, isIntersecting]
}