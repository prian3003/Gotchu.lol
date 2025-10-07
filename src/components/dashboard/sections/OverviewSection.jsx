import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../../config/api'
import { 
  HiUser, 
  HiStar, 
  HiIdentification, 
  HiEye, 
  HiPencilSquare, 
  HiCalendarDays, 
  HiChartBar, 
  HiExclamationTriangle,
  HiCamera,
  HiArrowTopRightOnSquare,
  HiShieldCheck,
  HiFingerPrint,
  HiUserPlus,
  HiSparkles,
  HiAdjustmentsHorizontal,
  HiAtSymbol
} from 'react-icons/hi2'
import { SimpleIconComponent } from '../../../utils/simpleIconsHelper.jsx'
import { useDiscord } from '../../../hooks/useDiscord'
import AccountSettingsModal from '../../modals/AccountSettingsModal'
import ChangeDisplayNameModal from '../../modals/ChangeDisplayNameModal'
import ChangeAliasModal from '../../modals/ChangeAliasModal'

const OverviewSection = ({ user, setUser, userLinks = [] }) => {
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)
  const [isDisplayNameModalOpen, setIsDisplayNameModalOpen] = useState(false)
  const [isAliasModalOpen, setIsAliasModalOpen] = useState(false)
  const [weeklyViewsGrowth, setWeeklyViewsGrowth] = useState(0)
  
  // Discord integration
  const { discordStatus, connecting, disconnecting, connectDiscord, disconnectDiscord } = useDiscord()

  // Calculate accurate profile completion percentage
  const calculateProfileCompletion = () => {
    // Check if user has any custom links added
    const hasLinks = userLinks && userLinks.length > 0
    
    const tasks = [
      !!user.avatar_url,                                        // Upload Avatar
      !!user.description || !!user.bio,                        // Add Description  
      !!discordStatus.connected,                                // Discord Connected
      hasLinks,                                                 // Add Socials (check if user has any links)
      !!(user.mfaEnabled || user.twoFactorEnabled)            // 2FA Enabled
    ]
    
    const completedTasks = tasks.filter(Boolean).length
    const totalTasks = tasks.length
    const calculatedPercentage = Math.round((completedTasks / totalTasks) * 100)
    
    
    // Use frontend calculation instead of backend to ensure accuracy
    return calculatedPercentage
  }

  const actualProfileCompletion = calculateProfileCompletion()
  const isProfileComplete = actualProfileCompletion === 100

  // Fetch 7-day analytics for profile views growth calculation
  useEffect(() => {
    const fetchWeeklyAnalytics = async () => {
      if (!user) return


      try {
        // Fetch only current 7-day period views for faster response
        const response = await fetch(`${API_BASE_URL}/dashboard/analytics?days=7`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.success) {
            const currentViews = data.data?.profile_views || 0
            // Simple calculation: show current 7-day views as growth from 0
            // This matches what analytics section would show for new accounts
            setWeeklyViewsGrowth(currentViews)
          }
        }
      } catch (error) {
        console.error('Error fetching weekly analytics:', error)
        // Fallback to 0 if analytics fails
        setWeeklyViewsGrowth(0)
      }
    }
    
    // Use a timeout to prevent blocking the UI
    const timeoutId = setTimeout(fetchWeeklyAnalytics, 100)
    return () => clearTimeout(timeoutId)
  }, [user])

  // Handle username change
  const handleUsernameChange = async (newUsername) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
        body: JSON.stringify({ username: newUsername })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update username')
      }

      const data = await response.json()
      
      // Update local user state immediately
      if (setUser) {
        setUser(prevUser => ({
          ...prevUser,
          username: newUsername
        }))
      }
      
      // Also clear any cached user data to force refresh
      localStorage.removeItem('cached_user_data')
    } catch (error) {
      throw error
    }
  }

  // Handle display name change
  const handleDisplayNameChange = async (newDisplayName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-display-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
        body: JSON.stringify({ displayName: newDisplayName })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update display name')
      }

      const data = await response.json()
      
      // Update local user state immediately
      if (setUser) {
        setUser(prevUser => ({
          ...prevUser,
          displayName: newDisplayName || null
        }))
      }
      
      // Also clear any cached user data to force refresh
      localStorage.removeItem('cached_user_data')
    } catch (error) {
      throw error
    }
  }

  // Handle alias change (Premium only)
  const handleAliasChange = async (newAlias) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-alias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
        body: JSON.stringify({ alias: newAlias })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update alias')
      }

      const data = await response.json()
      
      // Update local user state immediately
      if (setUser) {
        setUser(prevUser => ({
          ...prevUser,
          alias: newAlias || null
        }))
      }
      
      // Also clear any cached user data to force refresh
      localStorage.removeItem('cached_user_data')
    } catch (error) {
      throw error
    }
  }

  return (
    <>
      {/* Header */}
      <div className="content-header">
        <h1>Account Overview</h1>
      </div>

      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="overview-card">
          <div className="card-header">
            <div className="card-header-content">
              <HiUser className="card-icon" />
              <h3>Username</h3>
            </div>
            <button className="edit-button" onClick={() => setIsUsernameModalOpen(true)}>
              <HiPencilSquare />
            </button>
          </div>
          <div className="card-value">{user.username}</div>
          <div className="card-description">Change available now</div>
        </div>

        <div className="overview-card">
          <div className="card-header">
            <div className="card-header-content">
              <HiStar className="card-icon" />
              <h3>Alias</h3>
            </div>
            <button 
              className={`edit-button ${user.plan === 'premium' ? '' : 'premium'}`}
              onClick={() => user.plan === 'premium' ? setIsAliasModalOpen(true) : null}
              disabled={user.plan !== 'premium'}
            >
              <HiStar />
            </button>
          </div>
          <div className="card-value">
            {user.alias || (user.plan === 'premium' ? 'Set your alias' : 'Not set')}
          </div>
          <div className="card-description">
            {user.plan === 'premium' ? 'Premium feature' : 'Premium Only'}
          </div>
        </div>

        <div className="overview-card">
          <div className="card-header">
            <div className="card-header-content">
              <HiIdentification className="card-icon" />
              <h3>UID</h3>
            </div>
            <button className="edit-button disabled">
              <HiCalendarDays />
            </button>
          </div>
          <div className="card-value">{user.uid}</div>
          <div className="card-description">Joined after 84% of all users</div>
        </div>

        <div className="overview-card">
          <div className="card-header">
            <div className="card-header-content">
              <HiEye className="card-icon" />
              <h3>Profile Views</h3>
            </div>
            <button className="edit-button">
              <HiChartBar />
            </button>
          </div>
          <div className="card-value">{user.profileViews}</div>
          <div className="card-description">
            {weeklyViewsGrowth >= 0 ? '+' : ''}{weeklyViewsGrowth} views since last 7 days
          </div>
        </div>
      </div>

      {/* Account Statistics */}
      <div className="account-statistics">
        <h2>Account Statistics</h2>
        
        <div className="statistics-layout">
          <div className="profile-completion">
          <div className="completion-header">
            <h3>Profile Completion</h3>
            <span className="completion-percentage">{actualProfileCompletion}% completed</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${actualProfileCompletion}%` }}
            ></div>
          </div>
          {!isProfileComplete && (
            <>
              <div className="completion-alert">
                <HiExclamationTriangle className="alert-icon" />
                <span>Your profile isn't complete yet!</span>
              </div>
              <p className="completion-description">
                Complete your profile to make it more discoverable and appealing.
              </p>
            </>
          )}
          {isProfileComplete && (
            <>
              <div className="completion-alert" style={{ color: '#4ade80' }}>
                <HiShieldCheck className="alert-icon" />
                <span>Congratulations! Your profile is 100% complete!</span>
              </div>
              <p className="completion-description">
                Your profile is fully optimized and ready to impress visitors.
              </p>
            </>
          )}
          
          <div className="completion-tasks">
            <div 
              className={`task-item ${user.avatar_url ? 'completed' : ''}`}
              onClick={() => window.location.href = '/dashboard?section=customize'}
              style={{ cursor: 'pointer' }}
            >
              <HiCamera className={`task-icon ${user.avatar_url ? 'completed' : ''}`} />
              <span className="task-text">Upload An Avatar</span>
              {user.avatar_url ? (
                <HiShieldCheck className="task-icon completed" />
              ) : (
                <HiArrowTopRightOnSquare className="task-arrow" />
              )}
            </div>
            <div 
              className={`task-item ${(user.description || user.bio) ? 'completed' : ''}`}
              onClick={() => window.location.href = '/dashboard?section=customize'}
              style={{ cursor: 'pointer' }}
            >
              {(user.description || user.bio) ? (
                <HiShieldCheck className="task-icon completed" />
              ) : (
                <HiArrowTopRightOnSquare className="task-arrow" />
              )}
              <span className="task-text">Add A Description</span>
            </div>
            <div className={`task-item ${discordStatus.connected ? 'completed' : ''}`}>
              <SimpleIconComponent iconName="discord" size={20} customColor={discordStatus.connected ? "#4ade80" : "#58A4B0"} />
              <span className="task-text">
                {discordStatus.connected ? 'Discord Connected' : 'Link Discord Account'}
              </span>
              {discordStatus.connected ? (
                <HiShieldCheck className="task-icon completed" />
              ) : (
                <HiArrowTopRightOnSquare className="task-arrow" />
              )}
            </div>
            <div 
              className={`task-item ${(userLinks && userLinks.length > 0) ? 'completed' : ''}`}
              onClick={() => window.location.href = '/dashboard?section=links'}
              style={{ cursor: 'pointer' }}
            >
              {(userLinks && userLinks.length > 0) ? (
                <HiShieldCheck className="task-icon completed" />
              ) : (
                <HiArrowTopRightOnSquare className="task-arrow" />
              )}
              <span className="task-text">Add Socials</span>
            </div>
            <div 
              className={`task-item ${user.mfaEnabled || user.twoFactorEnabled ? 'completed' : ''}`}
              onClick={() => window.location.href = '/dashboard?section=settings'}
              style={{ cursor: 'pointer' }}
            >
              <HiFingerPrint className={`task-icon ${user.mfaEnabled || user.twoFactorEnabled ? 'completed' : ''}`} />
              <span className="task-text">
                {user.mfaEnabled || user.twoFactorEnabled ? '2FA Enabled' : 'Enable 2FA'}
              </span>
              {user.mfaEnabled || user.twoFactorEnabled ? (
                <HiShieldCheck className="task-icon completed" />
              ) : (
                <HiArrowTopRightOnSquare className="task-arrow" />
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <div className="manage-account">
            <h3>Manage your account</h3>
            <p>Change your email, username and more.</p>
            
            <div className="account-actions">
              <button className="action-button" onClick={() => setIsUsernameModalOpen(true)}>
                <HiPencilSquare className="action-icon" />
                Change Username
              </button>
              <button className="action-button" onClick={() => setIsDisplayNameModalOpen(true)}>
                <HiUserPlus className="action-icon" />
                Change Display Name
              </button>
              <button className="action-button" onClick={() => setIsAliasModalOpen(true)}>
                <HiAtSymbol className="action-icon" />
                Change Alias
              </button>
              {user.plan !== 'premium' && (
                <button className="action-button premium">
                  <HiSparkles className="action-icon" />
                  Want more? Unlock with Premium
                </button>
              )}
              <button className="action-button" onClick={() => window.location.href = '/dashboard?section=settings'}>
                <HiAdjustmentsHorizontal className="action-icon" />
                Account Settings
              </button>
            </div>
          </div>

          <div className="connections">
            <h3>Connections</h3>
            {discordStatus.connected ? (
              <div className="discord-connected">
                <div className="discord-user">
                  {discordStatus.avatar_url ? (
                    <img 
                      src={discordStatus.avatar_url} 
                      alt="Discord Avatar"
                      className="discord-avatar"
                    />
                  ) : (
                    <div className="discord-avatar-fallback">
                      <SimpleIconComponent iconName="discord" size={24} customColor="#5865f2" />
                    </div>
                  )}
                  <div className="discord-info">
                    <span className="discord-username">{discordStatus.discord_username || 'Discord User'}</span>
                    {discordStatus.is_booster && <span className="booster-badge">🚀 Server Booster</span>}
                  </div>
                </div>
                <button 
                  className="connect-button disconnect" 
                  onClick={disconnectDiscord}
                  disabled={disconnecting}
                >
                  <SimpleIconComponent iconName="discord" size={20} customColor="#ffffff" />
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            ) : (
              <>
                <p>Link your Discord account to gotchu.lol</p>
                <button 
                  className="connect-button" 
                  onClick={connectDiscord}
                  disabled={connecting}
                >
                  <SimpleIconComponent iconName="discord" size={20} customColor="#ffffff" />
                  {connecting ? 'Connecting...' : 'Connect Discord'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Username Modal */}
    <AccountSettingsModal
      isOpen={isUsernameModalOpen}
      onClose={() => setIsUsernameModalOpen(false)}
      user={user}
      onUsernameChange={handleUsernameChange}
    />

    {/* Display Name Modal */}
    <ChangeDisplayNameModal
      isOpen={isDisplayNameModalOpen}
      onClose={() => setIsDisplayNameModalOpen(false)}
      user={user}
      onDisplayNameChange={handleDisplayNameChange}
    />

    {/* Alias Modal */}
    <ChangeAliasModal
      isOpen={isAliasModalOpen}
      onClose={() => setIsAliasModalOpen(false)}
      user={user}
      onAliasChange={handleAliasChange}
    />
    </>
  )
}

export default OverviewSection