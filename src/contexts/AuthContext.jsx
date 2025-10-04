import React, { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/api'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Global flag to prevent multiple auth checks across all instances
let globalAuthChecking = false

// Fast auth cache - stores auth data with timestamp
const AUTH_CACHE_KEY = 'gotchu_auth_cache'
const AUTH_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache
const SESSION_CHECK_KEY = 'gotchu_session_check'

// Fast client-side auth cache
const authCache = {
  get: () => {
    try {
      const cached = localStorage.getItem(AUTH_CACHE_KEY)
      if (!cached) return null
      
      const { data, timestamp } = JSON.parse(cached)
      const isExpired = Date.now() - timestamp > AUTH_CACHE_DURATION
      
      if (isExpired) {
        localStorage.removeItem(AUTH_CACHE_KEY)
        return null
      }
      
      return data
    } catch {
      return null
    }
  },
  
  set: (authData) => {
    try {
      const cacheData = {
        data: authData,
        timestamp: Date.now()
      }
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cacheData))
    } catch {
      // Ignore localStorage errors
    }
  },
  
  clear: () => {
    localStorage.removeItem(AUTH_CACHE_KEY)
    localStorage.removeItem(SESSION_CHECK_KEY)
  }
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  // Fast authentication check with multi-layer caching
  useEffect(() => {
    let isMounted = true
    let isChecking = false

    const checkAuthStatus = async (forceRefresh = false) => {
      if (!isMounted || isChecking || globalAuthChecking) return
      isChecking = true
      globalAuthChecking = true
      
      try {
        // 🚀 LAYER 1: Check cache first (INSTANT - 0ms)
        if (!forceRefresh) {
          const cachedAuth = authCache.get()
          if (cachedAuth && isMounted) {
            setIsAuthenticated(cachedAuth.isAuthenticated)
            setUser(cachedAuth.user)
            setIsLoading(false)
            
            // Background validation - verify cache is still valid
            setTimeout(() => {
              if (isMounted) {
                checkAuthStatus(true) // Silent refresh
              }
            }, 100)
            
            isChecking = false
            globalAuthChecking = false
            return
          }
        }

        // 🔄 LAYER 2: API call only when cache is empty/expired with retry logic
        let response
        let attempts = 0
        const maxAttempts = 3
        
        while (attempts < maxAttempts) {
          try {
            response = await fetch(`${API_BASE_URL}/auth/me`, {
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
              }
            })
            
            if (response.status === 429) {
              attempts++
              if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
                continue
              }
            }
            break
          } catch (error) {
            attempts++
            if (attempts >= maxAttempts) throw error
            await new Promise(resolve => setTimeout(resolve, 500 * attempts))
          }
        }
        
        if (isMounted && response.ok) {
          const userData = await response.json()
          const authData = {
            isAuthenticated: true,
            user: userData
          }
          
          setIsAuthenticated(true)
          setUser(userData)
          
          // 💾 Cache successful auth for next reload
          authCache.set(authData)
        } else if (isMounted) {
          setIsAuthenticated(false)
          setUser(null)
          authCache.clear()
        }
      } catch (error) {
        if (isMounted) {
          setIsAuthenticated(false)
          setUser(null)
          authCache.clear()
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
        isChecking = false
        globalAuthChecking = false
      }
    }

    // 🏃‍♂️ Fast initial check
    checkAuthStatus()

    return () => {
      isMounted = false
    }
  }, [])

  const login = async (token = null, sessionId = null, userData = null) => {
    // Handle both old call signature (just userData) and new call signature (token, sessionId, userData)
    if (typeof token === 'object' && token !== null && sessionId === null && userData === null) {
      // Old signature: login(userData)
      userData = token
      token = null
      sessionId = null
    }
    
    setIsAuthenticated(true)
    setUser(userData)
    
    // Store token and session for API calls if provided
    if (token) {
      localStorage.setItem('auth_token', token)
    }
    if (sessionId) {
      localStorage.setItem('session_id', sessionId)
    }
    
    // 💾 Cache login state for fast future loads
    if (userData) {
      authCache.set({
        isAuthenticated: true,
        user: userData,
        token: token,
        sessionId: sessionId
      })
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint to clear httpOnly session cookie
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      setIsAuthenticated(false)
      setUser(null)
      
      // Clear tokens
      localStorage.removeItem('auth_token')
      localStorage.removeItem('session_id')
      
      // 🗑️ Clear all cached auth data
      authCache.clear()
    }
  }

  // Force refresh auth state (useful for manual refresh)
  const refreshAuth = async () => {
    setIsLoading(true)
    authCache.clear()
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setIsAuthenticated(true)
        setUser(userData)
        authCache.set({
          isAuthenticated: true,
          user: userData
        })
      } else {
        setIsAuthenticated(false)
        setUser(null)
        authCache.clear()
      }
    } catch (error) {
      setIsAuthenticated(false)
      setUser(null)
      authCache.clear()
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    refreshAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext