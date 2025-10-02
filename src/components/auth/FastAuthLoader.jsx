import React from 'react'
import styled, { keyframes } from 'styled-components'

// Lightweight, instant-loading auth splash
const pulse = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 0.4; }
`

const LoaderContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 75%, #000000 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`

const LoaderContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`

const LogoContainer = styled.div`
  animation: ${pulse} 2s ease-in-out infinite;
`

const LogoText = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, #1bbd9a, #60A5FA);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`

const LoadingDots = styled.div`
  display: flex;
  gap: 0.5rem;
  
  & > div {
    width: 8px;
    height: 8px;
    background: #1bbd9a;
    border-radius: 50%;
    animation: ${pulse} 1.5s ease-in-out infinite;
    
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`

const StatusText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin: 0;
`

const FastAuthLoader = ({ status = 'Authenticating...' }) => {
  return (
    <LoaderContainer>
      <LoaderContent>
        <LogoContainer>
          <LogoText>gotchu</LogoText>
        </LogoContainer>
        
        <LoadingDots>
          <div />
          <div />
          <div />
        </LoadingDots>
        
        <StatusText>{status}</StatusText>
      </LoaderContent>
    </LoaderContainer>
  )
}

export default FastAuthLoader