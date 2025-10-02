import React, { useState } from 'react'
import styled from 'styled-components'
import { HiEye, HiEyeSlash, HiXMark, HiShieldExclamation } from 'react-icons/hi2'

const Disable2FAModal = ({ isOpen, onClose, onSubmit, loading = false, colors }) => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!password.trim()) {
      setError('Password is required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      await onSubmit(password)
      // If successful, the parent component will close the modal
    } catch (error) {
      // Handle API errors in the modal
      setError(error.message || 'Failed to disable 2FA. Please try again.')
    }
  }

  const handleClose = () => {
    if (!loading) {
      setPassword('')
      setShowPassword(false)
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()} colors={colors}>
        <ModalHeader>
          <div className="header-icon">
            <HiShieldExclamation />
          </div>
          <div className="header-content">
            <h2>Disable Two-Factor Authentication</h2>
            <p>Enter your password to disable 2FA protection</p>
          </div>
          <CloseButton onClick={handleClose} disabled={loading}>
            <HiXMark />
          </CloseButton>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="input-group">
              <label htmlFor="password">Current Password</label>
              <div className="password-input-container">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Enter your current password"
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <HiEyeSlash /> : <HiEye />}
                </button>
              </div>
              {error && <span className="error-message">{error}</span>}
            </div>

            <div className="warning-box">
              <HiShieldExclamation className="warning-icon" />
              <div className="warning-content">
                <strong>Warning:</strong> Disabling 2FA will make your account less secure. 
                You can re-enable it at any time from your security settings.
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              className="cancel-btn"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="disable-btn"
              disabled={loading || !password.trim()}
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  )
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`

const ModalContent = styled.div`
  background: ${props => props.colors?.surface || '#1a1a1a'};
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  border: 1px solid ${props => props.colors?.border || 'rgba(255, 255, 255, 0.1)'};
  animation: modalSlideIn 0.3s ease-out;

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid ${props => props.colors?.border || 'rgba(255, 255, 255, 0.1)'};

  .header-icon {
    width: 48px;
    height: 48px;
    background: rgba(239, 68, 68, 0.2);
    border: 2px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ef4444;
    font-size: 24px;
    flex-shrink: 0;
  }

  .header-content {
    flex: 1;
    min-width: 0;

    h2 {
      color: ${props => props.colors?.text || '#ffffff'};
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 4px 0;
      line-height: 1.4;
    }

    p {
      color: ${props => props.colors?.muted || 'rgba(255, 255, 255, 0.7)'};
      font-size: 14px;
      margin: 0;
      line-height: 1.4;
    }
  }
`

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: ${props => props.colors?.muted || 'rgba(255, 255, 255, 0.5)'};
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: ${props => props.colors?.text || '#ffffff'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ModalBody = styled.div`
  padding: 24px;

  .input-group {
    margin-bottom: 20px;

    label {
      display: block;
      color: ${props => props.colors?.text || '#ffffff'};
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .password-input-container {
      position: relative;

      input {
        width: 100%;
        padding: 12px 45px 12px 16px;
        background: ${props => props.colors?.background || '#0a0a0a'};
        border: 1px solid ${props => props.colors?.border || 'rgba(255, 255, 255, 0.2)'};
        border-radius: 12px;
        color: ${props => props.colors?.text || '#ffffff'};
        font-size: 14px;
        outline: none;
        transition: all 0.2s ease;

        &::placeholder {
          color: ${props => props.colors?.muted || 'rgba(255, 255, 255, 0.5)'};
        }

        &:focus {
          border-color: ${props => props.colors?.accent || '#58A4B0'};
          box-shadow: 0 0 0 3px ${props => props.colors?.accent || '#58A4B0'}20;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .password-toggle {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: ${props => props.colors?.muted || 'rgba(255, 255, 255, 0.5)'};
        cursor: pointer;
        font-size: 18px;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          color: ${props => props.colors?.text || '#ffffff'};
          background: rgba(255, 255, 255, 0.1);
        }

        &:disabled {
          cursor: not-allowed;
        }
      }
    }

    .error-message {
      display: block;
      color: #ef4444;
      font-size: 12px;
      margin-top: 6px;
      font-weight: 500;
    }
  }

  .warning-box {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 12px;

    .warning-icon {
      color: #ef4444;
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .warning-content {
      color: ${props => props.colors?.text || '#ffffff'};
      font-size: 13px;
      line-height: 1.5;

      strong {
        color: #ef4444;
        font-weight: 600;
      }
    }
  }
`

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid ${props => props.colors?.border || 'rgba(255, 255, 255, 0.1)'};

  button {
    flex: 1;
    padding: 12px 20px;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 44px;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .cancel-btn {
    background: transparent;
    color: ${props => props.colors?.muted || 'rgba(255, 255, 255, 0.7)'};
    border: 1px solid ${props => props.colors?.border || 'rgba(255, 255, 255, 0.2)'};

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.05);
      color: ${props => props.colors?.text || '#ffffff'};
    }
  }

  .disable-btn {
    background: #ef4444;
    color: white;

    &:hover:not(:disabled) {
      background: #dc2626;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    }

    &:disabled {
      background: #6b7280;
    }
  }
`

export default Disable2FAModal