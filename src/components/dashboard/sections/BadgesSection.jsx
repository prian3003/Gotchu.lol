import React, { useState, useEffect, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { useTheme } from '../../../contexts/ThemeContext'
import { API_BASE_URL } from '../../../config/api'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Get rarity effects
const getRarityEffects = (rarity) => {
  const effects = {
    COMMON: { glow: 'none', borderGlow: 'none', animation: 'none' },
    UNCOMMON: { glow: '0 0 10px rgba(16, 185, 129, 0.3)', borderGlow: 'rgba(16, 185, 129, 0.5)', animation: 'none' },
    RARE: { glow: '0 0 15px rgba(59, 130, 246, 0.4)', borderGlow: 'rgba(59, 130, 246, 0.6)', animation: 'none' },
    EPIC: { glow: '0 0 20px rgba(139, 92, 246, 0.5)', borderGlow: 'rgba(139, 92, 246, 0.7)', animation: 'pulse 2s infinite' },
    LEGENDARY: { glow: '0 0 25px rgba(245, 158, 11, 0.6)', borderGlow: 'rgba(245, 158, 11, 0.8)', animation: 'pulse 1.5s infinite' },
    MYTHIC: { glow: '0 0 30px rgba(239, 68, 68, 0.7)', borderGlow: 'rgba(239, 68, 68, 0.9)', animation: 'pulse 1s infinite' }
  }
  return effects[rarity] || effects.COMMON
}

// Enhanced Badge Item Component
const EnhancedBadgeItem = ({ badge, isShowcased = false, onToggleShowcase, onClaimBadge, canReorder = false }) => {
  const { colors } = useTheme()
  const rarityEffects = getRarityEffects(badge.rarity)
  
  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${rarityEffects.borderGlow || colors.border}`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      boxShadow: rarityEffects.glow,
      animation: rarityEffects.animation,
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = colors.accent
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = `${rarityEffects.glow}, 0 8px 24px rgba(0,0,0,0.15)`
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = rarityEffects.borderGlow || colors.border
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = rarityEffects.glow
    }}>
      {/* Rarity gradient overlay for mythic/legendary */}
      {(badge.rarity === 'MYTHIC' || badge.rarity === 'LEGENDARY') && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: badge.rarity === 'MYTHIC' 
            ? 'linear-gradient(90deg, #ef4444, #f59e0b, #ef4444)' 
            : 'linear-gradient(90deg, #f59e0b, #eab308, #f59e0b)',
          animation: 'shimmer 2s linear infinite'
        }} />
      )}
      
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: badge.bgColor || `${colors.accent}20`,
        fontSize: '28px',
        boxShadow: rarityEffects.glow
      }}>
        <Icon icon={badge.icon} />
      </div>
      
      <div style={{ flex: 1 }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          margin: '0 0 4px 0',
          color: colors.text,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {badge.name}
          {badge.earned ? (
            <span style={{
              background: colors.accent,
              color: 'white',
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 6px',
              borderRadius: '12px',
              textTransform: 'uppercase'
            }}>Earned</span>
          ) : badge.is_claimable ? (
            <span style={{
              background: '#f59e0b',
              color: 'white',
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 6px',
              borderRadius: '12px',
              textTransform: 'uppercase',
              animation: 'pulse 2s infinite'
            }}>Claimable!</span>
          ) : null}
          {badge.rarity !== 'COMMON' && (
            <span style={{
              background: getRarityColor(badge.rarity),
              color: 'white',
              fontSize: '9px',
              fontWeight: '600',
              padding: '2px 5px',
              borderRadius: '8px',
              textTransform: 'capitalize'
            }}>{badge.rarity}</span>
          )}
        </h3>
        <p style={{
          fontSize: '14px',
          color: colors.muted,
          margin: 0,
          lineHeight: '1.4'
        }}>{badge.description}</p>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {badge.is_claimable && onClaimBadge && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClaimBadge(badge.id)
            }}
            style={{
              background: '#f59e0b',
              border: `1px solid #f59e0b`,
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              animation: 'pulse 2s infinite'
            }}
          >
            <Icon icon="mdi:gift" style={{ fontSize: '14px' }} />
            Claim Badge
          </button>
        )}
        {badge.earned && onToggleShowcase && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleShowcase(badge.id, isShowcased)
            }}
            style={{
              background: isShowcased ? colors.accent : 'transparent',
              border: `1px solid ${colors.accent}`,
              borderRadius: '8px',
              padding: '6px 12px',
              color: isShowcased ? 'white' : colors.accent,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Icon icon={isShowcased ? "mdi:eye" : "mdi:eye-off"} style={{ fontSize: '14px' }} />
            {isShowcased ? 'Showcased' : 'Showcase'}
          </button>
        )}
        {canReorder && (
          <Icon icon="mdi:drag-horizontal" style={{
            color: colors.muted,
            fontSize: '16px'
          }} />
        )}
      </div>
    </div>
  )
}

