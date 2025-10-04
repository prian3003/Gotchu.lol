import React from 'react'
import styled from 'styled-components'
import { HiArrowRight, HiCheck, HiXMark } from 'react-icons/hi2'

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  className,
  ...props
}) => {
  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e)
    }
  }

  const renderIcon = () => {
    if (loading) {
      return <LoadingSpinner />
    }
    if (icon) {
      return <IconWrapper position={iconPosition}>{icon}</IconWrapper>
    }
    return null
  }

  return (
    <StyledButton
      $variant={variant}
      size={size}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      onClick={handleClick}
      type={type}
      className={className}
      hasIcon={!!(icon || loading)}
      iconPosition={iconPosition}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      {children && <ButtonText>{children}</ButtonText>}
      {iconPosition === 'right' && renderIcon()}
    </StyledButton>
  )
}

// Button variants for common use cases
export const PrimaryButton = (props) => <Button variant="primary" {...props} />
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />
export const OutlineButton = (props) => <Button variant="outline" {...props} />
export const GhostButton = (props) => <Button variant="ghost" {...props} />
export const DangerButton = (props) => <Button variant="danger" {...props} />
export const SuccessButton = (props) => <Button variant="success" {...props} />

// Specialized buttons
export const SubmitButton = ({ loading, children, ...props }) => (
  <Button
    type="submit"
    loading={loading}
    icon={loading ? null : <HiCheck />}
    iconPosition="right"
    {...props}
  >
    {loading ? 'Saving...' : (children || 'Save')}
  </Button>
)

export const CancelButton = (props) => (
  <Button
    variant="ghost"
    icon={<HiXMark />}
    iconPosition="left"
    {...props}
  >
    Cancel
  </Button>
)

export const LinkButton = ({ href, external = false, children, ...props }) => {
  const handleClick = (e) => {
    e.preventDefault()
    if (external) {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = href
    }
  }

  return (
    <Button
      onClick={handleClick}
      icon={external ? <HiArrowRight /> : null}
      iconPosition="right"
      {...props}
    >
      {children}
    </Button>
  )
}

// Styled components
const StyledButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.hasIcon ? '0.5rem' : '0'};
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  
  /* Size variants */
  ${props => {
    switch (props.size) {
      case 'small':
        return `
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          min-height: 32px;
        `
      case 'large':
        return `
          padding: 1rem 2rem;
          font-size: 1.125rem;
          min-height: 48px;
        `
      case 'medium':
      default:
        return `
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          min-height: 40px;
        `
    }
  }}
  
  /* Full width */
  ${props => props.fullWidth && `
    width: 100%;
  `}
  
  /* Color variants */
  ${props => {
    switch (props.variant) {
      case 'secondary':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
          }
          
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `
      case 'outline':
        return `
          background: transparent;
          color: #58A4B0;
          border: 1px solid #58A4B0;
          
          &:hover:not(:disabled) {
            background: rgba(88, 164, 176, 0.1);
            transform: translateY(-1px);
          }
          
          &:active:not(:disabled) {
            background: rgba(88, 164, 176, 0.2);
            transform: translateY(0);
          }
        `
      case 'ghost':
        return `
          background: transparent;
          color: #a0a0a0;
          border: 1px solid transparent;
          
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.1);
            transform: translateY(-1px);
          }
          
          &:active:not(:disabled) {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(0);
          }
        `
      case 'danger':
        return `
          background: linear-gradient(145deg, #ef4444, #dc2626);
          color: #ffffff;
          border: 1px solid #ef4444;
          
          &:hover:not(:disabled) {
            background: linear-gradient(145deg, #dc2626, #b91c1c);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
          
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `
      case 'success':
        return `
          background: linear-gradient(145deg, #10b981, #059669);
          color: #ffffff;
          border: 1px solid #10b981;
          
          &:hover:not(:disabled) {
            background: linear-gradient(145deg, #059669, #047857);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
          
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `
      case 'primary':
      default:
        return `
          background: linear-gradient(145deg, #58A4B0, #4a8a94);
          color: #ffffff;
          border: 1px solid #58A4B0;
          
          &:hover:not(:disabled) {
            background: linear-gradient(145deg, #4a8a94, #3c7580);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(88, 164, 176, 0.3);
          }
          
          &:active:not(:disabled) {
            background: linear-gradient(145deg, #3c7580, #2e5f6b);
            transform: translateY(0);
          }
        `
    }
  }}
  
  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
  
  /* Focus styles */
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(88, 164, 176, 0.3);
  }
  
  /* Loading state */
  ${props => props.disabled && `
    pointer-events: none;
  `}
`

const ButtonText = styled.span`
  display: inline-block;
`

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.125em;
  
  ${props => props.position === 'right' && `
    order: 1;
  `}
`

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`

export default Button