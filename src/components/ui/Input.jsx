import React, { useState, forwardRef } from 'react'
import styled from 'styled-components'
import { HiEye, HiEyeSlash, HiExclamationCircle, HiCheck, HiMagnifyingGlass } from 'react-icons/hi2'

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  success,
  disabled = false,
  required = false,
  fullWidth = false,
  size = 'medium',
  variant = 'default',
  icon,
  iconPosition = 'left',
  maxLength,
  minLength,
  pattern,
  autoComplete,
  autoFocus = false,
  className,
  helpText,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const inputType = type === 'password' && showPassword ? 'text' : type

  const handleFocus = (e) => {
    setIsFocused(true)
    if (onFocus) onFocus(e)
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    if (onBlur) onBlur(e)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const renderIcon = () => {
    if (success) {
      return <StatusIcon status="success"><HiCheck /></StatusIcon>
    }
    if (error) {
      return <StatusIcon status="error"><HiExclamationCircle /></StatusIcon>
    }
    if (icon) {
      return <IconWrapper position={iconPosition}>{icon}</IconWrapper>
    }
    return null
  }

  const renderPasswordToggle = () => {
    if (type !== 'password') return null
    
    return (
      <PasswordToggle onClick={togglePasswordVisibility} type="button">
        {showPassword ? <HiEyeSlash /> : <HiEye />}
      </PasswordToggle>
    )
  }

  return (
    <InputContainer className={className} fullWidth={fullWidth}>
      {label && (
        <Label htmlFor={props.id} required={required}>
          {label}
          {required && <RequiredIndicator>*</RequiredIndicator>}
        </Label>
      )}
      
      <InputWrapper
        variant={variant}
        size={size}
        isFocused={isFocused}
        hasError={!!error}
        hasSuccess={!!success}
        disabled={disabled}
        hasLeftIcon={!!(icon && iconPosition === 'left')}
        hasRightIcon={!!(icon && iconPosition === 'right') || type === 'password' || error || success}
      >
        {iconPosition === 'left' && renderIcon()}
        
        <StyledInput
          ref={ref}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          {...props}
        />
        
        {iconPosition === 'right' && renderIcon()}
        {renderPasswordToggle()}
      </InputWrapper>
      
      {(helpText || error) && (
        <InputHelp hasError={!!error}>
          {error || helpText}
        </InputHelp>
      )}
    </InputContainer>
  )
})

// Specialized input components
export const SearchInput = (props) => (
  <Input
    type="search"
    icon={<HiMagnifyingGlass />}
    iconPosition="left"
    placeholder="Search..."
    {...props}
  />
)

export const EmailInput = (props) => (
  <Input
    type="email"
    autoComplete="email"
    placeholder="Enter your email"
    {...props}
  />
)

export const PasswordInput = (props) => (
  <Input
    type="password"
    autoComplete="current-password"
    placeholder="Enter your password"
    {...props}
  />
)

export const UrlInput = (props) => (
  <Input
    type="url"
    placeholder="https://example.com"
    pattern="https?://.+"
    {...props}
  />
)

export const NumberInput = ({ min, max, step = 1, ...props }) => (
  <Input
    type="number"
    min={min}
    max={max}
    step={step}
    {...props}
  />
)

// Textarea component
export const TextArea = forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  success,
  disabled = false,
  required = false,
  fullWidth = false,
  rows = 4,
  maxLength,
  className,
  helpText,
  resize = 'vertical',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = (e) => {
    setIsFocused(true)
    if (onFocus) onFocus(e)
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    if (onBlur) onBlur(e)
  }

  return (
    <InputContainer className={className} fullWidth={fullWidth}>
      {label && (
        <Label htmlFor={props.id} required={required}>
          {label}
          {required && <RequiredIndicator>*</RequiredIndicator>}
        </Label>
      )}
      
      <TextAreaWrapper
        isFocused={isFocused}
        hasError={!!error}
        hasSuccess={!!success}
        disabled={disabled}
        resize={resize}
      >
        <StyledTextArea
          ref={ref}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          {...props}
        />
        
        {(error || success) && (
          <TextAreaIcon>
            {success && <HiCheck />}
            {error && <HiExclamationCircle />}
          </TextAreaIcon>
        )}
      </TextAreaWrapper>
      
      {(helpText || error) && (
        <InputHelp hasError={!!error}>
          {error || helpText}
        </InputHelp>
      )}
      
      {maxLength && (
        <CharacterCount>
          {value?.length || 0} / {maxLength}
        </CharacterCount>
      )}
    </InputContainer>
  )
})

