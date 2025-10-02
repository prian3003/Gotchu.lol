import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import styled from 'styled-components'

function Navbar() {
  const { isAuthenticated } = useAuth()
  const { colors } = useTheme()
  const location = useLocation()
  
  return (
    <NavbarContainer colors={colors}>
      <NavbarContent>
        {/* Left - Logo */}
        <LogoSection>
          <Link to="/">
            <LogoText colors={colors}>
              <span>gotchu</span>
              <LogoAccent colors={colors}>.lol</LogoAccent>
            </LogoText>
          </Link>
        </LogoSection>
        
        {/* Right - Auth Buttons */}
        <AuthSection>
          {!isAuthenticated ? (
            <>
              <AuthLink colors={colors} to="/signin">
                Sign In
              </AuthLink>
              <SignUpButton colors={colors} to="/signup">
                Sign Up
              </SignUpButton>
            </>
          ) : (
            <DashboardButton colors={colors} to="/dashboard">
              Dashboard
            </DashboardButton>
          )}
        </AuthSection>
      </NavbarContent>
    </NavbarContainer>
  )
}

const NavbarContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: ${props => props.colors.background}CC;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid ${props => props.colors.border};
  z-index: 1000;
`

const NavbarContent = styled.nav`
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  
  a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-1px);
    }
  }
`

const LogoIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.colors.accent};
  box-shadow: 0 4px 20px ${props => props.colors.accent}50;
  
  svg {
    width: 24px;
    height: 24px;
  }
`

const LogoText = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.colors.text};
  
  span {
    color: ${props => props.colors.text};
  }
`

const LogoAccent = styled.span`
  color: ${props => props.colors.accent} !important;
  margin-left: 2px;
`

const AuthSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const AuthLink = styled(Link)`
  color: ${props => props.colors.textSecondary};
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    color: ${props => props.colors.text};
    background: ${props => props.colors.surface || 'rgba(255, 255, 255, 0.05)'};
    transform: translateY(-1px);
  }
`

const SignUpButton = styled(Link)`
  background: ${props => props.colors.accent};
  color: white;
  text-decoration: none;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px ${props => props.colors.accent}50;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px ${props => props.colors.accent}60;
    background: ${props => props.colors.accentHover};
  }
  
  &:active {
    transform: translateY(0);
  }
`

const DashboardButton = styled(Link)`
  background: ${props => props.colors.surface || 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.colors.text};
  text-decoration: none;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  border: 1px solid ${props => props.colors.border};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.colors.accent}20;
    border-color: ${props => props.colors.accent};
    transform: translateY(-1px);
  }
`

export default Navbar