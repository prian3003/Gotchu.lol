import React, { createContext, useContext, useEffect } from 'react'
import performanceMonitor, { usePerformanceMonitor } from '../utils/performanceMonitor'
import logger from '../utils/logger'

const PerformanceContext = createContext()

export const usePerformance = () => {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider')
  }
  return context
}

const PerformanceProvider = ({ children }) => {
  const { measureRender, measureAsync, getReport, recordMetric } = usePerformanceMonitor()

  useEffect(() => {
    // Initialize performance monitoring
    logger.info('PerformanceProvider - Initializing performance monitoring')

    // Track initial page load
    recordMetric('page-load-start', {
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    })

    // Track when React app is ready
    const handleReactReady = () => {
      recordMetric('react-app-ready', {
        timestamp: Date.now(),
        timeToReady: performance.now()
      })
    }

    // Schedule after React has mounted
    setTimeout(handleReactReady, 0)

    // Add global error tracking for performance-related errors
    const handleError = (event) => {
      recordMetric('performance-error', {
        message: event.error?.message || 'Unknown error',
        stack: event.error?.stack?.substring(0, 500),
        timestamp: Date.now()
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', (event) => {
      recordMetric('performance-promise-rejection', {
        reason: event.reason?.toString().substring(0, 500) || 'Unknown rejection',
        timestamp: Date.now()
      })
    })

    // Track page visibility changes
    const handleVisibilityChange = () => {
      recordMetric('page-visibility', {
        visible: !document.hidden,
        timestamp: Date.now()
      })
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      performanceMonitor.cleanup()
    }
  }, [recordMetric])

  const value = {
    measureRender,
    measureAsync,
    getReport,
    recordMetric,
    
    // Additional utility functions
    trackUserAction: (action, data = {}) => {
      recordMetric('user-action', {
        action,
        ...data,
        timestamp: Date.now()
      })
    },
    
    trackRouteChange: (from, to) => {
      recordMetric('route-change', {
        from,
        to,
        timestamp: Date.now()
      })
    },
    
    trackComponentMount: (componentName) => {
      recordMetric('component-mount', {
        component: componentName,
        timestamp: Date.now()
      })
    },
    
    trackComponentUnmount: (componentName) => {
      recordMetric('component-unmount', {
        component: componentName,
        timestamp: Date.now()
      })
    }
  }

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  )
}

export default PerformanceProvider