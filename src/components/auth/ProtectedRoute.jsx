import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: '#ffffff'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(88, 164, 176, 0.2)',
            borderTop: '4px solid #58A4B0',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Checking authentication...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    )
  }

  // If not authenticated, redirect to sign-in with return URL
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  // If authenticated, render the protected component
  return children
}

export default ProtectedRoute