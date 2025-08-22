import React from 'react'
import styled from 'styled-components'
import { 
  HiBars3, 
  HiXMark, 
  HiChevronUp, 
  HiChevronDown,
  HiQuestionMarkCircle,
  HiArrowTopRightOnSquare,
  HiArrowRightOnRectangle
} from 'react-icons/hi2'

const DashboardSidebar = ({ 
  sidebarCollapsed, 
  setSidebarCollapsed, 
  mobileMenuOpen, 
  sidebarItems, 
  activeSection, 
  setActiveSection, 
  accountDropdownOpen, 
  setAccountDropdownOpen,
  user,
  handleLogout,
  navigate
}) => {
  return (
    <Sidebar className={`${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo">
          <img src="/favicon.ico" alt="gotchu.lol" className="logo-icon" />
          {!sidebarCollapsed && <span className="logo-text">gotchu.lol</span>}
        </div>
        <button 
          className="collapse-button"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <HiBars3 /> : <HiXMark />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="nav-menu">
        {sidebarItems.map((item) => {
          const IconComponent = item.icon
          return (
            <div key={item.id} className="nav-item">
              <div 
                className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                title={sidebarCollapsed ? item.label : ''}
                onClick={() => {
                  if (item.route && navigate && !item.hasDropdown) {
                    navigate(item.route)
                  } else {
                    setActiveSection(item.id)
                    if (item.hasDropdown) {
                      setAccountDropdownOpen(!accountDropdownOpen)
                    } else {
                      setAccountDropdownOpen(false)
                    }
                  }
                }}
              >
                <div className="nav-link-content">
                  <IconComponent className="nav-icon" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      {item.hasDropdown && (
                        <div className={`dropdown-arrow ${accountDropdownOpen ? 'open' : ''}`}>
                          {accountDropdownOpen ? <HiChevronUp /> : <HiChevronDown />}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {item.hasDropdown && accountDropdownOpen && !sidebarCollapsed && (
                <div className="dropdown-menu">
                  {item.dropdownItems.map((dropdownItem) => {
                    const DropdownIcon = dropdownItem.icon
                    return (
                      <div 
                        key={dropdownItem.id}
                        className={`dropdown-item ${activeSection === dropdownItem.id ? 'active' : ''}`}
                        title={sidebarCollapsed ? dropdownItem.label : ''}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (dropdownItem.route && navigate) {
                            navigate(dropdownItem.route)
                          } else {
                            setActiveSection(dropdownItem.id)
                          }
                        }}
                      >
                        <DropdownIcon className="dropdown-icon" />
                        <span className="dropdown-label">{dropdownItem.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-bottom">
        {!sidebarCollapsed && (
          <>
            <div className="help-section">
              <p className="help-text">Have a question or need support?</p>
              <button className="help-button">
                <HiQuestionMarkCircle className="help-icon" />
                <span>Help Center</span>
              </button>
            </div>
            
            <div className="my-page-section">
              <p className="my-page-text">Check out your page</p>
              <button 
                className="my-page-button"
                onClick={() => window.open(`/${user?.username}`, '_blank')}
              >
                <HiArrowTopRightOnSquare className="share-icon" />
                <span>My Page</span>
              </button>
            </div>
          </>
        )}
        
        {/* User Section */}
        <div className="user-section">
          {!sidebarCollapsed && user && (
            <div className="user-info">
              <div className="user-avatar">
                {user.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">{user.username}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
          )}
          <button className="user-menu-button" onClick={handleLogout}>
            <HiArrowRightOnRectangle />
          </button>
        </div>
      </div>
    </Sidebar>
  )
}

const Sidebar = styled.div`
  width: 260px;
  height: 100vh;
  background: linear-gradient(145deg, rgba(15, 15, 25, 0.98), rgba(25, 25, 35, 0.95));
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(88, 164, 176, 0.15);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(88, 164, 176, 0.3) transparent;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(88, 164, 176, 0.3);
    border-radius: 3px;
    
    &:hover {
      background: rgba(88, 164, 176, 0.5);
    }
  }
  
  &.collapsed {
    width: 64px;
    
    .sidebar-header .logo .logo-text {
      opacity: 0;
      transform: translateX(-10px);
      pointer-events: none;
    }
    
    .nav-menu .nav-item .nav-link .nav-link-content {
      justify-content: center;
      
      .nav-label {
        opacity: 0;
        transform: translateX(-10px);
        pointer-events: none;
      }
      
      .dropdown-arrow {
        opacity: 0;
        transform: translateX(-10px);
        pointer-events: none;
      }
    }
    
    .dropdown-menu {
      display: none !important;
    }
    
    .sidebar-bottom {
      .help-section,
      .my-page-section {
        display: none;
      }
      
      .user-section .user-info {
        display: none;
      }
    }
  }
  
  @media (max-width: 768px) {
    transform: translateX(-100%);
    z-index: 20;
    
    &.mobile-open {
      transform: translateX(0);
    }
    
    &.collapsed {
      width: 260px;
      transform: translateX(-100%);
      
      &.mobile-open {
        transform: translateX(0);
      }
    }
  }
  
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1rem;
    border-bottom: 1px solid rgba(88, 164, 176, 0.1);
    background: linear-gradient(145deg, rgba(88, 164, 176, 0.08), rgba(88, 164, 176, 0.03));
    
    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      .logo-icon {
        font-size: 1.4rem;
        color: #58A4B0;
        filter: drop-shadow(0 0 6px rgba(88, 164, 176, 0.3));
        transition: all 0.3s ease;
        
        &:hover {
          transform: rotate(15deg) scale(1.1);
          filter: drop-shadow(0 0 10px rgba(88, 164, 176, 0.5));
        }
      }
      
      .logo-text {
        font-size: 1rem;
        font-weight: 700;
        background: linear-gradient(135deg, #58A4B0, #4A8C96);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        transition: all 0.3s ease;
      }
    }
    
    .collapse-button {
      background: rgba(88, 164, 176, 0.1);
      border: 1px solid rgba(88, 164, 176, 0.2);
      border-radius: 6px;
      padding: 0.4rem;
      color: #58A4B0;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background: rgba(88, 164, 176, 0.2);
        border-color: rgba(88, 164, 176, 0.4);
        transform: scale(1.05);
      }
      
      svg {
        font-size: 1rem;
      }
    }
  }
  
  .nav-menu {
    flex: 1;
    padding: 0.5rem 0;
    
    .nav-item {
      margin: 0.15rem 0;
      position: relative;
      
      .nav-link {
        margin: 0 0.75rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        display: block;
        
        &:visited, &:hover, &:focus, &:active {
          text-decoration: none;
          color: inherit;
        }
        
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(88, 164, 176, 0.1), rgba(88, 164, 176, 0.05));
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: 8px;
        }
        
        &:hover::before {
          opacity: 1;
        }
        
        &.active {
          background: linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1));
          border: 1px solid rgba(88, 164, 176, 0.3);
          box-shadow: 0 4px 15px rgba(88, 164, 176, 0.15);
          
          &::before {
            opacity: 0;
          }
          
          .nav-icon {
            color: #58A4B0;
            filter: drop-shadow(0 0 6px rgba(88, 164, 176, 0.4));
          }
          
          .nav-label {
            color: #ffffff;
            font-weight: 600;
          }
        }
        
        .nav-link-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          position: relative;
          z-index: 1;
          
          .nav-icon {
            font-size: 1.2rem;
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.3s ease;
            flex-shrink: 0;
          }
          
          .nav-label {
            color: rgba(255, 255, 255, 0.85);
            font-weight: 500;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            white-space: nowrap;
          }
          
          .dropdown-arrow {
            margin-left: auto;
            color: rgba(255, 255, 255, 0.6);
            transition: all 0.3s ease;
            
            &.open {
              transform: rotate(180deg);
            }
          }
        }
        
        &:hover .nav-icon {
          color: #58A4B0;
          transform: scale(1.1);
        }
        
        &:hover .nav-label {
          color: #ffffff;
        }
      }
      
      .dropdown-menu {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        margin: 0.5rem 0.75rem 0.75rem 0.75rem;
        border: 1px solid rgba(88, 164, 176, 0.1);
        overflow: hidden;
        
        .dropdown-item {
          padding: 0.75rem 1rem 0.75rem 3rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border-bottom: 1px solid rgba(88, 164, 176, 0.05);
          
          &:last-child {
            border-bottom: none;
          }
          
          .dropdown-icon {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.6);
            transition: all 0.3s ease;
          }
          
          .dropdown-label {
            color: rgba(255, 255, 255, 0.75);
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          
          &:hover {
            background: rgba(88, 164, 176, 0.1);
            
            .dropdown-icon {
              color: #58A4B0;
            }
            
            .dropdown-label {
              color: #ffffff;
            }
          }
          
          &.active {
            background: rgba(88, 164, 176, 0.15);
            border-left: 3px solid #58A4B0;
            
            .dropdown-icon {
              color: #58A4B0;
            }
            
            .dropdown-label {
              color: #ffffff;
              font-weight: 600;
            }
          }
        }
      }
    }
  }

  .sidebar-bottom {
    padding: 1rem;
    border-top: 1px solid rgba(88, 164, 176, 0.1);
    margin-top: auto;

    .help-section,
    .my-page-section {
      margin-bottom: 1rem;

      .help-text,
      .my-page-text {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8rem;
        margin: 0 0 0.5rem 0;
        line-height: 1.4;
      }

      .help-button,
      .my-page-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.75rem;
        background: rgba(88, 164, 176, 0.1);
        border: 1px solid rgba(88, 164, 176, 0.2);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(88, 164, 176, 0.2);
          border-color: rgba(88, 164, 176, 0.3);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .help-icon,
        .share-icon {
          font-size: 1rem;
          color: #58A4B0;
        }
      }
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(88, 164, 176, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(88, 164, 176, 0.1);

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #58A4B0, #4a8a94);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .user-details {
          display: flex;
          flex-direction: column;

          .user-name {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.85rem;
            font-weight: 600;
          }

          .user-email {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.75rem;
          }
        }
      }

      .user-menu-button {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 77, 77, 0.2);
          border-color: rgba(255, 77, 77, 0.3);
          color: #ff4d4d;
          transform: scale(1.05);
        }

        svg {
          font-size: 1rem;
        }
      }
    }
  }
`

export default DashboardSidebar