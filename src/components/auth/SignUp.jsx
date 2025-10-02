import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import ShinyText from '../effects/ShinyText'
import { useTheme } from '../../contexts/ThemeContext'

function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [usernameValidation, setUsernameValidation] = useState({
    isChecking: false,
    isAvailable: null,
    message: ''
  })
  const { colors, isDarkMode } = useTheme()
  const navigate = useNavigate()

  // Debounce timer for username checking
  const [usernameCheckTimer, setUsernameCheckTimer] = useState(null)

  // Check username availability with backend
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 1) {
      setUsernameValidation({
        isChecking: false,
        isAvailable: null,
        message: ''
      })
      return
    }

    setUsernameValidation({
      isChecking: true,
      isAvailable: null,
      message: ''
    })

    try {
      console.log('Checking username:', username) // Debug log
      
      const response = await fetch(`http://localhost:8080/api/auth/check-username/${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      console.log('Response status:', response.status) // Debug log
      
      const data = await response.json()
      console.log('Response data:', data) // Debug log

      if (data.success) {
        setUsernameValidation({
          isChecking: false,
          isAvailable: data.available,
          message: data.message
        })
      } else {
        setUsernameValidation({
          isChecking: false,
          isAvailable: false,
          message: data.message || 'Failed to check username'
        })
      }
    } catch (error) {
      console.error('Username check error:', error)
      setUsernameValidation({
        isChecking: false,
        isAvailable: null,
        message: 'Failed to check username availability'
      })
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    // Handle username validation with debouncing
    if (name === 'username') {
      // Clear previous timer
      if (usernameCheckTimer) {
        clearTimeout(usernameCheckTimer)
      }

      // Clear previous errors
      setErrors(prev => ({
        ...prev,
        username: ''
      }))

      // Set new timer for debounced checking
      const timer = setTimeout(() => {
        checkUsernameAvailability(value.trim().toLowerCase())
      }, 500) // 500ms delay

      setUsernameCheckTimer(timer)
    }
  }

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (usernameCheckTimer) {
        clearTimeout(usernameCheckTimer)
      }
    }
  }, [usernameCheckTimer])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    } else if (usernameValidation.isAvailable === false) {
      newErrors.username = usernameValidation.message || 'Username is not available'
    } else if (usernameValidation.isChecking) {
      newErrors.username = 'Checking username availability...'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const userData = {
        username: formData.username.toLowerCase(),
        email: formData.email.toLowerCase(),
        password: formData.password
      }
      
      console.log('Sending registration data:', userData)
      
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      
      console.log('Registration response status:', response.status)
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Registration failed')
      }
      
      // Check if email verification is required
      if (data.success && data.message.includes('verify')) {
        // Redirect to email verification page with email in state
        navigate('/email-verification', { 
          state: { email: formData.email.toLowerCase() }
        })
      } else if (data.data?.token && data.data?.sessionId) {
        // Store auth data and redirect to dashboard (fallback for immediate login)
        localStorage.setItem('authToken', data.data.token)
        localStorage.setItem('sessionId', data.data.sessionId)
        window.location.href = '/dashboard'
      } else {
        // Redirect to email verification as fallback
        navigate('/email-verification', { 
          state: { email: formData.email.toLowerCase() }
        })
      }
      
    } catch (error) {
      console.error('Sign up error:', error)
      
      if (error.message.includes('Username already exists')) {
        setErrors({ username: 'Username already taken' })
      } else if (error.message.includes('Email already exists')) {
        setErrors({ email: 'Email already registered' })
      } else if (error.message.includes('Rate limited')) {
        setErrors({ general: 'Too many attempts. Please try again later.' })
      } else {
        setErrors({ general: error.message || 'Failed to create account. Please try again.' })
      }
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
          sign up
        </ShinyText>
      </div>
      
      <div className="container">
        <div className="form-container">

          <form onSubmit={handleSubmit} className="form">
            {errors.general && (
              <div className="error-banner">
                {errors.general}
              </div>
            )}
            
            <div className="input-group">
              <label htmlFor="username">Username *</label>
              <div className="username-input-wrapper">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Choose a unique username"
                  className={errors.username ? 'error' : (usernameValidation.isAvailable === true ? 'success' : '')}
                />
                {usernameValidation.isChecking && (
                  <div className="username-spinner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <animateTransform attributeName="transform" type="rotate" dur="1s" values="0 12 12;360 12 12" repeatCount="indefinite"/>
                      </path>
                    </svg>
                  </div>
                )}
                {!usernameValidation.isChecking && usernameValidation.isAvailable === true && (
                  <div className="username-check-icon success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                {!usernameValidation.isChecking && usernameValidation.isAvailable === false && (
                  <div className="username-check-icon error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              {errors.username && <span className="error-message">{errors.username}</span>}
              {!errors.username && usernameValidation.message && (
                <span className={`validation-message ${usernameValidation.isAvailable ? 'success' : 'error'}`}>
                  {usernameValidation.message}
                </span>
              )}
            </div>
            

            <div className="input-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a strong password (8+ characters)"
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

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
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
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <div className="terms-container">
              <label className="checkbox-container">
                <input type="checkbox" required />
                <span className="checkmark"></span>
                I agree to the <Link to="/terms" className="link">Terms of Service</Link> and <Link to="/privacy" className="link">Privacy Policy</Link>
              </label>
            </div>

            <StyledButtonWrapper>
              <button type="submit" className="button" disabled={isLoading}>
                <span className="button_lg">
                  <span className="button_sl" />
                  <span className="button_text">{isLoading ? 'creating account...' : 'sign up'}</span>
                </span>
              </button>
            </StyledButtonWrapper>


            <div className="signin-prompt">
              Already have an account? 
              <Link to="/signin" className="signin-link"> Sign in</Link>
            </div>
          </form>
        </div>
      </div>
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
    max-width: 450px;
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
      
      &.success {
        border-color: #58A4B0;
        box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.1);
      }
    }
    
    .password-input-wrapper input {
      padding-right: 3rem;
    }
  }

  .username-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    
    input {
      padding-right: 2.5rem;
    }
  }

  .username-spinner,
  .username-check-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }

  .username-spinner {
    color: #58A4B0;
  }

  .username-check-icon.success {
    color: #58A4B0;
  }

  .username-check-icon.error {
    color: #ff6b6b;
  }

  .validation-message {
    font-size: 0.8rem;
    margin-top: 0.25rem;
    
    &.success {
      color: #58A4B0;
    }
    
    &.error {
      color: #ff6b6b;
    }
  }

  .terms-container {
    margin: 0.5rem 0;
  }

  .checkbox-container {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    color: #a0a0a0;
    cursor: pointer;
    font-size: 0.85rem;
    line-height: 1.4;

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #58A4B0;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .link {
      color: #58A4B0;
      text-decoration: none;
      transition: color 0.3s ease;

      &:hover {
        color: #4A8C96;
      }
    }
  }


  .signin-prompt {
    text-align: center;
    color: #a0a0a0;
    font-size: 0.9rem;
    margin-top: 1rem;
  }

  .signin-link {
    color: #58A4B0;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;

    &:hover {
      color: #4A8C96;
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

export default SignUp