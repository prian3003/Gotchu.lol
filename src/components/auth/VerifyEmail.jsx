import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import styled from 'styled-components'
import ParticleBackground from '../effects/ParticleBackground'
import ShinyText from '../effects/ShinyText'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { API_BASE_URL } from '../../config/api'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { colors, isDarkMode } = useTheme()
  const { login } = useAuth()
  
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [redirectCountdown, setRedirectCountdown] = useState(5)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    verifyEmail(token)
  }, [token])

  // Countdown and redirect after successful verification
  useEffect(() => {
    let timer
    if (status === 'success' && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1)
      }, 1000)
    } else if (status === 'success' && redirectCountdown === 0) {
      navigate('/dashboard')
    }
    return () => clearTimeout(timer)
  }, [status, redirectCountdown, navigate])

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(verificationToken)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include' // Include cookies for httpOnly session
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        setMessage(data.message || 'Email verified successfully!')
        setUserEmail(data.data?.user?.email || '')
        
        // Store auth data using auth context
        if (data.data?.user) {
          await login(data.data?.token, data.data?.session_id, data.data.user)
        }
      } else {
        setStatus('error')
        setMessage(data.message || 'Failed to verify email')
      }
    } catch (error) {
      console.error('Email verification error:', error)
      setStatus('error')
      setMessage('Network error occurred. Please try again.')
    }
  }

  const handleResendVerification = async () => {
    if (!userEmail) {
      setMessage('Email address not available for resend')
      return
    }

    try {
      const response = await fetch('${API_BASE_URL}/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userEmail })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage('New verification email sent successfully!')
      } else {
        setMessage(data.message || 'Failed to send verification email')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      setMessage('Network error. Please try again.')
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="status-content">
            <div className="icon-wrapper verifying">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="verify-icon">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <animateTransform attributeName="transform" type="rotate" dur="1s" values="0 12 12;360 12 12" repeatCount="indefinite"/>
                </path>
              </svg>
            </div>
            
            <h1>Verifying your email...</h1>
            <p className="subtitle">
              Please wait while we verify your email address
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="status-content">
            <div className="icon-wrapper success">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="success-icon">
                 <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                 <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
             </div>
            
            <h1>Email verified!</h1>
            <p className="subtitle">
              Welcome to Gotchu! Your account is now active.
            </p>
            {userEmail && (
              <p className="email-address">
                {userEmail}
              </p>
            )}
            
            <div className="redirect-info">
              <p>Redirecting to dashboard in {redirectCountdown} seconds...</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="redirect-btn"
              >
                Go to Dashboard Now
              </button>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="status-content">
            <div className="icon-wrapper error">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="error-icon">
                 <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                 <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
             </div>
            
            <h1>Verification failed</h1>
            <p className="subtitle error-message">
              {message}
            </p>
            
            <div className="error-actions">
              <p>The verification link may have expired or been used already.</p>
              
              {userEmail ? (
                <button 
                  onClick={handleResendVerification}
                  className="resend-btn"
                >
                  Send new verification email
                </button>
              ) : (
                <Link to="/signup" className="signup-link">
                  Create new account
                </Link>
              )}
              
              <Link to="/signin" className="signin-link">
                Already verified? Sign in
              </Link>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <PageWrapper>
      <ParticleBackground />
      
      {/* Large Background Text */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', transform: 'translateY(-75px)' }}>
        <ShinyText
          size="4xl"
          weight="extrabold"
          speed={4}
          baseColor={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(19, 21, 21, 0.08)"}
          shineColor={isDarkMode ? "rgba(88, 164, 176, 0.3)" : "rgba(88, 164, 176, 0.4)"}
          intensity={1}
          direction="left-to-right"
          shineWidth={30}
          repeat="infinite"
          className="text-[20vw] dm-serif-text-regular tracking-tight leading-none select-none uppercase"
        >
          verify
        </ShinyText>
      </div>
      
      <div className="container">
        <div className="card">
          {renderContent()}
          
          {status !== 'verifying' && (
            <div className="back-section">
              <Link to="/" className="back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H6M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to home
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;

  .container {
    width: 100%;
    max-width: 500px;
    position: relative;
    z-index: 10;
  }

  .card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 3rem 2.5rem;
    backdrop-filter: blur(10px);
    text-align: center;
  }

  .status-content {
    margin-bottom: 2rem;

    .icon-wrapper {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      
      &.verifying .verify-icon {
        color: #58A4B0;
      }
      
      &.success .success-icon {
        color: #58A4B0;
        filter: drop-shadow(0 0 20px rgba(88, 164, 176, 0.3));
        animation: successPulse 2s ease-in-out;
      }
      
      &.error .error-icon {
        color: #ff6b6b;
        filter: drop-shadow(0 0 20px rgba(255, 107, 107, 0.3));
      }
    }

    h1 {
      font-size: 2rem;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 1rem;
    }

    .subtitle {
      color: #a0a0a0;
      font-size: 1rem;
      margin-bottom: 1rem;
      
      &.error-message {
        color: #ff6b6b;
      }
    }

    .email-address {
      color: #58A4B0;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      word-break: break-all;
    }
  }

  .redirect-info {
    background: rgba(88, 164, 176, 0.1);
    border: 1px solid rgba(88, 164, 176, 0.2);
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1.5rem;

    p {
      color: #58A4B0;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .redirect-btn {
      background: linear-gradient(135deg, #58A4B0 0%, #4A8C96 100%);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 100%;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 25px rgba(88, 164, 176, 0.3);
      }
    }
  }

  .error-actions {
    text-align: center;
    margin-top: 1.5rem;

    p {
      color: #a0a0a0;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }

    .resend-btn {
      background: linear-gradient(135deg, #58A4B0 0%, #4A8C96 100%);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 100%;
      margin-bottom: 1rem;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 25px rgba(88, 164, 176, 0.3);
      }
    }

    .signup-link, .signin-link {
      display: block;
      color: #58A4B0;
      text-decoration: none;
      font-size: 0.9rem;
      padding: 0.5rem;
      margin: 0.5rem 0;
      transition: color 0.3s ease;

      &:hover {
        color: #4A8C96;
      }
    }
  }

  .back-section {
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .back-link {
      color: #a0a0a0;
      text-decoration: none;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: color 0.3s ease;

      &:hover {
        color: #58A4B0;
      }
    }
  }

  @keyframes successPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

export default VerifyEmail