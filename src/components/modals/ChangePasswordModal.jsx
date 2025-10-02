import React, { useState, useEffect } from 'react'
import { 
  HiXMark, 
  HiKey, 
  HiCheckCircle,
  HiExclamationTriangle,
  HiEye,
  HiEyeSlash
} from 'react-icons/hi2'
import { useTheme } from '../../contexts/ThemeContext'
import styled from 'styled-components'

const ChangePasswordModal = ({ isOpen, onClose, onPasswordChange }) => {
  const { colors } = useTheme()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setError('')
      setSuccess(false)
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      })
    }
  }, [isOpen])

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
    if (success) setSuccess(false)
  }

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  // Validate form
  const validateForm = () => {
    const { currentPassword, newPassword, confirmPassword } = formData
    
    if (!currentPassword.trim()) return 'Please enter your current password'
    if (!newPassword.trim()) return 'Please enter a new password'
    if (!confirmPassword.trim()) return 'Please confirm your new password'
    
    if (newPassword.length < 8) return 'New password must be at least 8 characters long'
    if (newPassword !== confirmPassword) return 'New password and confirmation do not match'
    if (currentPassword === newPassword) return 'New password must be different from your current password'
    
    return ''
  }

  // Handle submit
  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await onPasswordChange({
        current_password: formData.currentPassword.trim(),
        new_password: formData.newPassword.trim()
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to change password')
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

  const isFormValid = formData.currentPassword.trim() && 
                     formData.newPassword.trim() && 
                     formData.confirmPassword.trim()

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent colors={colors} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <ModalHeader>
          <HeaderContent>
            <HiKey className="header-icon" />
            <h2>Change Password</h2>
          </HeaderContent>
          <CloseButton onClick={onClose} colors={colors}>
            <HiXMark />
          </CloseButton>
        </ModalHeader>

        {/* Content */}
        <ModalBody>
          {/* Current Password */}
          <InputGroup>
            <Label colors={colors}>Current Password</Label>
            <InputWrapper hasError={!!error && !formData.currentPassword.trim()}>
              <Input
                type={showPasswords.current ? "text" : "password"}
                placeholder="Enter your current password"
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                colors={colors}
                autoComplete="current-password"
              />
              <ToggleButton
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                colors={colors}
              >
                {showPasswords.current ? <HiEyeSlash /> : <HiEye />}
              </ToggleButton>
            </InputWrapper>
          </InputGroup>

          {/* New Password */}
          <InputGroup>
            <Label colors={colors}>New Password</Label>
            <InputWrapper hasError={!!error && !formData.newPassword.trim()}>
              <Input
                type={showPasswords.new ? "text" : "password"}
                placeholder="Enter new password (min 8 characters)"
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                colors={colors}
                autoComplete="new-password"
              />
              <ToggleButton
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                colors={colors}
              >
                {showPasswords.new ? <HiEyeSlash /> : <HiEye />}
              </ToggleButton>
            </InputWrapper>
          </InputGroup>

          {/* Confirm Password */}
          <InputGroup>
            <Label colors={colors}>Confirm New Password</Label>
            <InputWrapper hasError={!!error && !formData.confirmPassword.trim()}>
              <Input
                type={showPasswords.confirm ? "text" : "password"}
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                colors={colors}
                autoComplete="new-password"
              />
              <ToggleButton
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                colors={colors}
              >
                {showPasswords.confirm ? <HiEyeSlash /> : <HiEye />}
              </ToggleButton>
            </InputWrapper>
          </InputGroup>

          {/* Requirements */}
          <RequirementsBox colors={colors}>
            <RequirementsTitle>Password Requirements:</RequirementsTitle>
            <RequirementsList>
              <li>At least 8 characters long</li>
              <li>Must be different from current password</li>
              <li>New password and confirmation must match</li>
            </RequirementsList>
          </RequirementsBox>
          
          {error && (
            <ErrorMessage>
              <HiExclamationTriangle />
              {error}
            </ErrorMessage>
          )}
          
          {success && (
            <SuccessMessage>
              <HiCheckCircle />
              Password changed successfully!
            </SuccessMessage>
          )}

          <ButtonGroup>
            <CancelButton onClick={onClose} colors={colors}>
              Cancel
            </CancelButton>
            <ActionButton 
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              colors={colors}
            >
              {loading ? (
                <>
                  <Spinner />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </ActionButton>
          </ButtonGroup>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  )
}

// Styled Components (same as other modals for consistency)
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
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
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
    color: #58A4B0;
  }

  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #ffffff;
  }
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.colors?.muted || 'rgba(255, 255, 255, 0.6)'};
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.colors?.border || 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.colors?.text || '#ffffff'};
  }
`

const ModalBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Label = styled.label`
  color: ${props => props.colors?.text || '#ffffff'};
  font-size: 0.875rem;
  font-weight: 600;
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
`

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 3rem 0.875rem 1rem;
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

const ToggleButton = styled.button`
  position: absolute;
  right: 0.875rem;
  background: none;
  border: none;
  color: ${props => props.colors?.muted || 'rgba(255, 255, 255, 0.6)'};
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.colors?.text || '#ffffff'};
  }
`

const RequirementsBox = styled.div`
  background: ${props => props.colors?.background || 'rgba(0, 0, 0, 0.2)'};
  border: 1px solid ${props => props.colors?.border || 'rgba(255, 255, 255, 0.15)'};
  border-radius: 8px;
  padding: 1rem;
`

const RequirementsTitle = styled.div`
  color: ${props => props.colors?.text || '#ffffff'};
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`

const RequirementsList = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  color: ${props => props.colors?.muted || 'rgba(255, 255, 255, 0.7)'};
  font-size: 0.825rem;
  
  li {
    margin-bottom: 0.25rem;
    
    &:last-child {
      margin-bottom: 0;
    }
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
  background: ${props => props.colors?.accent || '#58A4B0'};
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
    background: ${props => props.colors?.accent || '#58A4B0'}dd;
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

export default ChangePasswordModal