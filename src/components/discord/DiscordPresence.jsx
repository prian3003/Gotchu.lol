import React from 'react'
import { useDiscordPresence } from '../../hooks/useDiscordPresence'
import DiscordBadges from './DiscordBadges'

const DiscordPresence = ({ 
  discordUserID, 
  showBadges = true, 
  showAvatar = true,
  showOfflineDetails = true,
  className = "",
  avatarSize = 64
}) => {
  const { 
    presence, 
    userInfo,
    loading, 
    userLoading,
    error, 
    getStatusDisplay, 
    getActivityDisplay, 
    formatLastSeen, 
    isPresenceRecent,
    getDiscordAvatarURL
  } = useDiscordPresence(discordUserID)

  const isLoading = loading || userLoading

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center gap-3">
          {showAvatar && (
            <div 
              className="bg-gray-300 rounded-full flex-shrink-0"
              style={{ width: avatarSize, height: avatarSize }}
            ></div>
          )}
          <div className="flex-1">
            <div className="w-24 h-4 bg-gray-300 rounded mb-2"></div>
            <div className="w-32 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return null
  }

  const statusInfo = getStatusDisplay(presence?.status || 'offline')
  const isRecent = presence ? isPresenceRecent(presence.updated_at) : false
  const isOffline = !presence || presence.status === 'offline'
  
  // Get avatar URL
  const avatarUrl = userInfo?.avatar_url || getDiscordAvatarURL(discordUserID, null, avatarSize * 2)
  
  return (
    <div className={`${className}`}>
      {/* Enhanced Offline Display */}
      {isOffline && showOfflineDetails ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-start gap-4">
            {/* Discord Avatar with Status Indicator */}
            {showAvatar && (
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="Discord Avatar"
                  className="rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-600 shadow-lg"
                  style={{ width: avatarSize, height: avatarSize }}
                  onError={(e) => {
                    e.target.src = getDiscordAvatarURL(discordUserID, null, avatarSize * 2)
                  }}
                />
                {/* Status Dot */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-600">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: statusInfo.color }}
                    title={statusInfo.description}
                  ></div>
                </div>
              </div>
            )}

            {/* User Info and Status */}
            <div className="flex-1 space-y-3">
              {/* Status */}
              <div className="flex items-center gap-2">
                {!showAvatar && (
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: statusInfo.color }}
                    title={statusInfo.description}
                  ></div>
                )}
                <span 
                  className="text-sm font-semibold"
                  style={{ color: statusInfo.color }}
                >
                  {statusInfo.icon} {statusInfo.text}
                </span>
              </div>

              {/* Last Seen */}
              {presence?.last_seen && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Last seen {formatLastSeen(presence.last_seen)}</span>
                </div>
              )}

              {/* Discord Badges */}
              {showBadges && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <DiscordBadges discordUserID={discordUserID} />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Online/Activity Display */
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {/* Avatar for online users */}
            {showAvatar && !isOffline && (
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="Discord Avatar"
                  className="rounded-full bg-gray-200 dark:bg-gray-700"
                  style={{ width: avatarSize * 0.75, height: avatarSize * 0.75 }}
                  onError={(e) => {
                    e.target.src = getDiscordAvatarURL(discordUserID, null, avatarSize * 1.5)
                  }}
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <div 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: statusInfo.color }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex-1 space-y-2">
              {/* Status Display */}
              <div className="flex items-center gap-2">
                {!showAvatar && (
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: statusInfo.color }}
                    title={statusInfo.description}
                  ></div>
                )}
                <span className="text-sm font-medium" style={{ color: statusInfo.color }}>
                  {statusInfo.text}
                </span>
                
                {!isRecent && presence?.last_seen && (
                  <span className="text-xs text-gray-500">
                    • Last seen {formatLastSeen(presence.last_seen)}
                  </span>
                )}
              </div>

              {/* Activities */}
              {presence?.activities && presence.activities.length > 0 && (
                <div className="space-y-2">
                  {presence.activities.map((activity, index) => {
                    const activityInfo = getActivityDisplay(activity)
                    
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span>{activityInfo.icon}</span>
                        <div className="flex-1">
                          {activityInfo.prefix && (
                            <span className="text-gray-600 dark:text-gray-300">{activityInfo.prefix} </span>
                          )}
                          <span className="font-medium">{activity.name}</span>
                          
                          {/* Show details for Spotify/music activities */}
                          {activity.type === 2 && (activity.details || activity.state) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {activity.details && <div>🎵 {activity.details}</div>}
                              {activity.state && <div>👤 by {activity.state}</div>}
                            </div>
                          )}
                          
                          {/* Show details for other activities */}
                          {activity.type !== 2 && activity.details && (
                            <div className="text-xs text-gray-500 mt-1">
                              {activity.details}
                            </div>
                          )}
                        </div>
                        
                        {/* Streaming indicator */}
                        {activity.type === 1 && activity.url && (
                          <a 
                            href={activity.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-red-500 hover:text-red-600 text-xs"
                          >
                            🔴 LIVE
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Discord Badges */}
          {showBadges && (
            <DiscordBadges discordUserID={discordUserID} />
          )}
        </div>
      )}
    </div>
  )
}

export default DiscordPresence