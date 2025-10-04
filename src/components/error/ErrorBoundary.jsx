import React from 'react'
import styled from 'styled-components'
import { HiExclamationTriangle, HiArrowPath, HiHome } from 'react-icons/hi2'
import logger from '../../utils/logger'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    const eventId = logger.error('React Error Boundary caught an error', error, {
      errorInfo,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown'
    })

    this.setState({
      error,
      errorInfo,
      eventId
    })

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  reportError = (error, errorInfo) => {
    // In a real app, this would report to services like:
    // - Sentry
    // - LogRocket
    // - Bugsnag
    // - Custom error reporting endpoint
    
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.props.userId,
        sessionId: this.props.sessionId,
        buildVersion: process.env.REACT_APP_VERSION || 'unknown'
      }

      // Store in localStorage for demo purposes
      const errors = JSON.parse(localStorage.getItem('error_reports') || '[]')
      errors.push(errorReport)
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50) // Keep only last 50 errors
      }
      localStorage.setItem('error_reports', JSON.stringify(errors))
    } catch (reportingError) {
      logger.error('Failed to report error', reportingError)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    })
    
    logger.userAction('error_boundary_retry', {
      boundaryName: this.props.name
    })
  }

  handleReload = () => {
    logger.userAction('error_boundary_reload', {
      boundaryName: this.props.name
    })
    window.location.reload()
  }

  handleGoHome = () => {
    logger.userAction('error_boundary_go_home', {
      boundaryName: this.props.name
    })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }

      // Default fallback UI
      return (
        <ErrorContainer>
          <ErrorContent $variant={this.props.variant}>
            <ErrorIcon $variant={this.props.variant}>
              <HiExclamationTriangle />
            </ErrorIcon>
            
            <ErrorTitle>
              {this.props.title || 'Something went wrong'}
            </ErrorTitle>
            
            <ErrorMessage>
              {this.props.message || 
                'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.'}
            </ErrorMessage>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <ErrorDetails>
                <ErrorDetailsTitle>Error Details (Development Only)</ErrorDetailsTitle>
                <ErrorCode>
                  <strong>Error:</strong> {this.state.error.message}
                </ErrorCode>
                <ErrorCode>
                  <strong>Stack:</strong>
                  <pre>{this.state.error.stack}</pre>
                </ErrorCode>
                {this.state.errorInfo && (
                  <ErrorCode>
                    <strong>Component Stack:</strong>
                    <pre>{this.state.errorInfo.componentStack}</pre>
                  </ErrorCode>
                )}
              </ErrorDetails>
            )}

            <ErrorActions>
              <ErrorButton onClick={this.handleRetry} variant="primary">
                <HiArrowPath />
                Try Again
              </ErrorButton>
              
              <ErrorButton onClick={this.handleReload} variant="secondary">
                Reload Page
              </ErrorButton>
              
              {this.props.showHomeButton !== false && (
                <ErrorButton onClick={this.handleGoHome} variant="ghost">
                  <HiHome />
                  Go Home
                </ErrorButton>
              )}
            </ErrorActions>

            {this.state.eventId && (
              <ErrorId>
                Error ID: {this.state.eventId}
              </ErrorId>
            )}
          </ErrorContent>
        </ErrorContainer>
      )
    }

    return this.props.children
  }
}

// Specialized error boundaries
export class RouteErrorBoundary extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorContent variant="route">
            <ErrorIcon variant="route">
              <HiExclamationTriangle />
            </ErrorIcon>
            
            <ErrorTitle>Page Error</ErrorTitle>
            <ErrorMessage>
              This page encountered an error and couldn't load properly.
            </ErrorMessage>

            <ErrorActions>
              <ErrorButton onClick={this.handleRetry} variant="primary">
                <HiArrowPath />
                Retry
              </ErrorButton>
              
              <ErrorButton onClick={this.handleGoHome} variant="secondary">
                <HiHome />
                Go Home
              </ErrorButton>
            </ErrorActions>
          </ErrorContent>
        </ErrorContainer>
      )
    }

    return this.props.children
  }
}

export class ComponentErrorBoundary extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <ComponentErrorContainer>
          <ComponentErrorContent>
            <ErrorIcon variant="component">
              <HiExclamationTriangle />
            </ErrorIcon>
            
            <ComponentErrorText>
              Component failed to load
            </ComponentErrorText>
            
            <ErrorButton onClick={this.handleRetry} variant="small">
              <HiArrowPath />
              Retry
            </ErrorButton>
          </ComponentErrorContent>
        </ComponentErrorContainer>
      )
    }

    return this.props.children
  }
}

export class AsyncErrorBoundary extends ErrorBoundary {
  constructor(props) {
    super(props)
    this.promiseRejectionHandler = (event) => {
      this.setState({
        hasError: true,
        error: new Error(event.reason || 'Unhandled promise rejection')
      })
    }
  }

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.promiseRejectionHandler)
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.promiseRejectionHandler)
  }
}

// Hook for programmatic error handling
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error) => {
    logger.error('Manual error triggered', error)
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError }
}

// Styled components
const ErrorContainer = styled.div`
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  
  ${props => props.fullscreen && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #1a1a1a;
    z-index: 9999;
  `}
`

const ErrorContent = styled.div`
  text-align: center;
  max-width: 500px;
  
  ${props => {
    switch (props.variant) {
      case 'route':
        return `
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px;
          padding: 3rem 2rem;
          backdrop-filter: blur(10px);
        `
      case 'component':
        return `
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          padding: 1rem;
        `
      default:
        return `
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px;
          padding: 3rem 2rem;
          backdrop-filter: blur(10px);
        `
    }
  }}
`

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  
  ${props => {
    switch (props.variant) {
      case 'component':
        return `
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #ef4444;
        `
      default:
        return `
          color: #ef4444;
        `
    }
  }}
`

const ErrorTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 1rem 0;
`

const ErrorMessage = styled.p`
  font-size: 1rem;
  color: #a0a0a0;
  margin: 0 0 2rem 0;
  line-height: 1.5;
`

const ErrorActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
`

const ErrorButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(145deg, #ef4444, #dc2626);
          color: #ffffff;
          
          &:hover {
            background: linear-gradient(145deg, #dc2626, #b91c1c);
            transform: translateY(-1px);
          }
        `
      case 'secondary':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          &:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
          }
        `
      case 'ghost':
        return `
          background: transparent;
          color: #a0a0a0;
          
          &:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.05);
          }
        `
      case 'small':
        return `
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          background: linear-gradient(145deg, #ef4444, #dc2626);
          color: #ffffff;
          
          &:hover {
            background: linear-gradient(145deg, #dc2626, #b91c1c);
          }
        `
      default:
        return `
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        `
    }
  }}
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5);
  }
`

const ErrorId = styled.div`
  font-size: 0.75rem;
  color: #666;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`

const ErrorDetails = styled.div`
  text-align: left;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin: 2rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const ErrorDetailsTitle = styled.h4`
  color: #ffffff;
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
`

const ErrorCode = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  color: #a0a0a0;
  margin-bottom: 1rem;
  
  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0.5rem 0 0 0;
    color: #ff6b6b;
  }
  
  strong {
    color: #ffffff;
  }
`

// Component error boundary styles
const ComponentErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  padding: 1rem;
`

const ComponentErrorContent = styled.div`
  text-align: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  padding: 1rem;
  max-width: 300px;
`

const ComponentErrorText = styled.p`
  font-size: 0.875rem;
  color: #ef4444;
  margin: 0.5rem 0 1rem 0;
`

export default ErrorBoundary