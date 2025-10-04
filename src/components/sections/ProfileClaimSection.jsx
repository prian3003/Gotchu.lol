import React, { useState } from 'react'
import styled from 'styled-components'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'

const ProfileClaimSection = () => {
  const { colors } = useTheme()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')

  const handleClaim = () => {
    if (username.trim()) {
      navigate(`/signup?username=${encodeURIComponent(username.trim())}`)
    } else {
      navigate('/signup')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleClaim()
    }
  }

  return (
    <ClaimContainer colors={colors}>
      <ClaimContent>
        <ClaimTitle colors={colors}>
          Claim your profile and create an account in minutes!
        </ClaimTitle>
        
        <ClaimForm>
          <UrlPreview colors={colors}>
            <UrlPrefix colors={colors}>gotchu.lol/</UrlPrefix>
            <UsernameInput
              colors={colors}
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={30}
            />
          </UrlPreview>
          
          <ClaimButton colors={colors} onClick={handleClaim}>
            Claim Now
          </ClaimButton>
        </ClaimForm>
      </ClaimContent>
    </ClaimContainer>
  )
}

const ClaimContainer = styled.div`
  width: 100%;
  background: ${props => props.colors.background};
  padding: 4rem 2rem;
  display: flex;
  justify-content: center;
  position: relative;
  
  /* Add the same background overlay as landing page */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(169, 204, 62, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(169, 204, 62, 0.05) 0%, transparent 50%);
    z-index: 1;
  }
  
  @media (max-width: 768px) {
    padding: 3rem 1rem;
  }
`

const ClaimContent = styled.div`
  max-width: 800px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  position: relative;
  z-index: 2;
`

const ClaimTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.colors.text};
  margin: 0;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`

const ClaimForm = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 600px;
  
  @media (max-width: 640px) {
    flex-direction: column;
    gap: 1.5rem;
  }
`

const UrlPreview = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  background: ${props => props.colors.surface};
  border: 2px solid ${props => props.colors.border};
  border-radius: 16px;
  padding: 0.75rem 1.25rem;
  transition: all 0.3s ease;
  
  &:focus-within {
    border-color: ${props => props.colors.accent};
    box-shadow: 0 0 0 3px ${props => props.colors.accent}20;
  }
  
  @media (max-width: 640px) {
    width: 100%;
  }
`

const UrlPrefix = styled.span`
  color: ${props => props.colors.textSecondary};
  font-size: 1.1rem;
  font-weight: 500;
  white-space: nowrap;
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`

const UsernameInput = styled.input`
  background: transparent;
  border: none;
  outline: none;
  color: ${props => props.colors.text};
  font-size: 1.1rem;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  
  &::placeholder {
    color: ${props => props.colors.textSecondary};
    opacity: 0.6;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`

const ClaimButton = styled.button`
  background: ${props => props.colors.accent};
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 4px 20px ${props => props.colors.accent}40;
  
  &:hover {
    background: ${props => props.colors.accentHover || props.colors.accent};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px ${props => props.colors.accent}50;
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 640px) {
    width: 100%;
    padding: 1.25rem 2rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`

export default ProfileClaimSection