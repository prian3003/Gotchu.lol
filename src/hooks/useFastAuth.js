import { useState, useEffect } from 'react'

// Ultra-fast auth hook for components that need instant auth state
export const useFastAuth = () => {
  const [authState, setAuthState] = useState(null)

  useEffect(() => {
    // Immediate check from localStorage cache
    const checkFastAuth = () => {
      try {
        const cached = localStorage.getItem('gotchu_auth_cache')
        if (!cached) return null

        const { data, timestamp } = JSON.parse(cached)
        const isExpired = Date.now() - timestamp > 5 * 60 * 1000 // 5 min

        if (isExpired) {
          localStorage.removeItem('gotchu_auth_cache')
          return null
        }

        return data
      } catch {
        return null
      }
    }

    // Set initial state immediately
    const fastAuth = checkFastAuth()
    setAuthState(fastAuth)

    // Listen for auth changes across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'gotchu_auth_cache') {
        const newAuth = checkFastAuth()
        setAuthState(newAuth)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return {
    isAuthenticated: authState?.isAuthenticated || false,
    user: authState?.user || null,
    isLoading: authState === null
  }
}

// Performance-optimized auth guard for routes
export const useAuthGuard = () => {
  const { isAuthenticated, isLoading } = useFastAuth()
  
  return {
    canAccess: isAuthenticated,
    shouldRedirect: !isLoading && !isAuthenticated,
    isChecking: isLoading
  }
}