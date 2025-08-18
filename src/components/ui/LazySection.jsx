import React, { Suspense } from 'react'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { useTheme } from '../../contexts/ThemeContext'

const LazySection = ({ 
  children, 
  fallback, 
  rootMargin = '200px',
  threshold = 0.1,
  minHeight = '200px'
}) => {
  const { colors } = useTheme()
  const [ref, isIntersecting, hasIntersected] = useIntersectionObserver({
    rootMargin,
    threshold
  })

  const defaultFallback = (
    <div style={{ 
      height: minHeight, 
      background: `linear-gradient(45deg, ${colors.surface}44, ${colors.surface}88)`,
      borderRadius: '8px',
      margin: '20px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.muted,
      fontSize: '14px',
      fontStyle: 'italic'
    }}>
      Loading section...
    </div>
  )

  return (
    <div ref={ref} style={{ minHeight }}>
      {hasIntersected ? (
        <Suspense fallback={fallback || defaultFallback}>
          {children}
        </Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  )
}

export default LazySection