import React, { useState } from 'react'
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
  HiAdjustmentsHorizontal
} from 'react-icons/hi2'
import { SimpleIconComponent } from '../../../utils/simpleIconsHelper.jsx'
import { useDiscord } from '../../../hooks/useDiscord'
import AccountSettingsModal from '../../modals/AccountSettingsModal'
import ChangeDisplayNameModal from '../../modals/ChangeDisplayNameModal'
import ChangeAliasModal from '../../modals/ChangeAliasModal'

const OverviewSection = ({ user, setUser }) => {
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)
  const [isDisplayNameModalOpen, setIsDisplayNameModalOpen] = useState(false)
  const [isAliasModalOpen, setIsAliasModalOpen] = useState(false)
  
  // Discord integration
  const { discordStatus, connecting, disconnecting, connectDiscord, disconnectDiscord } = useDiscord()

  // Handle username change
  const handleUsernameChange = async (newUsername) => {
    try {
      const token = localStorage.getItem('token')
      const sessionId = localStorage.getItem('sessionId')
      
      const response = await fetch('/api/auth/update-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Session-ID': sessionId || '',
        },
        credentials: 'include',
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
      const token = localStorage.getItem('token')
      const sessionId = localStorage.getItem('sessionId')
      
      const response = await fetch('/api/auth/update-display-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Session-ID': sessionId || '',
        },
        credentials: 'include',
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
      const token = localStorage.getItem('token')
      const sessionId = localStorage.getItem('sessionId')
      
      const response = await fetch('/api/auth/update-alias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Session-ID': sessionId || '',
        },
        credentials: 'include',
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
          <div className="card-description">+0 views since last 7 days</div>
        </div>
      </div>

      {/* Account Statistics */}
      <div className="account-statistics">
        <h2>Account Statistics</h2>
        
        <div className="statistics-layout">
          <div className="profile-completion">
          <div className="completion-header">
            <h3>Profile Completion</h3>
            <span className="completion-percentage">{user.profileCompletion}% completed</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${user.profileCompletion}%` }}
            ></div>
          </div>
          <div className="completion-alert">
            <HiExclamationTriangle className="alert-icon" />
            <span>Your profile isn't complete yet!</span>
          </div>
          <p className="completion-description">
            Complete your profile to make it more discoverable and appealing.
          </p>
          
          <div className="completion-tasks">
            <div className="task-item">
              <HiCamera className="task-icon" />
              <span className="task-text">Upload An Avatar</span>
              <HiArrowTopRightOnSquare className="task-arrow" />
            </div>
            <div className="task-item completed">
              <HiShieldCheck className="task-icon completed" />
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
            <div className="task-item completed">
              <HiShieldCheck className="task-icon completed" />
              <span className="task-text">Add Socials</span>
            </div>
            <div className="task-item">
              <HiFingerPrint className="task-icon" />
              <span className="task-text">Enable 2FA</span>
              <HiArrowTopRightOnSquare className="task-arrow" />
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
              <button className="action-button premium">
                <HiSparkles className="action-icon" />
                Want more? Unlock with Premium
              </button>
              <button className="action-button" onClick={() => setIsUsernameModalOpen(true)}>
                <HiAdjustmentsHorizontal className="action-icon" />
                Account Settings
              </button>
            </div>
          </div>

          <div className="connections">
            <h3>Connections</h3>
            <p>
              {discordStatus.connected 
                ? `Connected as ${discordStatus.discord_username || 'Discord User'}${discordStatus.is_booster ? ' 🚀 Server Booster' : ''}`
                : 'Link your Discord account to gotchu.lol'
              }
            </p>
            {discordStatus.connected ? (
              <button 
                className="connect-button disconnect" 
                onClick={disconnectDiscord}
                disabled={disconnecting}
              >
                <SimpleIconComponent iconName="discord" size={20} customColor="#ffffff" />
                {disconnecting ? 'Disconnecting...' : 'Disconnect Discord'}
              </button>
            ) : (
              <button 
                className="connect-button" 
                onClick={connectDiscord}
                disabled={connecting}
              >
                <SimpleIconComponent iconName="discord" size={20} customColor="#ffffff" />
                {connecting ? 'Connecting...' : 'Connect Discord'}
              </button>
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