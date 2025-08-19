import React from 'react'
import styled from 'styled-components'
import { PageLoading } from './Loading'

const LazyLoadFallback = ({ error, retry, pastDelay, timedOut }) => {
  if (error) {
    return (
      <FallbackContainer>
        <ErrorContent>
          <ErrorTitle>Failed to load component</ErrorTitle>
          <ErrorMessage>
            {error.message || 'The component could not be loaded. Please try again.'}
          </ErrorMessage>
          <RetryButton onClick={retry}>
            Retry
          </RetryButton>
        </ErrorContent>
      </FallbackContainer>
    )
  }

  if (timedOut) {
    return (
      <FallbackContainer>
        <ErrorContent>
          <ErrorTitle>Loading timeout</ErrorTitle>
          <ErrorMessage>
            The component is taking longer than expected to load.
          </ErrorMessage>
          <RetryButton onClick={retry}>
            Retry
          </RetryButton>
        </ErrorContent>
      </FallbackContainer>
    )
  }

  if (pastDelay) {
    return (
      <FallbackContainer>
        <PageLoading text="Loading page..." />
      </FallbackContainer>
    )
  }

  // Don't show anything for very fast loads
  return null
}

// Route-specific fallbacks
export const DashboardFallback = () => {
  // Return null since Dashboard has its own loading state
  // This prevents double loading screens
  return null
}

export const ProfileFallback = () => {
  // Return null since UserProfile has its own loading state
  // This prevents double loading screens
  return null
}

export const AuthFallback = () => (
  <FallbackContainer>
    <PageLoading text="Loading..." />
  </FallbackContainer>
)

// Styled components
const FallbackContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
`

const ErrorContent = styled.div`
  text-align: center;
  max-width: 400px;
  padding: 2rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  backdrop-filter: blur(10px);
`

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 1rem 0;
`

const ErrorMessage = styled.p`
  font-size: 1rem;
  color: #a0a0a0;
  margin: 0 0 2rem 0;
  line-height: 1.5;
`

const RetryButton = styled.button`
  padding: 0.75rem 2rem;
  background: linear-gradient(145deg, #58A4B0, #4a8a94);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(145deg, #4a8a94, #3c7580);
    transform: translateY(-1px);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.5);
  }
`

export default LazyLoadFallback