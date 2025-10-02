import React, { useState, useEffect, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes, css } from 'styled-components'
import { HiXMark, HiCheckCircle, HiExclamationTriangle, HiInformationCircle, HiXCircle } from 'react-icons/hi2'

// Toast context for managing toasts globally
const ToastContext = createContext()

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (toast) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      type: 'info',
      duration: 4000,
      ...toast
    }

    setToasts(prev => [...prev, newToast])
    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const removeAllToasts = () => {
    setToasts([])
  }

  const value = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    // Convenience methods for better UX
    success: (title, message, options = {}) => addToast({ 
      ...options, 
      type: 'success', 
      title: title || 'Success',
      message, 
      duration: 3000 
    }),
    error: (title, message, options = {}) => addToast({ 
      ...options, 
      type: 'error', 
      title: title || 'Error',
      message, 
      duration: 5000 
    }),
    warning: (title, message, options = {}) => addToast({ 
      ...options, 
      type: 'warning', 
      title: title || 'Warning',
      message, 
      duration: 4000 
    }),
    info: (title, message, options = {}) => addToast({ 
      ...options, 
      type: 'info', 
      title: title || 'Info',
      message,
      duration: 4000 
    })
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Individual toast component
const Toast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 50)
    
    // Auto-remove after duration
    const hideTimer = setTimeout(() => {
      handleRemove()
    }, toast.duration)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [toast.duration])

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 250) // Match exit animation duration
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <HiCheckCircle />
      case 'error':
        return <HiXCircle />
      case 'warning':
        return <HiExclamationTriangle />
      case 'info':
      default:
        return <HiInformationCircle />
    }
  }

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.25)',
          icon: '#10B981',
          iconBg: 'rgba(16, 185, 129, 0.15)',
          progress: '#10B981'
        }
      case 'error':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.25)',
          icon: '#EF4444',
          iconBg: 'rgba(239, 68, 68, 0.15)',
          progress: '#EF4444'
        }
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.25)',
          icon: '#F59E0B',
          iconBg: 'rgba(245, 158, 11, 0.15)',
          progress: '#F59E0B'
        }
      case 'info':
      default:
        return {
          bg: 'rgba(88, 164, 176, 0.12)',
          border: 'rgba(88, 164, 176, 0.25)',
          icon: '#58A4B0',
          iconBg: 'rgba(88, 164, 176, 0.15)',
          progress: '#58A4B0'
        }
    }
  }

  return (
    <ToastItem 
      colors={getColors()}
      $isVisible={isVisible}
      $isExiting={isExiting}
      $duration={toast.duration}
    >
      <ToastContent>
        <ToastIcon colors={getColors()}>
          {getIcon()}
        </ToastIcon>
        
        <ToastText>
          {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
          {toast.message && <ToastMessage>{toast.message}</ToastMessage>}
        </ToastText>
        
        <ToastCloseButton onClick={handleRemove}>
          <HiXMark />
        </ToastCloseButton>
      </ToastContent>
      
      <ToastProgress 
        colors={getColors()} 
        $duration={toast.duration}
        $isVisible={isVisible}
      />
    </ToastItem>
  )
}

// Toast container component
const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  const toastElements = (
    <ToastList>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </ToastList>
  )

  return createPortal(toastElements, document.body)
}

// Animations
const slideInRight = keyframes`
  from {
    transform: translateX(100%) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
`

const slideOutRight = keyframes`
  from {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateX(100%) scale(0.95);
    opacity: 0;
  }
`

const progressAnimation = keyframes`
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
`

// Styled components
const ToastList = styled.div`
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 380px;
  
  @media (max-width: 768px) {
    top: 1rem;
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
`

const ToastItem = styled.div`
  background: linear-gradient(145deg, 
    rgba(26, 26, 26, 0.97), 
    rgba(19, 19, 19, 0.99)
  );
  border: 1px solid ${props => props.colors.border};
  border-radius: 12px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
  width: 100%;
  
  ${props => {
    if (props.$isExiting) {
      return css`animation: ${slideOutRight} 0.25s cubic-bezier(0.4, 0, 1, 1) forwards;`
    } else if (props.$isVisible) {
      return css`animation: ${slideInRight} 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;`
    }
    return css`
      transform: translateX(100%) scale(0.95);
      opacity: 0;
    `
  }}
`

const ToastContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem;
`

const ToastIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: ${props => props.colors.iconBg};
  flex-shrink: 0;
  
  svg {
    width: 1.125rem;
    height: 1.125rem;
    color: ${props => props.colors.icon};
  }
`

const ToastText = styled.div`
  flex: 1;
  min-width: 0;
`

const ToastTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
`

const ToastMessage = styled.p`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
  line-height: 1.4;
`

const ToastCloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.8);
    transform: scale(1.05);
  }
  
  svg {
    width: 0.75rem;
    height: 0.75rem;
  }
`

const ToastProgress = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, ${props => props.colors.progress}, ${props => props.colors.progress}CC);
  width: 100%;
  transform-origin: left;
  border-radius: 0 0 12px 12px;
  
  ${props => props.$isVisible && css`
    animation: ${progressAnimation} ${props.$duration}ms linear;
  `}
`

export default Toast