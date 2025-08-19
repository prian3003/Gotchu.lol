import React from 'react'
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
  HiChatBubbleLeftEllipsis,
  HiFingerPrint,
  HiUserPlus,
  HiSparkles,
  HiAdjustmentsHorizontal,
  HiChatBubbleLeftRight
} from 'react-icons/hi2'

const OverviewSection = ({ user }) => {
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
            <button className="edit-button">
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
            <button className="edit-button premium">
              <HiStar />
            </button>
          </div>
          <div className="card-value">{user.alias}</div>
          <div className="card-description">Premium Only</div>
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
            <div className="task-item">
              <HiChatBubbleLeftEllipsis className="task-icon" />
              <span className="task-text">Link Discord Account</span>
              <HiArrowTopRightOnSquare className="task-arrow" />
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
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="manage-account">
          <h3>Manage your account</h3>
          <p>Change your email, username and more.</p>
          
          <div className="account-actions">
            <button className="action-button">
              <HiPencilSquare className="action-icon" />
              Change Username
            </button>
            <button className="action-button">
              <HiUserPlus className="action-icon" />
              Change Display Name
            </button>
            <button className="action-button premium">
              <HiSparkles className="action-icon" />
              Want more? Unlock with Premium
            </button>
            <button className="action-button">
              <HiAdjustmentsHorizontal className="action-icon" />
              Account Settings
            </button>
          </div>
        </div>

        <div className="connections">
          <h3>Connections</h3>
          <p>Link your Discord account to guns.lol</p>
          <button className="connect-button">
            <HiChatBubbleLeftRight className="discord-icon" />
            Connect Discord
          </button>
        </div>
      </div>
    </>
  )
}

export default OverviewSection