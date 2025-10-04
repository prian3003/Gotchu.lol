import React, { useState, useEffect, useMemo, useCallback } from 'react'
import styled from 'styled-components'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { HiBars3 } from 'react-icons/hi2'
import { RiDashboardLine, RiBrushLine, RiLinksLine, RiVipCrownLine, RiAppsLine } from 'react-icons/ri'
import { HiHome, HiChartBar, HiShieldCheck, HiAdjustmentsHorizontal, HiQuestionMarkCircle } from 'react-icons/hi2'

// Components
import ParticleBackground from '../effects/ParticleBackground'
import DashboardSidebar from '../dashboard/sidebar/Sidebar'
import OverviewSection from '../dashboard/sections/OverviewSection'
import AnalyticsSection from '../dashboard/sections/AnalyticsSection'
import BadgesSection from '../dashboard/sections/BadgesSection'
import SettingsSection from '../dashboard/sections/SettingsSection'
import CustomizationPage from './CustomizationPage'
import LinksSection from '../dashboard/LinksSection'
import TemplatesSection from '../dashboard/TemplatesSection'
import PremiumModal from '../modals/PremiumModal'

// Hooks
import { useDashboard } from '../../hooks/dashboard/useDashboard'
import { useTheme } from '../../contexts/ThemeContext'

