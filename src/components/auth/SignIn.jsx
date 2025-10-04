import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import ShinyText from '../effects/ShinyText'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import TurnstileModal from '../modals/TurnstileModal'
import { 
  HiFingerPrint,
  HiShieldCheck
} from 'react-icons/hi2'

function SignIn() {
  const [formData, setFormData] = useState({
    identifier: '', // Can be username or email
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [twoFACode, setTwoFACode] = useState('')
  const [tempLoginData, setTempLoginData] = useState(null)
  const [showTurnstileModal, setShowTurnstileModal] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false)
  const { colors, isDarkMode } = useTheme()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Auto-perform login when turnstile token is received
  useEffect(() => {
    if (turnstileToken && formData.identifier && formData.password && !hasAttemptedLogin) {
      setHasAttemptedLogin(true)
      performLogin()
    }
  }, [turnstileToken])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handle2FASubmit = async (e) => {
    e.preventDefault()
    
    if (!twoFACode || twoFACode.length !== 6) {
      setErrors({ twoFA: 'Please enter a valid 6-digit code' })
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      // Send the 2FA code along with the stored login credentials
      const response = await fetch('http://localhost:8080/api/auth/login/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for httpOnly session
        body: JSON.stringify({
          identifier: tempLoginData.identifier,
          password: tempLoginData.password,
          twofa_code: twoFACode
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store authentication data
        if (data.data?.token && data.data?.session_id) {
          login(data.data.token, data.data.session_id, data.data.user)
        }

        // Redirect to dashboard
        const from = location.state?.from?.pathname || '/dashboard'
        navigate(from, { replace: true })
      } else {
        setErrors({ twoFA: data.message || 'Invalid 2FA code' })
      }
      
    } catch (error) {
      console.error('2FA verification error:', error)
      setErrors({ twoFA: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const goBackToLogin = () => {
    // Reset all 2FA related state
    setShow2FA(false)
    setTwoFACode('')
    setTempLoginData(null)
    
    // Reset form state
    setErrors({})
    setIsLoading(false)
    
    // Reset Turnstile verification
    setTurnstileToken('')
    setShowTurnstileModal(false)
    
    // Optionally reset form data to prevent confusion
    // setFormData({ identifier: '', password: '' })
  }

  const handleSocialLogin = async (provider) => {
    try {
      setIsLoading(true)
      setErrors({})
      
      // Generate a secure state parameter for OAuth
      const state = btoa(JSON.stringify({
        provider,
        timestamp: Date.now(),
        redirect: location.state?.from?.pathname || '/dashboard'
      }))
      
      // Redirect to backend OAuth initiation endpoint
      const authUrl = `http://localhost:8080/api/auth/oauth/${provider}?state=${encodeURIComponent(state)}`
      
      // Clear loading state before redirect to prevent glitches if user comes back
      setTimeout(() => {
        window.location.href = authUrl
      }, 100)
      
    } catch (error) {
      console.error(`${provider} login error:`, error)
      setErrors({ general: `Failed to initiate ${provider} login. Please try again.` })
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Username or email is required'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // If no Turnstile token yet, show the modal first
    if (!turnstileToken) {
      setShowTurnstileModal(true)
      setHasAttemptedLogin(false) // Reset flag
      return
    }

    // Proceed with actual login if we have a token
    if (!hasAttemptedLogin) {
      setHasAttemptedLogin(true)
      await performLogin()
    }
  }

  const handleTurnstileVerified = (token) => {
    setTurnstileToken(token)
    setShowTurnstileModal(false)
    setHasAttemptedLogin(false) // Reset flag for new attempt
    // Note: performLogin will be called when turnstileToken state updates
  }

  const performLogin = async () => {
    setIsLoading(true)
    setErrors({}) // Clear previous errors
    
    try {
      const loginData = {
        identifier: formData.identifier.toLowerCase(),
        password: formData.password,
        turnstile_token: turnstileToken
      }
      
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for httpOnly session
        body: JSON.stringify(loginData)
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError)
        throw new Error('Invalid server response')
      }

      if (response.ok && data.success) {
        
        // Check if user has 2FA enabled
        if (data.requires_2fa) {
          // Store temporary login data and show 2FA form
          setTempLoginData(loginData)
          setShow2FA(true)
          setErrors({}) // Clear any previous errors
          return
        }
        
        // Store authentication data using auth context (no tokens needed - using cookies)
        login(data.data.user)

        // Check if user is verified
        if (data.data?.user?.is_verified) {
          // Redirect to intended destination or dashboard
          const from = location.state?.from?.pathname || '/dashboard'
          navigate(from, { replace: true })
        } else {
          // Redirect to email verification page for unverified users
          navigate('/email-verification', { 
            state: { email: data.data?.user?.email || formData.identifier }
          })
        }
      } else {
        setErrors({ general: data.message || 'Invalid username/email or password' })
        setHasAttemptedLogin(false) // Reset flag on failure to allow retry
      }
      
    } catch (error) {
      console.error('Sign in error:', error)
      setErrors({ general: 'Network error. Please try again.' })
      setHasAttemptedLogin(false) // Reset flag on error to allow retry
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageWrapper colors={colors}>
      
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
          login
        </ShinyText>
      </div>
      
      <div className="container">
        <div className="form-container">

          {!show2FA ? (
            <form onSubmit={handleSubmit} className="form">
            {errors.general && (
              <div className="error-banner">
                {errors.general}
              </div>
            )}
            
            <div className="input-group">
              <label htmlFor="identifier">Username or Email</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                required
                placeholder="Enter your username or email"
                className={errors.identifier ? 'error' : ''}
              />
              {errors.identifier && <span className="error-message">{errors.identifier}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 01 12 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <StyledButtonWrapper>
              <button type="submit" className="button" disabled={isLoading}>
                <span className="button_lg">
                  <span className="button_sl" />
                  <span className="button_text">{isLoading ? 'signing in...' : 'sign in'}</span>
                </span>
              </button>
            </StyledButtonWrapper>

            <div className="divider">
              <span>or</span>
            </div>

            <div className="social-buttons">
              <button type="button" className="social-btn google" onClick={() => handleSocialLogin('google')}>
                <div className="social-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <span className="social-text">Continue with Google</span>
                <div className="social-arrow">→</div>
              </button>
              <button type="button" className="social-btn discord" onClick={() => handleSocialLogin('discord')}>
                <div className="social-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0188 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </div>
                <span className="social-text">Continue with Discord</span>
                <div className="social-arrow">→</div>
              </button>
            </div>

            <div className="signup-prompt">
              Don't have an account? 
              <Link to="/signup" className="signup-link"> Sign up</Link>
            </div>
          </form>
          ) : (
            <div className="twofa-form">
              <div className="twofa-header">
                <div className="header-content">
                  <div className="twofa-icon">
                    <HiShieldCheck />
                  </div>
                  <div className="header-text">
                    <h2>Two-Factor Authentication</h2>
                    <p>Enter the 6-digit code from your authenticator app</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handle2FASubmit} className="form">
                {errors.twoFA && (
                  <div className="error-banner">
                    {errors.twoFA}
                  </div>
                )}
                
                <div className="input-group">
                  <label htmlFor="twofa-code">Authentication Code</label>
                  <input
                    type="text"
                    id="twofa-code"
                    name="twofa-code"
                    value={twoFACode}
                    onChange={(e) => {
                      setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      // Clear errors when user starts typing
                      if (errors.twoFA) {
                        setErrors({})
                      }
                    }}
                    required
                    placeholder="000000"
                    className={`twofa-input ${errors.twoFA ? 'error' : ''}`}
                    maxLength="6"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                  <small className="input-help">
                    Check your authenticator app for the 6-digit code
                  </small>
                </div>

                <StyledButtonWrapper>
                  <button type="submit" className="button" disabled={isLoading || twoFACode.length !== 6}>
                    <span className="button_lg">
                      <span className="button_sl" />
                      <span className="button_text">
                        {isLoading ? 'verifying...' : 'verify & sign in'}
                      </span>
                    </span>
                  </button>
                </StyledButtonWrapper>

                <div className="back-to-login">
                  <button type="button" className="back-link" onClick={goBackToLogin}>
                    ← Back to login
                  </button>
                </div>

                <div className="help-text">
                  <p>Having trouble? Contact support or use backup codes if available.</p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Turnstile Security Modal */}
      <TurnstileModal
        isOpen={showTurnstileModal}
        onClose={() => setShowTurnstileModal(false)}
        onVerified={handleTurnstileVerified}
        title="Security Verification"
        description="Please complete the security verification to sign in"
      />
    </PageWrapper>
  )
}

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${props => props.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;

  .container {
    width: 100%;
    max-width: 400px;
    position: relative;
    z-index: 10;
  }

  .form-container {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 2rem;
    backdrop-filter: blur(10px);
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;

    h1 {
      font-size: 2rem;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 0.5rem;
    }

    .accent {
      color: #64ffda;
    }

    p {
      color: #a0a0a0;
      font-size: 0.9rem;
    }
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      color: #ffffff;
      font-size: 0.9rem;
      font-weight: 500;
    }

    input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 0.75rem;
      color: #ffffff;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      width: 100%;

      &::placeholder {
        color: #666;
      }

      &:focus {
        outline: none;
        border-color: #58A4B0;
        box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.1);
      }
      
      &.error {
        border-color: #ff6b6b;
        box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.1);
      }
    }
    
    .password-input-wrapper input {
      padding-right: 3rem;
    }
  }

  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
  }

  .checkbox-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #a0a0a0;
    cursor: pointer;

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #58A4B0;
    }
  }
  
  .error-message {
    color: #ff6b6b;
    font-size: 0.8rem;
    margin-top: 0.25rem;
  }
  
  .error-banner {
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid rgba(255, 107, 107, 0.3);
    border-radius: 6px;
    padding: 0.75rem;
    color: #ff6b6b;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #a0a0a0;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.3s ease;
    z-index: 2;
    
    &:hover {
      color: #58A4B0;
    }
    
    &:focus {
      outline: none;
    }
  }

  .forgot-link {
    color: #58A4B0;
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: #4A8C96;
    }
  }

  .divider {
    text-align: center;
    position: relative;
    margin: 1rem 0;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
    }

    span {
      background: transparent;
      color: #a0a0a0;
      padding: 0 1rem;
      position: relative;
      z-index: 1;
    }
  }

  .social-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .social-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
      transition: left 0.5s ease;
    }

    &:hover::before {
      left: 100%;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 10px 25px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.15);
    }

    .social-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .social-text {
      flex: 1;
      text-align: center;
      margin: 0 1rem;
    }

    .social-arrow {
      font-size: 1.1rem;
      opacity: 0.6;
      transition: all 0.3s ease;
      transform: translateX(0);
      flex-shrink: 0;
    }

    &:hover .social-arrow {
      opacity: 1;
      transform: translateX(4px);
    }

    &.google {
      &:hover {
        border-color: #4285F4;
        background: rgba(66, 133, 244, 0.08);
        box-shadow: 
          0 10px 25px rgba(66, 133, 244, 0.2),
          0 0 0 1px rgba(66, 133, 244, 0.3);
      }
    }

    &.discord {
      &:hover {
        border-color: #5865F2;
        background: rgba(88, 101, 242, 0.08);
        box-shadow: 
          0 10px 25px rgba(88, 101, 242, 0.2),
          0 0 0 1px rgba(88, 101, 242, 0.3);
      }
    }

    &:active {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      
      &:hover {
        transform: none;
        box-shadow: none;
        border-color: rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.03);
      }
      
      .social-arrow {
        opacity: 0.3;
        transform: translateX(0);
      }
    }
  }

  .signup-prompt {
    text-align: center;
    color: #a0a0a0;
    font-size: 0.9rem;
    margin-top: 1rem;
  }

  .signup-link {
    color: #58A4B0;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;

    &:hover {
      color: #4A8C96;
    }
  }


  /* 2FA Form Styles */
  .twofa-form {
    .twofa-header {
      margin-bottom: 2rem;

      .header-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        justify-content: center;
        text-align: center;

        .twofa-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #58A4B0, #4a8a94);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;

          svg {
            width: 24px;
            height: 24px;
          }
        }

        .header-text {
          h2 {
            color: #ffffff;
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0 0 0.25rem 0;
          }

          p {
            color: #a0a0a0;
            font-size: 0.9rem;
            margin: 0;
            line-height: 1.4;
          }
        }
      }
    }

    .twofa-input {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: 0.5rem;
      padding: 1rem;
      font-family: 'Courier New', monospace;

      &::placeholder {
        letter-spacing: 0.3rem;
        font-size: 1.2rem;
      }
    }

    .input-help {
      color: #a0a0a0;
      font-size: 0.8rem;
      text-align: center;
      margin-top: 0.5rem;
      display: block;
    }

    .back-to-login {
      text-align: center;
      margin-top: 1rem;

      .back-link {
        background: none;
        border: none;
        color: #58A4B0;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;

        &:hover {
          color: #4A8C96;
          background: rgba(88, 164, 176, 0.1);
        }

        &:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.3);
        }
      }
    }

    .help-text {
      text-align: center;
      margin-top: 1.5rem;

      p {
        color: #a0a0a0;
        font-size: 0.85rem;
        line-height: 1.4;
      }
    }
  }