// Styled components
const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
`

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`

const RequiredIndicator = styled.span`
  color: #ef4444;
  font-size: 0.875rem;
`

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Size variants */
  ${props => {
    switch (props.size) {
      case 'small':
        return `
          min-height: 32px;
          padding: 0 0.75rem;
          gap: 0.5rem;
        `
      case 'large':
        return `
          min-height: 48px;
          padding: 0 1.25rem;
          gap: 0.75rem;
        `
      case 'medium':
      default:
        return `
          min-height: 40px;
          padding: 0 1rem;
          gap: 0.5rem;
        `
    }
  }}
  
  /* Variant styles */
  ${props => {
    switch (props.variant) {
      case 'filled':
        return `
          background: rgba(255, 255, 255, 0.1);
          border-color: transparent;
        `
      case 'outlined':
        return `
          background: transparent;
          border-color: rgba(255, 255, 255, 0.3);
        `
      default:
        return ``
    }
  }}
  
  /* State styles */
  ${props => props.isFocused && `
    border-color: #58A4B0;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(88, 164, 176, 0.1);
  `}
  
  ${props => props.hasError && `
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
    
    ${props.isFocused && `
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    `}
  `}
  
  ${props => props.hasSuccess && `
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.05);
    
    ${props.isFocused && `
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    `}
  `}
  
  ${props => props.disabled && `
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.02);
  `}
  
  &:hover:not(:focus-within) {
    ${props => !props.disabled && !props.hasError && `
      border-color: rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
    `}
  }
`

const StyledInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 1rem;
  font-family: inherit;
  
  &::placeholder {
    color: #666;
  }
  
  &:disabled {
    cursor: not-allowed;
  }
  
  /* Remove default styles for various input types */
  &[type="search"] {
    -webkit-appearance: none;
    
    &::-webkit-search-decoration,
    &::-webkit-search-cancel-button,
    &::-webkit-search-results-button,
    &::-webkit-search-results-decoration {
      display: none;
    }
  }
  
  &[type="number"] {
    -moz-appearance: textfield;
    
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
`

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0a0a0;
  font-size: 1.125rem;
  flex-shrink: 0;
`

const StatusIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  flex-shrink: 0;
  
  ${props => props.status === 'success' && `
    color: #10b981;
  `}
  
  ${props => props.status === 'error' && `
    color: #ef4444;
  `}
`

const PasswordToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 0;
  font-size: 1.125rem;
  transition: color 0.3s ease;
  flex-shrink: 0;
  
  &:hover {
    color: #ffffff;
  }
  
  &:focus {
    outline: none;
    color: #58A4B0;
  }
`

const InputHelp = styled.div`
  font-size: 0.75rem;
  line-height: 1.4;
  
  ${props => props.hasError ? `
    color: #ef4444;
  ` : `
    color: #a0a0a0;
  `}
`

// Textarea specific styles
const TextAreaWrapper = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${props => props.isFocused && `
    border-color: #58A4B0;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(88, 164, 176, 0.1);
  `}
  
  ${props => props.hasError && `
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
    
    ${props.isFocused && `
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    `}
  `}
  
  ${props => props.hasSuccess && `
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.05);
    
    ${props.isFocused && `
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    `}
  `}
  
  ${props => props.disabled && `
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.02);
  `}
  
  &:hover:not(:focus-within) {
    ${props => !props.disabled && !props.hasError && `
      border-color: rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
    `}
  }
`

const StyledTextArea = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 1rem;
  font-family: inherit;
  padding: 1rem;
  resize: ${props => props.resize || 'vertical'};
  
  &::placeholder {
    color: #666;
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`

const TextAreaIcon = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  pointer-events: none;
  
  svg {
    color: #10b981;
  }
  
  ${props => props.hasError && `
    svg {
      color: #ef4444;
    }
  `}
`

const CharacterCount = styled.div`
  font-size: 0.75rem;
  color: #a0a0a0;
  text-align: right;
  margin-top: -0.25rem;
`

Input.displayName = 'Input'
TextArea.displayName = 'TextArea'

export default Input