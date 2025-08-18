import React from 'react'
import styled from 'styled-components'

const Form = ({
  children,
  onSubmit,
  onReset,
  className,
  gap = 'medium',
  layout = 'vertical',
  maxWidth,
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(e)
    }
  }

  const handleReset = (e) => {
    if (onReset) {
      onReset(e)
    }
  }

  return (
    <StyledForm
      onSubmit={handleSubmit}
      onReset={handleReset}
      className={className}
      gap={gap}
      layout={layout}
      maxWidth={maxWidth}
      {...props}
    >
      {children}
    </StyledForm>
  )
}

// Form section components
export const FormSection = ({ title, description, children, className }) => (
  <FormSectionContainer className={className}>
    {(title || description) && (
      <FormSectionHeader>
        {title && <FormSectionTitle>{title}</FormSectionTitle>}
        {description && <FormSectionDescription>{description}</FormSectionDescription>}
      </FormSectionHeader>
    )}
    <FormSectionContent>
      {children}
    </FormSectionContent>
  </FormSectionContainer>
)

export const FormRow = ({ children, className, gap = 'medium', align = 'stretch' }) => (
  <FormRowContainer className={className} gap={gap} align={align}>
    {children}
  </FormRowContainer>
)

export const FormGroup = ({ children, className }) => (
  <FormGroupContainer className={className}>
    {children}
  </FormGroupContainer>
)

export const FormActions = ({ 
  children, 
  className, 
  align = 'flex-end', 
  gap = 'medium',
  fullWidth = false 
}) => (
  <FormActionsContainer 
    className={className} 
    align={align} 
    gap={gap}
    fullWidth={fullWidth}
  >
    {children}
  </FormActionsContainer>
)

// Field wrapper for better form layout
export const FormField = ({ 
  children, 
  className, 
  required = false,
  error,
  fullWidth = true 
}) => (
  <FormFieldContainer 
    className={className}
    required={required}
    hasError={!!error}
    fullWidth={fullWidth}
  >
    {children}
  </FormFieldContainer>
)

// Fieldset for grouping related fields
export const FormFieldset = ({ legend, children, className }) => (
  <StyledFieldset className={className}>
    {legend && <StyledLegend>{legend}</StyledLegend>}
    {children}
  </StyledFieldset>
)

// Form error display
export const FormError = ({ children, className }) => (
  <FormErrorContainer className={className}>
    {children}
  </FormErrorContainer>
)

// Form success message
export const FormSuccess = ({ children, className }) => (
  <FormSuccessContainer className={className}>
    {children}
  </FormSuccessContainer>
)

// Styled components
const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  
  ${props => {
    switch (props.gap) {
      case 'small':
        return 'gap: 1rem;'
      case 'large':
        return 'gap: 2rem;'
      case 'medium':
      default:
        return 'gap: 1.5rem;'
    }
  }}
  
  ${props => props.layout === 'horizontal' && `
    @media (min-width: 768px) {
      flex-direction: row;
      align-items: flex-start;
    }
  `}
  
  ${props => props.maxWidth && `
    max-width: ${props.maxWidth};
    margin: 0 auto;
  `}
`

const FormSectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const FormSectionHeader = styled.div`
  margin-bottom: 0.5rem;
`

const FormSectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
`

const FormSectionDescription = styled.p`
  font-size: 0.875rem;
  color: #a0a0a0;
  margin: 0;
  line-height: 1.5;
`

const FormSectionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const FormRowContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: ${props => props.align};
  
  ${props => {
    switch (props.gap) {
      case 'small':
        return 'gap: 0.75rem;'
      case 'large':
        return 'gap: 1.5rem;'
      case 'medium':
      default:
        return 'gap: 1rem;'
    }
  }}
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
  
  > * {
    flex: 1;
    min-width: 0;
  }
`

const FormGroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const FormActionsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${props => props.align};
  flex-wrap: wrap;
  
  ${props => {
    switch (props.gap) {
      case 'small':
        return 'gap: 0.5rem;'
      case 'large':
        return 'gap: 1.5rem;'
      case 'medium':
      default:
        return 'gap: 1rem;'
    }
  }}
  
  ${props => props.fullWidth && `
    > * {
      flex: 1;
    }
  `}
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    
    > * {
      width: 100%;
    }
  }
`

const FormFieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  
  ${props => props.hasError && `
    /* Add any field-level error styling here */
  `}
`

const StyledFieldset = styled.fieldset`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 0;
  background: rgba(255, 255, 255, 0.02);
  
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const StyledLegend = styled.legend`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  padding: 0 0.5rem;
  margin-left: -0.5rem;
`

const FormErrorContainer = styled.div`
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #ef4444;
  font-size: 0.875rem;
  line-height: 1.5;
  
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  
  &::before {
    content: '⚠️';
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
`

const FormSuccessContainer = styled.div`
  padding: 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  color: #10b981;
  font-size: 0.875rem;
  line-height: 1.5;
  
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  
  &::before {
    content: '✅';
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
`

export default Form