import React, { useState, useEffect } from 'react'
import { 
  HiXMark, 
  HiStar, 
  HiCheckCircle,
  HiExclamationTriangle
} from 'react-icons/hi2'
import { useTheme } from '../../contexts/ThemeContext'
import styled from 'styled-components'

const ChangeDisplayNameModal = ({ isOpen, onClose, user, onDisplayNameChange }) => {
  const { colors } = useTheme()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName || '')
      setError('')
      setSuccess(false)
    }
  }, [isOpen, user])

  // Handle input changes
  const handleInputChange = (value) => {
    setDisplayName(value)
    if (error) setError('')
    if (success) setSuccess(false)
  }

  // Validate display name
  const validateDisplayName = (name) => {
    if (name.length > 30) return 'Display name must be less than 30 characters'
    if (name === user?.displayName) return 'This is your current display name'
    return ''
  }

  // Handle submit
  const handleSubmit = async () => {
    const validationError = validateDisplayName(displayName)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await onDisplayNameChange(displayName)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to update display name')
    } finally {
      setLoading(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent colors={colors} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <ModalHeader>
          <HeaderContent>
            <HiStar className="header-icon" />
            <h2>Change Display Name</h2>
          </HeaderContent>
          <CloseButton onClick={onClose} colors={colors}>
            <HiXMark />
          </CloseButton>
        </ModalHeader>

        {/* Content */}
        <ModalBody>
          <InputWrapper hasError={!!error} hasSuccess={success}>
            <Input
              type="text"
              placeholder="Enter display name (optional)"
              value={displayName}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              colors={colors}
              autoFocus
            />
            {success && (
              <StatusIcon className="success">
                <HiCheckCircle />
              </StatusIcon>
            )}
          </InputWrapper>
          
          {error && (
            <ErrorMessage>
              <HiExclamationTriangle />
              {error}
            </ErrorMessage>
          )}
          
          {success && (
            <SuccessMessage>
              <HiCheckCircle />
              Display name updated successfully!
            </SuccessMessage>
          )}

          <ButtonGroup>
            <CancelButton onClick={onClose} colors={colors}>
              Cancel
            </CancelButton>
            <ActionButton 
              onClick={handleSubmit}
              disabled={loading || displayName === user?.displayName}
              colors={colors}
            >
              {loading ? (
                <>
                  <Spinner />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </ActionButton>
          </ButtonGroup>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  )
}

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const ModalContent = styled.div`
  background: ${props => props.colors.surface};
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  border: 1px solid ${props => props.colors.border};
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0 1.5rem;
`

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .header-icon {
    font-size: 1.25rem;
    color: ${props => props.colors?.accent || '#58A4B0'};
  }

  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: ${props => props.colors?.text || '#ffffff'};
  }
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.colors.muted};
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.colors.border};
    color: ${props => props.colors.text};
  }
`

const ModalBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  ${props => props.hasError && `
    input {
      border-color: #ef4444;
    }
  `}

  ${props => props.hasSuccess && `
    input {
      border-color: #10b981;
    }
  `}
`

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  background: ${props => props.colors.background || 'rgba(0, 0, 0, 0.3)'};
  border: 2px solid ${props => props.colors.border || 'rgba(255, 255, 255, 0.15)'};
  border-radius: 10px;
  color: ${props => props.colors.text || '#ffffff'};
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &::placeholder {
    color: ${props => props.colors.muted || 'rgba(255, 255, 255, 0.5)'};
    font-weight: 400;
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.colors.accent || '#58A4B0'};
    box-shadow: 0 0 0 3px ${props => props.colors.accent || '#58A4B0'}20;
    background: ${props => props.colors.background || 'rgba(0, 0, 0, 0.4)'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const StatusIcon = styled.div`
  position: absolute;
  right: 0.875rem;
  font-size: 1.125rem;
  
  &.success {
    color: #10b981;
  }
`

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
`

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  font-size: 0.875rem;
  font-weight: 500;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
`

const CancelButton = styled.button`
  flex: 1;
  background: transparent;
  color: ${props => props.colors.text || '#ffffff'};
  border: 2px solid ${props => props.colors.border || 'rgba(255, 255, 255, 0.15)'};
  padding: 0.875rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.colors.accent || '#58A4B0'};
    color: ${props => props.colors.accent || '#58A4B0'};
    background: ${props => props.colors.accent || '#58A4B0'}10;
  }
`

const ActionButton = styled.button`
  flex: 1;
  background: ${props => props.colors.accent};
  color: white;
  border: none;
  padding: 0.875rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    background: ${props => props.colors.accent}dd;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

export default ChangeDisplayNameModal