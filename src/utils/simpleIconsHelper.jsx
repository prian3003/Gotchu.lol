import React from 'react'
import * as SimpleIcons from 'simple-icons'

// Helper function to get Simple Icon SVG and color
export const getSimpleIconData = (iconName) => {
  try {
    // Convert icon name to Simple Icons format (camelCase with 'si' prefix)
    const iconKey = `si${iconName.charAt(0).toUpperCase()}${iconName.slice(1).replace(/[-_.]/g, '')}`
    const icon = SimpleIcons[iconKey]
    if (icon) {
      return {
        svg: icon.svg,
        hex: `#${icon.hex}`,
        title: icon.title
      }
    }
  } catch (error) {
    console.warn(`Icon ${iconName} not found in Simple Icons`)
  }
  return null
}

// Component to render Simple Icon with brand colors
export const SimpleIconComponent = ({ iconName, customColor, size = 24, useWhite = false }) => {
  const iconData = getSimpleIconData(iconName)
  
  if (!iconData) {
    return <span style={{ fontSize: `${size}px`, color: '#ffffff' }}>🔗</span>
  }

  // Use custom color, brand color, or white based on useWhite prop
  const color = customColor || (useWhite ? '#ffffff' : iconData.hex)

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      dangerouslySetInnerHTML={{
        __html: iconData.svg.replace('<svg', `<svg fill="${color}" width="${size}" height="${size}"`)
      }}
    />
  )
}

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

// Get icon name with fallback
export const getIconName = (iconName) => {
  return iconNameMappings[iconName?.toLowerCase()] || iconName
}