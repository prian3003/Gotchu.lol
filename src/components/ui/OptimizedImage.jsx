import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

const OptimizedImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  style = {},
  priority = false,
  loading = 'lazy',
  sizes = '100vw',
  onLoad,
  onError,
  placeholder = true
}) => {
  const { colors } = useTheme()
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef(null)

  // Generate optimized URL for external images
  const optimizeImageUrl = (url, width = 800) => {
    if (url.includes('unsplash.com')) {
      // Use Unsplash's optimization parameters
      const urlObj = new URL(url)
      urlObj.searchParams.set('w', width.toString())
      urlObj.searchParams.set('q', '75') // Reduce quality for faster loading
      urlObj.searchParams.set('fm', 'webp') // Use WebP format
      urlObj.searchParams.set('fit', 'crop')
      return urlObj.toString()
    }
    if (url.includes('pexels.com')) {
      // Use Pexels optimization
      return `${url}?auto=compress&cs=tinysrgb&w=${width}&h=${height || width}`
    }
    return url
  }

  const handleLoad = (e) => {
    setIsLoaded(true)
    if (onLoad) onLoad(e)
  }

  const handleError = (e) => {
    setHasError(true)
    if (onError) onError(e)
  }

  // Preload critical images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = optimizeImageUrl(src, width)
      document.head.appendChild(link)
      
      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link)
        }
      }
    }
  }, [src, priority, width])

  const placeholderStyle = {
    backgroundColor: colors.surface,
    background: `linear-gradient(45deg, ${colors.surface}, ${colors.muted}22)`,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 10px 10px',
    width: width || '100%',
    height: height || '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.muted,
    fontSize: '14px',
    borderRadius: '8px'
  }

  if (hasError) {
    return (
      <div style={placeholderStyle} className={className}>
        Failed to load image
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Placeholder */}
      {!isLoaded && placeholder && (
        <div 
          style={placeholderStyle}
          className="absolute inset-0 animate-pulse"
        >
          Loading...
        </div>
      )}
      
      {/* Optimized Image */}
      <img
        ref={imgRef}
        src={optimizeImageUrl(src, width)}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        decoding="async"
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          ...style,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
    </div>
  )
}

export default OptimizedImage