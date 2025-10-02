import { useState, useEffect, useCallback, useRef } from 'react'
import { backgroundCache } from '../utils/backgroundCache'

/**
 * Custom hook to manage profile splash screen state with smart pre-fetching
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether splash screen is enabled
 * @param {boolean} options.rememberChoice - Remember user's choice in localStorage
 * @param {string} options.storageKey - localStorage key for remembering choice
 * @param {number} options.autoHideDelay - Auto hide delay in milliseconds
 * @param {boolean} options.showOnFirstVisit - Only show on first visit
 * @param {Function} options.onDataFetch - Function to fetch user data
 * @param {string} options.username - Username for fetching
 * @param {number} options.minDisplayTime - Minimum time to show splash (for smooth UX)
 */
const useSplashScreen = ({
  enabled = true,
  rememberChoice = true,
  storageKey = 'profile_splash_dismissed',
  autoHideDelay = 0,
  showOnFirstVisit = false,
  onDataFetch = null,
  username = null,
  minDisplayTime = 1000 // Minimum 1 second for smooth UX
} = {}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isDataReady, setIsDataReady] = useState(false)
  const [error, setError] = useState(null)
  
  const startTimeRef = useRef(null)
  const dataFetchedRef = useRef(false)

  // Debug isVisible changes
  useEffect(() => {
    console.log('[useSplashScreen] isVisible changed:', isVisible)
    if (!isVisible && isInitialized) {
      console.log('[useSplashScreen] SPLASH HIDDEN - checking localStorage:', {
        storageKey,
        storedValue: localStorage.getItem(storageKey),
        rememberChoice
      })
      console.trace('[useSplashScreen] Splash hidden stack trace')
    }
  }, [isVisible])

  // Smart data pre-fetching
  const preloadData = useCallback(async () => {
    if (dataFetchedRef.current || !username || !onDataFetch) {
      return
    }

    setIsLoading(true)
    setLoadingProgress(10)
    dataFetchedRef.current = true
    startTimeRef.current = Date.now()

    try {
      // Check cache first
      const cachedData = backgroundCache.getUserData(username)
      if (cachedData) {
        setLoadingProgress(60)
        console.log('[useSplashScreen] Using cached data for:', username)
        
        // Simulate smooth loading for better UX
        setTimeout(() => {
          setLoadingProgress(100)
          setIsDataReady(true)
          setIsLoading(false)
        }, 300)
        return
      }

      // Fetch fresh data with progress updates
      console.log('[useSplashScreen] Fetching fresh data for:', username)
      setLoadingProgress(30)

      const userData = await onDataFetch(username, (progress) => {
        setLoadingProgress(30 + (progress * 0.6)) // Map 0-100% to 30-90%
      })

      setLoadingProgress(90)

      // Cache the fetched data
      if (userData) {
        backgroundCache.setUserData(username, userData)
        
        // Pre-load critical assets
        if (userData.customization?.backgroundUrl) {
          const img = new Image()
          img.onload = () => setLoadingProgress(95)
          img.src = userData.customization.backgroundUrl
        }
        
        if (userData.customization?.avatarUrl) {
          const img = new Image()
          img.onload = () => setLoadingProgress(98)
          img.src = userData.customization.avatarUrl
        }
      }

      // Ensure minimum display time for smooth UX
      const elapsed = Date.now() - (startTimeRef.current || 0)
      const remainingTime = Math.max(0, minDisplayTime - elapsed)
      
      setTimeout(() => {
        setLoadingProgress(100)
        setIsDataReady(true)
        setIsLoading(false)
      }, remainingTime)

    } catch (err) {
      console.error('[useSplashScreen] Data fetch failed:', err)
      setError(err.message || 'Failed to load profile data')
      setIsLoading(false)
      setIsDataReady(true) // Allow proceed even with error
    }
  }, [username, onDataFetch, minDisplayTime])

  // Initialize splash screen visibility
  useEffect(() => {
    // Skip if already initialized and still enabled
    if (isInitialized && enabled) {
      return
    }
    
    if (!enabled) {
      setIsVisible(false)
      setIsInitialized(true)
      return
    }

    // Check if user has previously dismissed splash for THIS SESSION
    const sessionKey = `${storageKey}_session_${Date.now().toString().slice(-6)}`
    const hasBeenDismissedInSession = sessionStorage.getItem(sessionKey) === 'true'
    const hasBeenDismissedPermanently = rememberChoice && localStorage.getItem(storageKey) === 'true'
    
    console.log('[useSplashScreen] Initialization check:', {
      enabled,
      rememberChoice, 
      storageKey,
      hasBeenDismissedInSession,
      hasBeenDismissedPermanently,
      localStorageValue: localStorage.getItem(storageKey)
    })
    
    // Check if this is first visit
    const isFirstVisit = showOnFirstVisit && !localStorage.getItem(`${storageKey}_visited`)
    
    // Determine initial visibility - ALWAYS show splash unless permanently dismissed
    let shouldShow = enabled
    
    if (showOnFirstVisit && !isFirstVisit) {
      shouldShow = false
    } else if (hasBeenDismissedPermanently && !showOnFirstVisit) {
      shouldShow = false
    }
    
    // For development/testing - always show if not permanently dismissed
    if (!hasBeenDismissedPermanently) {
      shouldShow = enabled
    }
    
    setIsVisible(shouldShow)
    setIsInitialized(true)
    
    // Mark as visited
    if (showOnFirstVisit) {
      localStorage.setItem(`${storageKey}_visited`, 'true')
    }

    // Start data pre-fetching if splash will be shown
    if (shouldShow && username && onDataFetch) {
      preloadData()
    }
  }, [enabled, rememberChoice, storageKey, showOnFirstVisit, isInitialized, username, onDataFetch, preloadData])

  // Auto hide functionality
  useEffect(() => {
    if (isVisible && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        hideSplash()
      }, autoHideDelay)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, autoHideDelay])

  const hideSplash = useCallback(() => {
    console.log('[useSplashScreen] hideSplash called - HIDING SPLASH')
    console.trace('[useSplashScreen] Hide splash stack trace')
    setIsVisible(false)
    
    // Remember user's choice
    if (rememberChoice) {
      localStorage.setItem(storageKey, 'true')
    }
  }, [rememberChoice, storageKey])

  const showSplash = useCallback(() => {
    setIsVisible(true)
    setIsLoading(false)
    setIsDataReady(false)
    setError(null)
    setLoadingProgress(0)
    dataFetchedRef.current = false
    
    // Clear remembered choice if showing manually
    if (rememberChoice) {
      localStorage.removeItem(storageKey)
    }
    
    // Restart data fetching
    if (username && onDataFetch) {
      preloadData()
    }
  }, [rememberChoice, storageKey, username, onDataFetch, preloadData])

  const resetSplash = useCallback(() => {
    if (rememberChoice) {
      localStorage.removeItem(storageKey)
      if (showOnFirstVisit) {
        localStorage.removeItem(`${storageKey}_visited`)
      }
    }
    setIsVisible(enabled)
    setIsLoading(false)
    setIsDataReady(false)
    setError(null)
    setLoadingProgress(0)
    dataFetchedRef.current = false
  }, [enabled, rememberChoice, storageKey, showOnFirstVisit])

  const toggleSplash = useCallback(() => {
    if (isVisible) {
      hideSplash()
    } else {
      showSplash()
    }
  }, [isVisible, hideSplash, showSplash])

  // Always allow hiding - splash screen should always be user-controlled
  const canHide = true

  return {
    isVisible,
    isInitialized,
    hideSplash,
    showSplash,
    resetSplash,
    toggleSplash,
    // Loading states
    isLoading,
    loadingProgress,
    isDataReady,
    error,
    canHide,
    // Utilities
    hasBeenDismissed: rememberChoice && localStorage.getItem(storageKey) === 'true',
    isFirstVisit: showOnFirstVisit && !localStorage.getItem(`${storageKey}_visited`),
    // Data fetching
    preloadData
  }
}

export default useSplashScreen