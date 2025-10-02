import React, { memo, useMemo } from 'react'
import * as SimpleIcons from 'simple-icons'

// Cache for processed icon data
const iconCache = new Map()

// Helper function to get Simple Icon SVG and color with caching
export const getSimpleIconData = (iconName) => {
  // Check cache first
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName)
  }
  
  try {
    // Convert icon name to Simple Icons format (camelCase with 'si' prefix)
    const iconKey = `si${iconName.charAt(0).toUpperCase()}${iconName.slice(1).replace(/[-_.]/g, '')}`
    const icon = SimpleIcons[iconKey]
    if (icon) {
      const iconData = {
        svg: icon.svg,
        hex: `#${icon.hex}`,
        title: icon.title
      }
      // Cache the result
      iconCache.set(iconName, iconData)
      return iconData
    }
  } catch (error) {
    // Cache null results too to avoid repeated failed lookups
    iconCache.set(iconName, null)
  }
  return null
}

// Cache for processed SVG strings
const svgCache = new Map()

// Component to render Simple Icon with brand colors - Memoized for performance
export const SimpleIconComponent = memo(({ iconName, customColor, size = 24, useWhite = false }) => {
  const processedSvg = useMemo(() => {
    const cacheKey = `${iconName}-${customColor}-${size}-${useWhite}`
    
    // Check SVG cache first
    if (svgCache.has(cacheKey)) {
      return svgCache.get(cacheKey)
    }
    
    const iconData = getSimpleIconData(iconName)
    if (!iconData) {
      const fallback = { svg: null, color: '#ffffff' }
      svgCache.set(cacheKey, fallback)
      return fallback
    }

    // Use custom color, brand color, or white based on useWhite prop
    const color = customColor || (useWhite ? '#ffffff' : iconData.hex)
    
    // Pre-process SVG string
    const processedSvgString = iconData.svg.replace('<svg', `<svg fill="${color}" width="${size}" height="${size}"`)
    
    const result = { svg: processedSvgString, color }
    svgCache.set(cacheKey, result)
    return result
  }, [iconName, customColor, size, useWhite])

  if (!processedSvg.svg) {
    return <span style={{ fontSize: `${size}px`, color: '#ffffff' }}>🔗</span>
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      dangerouslySetInnerHTML={{ __html: processedSvg.svg }}
    />
  )
})

// Popular icon name mappings for easier use
export const iconNameMappings = {
  'twitter': 'x',
  'instagram': 'instagram',
  'facebook': 'facebook',
  'youtube': 'youtube',
  'tiktok': 'tiktok',
  'discord': 'discord',
  'spotify': 'spotify',
  'github': 'github',
  'linkedin': 'linkedin',
  'reddit': 'reddit',
  'twitch': 'twitch',
  'snapchat': 'snapchat',
  'telegram': 'telegram',
  'whatsapp': 'whatsapp',
  'email': 'gmail',
  'website': 'link',
  'link': 'link'
}

// Preload common icons for better performance
const preloadCommonIcons = () => {
  const commonIcons = Object.values(iconNameMappings)
  commonIcons.forEach(iconName => {
    // Pre-cache common icons
    getSimpleIconData(iconName)
  })
}

// Initialize preloading when module loads
if (typeof window !== 'undefined') {
  // Use requestIdleCallback for better performance, fallback to setTimeout
  if (window.requestIdleCallback) {
    window.requestIdleCallback(preloadCommonIcons)
  } else {
    setTimeout(preloadCommonIcons, 100)
  }
}

// Get icon name with fallback
export const getIconName = (iconName) => {
  return iconNameMappings[iconName?.toLowerCase()] || iconName
}