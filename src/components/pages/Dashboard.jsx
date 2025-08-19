import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { HiBars3 } from 'react-icons/hi2'
import { RiDashboardLine, RiBrushLine, RiLinksLine, RiVipCrownLine, RiAppsLine } from 'react-icons/ri'
import { HiHome, HiChartBar, HiShieldCheck, HiAdjustmentsHorizontal } from 'react-icons/hi2'

// Components
import ParticleBackground from '../effects/ParticleBackground'
import DashboardSidebar from '../dashboard/sidebar/Sidebar'
import OverviewSection from '../dashboard/sections/OverviewSection'
import CustomizationPage from './CustomizationPage'
import LinksSection from '../dashboard/LinksSection'
import TemplatesSection from '../dashboard/TemplatesSection'

// Hooks
import { useDashboard } from '../../hooks/dashboard/useDashboard'
import { useTheme } from '../../contexts/ThemeContext'

const Dashboard = ({ defaultSection = 'overview' }) => {
  const { colors } = useTheme()
  const [showNewCustomization, setShowNewCustomization] = useState(false)
  
  const {
    // State
    user,
    setUser,
    activeSection,
    setActiveSection,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    accountDropdownOpen,
    setAccountDropdownOpen,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    userLinks,
    setUserLinks,
    isLoading: loading,
    error,
    
    // Actions
    handleLogout
  } = useDashboard(defaultSection)

  // Sidebar configuration
  const sidebarItems = [
    { 
      id: 'overview', 
      icon: RiDashboardLine, 
      label: 'Account', 
      hasDropdown: true,
      dropdownItems: [
        { id: 'overview', icon: HiHome, label: 'Overview' },
        { id: 'analytics', icon: HiChartBar, label: 'Analytics' },
        { id: 'badges', icon: HiShieldCheck, label: 'Badges' },
        { id: 'settings', icon: HiAdjustmentsHorizontal, label: 'Settings' }
      ]
    },
    { id: 'customize', icon: RiBrushLine, label: 'Customize' },
    { id: 'links', icon: RiLinksLine, label: 'Links' },
    { id: 'premium', icon: RiVipCrownLine, label: 'Premium' },
    { id: 'templates', icon: RiAppsLine, label: 'Templates' }
  ]

  // Loading state
  if (loading) {
    return (
      <DashboardWrapper style={{ background: colors.background }}>
        <ParticleBackground />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </DashboardWrapper>
    )
  }

  // Error state
  if (error || !user) {
    return (
      <DashboardWrapper style={{ background: colors.background }}>
        <ParticleBackground />
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>{error || 'You need to be logged in to view this page'}</p>
          <button 
            className="cta-button"
            onClick={() => window.location.href = '/signin'}
          >
            Sign In
          </button>
        </div>
      </DashboardWrapper>
    )
  }

  // Show new customization page if enabled
  if (showNewCustomization) {
    return <CustomizationPage />
  }

  return (
    <DashboardWrapper style={{ background: colors.background }}>
      <ParticleBackground />
      
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <DashboardSidebar 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        sidebarItems={sidebarItems}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        accountDropdownOpen={accountDropdownOpen}
        setAccountDropdownOpen={setAccountDropdownOpen}
        user={user}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <MainContent>
        {/* Mobile menu button */}
        <button 
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <HiBars3 />
        </button>
        
        {/* Content Sections */}
        {activeSection === 'overview' && (
          <OverviewSection user={user} />
        )}

        {activeSection === 'customize' && (
          <CustomizationPage />
        )}

        {activeSection === 'links' && (
          <LinksSection 
            links={userLinks}
            setLinks={setUserLinks}
            user={user}
            setUser={setUser}
            setHasUnsavedChanges={setHasUnsavedChanges}
          />
        )}

        {activeSection === 'premium' && (
          <div className="section-content">
            <h1>Premium Plans</h1>
            <p>Upgrade to premium for exclusive features and customization options.</p>
            {/* Premium content will be implemented here */}
          </div>
        )}

        {activeSection === 'templates' && (
          <TemplatesSection />
        )}

        {/* Analytics, Badges, Settings sections would go here */}
        {activeSection === 'analytics' && (
          <div className="section-content">
            <h1>Analytics</h1>
            <p>View your profile analytics and insights.</p>
          </div>
        )}

        {activeSection === 'badges' && (
          <div className="section-content">
            <h1>Badges</h1>
            <p>Manage your profile badges and achievements.</p>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="section-content">
            <h1>Account Settings</h1>
            <p>Configure your account settings and preferences.</p>
          </div>
        )}
      </MainContent>
    </DashboardWrapper>
  )
}

// Styled Components (extracted from original for now, could be moved to separate file)
const DashboardWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
  background: #1a1a1a;

  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 15;
    backdrop-filter: blur(4px);
    
    @media (min-width: 769px) {
      display: none;
    }
  }

  .loading-container,
  .error-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #ffffff;
    z-index: 10;
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(88, 164, 176, 0.2);
      border-top: 3px solid #58A4B0;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .error-message {
      color: #ff6b6b;
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }
    
    .cta-button {
      background: linear-gradient(135deg, #58A4B0, #4a8a94);
      border: none;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(88, 164, 176, 0.3);
      }
    }
  }
