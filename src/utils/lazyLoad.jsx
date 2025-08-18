import React, { Suspense } from 'react'
import LazyLoadFallback, { 
  DashboardFallback, 
  ProfileFallback, 
  AuthFallback 
} from '../components/ui/LazyLoadFallback'
import { ComponentErrorBoundary } from '../components/error/ErrorBoundary'
import logger from './logger'
import { trackedImport } from './bundleAnalyzer'

// Enhanced lazy loading with retry functionality and bundle tracking
export const lazyLoad = (importFunc, fallbackComponent = LazyLoadFallback, chunkName = 'unknown') => {
  const LazyComponent = React.lazy(() => 
    trackedImport(importFunc, chunkName).catch(error => {
      logger.error('Code splitting - Failed to load component', error)
      
      // Retry logic for network failures
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          trackedImport(importFunc, `${chunkName}-retry`)
            .then(resolve)
            .catch(retryError => {
              logger.error('Code splitting - Retry failed', retryError)
              reject(retryError)
            })
        }, 1000) // Retry after 1 second
      })
    })
  )

  return (props) => (
    <ComponentErrorBoundary name="lazy-component">
      <Suspense fallback={React.createElement(fallbackComponent)}>
        <LazyComponent {...props} />
      </Suspense>
    </ComponentErrorBoundary>
  )
}

// Preload function for components with tracking
export const preloadComponent = (importFunc, chunkName = 'preload') => {
  const componentImport = trackedImport(importFunc, chunkName)
  
  // Log preload for monitoring
  logger.info(`Preloading component: ${chunkName}`)
  
  return componentImport
}

// Route-specific lazy loaders
export const lazyLoadRoute = (importFunc, fallbackType = 'default', chunkName = 'route') => {
  const fallbackComponents = {
    dashboard: DashboardFallback,
    profile: ProfileFallback,
    auth: AuthFallback,
    default: LazyLoadFallback
  }

  return lazyLoad(importFunc, fallbackComponents[fallbackType], chunkName)
}

// Utility to create lazy routes with preloading
export const createLazyRoute = (importFunc, options = {}) => {
  const {
    fallbackType = 'default',
    preload = false,
    chunkName = 'unknown'
  } = options

  // Add webpack magic comment for chunk naming
  const enhancedImportFunc = () => 
    importFunc().then(module => {
      logger.info(`Code splitting - Loaded chunk: ${chunkName}`)
      return module
    })

  const LazyComponent = lazyLoadRoute(enhancedImportFunc, fallbackType, chunkName)

  // Preload if requested
  if (preload) {
    // Preload after a short delay to avoid blocking initial render
    setTimeout(() => {
      preloadComponent(importFunc, chunkName)
    }, 100)
  }

  return LazyComponent
}

// Hook for programmatic preloading
export const usePreloadRoute = () => {
  const preloadRoute = React.useCallback((importFunc, chunkName = 'manual-preload') => {
    preloadComponent(importFunc, chunkName)
  }, [])

  return preloadRoute
}

// Component for prefetching routes on hover/focus
export const PrefetchLink = ({ 
  children, 
  importFunc, 
  onMouseEnter, 
  onFocus,
  prefetchDelay = 200,
  ...props 
}) => {
  const [prefetched, setPrefetched] = React.useState(false)
  const timeoutRef = React.useRef()

  const handlePrefetch = React.useCallback(() => {
    if (!prefetched) {
      timeoutRef.current = setTimeout(() => {
        preloadComponent(importFunc, `prefetch-${importFunc.name || 'unknown'}`)
        setPrefetched(true)
        logger.userAction('route_prefetched', { component: importFunc.name })
      }, prefetchDelay)
    }
  }, [prefetched, importFunc, prefetchDelay])

  const handleCancelPrefetch = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleMouseEnter = React.useCallback((e) => {
    handlePrefetch()
    if (onMouseEnter) onMouseEnter(e)
  }, [handlePrefetch, onMouseEnter])

  const handleFocus = React.useCallback((e) => {
    handlePrefetch()
    if (onFocus) onFocus(e)
  }, [handlePrefetch, onFocus])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return React.cloneElement(children, {
    ...props,
    onMouseEnter: handleMouseEnter,
    onFocus: handleFocus,
    onMouseLeave: handleCancelPrefetch
  })
}

export default lazyLoad