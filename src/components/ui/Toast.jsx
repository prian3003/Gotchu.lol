import React, { useState, useEffect, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes } from 'styled-components'
import { HiXMark, HiCheck, HiExclamationTriangle, HiInformationCircle, HiExclamationCircle } from 'react-icons/hi2'

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
      duration: 5000,
      ...toast
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

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
    // Convenience methods
    success: (message, options = {}) => addToast({ ...options, type: 'success', message }),
    error: (message, options = {}) => addToast({ ...options, type: 'error', message, duration: 8000 }),
    warning: (message, options = {}) => addToast({ ...options, type: 'warning', message, duration: 6000 }),
    info: (message, options = {}) => addToast({ ...options, type: 'info', message })
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
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = () => {
    setIsRemoving(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300) // Match exit animation duration
  }

  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove()
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.duration])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <HiCheck />
      case 'error':
        return <HiExclamationCircle />
      case 'warning':
        return <HiExclamationTriangle />
      case 'info':
      default:
        return <HiInformationCircle />
    }
  }

  return (
    <ToastItem type={toast.type} isRemoving={isRemoving}>
      <ToastIcon type={toast.type}>
        {getIcon()}
      </ToastIcon>
      
      <ToastContent>
        {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
        <ToastMessage>{toast.message}</ToastMessage>
      </ToastContent>

      {toast.action && (
        <ToastAction onClick={toast.action.onClick}>
          {toast.action.label}
        </ToastAction>
      )}

      <ToastCloseButton onClick={handleRemove}>
        <HiXMark />
      </ToastCloseButton>
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
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`

const slideOutRight = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`

const progressBar = keyframes`
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
  top: 1rem;
  right: 1rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  
  @media (max-width: 768px) {
    top: 1rem;
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
`

const ToastItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(19, 19, 19, 0.98));
  border: 1px solid;
  border-radius: 12px;
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  
  animation: ${props => props.isRemoving ? slideOutRight : slideInRight} 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Type-based styling */
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          border-color: rgba(16, 185, 129, 0.3);
          
          &::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, #10b981, #059669);
            animation: ${progressBar} 5s linear;
          }
        `
      case 'error':
        return `
          border-color: rgba(239, 68, 68, 0.3);
          
          &::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, #ef4444, #dc2626);
            animation: ${progressBar} 8s linear;
          }
        `
      case 'warning':
        return `
          border-color: rgba(245, 158, 11, 0.3);
          
          &::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, #f59e0b, #d97706);
            animation: ${progressBar} 6s linear;
          }
        `
      case 'info':
      default:
        return `
          border-color: rgba(88, 164, 176, 0.3);
          
          &::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, #58A4B0, #4a8a94);
            animation: ${progressBar} 5s linear;
          }
        `
    }
  }}
`

const ToastIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        `
      case 'error':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        `
      case 'warning':
        return `
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        `
      case 'info':
      default:
        return `
          background: rgba(88, 164, 176, 0.2);
          color: #58A4B0;
        `
    }
  }}
`

const ToastContent = styled.div`
  flex: 1;
  min-width: 0;
`

const ToastTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
`

const ToastMessage = styled.div`
  font-size: 0.875rem;
  color: #a0a0a0;
  line-height: 1.4;
`

const ToastAction = styled.button`
  background: transparent;
  border: 1px solid rgba(88, 164, 176, 0.3);
  color: #58A4B0;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.25rem;
  
  &:hover {
    background: rgba(88, 164, 176, 0.1);
    border-color: rgba(88, 164, 176, 0.5);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.3);
  }
`

const ToastCloseButton = styled.button`
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.3s ease;
  font-size: 0.875rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  
  &:hover {
    color: #ffffff;
  }
  
  &:focus {
    outline: none;
    color: #ffffff;
  }
`

export default Toast