const Dashboard = ({ defaultSection = 'overview' }) => {
  const { colors } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showNewCustomization, setShowNewCustomization] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  
  // Get current section from URL or use default
  const currentSection = searchParams.get('section') || defaultSection
  
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
    handleLogout,
    fetchLinks,
    fetchDashboardData
  } = useDashboard(currentSection)

  // Function to refresh user data after MFA operations
  const refreshUserData = useCallback(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Function to handle section changes with URL updates
  const handleSectionChange = useCallback((sectionId) => {
    if (sectionId === 'premium') {
      setShowPremiumModal(true)
      return
    }
    
    // Prevent unnecessary updates if already on this section
    if (sectionId === activeSection) {
      return
    }
    
    // Update URL with new section
    const newSearchParams = new URLSearchParams(searchParams)
    if (sectionId === 'overview') {
      newSearchParams.delete('section') // Remove section param for overview (default)
    } else {
      newSearchParams.set('section', sectionId)
    }
    setSearchParams(newSearchParams)
    // Don't call setActiveSection here as useEffect will handle it
  }, [activeSection, searchParams, setSearchParams])

  // Handle URL-based section synchronization (single source of truth)
  useEffect(() => {
    const urlSection = searchParams.get('section')
    const targetSection = urlSection || 'overview'
    
    // Validate section exists to prevent invalid URLs (premium excluded as it's modal)
    const validSections = ['overview', 'analytics', 'badges', 'settings', 'customize', 'links', 'templates']
    const finalSection = validSections.includes(targetSection) ? targetSection : 'overview'
    
    // Only update if different to prevent loops
    if (finalSection !== activeSection) {
      setActiveSection(finalSection)
    }
  }, [searchParams, setActiveSection]) // Removed activeSection from deps to prevent loops

  // Handle premium section click - show modal instead of section
  useEffect(() => {
    if (activeSection === 'premium') {
      setShowPremiumModal(true)
      // Reset to overview and update URL to prevent premium from staying in URL
      handleSectionChange('overview')
    }
  }, [activeSection, handleSectionChange])

  // Sidebar configuration
  const sidebarItems = [
    { 
      id: 'overview', 
      icon: RiDashboardLine, 
      label: 'Account', 
      hasDropdown: true,
      dropdownItems: [
        { id: 'overview', icon: HiHome, label: 'Overview', route: '/dashboard' },
        { id: 'analytics', icon: HiChartBar, label: 'Analytics', route: '/dashboard?section=analytics' },
        { id: 'badges', icon: HiShieldCheck, label: 'Badges', route: '/dashboard?section=badges' },
        { id: 'settings', icon: HiAdjustmentsHorizontal, label: 'Settings', route: '/dashboard?section=settings' }
      ]
    },
    { id: 'customize', icon: RiBrushLine, label: 'Customize', route: '/dashboard?section=customize' },
    { id: 'links', icon: RiLinksLine, label: 'Links', route: '/dashboard?section=links' },
    { id: 'premium', icon: RiVipCrownLine, label: 'Premium' },
    { id: 'templates', icon: RiAppsLine, label: 'Templates', route: '/dashboard?section=templates' }
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
        setActiveSection={handleSectionChange}
        accountDropdownOpen={accountDropdownOpen}
        setAccountDropdownOpen={setAccountDropdownOpen}
        user={user}
        handleLogout={handleLogout}
        navigate={navigate}
      />

      {/* Main Content */}
      <MainContent className={sidebarCollapsed ? 'sidebar-collapsed' : ''}>
        {/* Mobile menu button */}
        <button 
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <HiBars3 />
        </button>
        
        {/* Content Sections */}
        {activeSection === 'overview' && (
          <OverviewSection user={user} setUser={setUser} userLinks={userLinks} />
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
            fetchLinks={fetchLinks}
          />
        )}


        {activeSection === 'templates' && (
          <TemplatesSection />
        )}

        {activeSection === 'analytics' && (
          <AnalyticsSection user={user} />
        )}

        {activeSection === 'badges' && (
          <BadgesSection user={user} onOpenPremiumModal={() => setShowPremiumModal(true)} />
        )}

        {activeSection === 'settings' && (
          <SettingsSection user={user} onUserUpdate={refreshUserData} />
        )}
      </MainContent>

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
      />
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
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.sidebar-collapsed {
    margin-left: 64px;
  }
  
  @media (max-width: 768px) {
    margin-left: 0;
    
    &.sidebar-collapsed {
      margin-left: 0;
    }
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
    
    .statistics-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: start;
      
      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
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
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        
        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
        
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
      
      &.disconnect {
        background: #ed4245;
        
        &:hover {
          background: #c23637;
          box-shadow: 0 4px 15px rgba(237, 66, 69, 0.3);
        }
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        
        &:hover {
          transform: none;
          box-shadow: none;
        }
      }
      
      .discord-icon {
        font-size: 1.1rem;
      }
    }
    
    .discord-connected {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .discord-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(88, 101, 242, 0.1);
      border: 1px solid rgba(88, 101, 242, 0.2);
      border-radius: 8px;
    }
    
    .discord-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid rgba(88, 101, 242, 0.3);
    }
    
    .discord-avatar-fallback {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(88, 101, 242, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(88, 101, 242, 0.3);
    }
    
    .discord-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .discord-username {
      color: #ffffff;
      font-weight: 600;
      font-size: 0.95rem;
    }
    
    .booster-badge {
      color: #f093fb;
      font-size: 0.8rem;
      font-weight: 500;
    }
  }

  /* Analytics Section Styles */
  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    padding: 0 2rem 2rem 2rem;
  }

  .analytics-section {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
    border: 1px solid rgba(88, 164, 176, 0.15);
    border-radius: 12px;
    padding: 1.5rem;
    backdrop-filter: blur(10px);

    h2 {
      color: #ffffff;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }
  }

  .analytics-card {
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

    .trend-indicator {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      
      &.positive {
        background: rgba(16, 185, 129, 0.2);
        color: #10B981;
      }
      
      &.negative {
        background: rgba(239, 68, 68, 0.2);
        color: #EF4444;
      }
    }

    .card-description.positive {
      color: #10B981;
    }
    
    .card-description.negative {
      color: #EF4444;
    }
  }

  .geo-stats, .pages-stats {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .geo-item, .page-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    .geo-info, .page-info {
      flex: 1;
      min-width: 0;
      
      .country-name, .page-path {
        display: block;
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.9rem;
        font-weight: 500;
      }
      
      .country-views, .page-views {
        display: block;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8rem;
      }
    }
    
    .progress-bar {
      width: 60px;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #58A4B0, #4a8a94);
        border-radius: 2px;
        transition: width 0.3s ease;
      }
    }
    
    .percentage {
      color: #58A4B0;
      font-size: 0.8rem;
      font-weight: 600;
      min-width: 35px;
      text-align: right;
    }
  }

  .device-stats {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .device-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    .device-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 80px;
      
      .device-icon {
        font-size: 1rem;
        color: #58A4B0;
      }
      
      .device-label {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.9rem;
        font-weight: 500;
      }
    }
    
    .device-progress {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .progress-bar {
        flex: 1;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
        
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
          
          &.mobile {
            background: linear-gradient(90deg, #58A4B0, #4a8a94);
          }
          
          &.desktop {
            background: linear-gradient(90deg, #8B5CF6, #7C3AED);
          }
          
          &.tablet {
            background: linear-gradient(90deg, #F59E0B, #D97706);
          }
        }
      }
      
      .device-percentage {
        color: #58A4B0;
        font-size: 0.9rem;
        font-weight: 600;
        min-width: 40px;
        text-align: right;
      }
    }
  }

  .engagement-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
  }

  .engagement-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateY(-2px);
    }
    
    .engagement-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.likes {
        background: rgba(239, 68, 68, 0.2);
        
        .engagement-icon {
          color: #EF4444;
          font-size: 1.1rem;
        }
      }
      
      &.shares {
        background: rgba(16, 185, 129, 0.2);
        
        .engagement-icon {
          color: #10B981;
          font-size: 1rem;
        }
      }
      
      &.downloads {
        background: rgba(88, 164, 176, 0.2);
        
        .engagement-icon {
          color: #58A4B0;
          font-size: 1rem;
        }
      }
    }
    
    .engagement-info {
      text-align: center;
      
      .engagement-value {
        display: block;
        color: #ffffff;
        font-size: 1.3rem;
        font-weight: 700;
        line-height: 1;
      }
      
      .engagement-label {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8rem;
        font-weight: 500;
      }
    }
  }

  /* Badges Section Styles */
  .badges-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    padding: 0 2rem 2rem 2rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
    border: 1px solid rgba(88, 164, 176, 0.15);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: rgba(88, 164, 176, 0.3);
      box-shadow: 0 8px 25px rgba(88, 164, 176, 0.1);
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.earned {
        background: rgba(16, 185, 129, 0.2);
        
        .stat-icon {
          color: #10B981;
          font-size: 1.5rem;
        }
      }
      
      &.available {
        background: rgba(88, 164, 176, 0.2);
        
        .stat-icon {
          color: #58A4B0;
          font-size: 1.5rem;
        }
      }
      
      &.total {
        background: rgba(139, 92, 246, 0.2);
        
        .stat-icon {
          color: #8B5CF6;
          font-size: 1.5rem;
        }
      }
    }

    .stat-info {
      .stat-value {
        display: block;
        color: #ffffff;
        font-size: 1.8rem;
        font-weight: 700;
        line-height: 1;
      }
      
      .stat-label {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
        font-weight: 500;
      }
    }
  }

  .category-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0 2rem 2rem 2rem;

    .category-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(88, 164, 176, 0.2);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(88, 164, 176, 0.1);
        border-color: rgba(88, 164, 176, 0.3);
      }

      &.active {
        background: linear-gradient(135deg, #58A4B0, #4a8a94);
        border-color: #58A4B0;
        color: #ffffff;
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(88, 164, 176, 0.2);
      }

      .category-icon {
        font-size: 1rem;
      }
    }
  }

  .badges-section {
    padding: 0 2rem 2rem 2rem;

    h2 {
      color: #ffffff;
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
  }

  .badges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .badge-card {
    position: relative;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
    border: 1px solid rgba(88, 164, 176, 0.15);
    border-radius: 12px;
    padding: 1.5rem;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    overflow: hidden;

    &:hover {
      transform: translateY(-2px);
      border-color: rgba(88, 164, 176, 0.3);
      box-shadow: 0 8px 25px rgba(88, 164, 176, 0.1);
    }

    &.earned {
      border-color: rgba(16, 185, 129, 0.3);
      
      &:hover {
        border-color: rgba(16, 185, 129, 0.5);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.1);
      }
    }

    .badge-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      .badge-icon-wrapper {
        position: relative;
        width: 48px;
        height: 48px;
        border: 2px solid;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.2);

        .badge-icon {
          font-size: 1.3rem;
        }

        .earned-indicator {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          background: #10B981;
          border: 2px solid #1a1a1a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 0.7rem;
        }
      }

      .badge-rarity {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .badge-content {
      .badge-name {
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .badge-description {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
        line-height: 1.4;
        margin: 0 0 1rem 0;
      }

      .badge-earned-info {
        .earned-date {
          color: #10B981;
          font-size: 0.8rem;
          font-weight: 500;
        }
      }

      .badge-progress-info {
        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.5rem;

          .progress-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.3s ease;
          }
        }

        .progress-text {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
        }
      }
    }

    .badge-locked {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);

      .lock-icon {
        color: rgba(255, 255, 255, 0.5);
        font-size: 2rem;
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: rgba(255, 255, 255, 0.6);

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: rgba(88, 164, 176, 0.3);
    }

    h3 {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.2rem;
      margin: 0 0 0.5rem 0;
    }

    p {
      margin: 0;
    }
  }

  /* Settings Section Styles */
  .settings-layout {
    display: flex;
    gap: 2rem;
    padding: 0 2rem 2rem 2rem;
    min-height: 600px;

    @media (max-width: 1024px) {
      flex-direction: column;
    }
  }

  .settings-sidebar {
    width: 240px;
    flex-shrink: 0;

    @media (max-width: 1024px) {
      width: 100%;
      display: flex;
      overflow-x: auto;
      gap: 0.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(88, 164, 176, 0.15);
    }

    .settings-tab {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(88, 164, 176, 0.15);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 0.5rem;

      @media (max-width: 1024px) {
        white-space: nowrap;
        min-width: fit-content;
        margin-bottom: 0;
      }

      &:hover {
        background: rgba(88, 164, 176, 0.1);
        border-color: rgba(88, 164, 176, 0.3);
        transform: translateX(4px);

        @media (max-width: 1024px) {
          transform: translateY(-2px);
        }
      }

      &.active {
        background: linear-gradient(135deg, #58A4B0, #4a8a94);
        border-color: #58A4B0;
        color: #ffffff;
        transform: translateX(8px);
        box-shadow: 0 4px 15px rgba(88, 164, 176, 0.2);

        @media (max-width: 1024px) {
          transform: translateY(-2px);
        }
      }

      .tab-icon {
        font-size: 1rem;
      }
    }
  }

  .settings-content {
    flex: 1;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
    border: 1px solid rgba(88, 164, 176, 0.15);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    overflow: hidden;
  }

  .settings-section {
    padding: 1.5rem;

    .section-header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(88, 164, 176, 0.15);

      h2 {
        color: #ffffff;
        font-size: 1.3rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      p {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
        margin: 0;
      }
    }

    .settings-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
      }

      &.security-item {
        align-items: flex-start;
      }

      &.danger {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);

        .setting-label.danger {
          color: #EF4444;
        }
      }

      .setting-info {
        flex: 1;

        .setting-label {
          display: block;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .setting-description {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          margin: 0;
          line-height: 1.4;
        }
      }

      .toggle-switch {
        width: 48px;
        height: 24px;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;

        &.enabled {
          background: linear-gradient(135deg, #58A4B0, #4a8a94);
          border-color: #58A4B0;
          box-shadow: 0 2px 8px rgba(88, 164, 176, 0.3);
        }

        &.disabled {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.1);
        }

        &:hover {
          transform: scale(1.05);
          
          &.enabled {
            box-shadow: 0 4px 12px rgba(88, 164, 176, 0.4);
          }
          
          &.disabled {
            background: rgba(255, 255, 255, 0.15);
          }
        }

        .toggle-thumb {
          width: 20px;
          height: 20px;
          background: #ffffff;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

          &.enabled {
            transform: translateX(24px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }

          &.disabled {
            transform: translateX(0);
          }
        }
      }

      .setting-select, .setting-input, .setting-textarea {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(88, 164, 176, 0.2);
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        color: #ffffff;
        font-size: 0.9rem;
        min-width: 180px;

        &:focus {
          outline: none;
          border-color: #58A4B0;
          box-shadow: 0 0 0 3px rgba(88, 164, 176, 0.1);
        }
      }

      .setting-textarea {
        resize: vertical;
        min-height: 80px;
        font-family: inherit;
      }

      .security-actions {
        display: flex;
        align-items: center;
        gap: 1rem;

        .security-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          &.enabled {
            .status-icon {
              color: #10B981;
            }

            span {
              color: #10B981;
              font-weight: 500;
            }
          }

          .disable-button {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 6px;
            padding: 0.4rem 0.8rem;
            color: #EF4444;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;

            &:hover {
              background: rgba(239, 68, 68, 0.2);
            }
          }
        }

        .enable-2fa-button, .change-password-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #58A4B0, #4a8a94);
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(88, 164, 176, 0.2);
          }

          .button-icon {
            font-size: 1rem;
          }
        }
      }

      .delete-account-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 6px;
        padding: 0.5rem 1rem;
        color: #EF4444;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(239, 68, 68, 0.3);
          transform: translateY(-1px);
        }

        .button-icon {
          font-size: 1rem;
        }
      }
    }

    .danger-zone {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(239, 68, 68, 0.2);

      h3 {
        color: #EF4444;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 1rem 0;
      }
    }
  }

  .settings-footer {
    padding: 1rem 1.5rem;
    background: rgba(255, 255, 255, 0.03);
    border-top: 1px solid rgba(88, 164, 176, 0.15);

    .save-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #58A4B0, #4a8a94);
      border: none;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      color: #ffffff;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(88, 164, 176, 0.3);
      }

      .button-icon {
        font-size: 1rem;
      }
    }
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;

    .modal-content {
      background: linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(26, 26, 26, 0.9));
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      padding: 2rem;
      max-width: 400px;
      backdrop-filter: blur(20px);
      text-align: center;

      .modal-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;

        .warning-icon {
          color: #EF4444;
          font-size: 2rem;
        }

        h3 {
          color: #EF4444;
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0;
        }
      }

      p {
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.5;
        margin-bottom: 2rem;
      }

      .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;

        .cancel-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        }

        .delete-button {
          background: #EF4444;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          color: #ffffff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: #DC2626;
            transform: translateY(-1px);
          }
        }
      }
    }
  }

  /* Compact 2FA Modal Styles */
  .twofa-modal-content {
    background: rgba(26, 26, 26, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    padding: 1.5rem;
    width: 100%;
    max-width: 420px;
    border: 1px solid rgba(88, 164, 176, 0.3);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);

    .twofa-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .back-btn {
          width: 28px;
          height: 28px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
          }
        }

        .title-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .title-icon {
            color: #58A4B0;
            font-size: 1.25rem;
          }

          h3 {
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0;
          }
        }
      }

      .close-btn {
        width: 28px;
        height: 28px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.3);
          color: #EF4444;
        }
      }
    }

    .progress-steps {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;

      .progress-step {
        flex: 1;
        height: 3px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        transition: all 0.3s ease;

        &.active {
          background: linear-gradient(90deg, #58A4B0, #4a8a94);
          box-shadow: 0 0 8px rgba(88, 164, 176, 0.3);
        }
      }
    }

    .twofa-content {
      .content-main {
        text-align: center;
        margin-bottom: 1.5rem;

        h4 {
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        > p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          margin: 0 0 1rem 0;
        }

        .app-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;

          .app-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(88, 164, 176, 0.2);
            border-radius: 8px;
            transition: all 0.3s ease;

            &:hover {
              background: rgba(88, 164, 176, 0.1);
              border-color: rgba(88, 164, 176, 0.3);
            }

            .app-icon {
              color: #58A4B0;
              font-size: 1.5rem;
            }

            span {
              color: rgba(255, 255, 255, 0.9);
              font-size: 0.8rem;
              font-weight: 500;
            }
          }
        }

        .qr-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;

          .qr-code-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(88, 164, 176, 0.3);
            border-radius: 12px;
            
            svg {
              max-width: 160px;
              height: auto;
              border-radius: 8px;
              margin-bottom: 0.75rem;
            }

            small {
              color: rgba(255, 255, 255, 0.7);
              font-size: 0.8rem;
              font-weight: 500;
            }
          }

          .qr-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1.5rem;
            background: rgba(255, 255, 255, 0.05);
            border: 2px dashed rgba(88, 164, 176, 0.3);
            border-radius: 12px;

            .qr-icon {
              font-size: 3rem;
              color: rgba(88, 164, 176, 0.6);
              margin-bottom: 0.5rem;
            }

            small {
              color: rgba(255, 255, 255, 0.6);
              font-size: 0.8rem;
            }
          }

          .secret-section {
            span {
              color: rgba(255, 255, 255, 0.8);
              font-size: 0.8rem;
              display: block;
              margin-bottom: 0.5rem;
            }

            .secret-key {
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(88, 164, 176, 0.2);
              border-radius: 8px;
              padding: 0.75rem;

              code {
                color: #58A4B0;
                font-family: 'Monaco', 'Courier New', monospace;
                font-size: 0.9rem;
                font-weight: 600;
                letter-spacing: 1px;
              }

              .copy-btn {
                background: rgba(88, 164, 176, 0.2);
                border: none;
                border-radius: 6px;
                padding: 0.4rem;
                color: #58A4B0;
                cursor: pointer;
                transition: all 0.3s ease;

                &:hover:not(:disabled) {
                  background: rgba(88, 164, 176, 0.3);
                  transform: scale(1.1);
                }

                &:disabled {
                  opacity: 0.5;
                  cursor: not-allowed;
                }
              }
            }
          }
        }

        .code-input {
          width: 180px;
          height: 50px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(88, 164, 176, 0.3);
          border-radius: 10px;
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 600;
          text-align: center;
          letter-spacing: 6px;
          margin-bottom: 1rem;
          transition: all 0.3s ease;

          &:focus {
            outline: none;
            border-color: #58A4B0;
            box-shadow: 0 0 0 3px rgba(88, 164, 176, 0.2);
          }

          &::placeholder {
            color: rgba(255, 255, 255, 0.4);
            letter-spacing: 6px;
          }
        }

        .success-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          margin-top: 1rem;

          .success-icon {
            color: #10B981;
            font-size: 2rem;
          }

          > span {
            color: #10B981;
            font-weight: 600;
          }

          .backup-codes-compact {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            span {
              color: rgba(255, 255, 255, 0.8);
              font-size: 0.85rem;
            }

            .copy-backup-btn {
              display: flex;
              align-items: center;
              gap: 0.4rem;
              background: rgba(88, 164, 176, 0.2);
              border: 1px solid rgba(88, 164, 176, 0.3);
              border-radius: 6px;
              padding: 0.4rem 0.75rem;
              color: #58A4B0;
              font-size: 0.8rem;
              cursor: pointer;
              transition: all 0.3s ease;

              &:hover {
                background: rgba(88, 164, 176, 0.3);
                transform: translateY(-1px);
              }
            }
          }
        }
      }

      .action-buttons {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;

        .cancel-btn, .back-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 0.6rem 1.25rem;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
          }
        }

        .continue-btn, .enable-btn, .done-btn {
          background: linear-gradient(135deg, #58A4B0, #4a8a94);
          border: none;
          border-radius: 8px;
          padding: 0.6rem 1.25rem;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(88, 164, 176, 0.3);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
        }
      }
    }
  }

  /* Modal Alert Styles (inside 2FA modal) */
  .modal-alert {
    background: rgba(88, 164, 176, 0.1);
    border: 1px solid rgba(88, 164, 176, 0.3);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;

    .alert-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;

      .alert-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        flex-shrink: 0;

        &.success {
          background: rgba(34, 197, 94, 0.2);
          color: #22C55E;
          border: 2px solid rgba(34, 197, 94, 0.3);
        }

        &.error {
          background: rgba(239, 68, 68, 0.2);
          color: #EF4444;
          border: 2px solid rgba(239, 68, 68, 0.3);
        }

        &.warning {
          background: rgba(245, 158, 11, 0.2);
          color: #F59E0B;
          border: 2px solid rgba(245, 158, 11, 0.3);
        }
      }

      .alert-title {
        color: #ffffff;
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        text-align: left;
      }
    }

    .alert-message {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.875rem;
      line-height: 1.4;
      margin: 0 0 1.25rem 0;
      text-align: left;
    }

    .alert-actions {
      display: flex;
      justify-content: flex-end;

      .alert-button {
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1.25rem;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;

        &.success {
          background: linear-gradient(135deg, #22C55E, #16A34A);
          color: #ffffff;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
          }
        }

        &.error {
          background: linear-gradient(135deg, #EF4444, #DC2626);
          color: #ffffff;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
          }
        }

        &.warning {
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: #ffffff;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
          }
        }
      }
    }
  }

  /* Spinner Styles */
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-right: 0.5rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes slideDown {
    0% { 
      transform: translate(-50%, -100%);
      opacity: 0;
    }
    100% { 
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }

  /* Button loading state */
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    .spinner {
      border-top-color: rgba(255, 255, 255, 0.7);
    }
  }
`

export default Dashboard