`

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin-left: 260px;
  transition: margin-left 0.3s ease;
  
  @media (max-width: 768px) {
    margin-left: 0;
  }

  .mobile-menu-button {
    display: none;
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 5;
    background: rgba(88, 164, 176, 0.1);
    border: 1px solid rgba(88, 164, 176, 0.2);
    border-radius: 8px;
    padding: 0.75rem;
    color: #58A4B0;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    
    @media (max-width: 768px) {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    &:hover {
      background: rgba(88, 164, 176, 0.2);
      border-color: rgba(88, 164, 176, 0.4);
      transform: scale(1.05);
    }
    
    svg {
      font-size: 1.2rem;
    }
  }

  .section-content {
    flex: 1;
    padding: 2rem;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    margin: 1rem;
    border: 1px solid rgba(88, 164, 176, 0.1);
    
    @media (max-width: 768px) {
      margin: 0.5rem;
      padding: 1rem;
      border-radius: 15px;
    }
  }

  /* Overview Section Styles */
  .content-header {
    padding: 2rem 2rem 1rem 2rem;
    
    h1 {
      color: #ffffff;
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
    }
  }

  .overview-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 0 2rem 2rem 2rem;
    
    .overview-card {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
      border: 1px solid rgba(88, 164, 176, 0.15);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        border-color: rgba(88, 164, 176, 0.3);
        box-shadow: 0 8px 25px rgba(88, 164, 176, 0.1);
      }
      
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        
        .card-header-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          
          .card-icon {
            font-size: 1.25rem;
            color: #58A4B0;
          }
          
          h3 {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1rem;
            font-weight: 600;
            margin: 0;
          }
        }
        
        .edit-button {
          background: rgba(88, 164, 176, 0.1);
          border: 1px solid rgba(88, 164, 176, 0.2);
          border-radius: 6px;
          padding: 0.5rem;
          color: #58A4B0;
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover {
            background: rgba(88, 164, 176, 0.2);
            transform: scale(1.05);
          }
          
          &.premium {
            color: #ffd700;
            border-color: rgba(255, 215, 0, 0.2);
            background: rgba(255, 215, 0, 0.1);
          }
          
          &.disabled {
            color: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
            cursor: not-allowed;
          }
        }
      }
      
      .card-value {
        color: #ffffff;
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }
      
      .card-description {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.875rem;
      }
    }
  }

  .account-statistics {
    padding: 0 2rem 2rem 2rem;
    
    h2 {
      color: #ffffff;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }
    
    .profile-completion {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
      border: 1px solid rgba(88, 164, 176, 0.15);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      
      .completion-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        
        h3 {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }
        
        .completion-percentage {
          color: #58A4B0;
          font-weight: 600;
        }
      }
      
      .progress-bar {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        margin-bottom: 1rem;
        overflow: hidden;
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #58A4B0, #4a8a94);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
      }
      
      .completion-alert {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        
        .alert-icon {
          color: #ffa500;
          font-size: 1rem;
        }
        
        span {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          font-weight: 500;
        }
      }
      
      .completion-description {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.875rem;
        margin-bottom: 1.5rem;
        line-height: 1.5;
      }
      
      .completion-tasks {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        
        .task-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          transition: all 0.3s ease;
          
          &:hover {
            background: rgba(255, 255, 255, 0.06);
          }
          
          &.completed {
            background: rgba(88, 164, 176, 0.1);
            border: 1px solid rgba(88, 164, 176, 0.2);
          }
          
          .task-icon {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.5);
            
            &.completed {
              color: #58A4B0;
            }
          }
          
          .task-text {
            flex: 1;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            font-weight: 500;
          }
          
          .task-arrow {
            color: rgba(255, 255, 255, 0.4);
            font-size: 0.875rem;
          }
        }
      }
    }
  }

  .right-panel {
    padding: 0 2rem 2rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    
    .manage-account,
    .connections {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
      border: 1px solid rgba(88, 164, 176, 0.15);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      
      h3 {
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }
      
      p {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.875rem;
        margin: 0 0 1.5rem 0;
        line-height: 1.5;
      }
    }
    
    .account-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      
      .action-button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(88, 164, 176, 0.2);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: left;
        
        &:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(88, 164, 176, 0.3);
          transform: translateX(2px);
        }
        
        &.premium {
          border-color: rgba(255, 215, 0, 0.3);
          background: rgba(255, 215, 0, 0.1);
          color: #ffd700;
        }
        
        .action-icon {
          font-size: 1rem;
          color: #58A4B0;
        }
      }
    }
    
    .connect-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.875rem 1.5rem;
      background: #5865f2;
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: #4752c4;
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(88, 101, 242, 0.3);
      }
      
      .discord-icon {
        font-size: 1.1rem;
      }
    }
  }
`

export default Dashboard