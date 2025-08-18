import styled from 'styled-components'

// Main Layout Components
export const CustomizationWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(145deg, #0F0F23, #1a1a2e);
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

export const CustomizationContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  
  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
    gap: 3rem;
  }
`

export const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

export const Sidebar = styled.div`
  position: sticky;
  top: 2rem;
  height: fit-content;
`

// Navigation Components
export const TabNavigation = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(88, 164, 176, 0.2);
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`

export const TabButton = styled.button`
  background: ${props => props.$active ? 'linear-gradient(135deg, #58A4B0, #4A8C96)' : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'};
  border: none;
  border-radius: 8px 8px 0 0;
  padding: 1rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    color: #ffffff;
    background: ${props => props.$active ? 'linear-gradient(135deg, #58A4B0, #4A8C96)' : 'rgba(88, 164, 176, 0.1)'};
  }
  
  ${props => props.$active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: #58A4B0;
    }
  `}
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
  }
`

// Save Controls
export const SaveSnackbar = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  max-width: 600px;
  width: 90%;
  
  @media (max-width: 768px) {
    bottom: 1rem;
    width: 95%;
  }
`

export const SaveSnackbarContent = styled.div`
  background: linear-gradient(145deg, rgba(15, 15, 35, 0.95), rgba(20, 20, 40, 0.95));
  border: 1px solid rgba(88, 164, 176, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
`

export const SaveSnackbarIcon = styled.div`
  color: #f59e0b;
  font-size: 1.2rem;
  
  .spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`

export const SaveSnackbarText = styled.div`
  flex: 1;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.95rem;
`

export const SaveSnackbarActions = styled.div`
  display: flex;
  gap: 0.75rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`

export const SaveSnackbarButton = styled.button`
  background: ${props => props.$primary 
    ? 'linear-gradient(135deg, #58A4B0, #4A8C96)' 
    : 'rgba(255, 255, 255, 0.1)'
  };
  color: #ffffff;
  border: ${props => props.$primary ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'};
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover:not(:disabled) {
    background: ${props => props.$primary 
      ? 'linear-gradient(135deg, #4A8C96, #58A4B0)' 
      : 'rgba(255, 255, 255, 0.15)'
    };
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 640px) {
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
  }
`

// Error Notifications
export const ErrorNotification = styled.div`
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
  background: linear-gradient(145deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95));
  color: white;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 40px rgba(239, 68, 68, 0.3);
  max-width: 400px;
  
  .error-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
  }
  
  span {
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  p {
    margin: 0.25rem 0 0 0;
    font-size: 0.8rem;
    opacity: 0.9;
  }
`

// Preview Components
export const PreviewContainer = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`

export const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h3 {
    color: #ffffff;
    font-size: 1rem;
    margin: 0;
  }
`

export const PreviewToggle = styled.button`
  background: rgba(88, 164, 176, 0.1);
  color: #58A4B0;
  border: 1px solid rgba(88, 164, 176, 0.3);
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(88, 164, 176, 0.2);
    border-color: rgba(88, 164, 176, 0.5);
  }
`

// Form Elements
export const FormSection = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.2);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  
  h2 {
    color: #ffffff;
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  h3 {
    color: #ffffff;
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
  }
`

export const FormGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
`

export const FormField = styled.div`
  label {
    display: block;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  input, select, textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(88, 164, 176, 0.3);
    border-radius: 8px;
    padding: 0.75rem;
    color: #ffffff;
    font-size: 0.9rem;
    
    &:focus {
      outline: none;
      border-color: #58A4B0;
      box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.2);
    }
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }
  
  textarea {
    resize: vertical;
    min-height: 100px;
    font-family: inherit;
  }
`

// Loading States
export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #ffffff;
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(88, 164, 176, 0.2);
    border-top: 3px solid #58A4B0;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`