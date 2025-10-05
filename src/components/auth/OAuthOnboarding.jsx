import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/Toast'
import ParticleBackground from '../effects/ParticleBackground'
import ShinyText from '../effects/ShinyText'
import { useTheme } from '../../contexts/ThemeContext'
import { API_BASE_URL } from '../../config/api'
import { 
  HiUser, 
  HiSparkles,
  HiCheck,
  HiArrowRight
} from 'react-icons/hi2'

function OAuthOnboarding() {
  const location = useLocation()
  const { provider, userInfo } = location.state || { provider: 'oauth', userInfo: {} }
  
  const [username, setUsername] = useState(userInfo?.suggestedUsername || '')
  const [displayName, setDisplayName] = useState(userInfo?.displayName || '')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1)
  const { colors, isDarkMode } = useTheme()
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const validateUsername = (username) => {
    if (!username) return 'Username is required'
    if (username.length < 3) return 'Username must be at least 3 characters'
    if (username.length > 20) return 'Username must be less than 20 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores'
    return null
  }

  const checkUsernameAvailability = async (username) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-username/${username}`)
      const data = await response.json()
      return data.available
    } catch (error) {
      return false
    }
  }

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '')
    setUsername(value)
    setErrors({ ...errors, username: '' })
  }

  const handleNext = async () => {
    setErrors({})
    
    const usernameError = validateUsername(username)
    if (usernameError) {
      setErrors({ username: usernameError })
      return
    }

    setIsLoading(true)
    
    // Check username availability
    const isAvailable = await checkUsernameAvailability(username)
    if (!isAvailable) {
      setErrors({ username: 'Username is already taken' })
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    setStep(2)
  }

  const handleComplete = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('${API_BASE_URL}/auth/complete-oauth-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
        body: JSON.stringify({
          username,
          displayName: displayName || username,
        })
      })

      if (response.ok) {
        const data = await response.json()
        updateUser(data.data.user)
        
        toast.success('Welcome!', `Your ${provider} account has been connected successfully!`)
        navigate('/dashboard', { replace: true })
      } else {
        const error = await response.json()
        setErrors({ general: error.message || 'Setup failed' })
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    navigate('/dashboard', { replace: true })
  }

  const getProviderInfo = () => {
    switch (provider) {
      case 'google':
        return {
          name: 'Google',
          color: '#4285F4',
          icon: '🔍'
        }
      case 'discord':
        return {
          name: 'Discord',
          color: '#5865F2',
          icon: '💬'
        }
      default:
        return {
          name: 'OAuth',
          color: '#58A4B0',
          icon: '🔗'
        }
    }
  }

  const providerInfo = getProviderInfo()

  return (
    <PageWrapper>
      <ParticleBackground />
      
      {/* Background Text */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        pointerEvents: 'none',
        transform: 'translateY(-75px)'
      }}>
        <ShinyText
          size="4xl"
          weight="extrabold"
          speed={4}
          baseColor={isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(19, 21, 21, 0.06)"}
          shineColor={providerInfo.color + "40"}
          intensity={1}
          direction="left-to-right"
          shineWidth={30}
          repeat="infinite"
          className="text-[18vw] dm-serif-text-regular tracking-tight leading-none select-none uppercase"
        >
          welcome
        </ShinyText>
      </div>

      <Container>
        <OnboardingCard>
          {/* Header */}
          <Header>
            <ProviderBadge color={providerInfo.color}>
              <span className="provider-icon">{providerInfo.icon}</span>
              <span className="provider-text">Connected via {providerInfo.name}</span>
            </ProviderBadge>
            <WelcomeText>
              <h1>Almost there!</h1>
              <p>Let's set up your profile to get you started</p>
            </WelcomeText>
          </Header>

          {/* Progress Steps */}
          <ProgressBar>
            <ProgressStep $active={step >= 1} $completed={step > 1}>
              <StepCircle $active={step >= 1} $completed={step > 1}>
                {step > 1 ? <HiCheck /> : '1'}
              </StepCircle>
              <StepLabel>Choose Username</StepLabel>
            </ProgressStep>
            <ProgressLine $completed={step > 1} />
            <ProgressStep $active={step >= 2} $completed={step > 2}>
              <StepCircle $active={step >= 2} $completed={step > 2}>
                {step > 2 ? <HiCheck /> : '2'}
              </StepCircle>
              <StepLabel>Customize Profile</StepLabel>
            </ProgressStep>
          </ProgressBar>

          {/* Content */}
          {step === 1 && (
            <StepContent>
              <StepTitle>
                <HiUser className="step-icon" />
                Choose Your Username
              </StepTitle>
              <StepDescription>
                This will be your unique identifier on gotchu.lol
              </StepDescription>
              
              <FormGroup>
                <Label htmlFor="username">Username</Label>
                <InputWrapper $hasError={!!errors.username}>
                  <UsernameInput
                    type="text"
                    id="username"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="Enter your username"
                    maxLength={20}
                    $hasError={!!errors.username}
                  />
                  <UsernamePrefix>gotchu.lol/</UsernamePrefix>
                </InputWrapper>
                {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
                <HelpText>3-20 characters, letters, numbers, and underscores only</HelpText>
              </FormGroup>

              <ActionButtons>
                <SecondaryButton onClick={handleSkip}>
                  Skip for now
                </SecondaryButton>
                <PrimaryButton 
                  onClick={handleNext} 
                  disabled={!username || isLoading}
                  $loading={isLoading}
                >
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <>
                      Continue <HiArrowRight />
                    </>
                  )}
                </PrimaryButton>
              </ActionButtons>
            </StepContent>
          )}

          {step === 2 && (
            <StepContent>
              <StepTitle>
                <HiSparkles className="step-icon" />
                Customize Your Profile
              </StepTitle>
              <StepDescription>
                Add a display name and we'll set up the rest
              </StepDescription>
              
              <FormGroup>
                <Label htmlFor="displayName">Display Name (Optional)</Label>
                <DisplayNameInput
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  maxLength={50}
                />
                <HelpText>This is how your name will appear to others</HelpText>
              </FormGroup>

              <PreviewCard>
                <PreviewTitle>Preview</PreviewTitle>
                <PreviewProfile>
                  <PreviewAvatar>
                    {userInfo?.avatar ? (
                      <img src={userInfo.avatar} alt="Profile" />
                    ) : (
                      <HiUser />
                    )}
                  </PreviewAvatar>
                  <PreviewInfo>
                    <PreviewName>{displayName || username}</PreviewName>
                    <PreviewUsername>@{username}</PreviewUsername>
                  </PreviewInfo>
                </PreviewProfile>
              </PreviewCard>

              {errors.general && <ErrorMessage>{errors.general}</ErrorMessage>}

              <ActionButtons>
                <SecondaryButton onClick={() => setStep(1)}>
                  Back
                </SecondaryButton>
                <PrimaryButton 
                  onClick={handleComplete}
                  disabled={isLoading}
                  $loading={isLoading}
                >
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <>
                      Complete Setup <HiCheck />
                    </>
                  )}
                </PrimaryButton>
              </ActionButtons>
            </StepContent>
          )}
        </OnboardingCard>
      </Container>
    </PageWrapper>
  )
}

// Styled Components
const PageWrapper = styled.div`
  min-height: 100vh;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
