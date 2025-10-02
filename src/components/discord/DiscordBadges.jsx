import React from 'react'
import { useDiscordPresence } from '../../hooks/useDiscordPresence'

const DiscordBadges = ({ 
  discordUserID, 
  className = "", 
  compact = false, 
  maxVisible = null 
}) => {
  const { badges, badgesLoading, getBadgeDisplay, getRarityColor } = useDiscordPresence(discordUserID)

  if (badgesLoading) {
    if (compact) {
      return (
        <div className={`flex items-center gap-1 ${className}`}>
          <div className="w-4 h-4 bg-gray-300 animate-pulse rounded-full"></div>
        </div>
      )
    }
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-6 h-6 bg-gray-300 animate-pulse rounded-full"></div>
        <span className="text-sm text-gray-500">Loading badges...</span>
      </div>
    )
  }

  if (!badges || !badges.badges || badges.count === 0) {
    return null
  }

  // Limit badges if maxVisible is specified
  const visibleBadges = maxVisible ? badges.badges.slice(0, maxVisible) : badges.badges
  const remainingCount = maxVisible && badges.badges.length > maxVisible 
    ? badges.badges.length - maxVisible 
    : 0

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {visibleBadges.map((badge) => {
          const badgeInfo = getBadgeDisplay(badge)
          const rarityColor = getRarityColor(badgeInfo.rarity)
          
          return (
            <div
              key={badge.id}
              className="group relative"
              title={`${badge.name} - ${badge.description}`}
            >
              <div
                className="flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-help"
              >
                {badge.icon.startsWith('http') ? (
                  <img 
                    src={badge.icon} 
                    alt={badge.name}
                    className="w-5 h-5 object-contain"
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '20px', filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }}>{badge.icon}</span>
                )}
              </div>
              
              {/* Compact Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none z-20 whitespace-nowrap"
                   style={{
                     background: 'rgba(0, 0, 0, 0.15)',
                     backdropFilter: 'blur(20px) saturate(180%)',
                     WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                     border: '1px solid rgba(255, 255, 255, 0.2)',
                     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                   }}>
                <div className="font-medium">{badge.name}</div>
                <div 
                  className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent"
                  style={{ borderTopColor: 'rgba(0, 0, 0, 0.15)' }}
                ></div>
              </div>
            </div>
          )
        })}
        {remainingCount > 0 && (
          <div
            className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-600 text-white text-xs font-medium cursor-help ml-1"
            title={`+${remainingCount} more badges`}
            style={{ 
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              fontSize: '10px'
            }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
        <span>🏆</span>
        <span>Discord Badges ({badges.count})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {badges.badges.map((badge) => {
          const badgeInfo = getBadgeDisplay(badge)
          const rarityColor = getRarityColor(badgeInfo.rarity)
          
          return (
            <div
              key={badge.id}
              className="group relative"
              title={`${badge.name} - ${badge.description}`}
            >
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 cursor-help"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff'
                }}
              >
                {badge.icon.startsWith('http') ? (
                  <img 
                    src={badge.icon} 
                    alt={badge.name}
                    className="w-5 h-5 object-contain"
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                    }}
                  />
                ) : (
                  <span className="text-lg">{badge.icon}</span>
                )}
                <span className="truncate">{badge.name}</span>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none z-10 whitespace-nowrap"
                   style={{
                     background: 'rgba(0, 0, 0, 0.15)',
                     backdropFilter: 'blur(20px) saturate(180%)',
                     WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                     border: '1px solid rgba(255, 255, 255, 0.2)',
                     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                   }}>
                <div className="font-semibold">{badge.name}</div>
                <div className="text-gray-200 mt-1 opacity-90">{badge.description}</div>
                <div className="text-xs text-gray-300 mt-1 capitalize opacity-80">{badgeInfo.rarity} Badge</div>
                {/* Tooltip arrow */}
                <div 
                  className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent"
                  style={{ borderTopColor: 'rgba(0, 0, 0, 0.15)' }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DiscordBadges