// Get rarity color
const getRarityColor = (rarity) => {
  const colors = {
    COMMON: '#6b7280',
    UNCOMMON: '#10b981',
    RARE: '#3b82f6',
    EPIC: '#8b5cf6',
    LEGENDARY: '#f59e0b',
    MYTHIC: '#ef4444'
  }
  return colors[rarity] || colors.COMMON
}

// Sortable Badge Item Component
const SortableBadgeItem = ({ badge, id }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const { colors } = useTheme()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${isDragging ? colors.accent : colors.border}`,
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          transition: 'all 0.2s ease',
          cursor: isDragging ? 'grabbing' : 'grab',
          transform: isDragging ? 'rotate(2deg)' : 'none',
          boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.2)' : 'none'
        }}
      >
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: badge.bgColor || `${colors.accent}20`,
          fontSize: '24px'
        }}>
          <Icon icon={badge.icon} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            margin: '0 0 4px 0',
            color: colors.text,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {badge.name}
            <span style={{
              background: colors.accent,
              color: 'white',
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 6px',
              borderRadius: '12px',
              textTransform: 'uppercase'
            }}>Earned</span>
          </h3>
          <p style={{
            fontSize: '14px',
            color: colors.muted,
            margin: 0,
            lineHeight: '1.4'
          }}>{badge.description}</p>
        </div>
        <Icon icon="mdi:drag-horizontal" style={{
          color: colors.muted,
          fontSize: '16px'
        }} />
      </div>
    </div>
  )
}

const BadgesSection = ({ user, onOpenPremiumModal }) => {
  const { colors } = useTheme()

  // Add CSS for animations
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])
  const [selectedFilter] = useState('All Badges')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [earnedBadges, setEarnedBadges] = useState([])
  const [claimableBadges, setClaimableBadges] = useState([])
  const [unearnedBadges, setUnearnedBadges] = useState([])
  const [showcasedBadges, setShowcasedBadges] = useState([])
  const [nonShowcasedBadges, setNonShowcasedBadges] = useState([])
  const [isReordering, setIsReordering] = useState(false)
  const [isCheckingBadges, setIsCheckingBadges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )


  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!user?.username) {
        throw new Error('User information not available')
      }
      
      const response = await fetch(`${API_BASE_URL}/users/${user.username}/badges`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })

      const data = await response.json()
      
      if (data.success) {
        // Map API badge data to display format
        const allBadges = data.data.badges.map(badgeData => {
          const badge = {
            id: badgeData.badge.id,
            name: badgeData.badge.name,
            description: badgeData.badge.description,
            bgColor: badgeData.badge.icon_color || getColorFromRarity(badgeData.badge.rarity),
            type: getCategoryDisplayName(badgeData.badge.category),
            action: getBadgeAction(badgeData.badge.category),
            rarity: badgeData.badge.rarity,
            category: badgeData.badge.category,
            icon_type: badgeData.badge.icon_type,
            icon_value: badgeData.badge.icon_value,
            icon_color: badgeData.badge.icon_color,
            gradient_from: badgeData.badge.gradient_from,
            gradient_to: badgeData.badge.gradient_to,
            glow_color: badgeData.badge.glow_color,
            earned: badgeData.is_earned,
            progress: badgeData.progress,
            current_value: badgeData.current_value,
            target_value: badgeData.target_value,
            is_visible: badgeData.is_visible,
            is_showcased: badgeData.is_showcased,
            is_claimable: badgeData.is_claimable,
            user_progress: {
              is_earned: badgeData.is_earned,
              progress: badgeData.progress,
              current_value: badgeData.current_value,
              target_value: badgeData.target_value,
              showcase_order: badgeData.showcase_order
            }
          }
          
          // Set the icon using the proper icon handling logic
          badge.icon = getIconFromBadge(badge)
          
          return badge
        })
        
        // Separate badges by status
        const earned = allBadges.filter(badge => badge.earned)
        const claimable = allBadges.filter(badge => !badge.earned && badge.is_claimable)
        const unearned = allBadges.filter(badge => !badge.earned && !badge.is_claimable)
        
        // Separate showcased and non-showcased earned badges
        const showcased = earned.filter(badge => badge.is_showcased)
        const nonShowcased = earned.filter(badge => !badge.is_showcased)
        
        // Sort showcased badges by showcase order
        showcased.sort((a, b) => {
          const orderA = a.user_progress?.showcase_order || 999
          const orderB = b.user_progress?.showcase_order || 999
          return orderA - orderB
        })
        
        // Sort non-showcased by earned date (newest first)
        nonShowcased.sort((a, b) => {
          if (!a.user_progress?.earned_at || !b.user_progress?.earned_at) return 0
          return new Date(b.user_progress.earned_at) - new Date(a.user_progress.earned_at)
        })
        
        setEarnedBadges(earned)
        setClaimableBadges(claimable)
        setUnearnedBadges(unearned)
        setShowcasedBadges(showcased)
        setNonShowcasedBadges(nonShowcased)
      } else {
        throw new Error(data.message || 'Failed to fetch badges')
      }
    } catch (err) {
      console.error('Error fetching badges:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.username])

  // Fetch badges on component mount and when user changes
  useEffect(() => {
    if (user?.username) {
      fetchBadges()
    }
  }, [user?.username, fetchBadges])

  // Toggle badge showcase status
  const toggleBadgeShowcase = async (badgeId, currentShowcaseStatus) => {
    try {
      // Find the badge to get its current order
      const badge = earnedBadges.find(b => b.id === badgeId)
      if (!badge) return
      
      const response = await fetch('${API_BASE_URL}/badges/order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
        body: JSON.stringify({
          badge_orders: [{
            badge_id: badgeId,
            showcase_order: currentShowcaseStatus ? 0 : (showcasedBadges.length + 1),
            is_showcased: !currentShowcaseStatus
          }]
        })
      })

      if (response.ok) {
        // Refresh badges to get updated data
        await fetchBadges()
      } else {
        throw new Error('Failed to toggle badge showcase')
      }
    } catch (err) {
      console.error('Error toggling badge showcase:', err)
      setError(err.message)
    }
  }

  // Check badges manually
  const checkBadges = async () => {
    try {
      setIsCheckingBadges(true)
      
      const response = await fetch('${API_BASE_URL}/badges/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh badges after check
        await fetchBadges()
        // Show success message briefly
        setTimeout(() => {
          // You could add a toast notification here
        }, 1000)
      } else {
        throw new Error(data.message || 'Failed to check badges')
      }
    } catch (err) {
      console.error('Error checking badges:', err)
      setError(err.message)
    } finally {
      setIsCheckingBadges(false)
    }
  }

  // Claim a badge
  const claimBadge = async (badgeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/badges/claim/${badgeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh badges after claiming
        await fetchBadges()
        // You could add a success toast notification here
      } else {
        throw new Error(data.message || 'Failed to claim badge')
      }
    } catch (err) {
      console.error('Error claiming badge:', err)
      setError(err.message)
    }
  }


  // Helper functions for badge data conversion
  const getIconFromBadge = (badge) => {
    // Map badge names to Iconify icons
    const badgeIconMap = {
      'staff': 'lucide:star',
      'helper': 'lucide:help-circle',
      'premium': 'lucide:gem',
      'verified': 'lucide:badge-check',
      'donor': 'lucide:gift',
      'og': 'lucide:trophy',
      'gifter': 'lucide:gift',
      'server booster': 'lucide:rocket',
      'serverbooster': 'lucide:rocket',
      'winner': 'lucide:trophy',
      'second place': 'lucide:medal',
      'secondplace': 'lucide:medal',
      'third place': 'lucide:medal',
      'thirdplace': 'lucide:medal',
      'image host': 'lucide:image',
      'imagehost': 'lucide:image',
      'bug hunter': 'lucide:bug',
      'bughunter': 'lucide:bug',
      'welcome': 'lucide:user-plus',
      'first link': 'lucide:link',
      'popular': 'lucide:eye',
      'easter 2025': 'mdi:egg-easter',
      'easter2025': 'mdi:egg-easter',
      'christmas 2024': 'mdi:pine-tree',
      'christmas2024': 'mdi:pine-tree'
    }
    
    // First try to match by badge name
    const badgeName = badge.name?.toLowerCase()
    if (badgeName && badgeIconMap[badgeName]) {
      return badgeIconMap[badgeName]
    }
    
    // Fallback to original logic for custom badges
    if (badge.icon_type === 'EMOJI') {
      return badge.icon_value
    } else if (badge.icon_type === 'LUCIDE') {
      return `lucide:${badge.icon_value}`
    }
    
    return 'mdi:star' // default icon
  }

  const getColorFromRarity = (rarity) => {
    const rarityColors = {
      COMMON: '#6b7280',
      UNCOMMON: '#10b981',
      RARE: '#3b82f6',
      EPIC: '#8b5cf6',
      LEGENDARY: '#f59e0b',
      MYTHIC: '#ef4444'
    }
    return rarityColors[rarity] || '#6b7280'
  }

  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      MILESTONE: 'milestone',
      ENGAGEMENT: 'achievement',
      STAFF: 'staff',
      PREMIUM: 'premium',
      COMMUNITY: 'social',
      SOCIAL: 'social',
      TIME_BASED: 'achievement',
      ACHIEVEMENT: 'achievement',
      SEASONAL: 'seasonal',
      RARE: 'rare'
    }
    return categoryMap[category] || 'achievement'
  }

  const getBadgeAction = (category) => {
    const actionMap = {
      PREMIUM: 'Purchase',
      SOCIAL: 'Join Discord',
      ACHIEVEMENT: 'Unlock',
      COMMUNITY: 'Participate'
    }
    return actionMap[category] || null
  }


  // Drag and drop handlers
  const handleDragEnd = async (event) => {
    const { active, over } = event
    
    if (!over || !user || active.id === over.id) return
    
    const oldIndex = showcasedBadges.findIndex((badge) => badge.id === active.id)
    const newIndex = showcasedBadges.findIndex((badge) => badge.id === over.id)
    
    if (oldIndex === -1 || newIndex === -1) return
    
    const newItems = arrayMove(showcasedBadges, oldIndex, newIndex)
    
    // Update local state immediately
    setShowcasedBadges(newItems)
    setIsReordering(true)
    
    try {
      // Prepare badge orders for API
      const badgeOrders = newItems.map((badge, index) => ({
        badge_id: badge.id,
        showcase_order: index + 1,
        is_showcased: true
      }))
      
      const response = await fetch('${API_BASE_URL}/badges/order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ badge_orders: badgeOrders })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update badge order')
      }
    } catch (err) {
      console.error('Error updating badge order:', err)
      // Revert to original order on error
      fetchBadges()
    } finally {
      setIsReordering(false)
    }
  }

  return (
    <div style={{
      background: colors.background,
      color: colors.text,
      minHeight: '100vh',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            margin: '0 0 8px 0',
            color: colors.text
          }}>All Badges</h1>
          <p style={{
            color: colors.muted,
            margin: 0,
            fontSize: '14px'
          }}>Showcase your accomplishments and unlock new badges</p>
        </div>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <button 
            onClick={checkBadges}
            disabled={isCheckingBadges}
            style={{
              background: colors.accent,
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: 'white',
              cursor: isCheckingBadges ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              opacity: isCheckingBadges ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <Icon icon={isCheckingBadges ? "mdi:loading" : "mdi:refresh"} 
                  style={{ 
                    animation: isCheckingBadges ? 'spin 1s linear infinite' : 'none',
                    transformOrigin: 'center'
                  }} />
            {isCheckingBadges ? 'Checking...' : 'Check for New Badges'}
          </button>
          <div style={{
            position: 'relative',
            display: 'inline-block'
          }}>
            <button style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '8px 16px',
              color: colors.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}>
              {selectedFilter}
              <Icon icon="mdi:chevron-down" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          color: colors.muted
        }}>
          Loading badges...
        </div>
      ) : error ? (
        <div style={{
          background: `${colors.accent}10`,
          border: `1px solid ${colors.accent}30`,
          borderRadius: '8px',
          padding: '16px',
          color: colors.accent,
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      ) : (
        <>
          {/* Showcased Badges Section */}
          {showcasedBadges.length > 0 && (
            <>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: '0 0 8px 0',
                color: colors.text,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Icon icon="mdi:star" style={{ color: '#f59e0b', fontSize: '28px' }} />
                Showcased Badges ({showcasedBadges.length})
                {isReordering && (
                  <span style={{
                    fontSize: '14px',
                    color: colors.muted,
                    fontWeight: '400'
                  }}> - Saving order...</span>
                )}
              </h2>
              <p style={{
                color: colors.muted,
                margin: '0 0 20px 0',
                fontSize: '14px',
                fontStyle: 'italic'
              }}>
                These badges appear on your public profile. Drag to reorder them.
              </p>
              
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={showcasedBadges.map(badge => badge.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                      gap: '16px',
                      marginBottom: '48px',
                      padding: '20px',
                      background: `linear-gradient(135deg, ${colors.surface}50, ${colors.accent}10)`,
                      borderRadius: '16px',
                      border: `1px solid ${colors.accent}30`
                    }}
                  >
                    {showcasedBadges.map((badge) => (
                      <SortableBadgeItem
                        key={badge.id}
                        id={badge.id}
                        badge={badge}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}

          {/* Your Other Earned Badges */}
          {nonShowcasedBadges.length > 0 && (
            <>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: '32px 0 16px 0',
                color: colors.text,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Icon icon="mdi:trophy-outline" style={{ color: colors.accent }} />
                Your Other Earned Badges ({nonShowcasedBadges.length})
              </h2>
              <p style={{
                color: colors.muted,
                margin: '0 0 16px 0',
                fontSize: '14px'
              }}>
                Click "Showcase" to display these badges on your profile
              </p>
              
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '16px',
                  marginBottom: '40px'
                }}
              >
                {nonShowcasedBadges.map((badge) => (
                  <EnhancedBadgeItem
                    key={badge.id}
                    badge={badge}
                    isShowcased={false}
                    onToggleShowcase={toggleBadgeShowcase}
                    onClaimBadge={claimBadge}
                  />
                ))}
              </div>
            </>
          )}

          {/* Claimable Badges Section */}
          {claimableBadges.length > 0 && (
            <>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: '32px 0 16px 0',
                color: colors.text,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Icon icon="mdi:gift" style={{ color: '#f59e0b', fontSize: '24px' }} />
                Claimable Badges ({claimableBadges.length})
              </h2>
              <p style={{
                color: colors.muted,
                margin: '0 0 16px 0',
                fontSize: '14px'
              }}>
                You've met the requirements for these badges! Click "Claim Badge" to earn them.
              </p>
              
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '16px',
                  marginBottom: '40px',
                  padding: '20px',
                  background: `linear-gradient(135deg, #f59e0b10, #f59e0b20)`,
                  borderRadius: '16px',
                  border: `1px solid #f59e0b30`
                }}
              >
                {claimableBadges.map((badge) => (
                  <EnhancedBadgeItem
                    key={badge.id}
                    badge={badge}
                    isShowcased={false}
                    onClaimBadge={claimBadge}
                  />
                ))}
              </div>
            </>
          )}

          {/* No Earned Badges Message */}
          {earnedBadges.length === 0 && !loading && (
            <div style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              marginBottom: '40px'
            }}>
              <Icon icon="mdi:trophy-broken" style={{ 
                fontSize: '48px', 
                color: colors.muted,
                marginBottom: '16px'
              }} />
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: colors.text,
                margin: '0 0 8px 0'
              }}>No Badges Earned Yet</h3>
              <p style={{
                color: colors.muted,
                margin: 0,
                fontSize: '14px'
              }}>
                Start earning badges by using the platform features below!
              </p>
            </div>
          )}

          {/* Unearned Badges Grid */}
          {unearnedBadges.length > 0 && (
            <>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: '40px 0 16px 0',
                color: colors.text,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Icon icon="mdi:lock" style={{ color: colors.muted }} />
                Badges to Unlock ({unearnedBadges.length})
              </h2>
              <p style={{
                color: colors.muted,
                margin: '0 0 16px 0',
                fontSize: '14px'
              }}>
                Complete the requirements below to earn these badges
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
              }}>
                {unearnedBadges.map((badge) => {
              const isEarned = false // These are unearned badges
              return (
                <div key={badge.id} style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  opacity: 0.7
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.accent
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border
                  e.currentTarget.style.transform = 'translateY(0)'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: badge.bgColor || `${colors.accent}20`,
                    fontSize: '24px',
                    position: 'relative'
                  }}>
                    <Icon icon={badge.icon} />
                    {!isEarned && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon icon="mdi:lock" style={{ color: 'white', fontSize: '16px' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: '0 0 4px 0',
                      color: colors.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {badge.name}
                      {isEarned && (
                        <span style={{
                          background: colors.accent,
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: '600',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          textTransform: 'uppercase'
                        }}>Earned</span>
                      )}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: colors.muted,
                      margin: '0 0 4px 0',
                      lineHeight: '1.4'
                    }}>{badge.description}</p>
                    {badge.user_progress && !isEarned && badge.user_progress.progress > 0 && (
                      <div style={{
                        background: colors.border,
                        borderRadius: '4px',
                        height: '4px',
                        marginTop: '8px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          background: colors.accent,
                          height: '100%',
                          width: `${badge.user_progress.progress * 100}%`,
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    )}
                  </div>
                  {badge.action && !isEarned && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        if (badge.type === 'premium' && onOpenPremiumModal) {
                          onOpenPremiumModal()
                        }
                      }}
                      style={{
                        background: badge.type === 'premium' ? colors.accent : 'transparent',
                        border: `1px solid ${badge.type === 'premium' ? colors.accent : colors.border}`,
                        borderRadius: '8px',
                        padding: '8px 16px',
                        color: badge.type === 'premium' ? 'white' : colors.text,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (badge.type === 'premium') {
                          e.currentTarget.style.background = colors.accentHover || colors.accent
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (badge.type === 'premium') {
                          e.currentTarget.style.background = colors.accent
                          e.currentTarget.style.transform = 'translateY(0)'
                        }
                      }}
                    >
                      {badge.action}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}


      {/* Premium Upgrade - Only show for non-premium users */}
      {!user?.is_premium && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '32px',
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            backgroundImage: 'url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 100 100\\"><circle cx=\\"50\\" cy=\\"50\\" r=\\"3\\" fill=\\"rgba(255,255,255,0.1)\\"/><circle cx=\\"20\\" cy=\\"20\\" r=\\"2\\" fill=\\"rgba(255,255,255,0.1)\\"/><circle cx=\\"80\\" cy=\\"30\\" r=\\"1\\" fill=\\"rgba(255,255,255,0.1)\\"/></svg>")',
            opacity: 0.3
          }} />
          <h3 style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Icon icon="mdi:diamond" />
            Upgrade to Premium
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 16px 0',
            lineHeight: '1.5'
          }}>
            With gotchu.lol Premium you can reorder, recolor, and toggle each badge individually.
          </p>
          <button 
            onClick={onOpenPremiumModal}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '12px 24px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }}
          >
            Upgrade Now
          </button>
        </div>
      )}
        </>
      )}
    </div>
  )
}

export default BadgesSection