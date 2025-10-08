import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import styled from 'styled-components'
import ParticleBackground from '../effects/ParticleBackground'
import ShinyText from '../effects/ShinyText'
import { useTheme } from '../../contexts/ThemeContext'
import { API_BASE_URL } from '../../config/api'

function EmailVerification() {
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState(null) // 'success', 'error', or null
  const [resendMessage, setResendMessage] = useState('')
  const [countdown, setCountdown] = useState(0)
  const { colors, isDarkMode } = useTheme()
  const location = useLocation()
  
  // Get email from location state (passed from signup)
  const userEmail = location.state?.email || ''

  // Countdown timer for resend cooldown
  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleResendVerification = async () => {
    if (countdown > 0 || isResending) return

    setIsResending(true)
    setResendStatus(null)
    setResendMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userEmail })
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError)
        throw new Error('Invalid server response')
      }

      if (response.ok && data.success) {
        setResendStatus('success')
        setResendMessage('Verification email sent successfully!')
        setCountdown(60) // 60 second cooldown
      } else {
        setResendStatus('error')
        setResendMessage(data.message || 'Failed to send verification email')
        if (data.message?.includes('wait')) {
          setCountdown(60) // Set cooldown if rate limited
        }
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      setResendStatus('error')
      setResendMessage('Network error. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <PageWrapper>
      <ParticleBackground />
      
      <div className="container">
        {/* Email Status Container Above Card */}
        <div className="email-status">
          <h2>Check your email</h2>
          <p className="email-subtitle">We've sent a verification link to</p>
          <p className="user-email">{userEmail}</p>
        </div>

        {/* Card with Info Content Only */}
        <div className="card">
          <div className="content">
            <div className="info-section">
              <div className="info-item">
                <div className="info-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>Link expires in 24 hours</span>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>Click the link to activate your account</span>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>Check your spam folder if you don't see it</span>
              </div>
            </div>

            {resendStatus && (
              <div className={`status-message ${resendStatus}`}>
                {resendMessage}
              </div>
            )}

            <div className="resend-section">
              <p>Didn't receive the email?</p>
              <button 
                onClick={handleResendVerification}
                disabled={isResending || countdown > 0}
                className={`resend-btn ${isResending || countdown > 0 ? 'disabled' : ''}`}
              >
                {isResending ? (
                  <>
                    <div className="spinner" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  'Resend verification email'
                )}
              </button>
            </div>

            <div className="back-section">
              <Link to="/signup" className="back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H6M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

const PageWrapper = styled.div`
  /* === FOUNDATION === */
  min-height: 100vh;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;

  /* === GLOBAL RESET === */
  * {
    box-sizing: border-box;
  }

  /* === CONTAINER SYSTEM === */
  .container {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }

  /* === CARD DESIGN === */
  .card {
    /* Background & Borders */
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    
    /* Layout */
    padding: 40px 32px;
    width: 100%;
    
    /* Effects */
    backdrop-filter: blur(20px);
    box-shadow: 
      0 4px 16px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    
    /* Behavior */
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .card:hover {
    transform: translateY(-1px);
    box-shadow: 
      0 8px 24px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  /* === RESPONSIVE BREAKPOINTS === */
  @media (max-width: 520px) {
    padding: 16px;
    
    .container {
      max-width: 100%;
    }
    
    .card {
      padding: 32px 24px;
      border-radius: 12px;
    }
  }

  @media (max-width: 380px) {
    padding: 12px;
    
    .card {
      padding: 24px 20px;
    }
  }

  /* === EMAIL STATUS CONTAINER (Above Card) === */
  .email-status {
    text-align: center;
    margin-bottom: 24px;
    
    h2 {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px 0;
      line-height: 1.3;
    }
    
    .email-subtitle {
      color: #a0a0a0;
      font-size: 16px;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }
    
    .user-email {
      color: #58A4B0;
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      word-break: break-all;
      line-height: 1.4;
    }
  }

  /* === CARD CONTENT SECTION === */
  .content {
    /* Card now only contains the action items */
  }

  /* === RESPONSIVE EMAIL STATUS === */
  @media (max-width: 520px) {
    .email-status {
      margin-bottom: 20px;
      
      h2 {
        font-size: 24px;
      }
      
      .email-subtitle {
        font-size: 15px;
      }
      
      .user-email {
        font-size: 15px;
      }
    }
  }

  @media (max-width: 380px) {
    .email-status {
      h2 {
        font-size: 22px;
      }
      
      .email-subtitle {
        font-size: 14px;
      }
      
      .user-email {
        font-size: 14px;
      }
    }
  }

  /* === INFO SECTION === */
  .info-section {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .info-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    color: #d0d0d0;
    font-size: 15px;
    line-height: 1.5;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .info-icon {
      color: #58A4B0;
      flex-shrink: 0;
      margin-top: 2px;
    }

    span {
      flex: 1;
    }
  }

  /* === STATUS MESSAGES === */
  .status-message {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 15px;
    text-align: center;
    font-weight: 500;

    &.success {
      background: rgba(88, 164, 176, 0.1);
      border: 1px solid rgba(88, 164, 176, 0.25);
      color: #58A4B0;
    }

    &.error {
      background: rgba(255, 107, 107, 0.1);
      border: 1px solid rgba(255, 107, 107, 0.25);
      color: #ff6b6b;
    }
  }

  /* === RESEND SECTION === */
  .resend-section {
    text-align: center;
    margin-bottom: 24px;

    p {
      color: #a0a0a0;
      font-size: 15px;
      margin: 0 0 16px 0;
      line-height: 1.5;
    }

    .resend-btn {
      background: linear-gradient(135deg, #58A4B0 0%, #4A8C96 100%);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 14px 24px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      min-height: 48px;

      &:hover:not(.disabled) {
        transform: translateY(-1px);
        box-shadow: 0 8px 20px rgba(88, 164, 176, 0.3);
      }

      &.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #ffffff;
        animation: spin 1s ease-in-out infinite;
      }
    }
  }

  /* === BACK SECTION === */
  .back-section {
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .back-link {
      color: #a0a0a0;
      text-decoration: none;
      font-size: 15px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: color 0.2s ease;

      &:hover {
        color: #58A4B0;
      }
    }
  }

  /* === ANIMATIONS === */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* === MOBILE RESPONSIVE === */
  @media (max-width: 520px) {
    .info-section {
      padding: 16px;
      margin-bottom: 20px;
    }
    
    .info-item {
      font-size: 14px;
      margin-bottom: 14px;
    }
    
    .status-message {
      font-size: 14px;
      padding: 10px 14px;
    }
    
    .resend-section p {
      font-size: 14px;
    }
    
    .resend-btn {
      font-size: 14px;
      padding: 12px 20px;
    }
    
    .back-link {
      font-size: 14px;
    }
  }
`;

export default EmailVerification