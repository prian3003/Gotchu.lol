import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useTheme } from '../../contexts/ThemeContext'
import TurnstileWidget from '../security/TurnstileWidget'
import { useTurnstile } from '../../hooks/useTurnstile'
import { HiXMark, HiShieldCheck } from 'react-icons/hi2'

const TurnstileModal = ({ 
  isOpen, 
  onClose, 
  onVerified, 
  title = "Security Verification",
  description = "Please complete the security verification to continue"
}) => {
  const { colors } = useTheme()
  const modalRef = useRef()
  
  const {
    isVerified,
    token,
    error,
    isLoading,
    handleVerify,
    handleError,
    handleExpire,
    reset,
    turnstileRef
  } = useTurnstile()

  // Handle successful verification
  useEffect(() => {
    if (isVerified && token) {
      // Auto-close modal and pass token to parent
      setTimeout(() => {
        onVerified(token)
        onClose()
      }, 1000) // Give user a moment to see success
    }
  }, [isVerified, token, onVerified, onClose])

  // Reset verification when modal opens
  useEffect(() => {
    if (isOpen) {
      reset()
    }
  }, [isOpen, reset])

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <ModalOverlay colors={colors}>
      <ModalContainer ref={modalRef} colors={colors}>
        <ModalHeader>
          <HeaderContent>
            <IconContainer colors={colors} $isVerified={isVerified}>
              <HiShieldCheck />
            </IconContainer>
            <HeaderText>
              <ModalTitle colors={colors}>{title}</ModalTitle>
              <ModalDescription colors={colors}>{description}</ModalDescription>
            </HeaderText>
          </HeaderContent>
          <CloseButton onClick={onClose} colors={colors}>
            <HiXMark />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {!isVerified ? (
            <VerificationSection>
              <TurnstileWidget
                ref={turnstileRef}
                onVerify={handleVerify}
                onError={handleError}
                onExpire={handleExpire}
                size="normal"
              />
              
              {error && (
                <ErrorMessage colors={colors}>
                  {error}
                </ErrorMessage>
              )}
              
              <HelpText colors={colors}>
                Complete the security check above to proceed
              </HelpText>
            </VerificationSection>
          ) : (
            <SuccessSection>
              <SuccessIcon colors={colors}>
                ✓
              </SuccessIcon>
              <SuccessMessage colors={colors}>
                Verification successful!
              </SuccessMessage>
              <SuccessSubtext colors={colors}>
                Redirecting...
              </SuccessSubtext>
            </SuccessSection>
          )}
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  )
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`

const ModalContainer = styled.div`
  background: ${props => props.colors?.surface || '#1a1a1a'};
  border: 1px solid ${props => props.colors?.border || 'rgba(255, 255, 255, 0.2)'};
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px ${props => props.colors?.border || 'rgba(255, 255, 255, 0.2)'};
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.colors?.border || 'rgba(255, 255, 255, 0.2)'};
`

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`

const IconContainer = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.3s ease;
  background: ${props => props.$isVerified 
    ? 'linear-gradient(135deg, #10b981, #059669)' 
    : 'linear-gradient(135deg, #58A4B0, #4a8a94)'
  };

  svg {
    width: 24px;
    height: 24px;
  }
`

const HeaderText = styled.div`
  flex: 1;
`

const ModalTitle = styled.h2`
  color: ${props => props.colors?.text || '#ffffff'};
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
`

const ModalDescription = styled.p`
  color: ${props => props.colors?.textSecondary || '#a0a0a0'};
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.colors?.textSecondary || '#a0a0a0'};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.colors?.surface || '#2a2a2a'};
    color: ${props => props.colors?.text || '#ffffff'};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`

const ModalBody = styled.div`
  padding: 2rem;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const VerificationSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
`

const ErrorMessage = styled.div`
  color: #ff6b6b;
  font-size: 0.9rem;
  text-align: center;
  padding: 0.75rem;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  width: 100%;
`

const HelpText = styled.p`
  color: ${props => props.colors?.textSecondary || '#a0a0a0'};
  font-size: 0.85rem;
  text-align: center;
  margin: 0;
`

const SuccessSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  animation: successBounce 0.5s ease-out;

  @keyframes successBounce {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`

const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
`

const SuccessMessage = styled.h3`
  color: ${props => props.colors?.text || '#ffffff'};
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`

const SuccessSubtext = styled.p`
  color: ${props => props.colors?.textSecondary || '#a0a0a0'};
  font-size: 0.9rem;
  margin: 0;
`

export default TurnstileModal