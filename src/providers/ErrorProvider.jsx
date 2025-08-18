import React, { createContext, useContext, useState, useEffect } from 'react'
import styled from 'styled-components'
import ErrorBoundary, { AsyncErrorBoundary } from '../components/error/ErrorBoundary'
import logger from '../utils/logger'

// Error context for global error state
const ErrorContext = createContext()

// Error provider that handles global error state
export const ErrorProvider = ({ children }) => {
  const [globalError, setGlobalError] = useState(null)
  const [networkError, setNetworkError] = useState(false)

  // Handle global errors
  const handleGlobalError = (error, context = {}) => {
    logger.error('Global error handled', error, context)
    setGlobalError({ error, context, timestamp: Date.now() })
  }

  // Clear global error
  const clearGlobalError = () => {
    setGlobalError(null)
  }

  // Handle network errors
  const handleNetworkError = (isOffline) => {
    setNetworkError(isOffline)
    if (isOffline) {
      logger.error('Network error - application is offline', new Error('Network unavailable'))
    } else {
      logger.info('Network restored - application is back online')
    }
  }

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => handleNetworkError(false)
    const handleOffline = () => handleNetworkError(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial network status
    handleNetworkError(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Handle unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      event.preventDefault() // Prevent default browser error handling
      
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(event.reason || 'Unhandled promise rejection')
      
      handleGlobalError(error, { 
        type: 'unhandled_promise_rejection',
        promise: event.promise 
      })
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Handle global JavaScript errors
  useEffect(() => {
    const handleGlobalJSError = (event) => {
      const error = new Error(event.message || 'Global JavaScript error')
      error.filename = event.filename
      error.lineno = event.lineno
      error.colno = event.colno
      error.stack = event.error?.stack

      handleGlobalError(error, {
        type: 'global_js_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    }

    window.addEventListener('error', handleGlobalJSError)

    return () => {
      window.removeEventListener('error', handleGlobalJSError)
    }
  }, [])

  const value = {
    globalError,
    networkError,
    handleGlobalError,
    clearGlobalError,
    handleNetworkError
  }

  return (
    <ErrorContext.Provider value={value}>
      <AsyncErrorBoundary
        name="app-root"
        title="Application Error"
        message="The application encountered an unexpected error. Please refresh the page to continue."
      >
        {children}
      </AsyncErrorBoundary>
    </ErrorContext.Provider>
  )
}

// Hook to use error context
export const useError = () => {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

// Higher-order component to wrap components with error boundaries
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary
      name={Component.displayName || Component.name || 'Unknown'}
      {...errorBoundaryProps}
    >
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`
  
  return WrappedComponent
}

// Hook for handling async errors in components
export const useAsyncError = () => {
  const { handleGlobalError } = useError()

  const throwError = (error) => {
    handleGlobalError(error, { type: 'async_component_error' })
  }

  return throwError
}

// Network status component
export const NetworkStatus = () => {
  const { networkError } = useError()

  if (!networkError) return null

  return (
    <NetworkStatusBanner>
      <NetworkStatusText>
        ⚠️ You're currently offline. Some features may not be available.
      </NetworkStatusText>
    </NetworkStatusBanner>
  )
}

// Styled components for network status
const NetworkStatusBanner = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(145deg, #f59e0b, #d97706);
  color: #ffffff;
  padding: 0.75rem;
  text-align: center;
  z-index: 10001;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

const NetworkStatusText = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`

export default ErrorProvider