`

const Container = styled.div`
  width: 100%;
  max-width: 500px;
  position: relative;
  z-index: 10;
`

const OnboardingCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2.5rem;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`

const ProviderBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.color}20;
  border: 1px solid ${props => props.color}40;
  border-radius: 50px;
  padding: 0.5rem 1rem;
  margin-bottom: 1.5rem;
  
  .provider-icon {
    font-size: 1.1rem;
  }
  
  .provider-text {
    color: ${props => props.color};
    font-weight: 500;
    font-size: 0.9rem;
  }
`

const WelcomeText = styled.div`
  h1 {
    color: #ffffff;
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(135deg, #ffffff, #a0a0a0);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    color: #a0a0a0;
    font-size: 1rem;
    margin: 0;
  }
`

const ProgressBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2.5rem;
  gap: 1rem;
`

const ProgressStep = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`

const StepCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  
  ${props => props.$completed ? `
    background: linear-gradient(135deg, #58A4B0, #4a8a94);
    color: #ffffff;
    border: 2px solid #58A4B0;
  ` : props.$active ? `
    background: rgba(88, 164, 176, 0.2);
    color: #58A4B0;
    border: 2px solid #58A4B0;
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: #666;
    border: 2px solid rgba(255, 255, 255, 0.2);
  `}
`

const StepLabel = styled.span`
  color: #a0a0a0;
  font-size: 0.8rem;
  font-weight: 500;
`

const ProgressLine = styled.div`
  width: 60px;
  height: 2px;
  background: ${props => props.$completed ? '#58A4B0' : 'rgba(255, 255, 255, 0.2)'};
  transition: background 0.3s ease;
`

const StepContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const StepTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  
  .step-icon {
    color: #58A4B0;
    font-size: 1.5rem;
  }
`

const StepDescription = styled.p`
  color: #a0a0a0;
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Label = styled.label`
  color: #ffffff;
  font-weight: 500;
  font-size: 0.95rem;
`

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

const UsernamePrefix = styled.span`
  position: absolute;
  left: 1rem;
  color: #666;
  font-size: 0.9rem;
  pointer-events: none;
  z-index: 1;
`

const UsernameInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 8rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid ${props => props.$hasError ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#ff6b6b' : '#58A4B0'};
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(255, 107, 107, 0.1)' : 'rgba(88, 164, 176, 0.1)'};
  }
  
  &::placeholder {
    color: #666;
  }
`

const DisplayNameInput = styled.input`
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #58A4B0;
    box-shadow: 0 0 0 3px rgba(88, 164, 176, 0.1);
  }
  
  &::placeholder {
    color: #666;
  }
`

const HelpText = styled.span`
  color: #888;
  font-size: 0.85rem;
`

const ErrorMessage = styled.span`
  color: #ff6b6b;
  font-size: 0.85rem;
  font-weight: 500;
`

const PreviewCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
`

const PreviewTitle = styled.h3`
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`

const PreviewProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const PreviewAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #58A4B0, #4a8a94);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  svg {
    color: #ffffff;
    font-size: 1.5rem;
  }
`

const PreviewInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const PreviewName = styled.span`
  color: #ffffff;
  font-weight: 600;
  font-size: 1.1rem;
`

const PreviewUsername = styled.span`
  color: #58A4B0;
  font-size: 0.9rem;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`

const SecondaryButton = styled.button`
  flex: 1;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }
`

const PrimaryButton = styled.button`
  flex: 2;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #58A4B0, #4a8a94);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #4a8a94, #3c6e77);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(88, 164, 176, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

export default OAuthOnboarding