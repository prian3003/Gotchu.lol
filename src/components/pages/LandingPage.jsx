import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useTheme } from '../../contexts/ThemeContext'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import ProfileClaimSection from '../sections/ProfileClaimSection'

const LandingPage = () => {
  const { colors } = useTheme()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const mockupRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.transform = 'translateY(0) rotateX(0) rotateY(0)'
            entry.target.style.opacity = '1'
          }
        })
      },
      { threshold: 0.2 }
    )

    if (mockupRef.current) {
      observer.observe(mockupRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Force video autoplay
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.muted = true
      video.autoplay = true
      video.loop = true
      video.playsInline = true
      
      const playVideo = async () => {
        try {
          await video.play()
        } catch (err) {
          console.log('Video autoplay failed:', err)
          // Fallback: try again after user interaction
          const handleInteraction = async () => {
            try {
              await video.play()
              document.removeEventListener('click', handleInteraction)
              document.removeEventListener('touchstart', handleInteraction)
            } catch (e) {
              console.log('Video play failed after interaction:', e)
            }
          }
          document.addEventListener('click', handleInteraction, { once: true })
          document.addEventListener('touchstart', handleInteraction, { once: true })
        }
      }
      
      if (video.readyState >= 4) {
        playVideo()
      } else {
        video.addEventListener('canplaythrough', playVideo, { once: true })
      }
    }
  }, [])

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      navigate('/signup')
    }
  }

  return (
    <>
      <LandingContainer colors={colors}>
        <BackgroundOverlay />
        
        <ContentSection>
          <HeroSection>
            <MainHeading colors={colors}>
              Everything you want, right here.
            </MainHeading>
            
            <SubHeading colors={colors}>
              gotchu.lol is your go-to for modern, feature-rich biolinks and fast, secure file hosting.
              <br />
              Everything you need — right here.
            </SubHeading>
            
            <ButtonGroup>
              <PrimaryButton colors={colors} onClick={handleGetStarted}>
                {isAuthenticated ? 'Go to Dashboard' : 'Sign Up for Free'}
              </PrimaryButton>
              <SecondaryButton colors={colors} as={Link} to="/pricing">
                View Pricing
              </SecondaryButton>
            </ButtonGroup>
          </HeroSection>
          
          <MockupSection ref={mockupRef}>
            <MockupContainer>
              <DesktopMockup colors={colors}>
                <MockupScreen colors={colors}>
                  <DashboardPreview>
                    <Sidebar colors={colors}>
                      <SidebarItem colors={colors}>
                        <SidebarIcon />
                        <span>account</span>
                      </SidebarItem>
                      <SidebarItem colors={colors}>
                        <SidebarIcon />
                        <span>customize</span>
                      </SidebarItem>
                      <SidebarItem colors={colors} $active>
                        <SidebarIcon />
                        <span>links</span>
                      </SidebarItem>
                      <SidebarItem colors={colors}>
                        <SidebarIcon />
                        <span>premium</span>
                      </SidebarItem>
                    </Sidebar>
                    
                    <MainContent>
                      <ContentHeader>
                        <HeaderTitle colors={colors}>Account Overview</HeaderTitle>
                        <StatsGrid>
                          <StatCard colors={colors}>
                            <StatIcon colors={colors} />
                            <StatLabel colors={colors}>Links</StatLabel>
                          </StatCard>
                          <StatCard colors={colors}>
                            <StatIcon colors={colors} />
                            <StatLabel colors={colors}>Customize</StatLabel>
                          </StatCard>
                          <StatCard colors={colors}>
                            <StatIcon colors={colors} />
                            <StatLabel colors={colors}>Alias</StatLabel>
                          </StatCard>
                          <StatCard colors={colors}>
                            <StatIcon colors={colors} />
                            <StatLabel colors={colors}>Profile Views</StatLabel>
                          </StatCard>
                        </StatsGrid>
                      </ContentHeader>
                      
                      <ChartSection colors={colors}>
                        <ChartContainer>
                          <ChartBar colors={colors} style={{ height: '60%' }} />
                          <ChartBar colors={colors} style={{ height: '80%' }} />
                          <ChartBar colors={colors} style={{ height: '45%' }} />
                          <ChartBar colors={colors} style={{ height: '90%' }} />
                          <ChartBar colors={colors} style={{ height: '70%' }} />
                          <ChartBar colors={colors} style={{ height: '55%' }} />
                        </ChartContainer>
                      </ChartSection>
                      
                      <ActionSection>
                        <ActionButton colors={colors}>Check out your page</ActionButton>
                        <ActionButton colors={colors} $primary>My Page</ActionButton>
                      </ActionSection>
                    </MainContent>
                  </DashboardPreview>
                </MockupScreen>
              </DesktopMockup>
              
              <MobileMockups>
                <MobileMockup colors={colors} style={{ transform: 'rotate(-15deg)', zIndex: 3 }}>
                  <MobileScreen colors={colors}>
                    <MockupVideo
                      ref={videoRef}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      controls={false}
                      disablePictureInPicture
                      poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 360 640'%3E%3Crect width='360' height='640' fill='%23000'/%3E%3C/svg%3E"
                    >
                      <source src="https://raw.githubusercontent.com/prian3003/Gotchu.lol/main/public/demo.mp4" type="video/mp4" />
                      <source src="/demo.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </MockupVideo>
                  </MobileScreen>
                </MobileMockup>
              </MobileMockups>
            </MockupContainer>
          </MockupSection>
        </ContentSection>
      </LandingContainer>
      
      <ProfileClaimSection />
    </>
  )
}

const LandingContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.colors.background};
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  padding-top: calc(80px + 2rem); /* Account for navbar height */
`

const BackgroundOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(169, 204, 62, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(169, 204, 62, 0.05) 0%, transparent 50%);
  z-index: 1;
`

const ContentSection = styled.div`
  max-width: 1400px;
  width: 100%;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 4rem;
  align-items: center;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 3rem;
  }
`

const HeroSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

const MainHeading = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  color: ${props => props.colors.text};
  line-height: 1.1;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`

const SubHeading = styled.p`
  font-size: 1.25rem;
  color: ${props => props.colors.textSecondary};
  line-height: 1.6;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`

const PrimaryButton = styled.button`
  background: ${props => props.colors.accent};
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(169, 204, 62, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(169, 204, 62, 0.4);
    background: ${props => props.colors.accentHover};
  }
  
  &:active {
    transform: translateY(0);
  }
`

const SecondaryButton = styled.button`
  background: transparent;
  color: ${props => props.colors.text};
  border: 1px solid ${props => props.colors.border};
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${props => props.colors.accent}10;
    border-color: ${props => props.colors.accent};
    transform: translateY(-1px);
  }
`

const MockupSection = styled.div`
  transform: translateY(50px) rotateX(15deg) rotateY(-10deg);
  opacity: 0;
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
`

const MockupContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
`

const DesktopMockup = styled.div`
  background: ${props => props.colors.surface || '#1a1a1a'};
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 
    0 0 0 1px ${props => props.colors.border},
    0 20px 60px rgba(0, 0, 0, 0.4);
  width: 500px;
  height: 320px;
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: 400px;
  }
`

const MockupScreen = styled.div`
  background: ${props => props.colors.background};
  border-radius: 12px;
  height: 100%;
  overflow: hidden;
  border: 1px solid ${props => props.colors.border};
`

const DashboardPreview = styled.div`
  display: flex;
  height: 100%;
`

const Sidebar = styled.div`
  background: ${props => props.colors.accent}15;
  width: 120px;
  padding: 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const SidebarItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  font-size: 0.7rem;
  color: ${props => props.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.active && `
    background: ${props.colors.accent}30;
    color: ${props.colors.text};
  `}
  
  &:hover {
    background: ${props => props.colors.accent}20;
  }
`

const SidebarIcon = styled.div`
  width: 12px;
  height: 12px;
  background: currentColor;
  border-radius: 2px;
  opacity: 0.7;
`

const MainContent = styled.div`
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const ContentHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const HeaderTitle = styled.h3`
  color: ${props => props.colors.text};
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
`

const StatCard = styled.div`
  background: ${props => props.colors.surface || 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.colors.border};
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`

const StatIcon = styled.div`
  width: 16px;
  height: 16px;
  background: ${props => props.colors.accent};
  border-radius: 4px;
`

const StatLabel = styled.span`
  font-size: 0.6rem;
  color: ${props => props.colors.textSecondary};
  text-align: center;
`

const ChartSection = styled.div`
  flex: 1;
  background: ${props => props.colors.surface || 'rgba(255, 255, 255, 0.02)'};
  border: 1px solid ${props => props.colors.border};
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`

const ChartContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 60px;
`

const ChartBar = styled.div`
  width: 12px;
  background: ${props => props.colors.accent};
  border-radius: 2px;
  animation: chartGrow 2s ease-out forwards;
  transform-origin: bottom;
  
  @keyframes chartGrow {
    from {
      transform: scaleY(0);
    }
    to {
      transform: scaleY(1);
    }
  }
`

const ActionSection = styled.div`
  display: flex;
  gap: 0.5rem;
`

const ActionButton = styled.button`
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  
  ${props => props.primary ? `
    background: ${props.colors.accent};
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      background: ${props.colors.accentHover};
    }
  ` : `
    background: ${props.colors.surface || 'rgba(255, 255, 255, 0.05)'};
    color: ${props.colors.textSecondary};
    border: 1px solid ${props.colors.border};
    
    &:hover {
      background: ${props.colors.accent}10;
    }
  `}
`

const MobileMockups = styled.div`
  position: absolute;
  right: -70px;
  top: -50px;
  display: flex;
  justify-content: center;
  
  @media (max-width: 968px) {
    position: relative;
    right: auto;
    top: auto;
    justify-content: center;
    margin-top: 2rem;
  }
  
  @media (max-width: 768px) {
    transform: scale(0.8);
  }
`

const MobileMockup = styled.div`
  background: #000;
  border-radius: 25px;
  padding: 8px;
  width: 140px;
  height: 280px;
  box-shadow: 
    0 0 0 1px ${props => props.colors.border},
    0 10px 30px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-10px) !important;
  }
`

const MobileScreen = styled.div`
  background: ${props => props.colors.background};
  border-radius: 20px;
  height: 100%;
  overflow: hidden;
  position: relative;
`

const MockupVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 20px;
  pointer-events: none; /* Prevent user interaction */
  
  /* Force autoplay styles */
  &::-webkit-media-controls {
    display: none !important;
  }
  
  &::-webkit-media-controls-panel {
    display: none !important;
  }
`


export default LandingPage