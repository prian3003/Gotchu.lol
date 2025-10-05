import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Loader from '../ui/Loader'
import { API_BASE_URL } from '../../config/api'

function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const error = searchParams.get('error')
      const newUser = searchParams.get('new_user')
      const needsSetup = searchParams.get('needs_setup')
      const provider = searchParams.get('provider')

      if (error) {
        // Handle OAuth errors
        const errorMessages = {
          oauth_failed: 'OAuth authentication failed',
          invalid_state: 'Invalid authentication state',
          token_exchange_failed: 'Failed to exchange authentication token',
          user_info_failed: 'Failed to retrieve user information',
          user_creation_failed: 'Failed to create user account',
          session_creation_failed: 'Failed to create session',
          unsupported_provider: 'Unsupported authentication provider'
        }
        
        const errorMessage = errorMessages[error] || 'Authentication failed'
        navigate('/signin', { 
          state: { 
            error: errorMessage 
          }
        })
        return
      }

      // OAuth success - session cookie should already be set by backend
      try {
        // Get user info using httpOnly cookie (no tokens in URL)
        const response = await fetch('${API_BASE_URL}/auth/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.user) {
            // Store authentication data (using cookies, no tokens needed)
            login(data.data.user)
            
            // Check if it's a new user or needs OAuth setup
            if (newUser === 'true' || needsSetup === 'true') {
              // Redirect to onboarding for new OAuth users or existing users linking OAuth
              navigate('/auth/onboarding', {
                replace: true,
                state: {
                  provider,
                  userInfo: {
                    suggestedUsername: searchParams.get('suggested_username') || data.data.user.username,
                    displayName: data.data.user.display_name,
                    avatar: data.data.user.avatar_url
                  }
                }
              })
            } else {
              // Navigate to dashboard for existing users
              navigate('/dashboard', {
                replace: true,
                state: {
                  message: 'Welcome back! You\'ve been signed in successfully.',
                  type: 'success'
                }
              })
            }
            return
          }
        }
      } catch (error) {
        console.error('OAuth callback error:', error)
      }

      // If we get here, something went wrong
      navigate('/signin', {
        state: {
          error: 'Authentication failed. Please try again.'
        }
      })
    }

    handleOAuthCallback()
  }, [searchParams, navigate, login])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <Loader />
      <p style={{
        color: '#a0a0a0',
        fontSize: '0.9rem',
        textAlign: 'center'
      }}>
        Completing authentication...
      </p>
    </div>
  )
}

export default OAuthCallback