`;

const StyledButtonWrapper = styled.div`
  .button {
    -moz-appearance: none;
    -webkit-appearance: none;
    appearance: none;
    border: none;
    background: none;
    color: #0f1923;
    cursor: pointer;
    position: relative;
    padding: 4px;
    text-decoration: none;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 14px;
    transition: all .15s ease;
    width: 100%;
  }

  .button::before,
  .button::after {
    content: '';
    display: block;
    position: absolute;
    right: 0;
    left: 0;
    height: calc(50% - 1px);
    border: 1px solid #7D8082;
    transition: all .15s ease;
  }

  .button::before {
    top: 0;
    border-bottom-width: 0;
  }

  .button::after {
    bottom: 0;
    border-top-width: 0;
  }

  .button:active,
  .button:focus {
    outline: none;
  }

  .button:active::before,
  .button:active::after {
    right: 3px;
    left: 3px;
  }

  .button:active::before {
    top: 3px;
  }

  .button:active::after {
    bottom: 3px;
  }

  .button_lg {
    position: relative;
    display: block;
    padding: 12px 20px;
    color: #fff;
    background-color: #0f1923;
    overflow: hidden;
    box-shadow: inset 0px 0px 0px 1px transparent;
  }

  .button_lg::before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 2px;
    background-color: #0f1923;
  }

  .button_lg::after {
    content: '';
    display: block;
    position: absolute;
    right: 0;
    bottom: 0;
    width: 4px;
    height: 4px;
    background-color: #0f1923;
    transition: all .2s ease;
  }

  .button_sl {
    display: block;
    position: absolute;
    top: 0;
    bottom: -1px;
    left: -8px;
    width: 0;
    background-color: #58A4B0;
    transform: skew(-15deg);
    transition: all .2s ease;
  }

  .button_text {
    position: relative;
  }

  .button:hover {
    color: #0f1923;
  }

  .button:hover .button_sl {
    width: calc(100% + 15px);
  }

  .button:hover .button_lg::after {
    background-color: #fff;
  }
  
  .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .button:disabled:hover .button_sl {
    width: 0;
  }
`;

export default SignIn