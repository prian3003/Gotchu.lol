import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  // Check authentication status on mount and whenever storage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const authToken = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId')
      
      const isAuth = !!(authToken && sessionId)
      setIsAuthenticated(isAuth)
      setIsLoading(false)
    }

    // Initial check
    checkAuthStatus()

    // Listen for storage changes (for cross-tab authentication sync)
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'sessionId') {
        checkAuthStatus()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events (for same-tab authentication changes)
    const handleAuthChange = () => {
      checkAuthStatus()
    }

    window.addEventListener('authChange', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authChange', handleAuthChange)
    }
  }, [])

  const login = (token, sessionId, userData = null) => {
    localStorage.setItem('authToken', token)
    localStorage.setItem('sessionId', sessionId)
    setIsAuthenticated(true)
    setUser(userData)
    
    // Dispatch custom event for same-tab sync
    window.dispatchEvent(new Event('authChange'))
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('sessionId')
    setIsAuthenticated(false)
    setUser(null)
    
    // Dispatch custom event for same-tab sync
    window.dispatchEvent(new Event('authChange'))
  }

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext