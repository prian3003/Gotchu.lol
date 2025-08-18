import React, { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes } from 'styled-components'
import { HiXMark } from 'react-icons/hi2'

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  ...props
}) => {
  // Handle escape key
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && closeOnEscape && onClose) {
      onClose()
    }
  }, [closeOnEscape, onClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback((event) => {
    if (event.target === event.currentTarget && closeOnBackdrop && onClose) {
      onClose()
    }
  }, [closeOnBackdrop, onClose])

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const modalContent = (
    <ModalOverlay onClick={handleBackdropClick}>
      <ModalContainer size={size} className={className} {...props}>
        {(title || showCloseButton) && (
          <ModalHeader>
            {title && <ModalTitle>{title}</ModalTitle>}
            {showCloseButton && (
              <CloseButton onClick={onClose} aria-label="Close modal">
                <HiXMark />
              </CloseButton>
            )}
          </ModalHeader>
        )}
        <ModalContent>
          {children}
        </ModalContent>
      </ModalContainer>
    </ModalOverlay>
  )

  return createPortal(modalContent, document.body)
}

// Specialized modal components
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  ...props 
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="small"
    {...props}
  >
    <ConfirmContent>
      <ConfirmMessage>{message}</ConfirmMessage>
      <ConfirmActions>
        <ConfirmButton onClick={onClose} variant="ghost">
          {cancelText}
        </ConfirmButton>
        <ConfirmButton onClick={onConfirm} variant={variant}>
          {confirmText}
        </ConfirmButton>
      </ConfirmActions>
    </ConfirmContent>
  </Modal>
)

export const AlertModal = ({ 
  isOpen, 
  onClose, 
  title = 'Alert',
  message,
  buttonText = 'OK',
  variant = 'primary',
  ...props 
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="small"
    {...props}
  >
    <AlertContent>
      <AlertMessage>{message}</AlertMessage>
      <AlertActions>
        <ConfirmButton onClick={onClose} variant={variant}>
          {buttonText}
        </ConfirmButton>
      </AlertActions>
    </AlertContent>
  </Modal>
)

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
`

// Styled components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`

const ModalContainer = styled.div`
  background: linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(19, 19, 19, 0.98));
  border: 1px solid rgba(88, 164, 176, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: ${slideIn} 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  
  /* Size variants */
  ${props => {
    switch (props.size) {
      case 'small':
        return `
          width: 90%;
          max-width: 400px;
        `
      case 'large':
        return `
          width: 90%;
          max-width: 800px;
        `
      case 'fullscreen':
        return `
          width: 95%;
          height: 95%;
          max-width: none;
          max-height: none;
        `
      case 'medium':
      default:
        return `
          width: 90%;
          max-width: 600px;
        `
    }
  }}
  
  @media (max-width: 768px) {
    width: 95%;
    max-height: 85vh;
  }
`

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0 1.5rem;
  flex-shrink: 0;
`

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #a0a0a0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.25rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.5);
  }
`

const ModalContent = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(88, 164, 176, 0.5);
    border-radius: 3px;
    
    &:hover {
      background: rgba(88, 164, 176, 0.7);
    }
  }
`

// Confirm modal components
const ConfirmContent = styled.div`
  text-align: center;
`

const ConfirmMessage = styled.p`
  font-size: 1rem;
  color: #ffffff;
  margin: 0 0 2rem 0;
  line-height: 1.5;
`

const ConfirmActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
`

const ConfirmButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  
  ${props => {
    switch (props.variant) {
      case 'danger':
        return `
          background: linear-gradient(145deg, #ef4444, #dc2626);
          color: #ffffff;
          
          &:hover {
            background: linear-gradient(145deg, #dc2626, #b91c1c);
            transform: translateY(-1px);
          }
        `
      case 'primary':
        return `
          background: linear-gradient(145deg, #58A4B0, #4a8a94);
          color: #ffffff;
          
          &:hover {
            background: linear-gradient(145deg, #4a8a94, #3c7580);
            transform: translateY(-1px);
          }
        `
      case 'ghost':
        return `
          background: transparent;
          color: #a0a0a0;
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          &:hover {
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.3);
          }
        `
      default:
        return `
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          &:hover {
            background: rgba(255, 255, 255, 0.15);
          }
        `
    }
  }}
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.5);
  }
`

// Alert modal components
const AlertContent = styled.div`
  text-align: center;
`

const AlertMessage = styled.p`
  font-size: 1rem;
  color: #ffffff;
  margin: 0 0 2rem 0;
  line-height: 1.5;
`

const AlertActions = styled.div`
  display: flex;
  justify-content: center;
`

export default Modal