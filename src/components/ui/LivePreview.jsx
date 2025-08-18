import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import {
  HiUser,
  HiHeart,
  HiEye,
  HiShare,
  HiGlobeAlt,
  HiMusicalNote,
  HiSparkles,
  HiShieldCheck,
  HiStar,
  HiCursorArrowRays
} from 'react-icons/hi2'

const LivePreview = ({ settings, className }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [viewCount, setViewCount] = useState(1247)
  const [likeCount, setLikeCount] = useState(89)
  const [isLiked, setIsLiked] = useState(false)

  // Simulate dynamic updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setViewCount(prev => prev + Math.floor(Math.random() * 3) + 1)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  const toggleAudio = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <PreviewContainer className={className}>
      {/* Header Stats */}
      <PreviewHeader>
        <StatItem>
          <HiEye />
          <span>{viewCount.toLocaleString()}</span>
        </StatItem>
        <StatItem onClick={handleLike} $active={isLiked}>
          <HiHeart />
          <span>{likeCount}</span>
        </StatItem>
        <StatItem>
          <HiShare />
          <span>Share</span>
        </StatItem>
      </PreviewHeader>

      {/* Main Profile Preview */}
      <ProfilePreview
        style={{
          backgroundColor: settings.backgroundUrl ? 'transparent' : settings.accentColor + '20',
          filter: `blur(${settings.profileBlur}px)`,
          opacity: settings.profileOpacity / 100
        }}
      >
        {/* Background Effect */}
        {settings.backgroundEffect !== 'none' && (
          <BackgroundEffect effect={settings.backgroundEffect}>
            <div className="particles">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="particle" />
              ))}
            </div>
            {settings.backgroundEffect === 'matrix' && (
              <div className="matrix-text">01001001</div>
            )}
            {settings.backgroundEffect === 'waves' && (
              <div className="wave-container">
                <div className="wave wave-1" />
                <div className="wave wave-2" />
                <div className="wave wave-3" />
              </div>
            )}
          </BackgroundEffect>
        )}

        {/* Custom Cursor */}
        {settings.customCursor && (
          <CustomCursor>
            <HiCursorArrowRays />
          </CustomCursor>
        )}

        {/* Avatar */}
        <Avatar
          style={{ 
            borderColor: settings.accentColor,
            boxShadow: `0 0 20px ${settings.accentColor}40`
          }}
        >
          {settings.avatarUrl ? (
            <img src={settings.avatarUrl} alt="Avatar" />
          ) : (
            <HiUser />
          )}
          {settings.theme === 'auto' && <ThemeIndicator />}
        </Avatar>

        {/* Username with Effects */}
        <Username 
          effect={settings.usernameEffect}
          color={settings.accentColor}
          animated={settings.enableAnimations}
        >
          YourUsername
        </Username>

        {/* Badges */}
        {settings.showBadges && (
          <BadgeContainer>
            <Badge color="#FFD700">
              <HiStar />
              <span>Verified</span>
            </Badge>
            <Badge color="#FF6B6B">
              <HiShieldCheck />
              <span>Premium</span>
            </Badge>
            <Badge color="#4ECDC4">
              <HiSparkles />
              <span>Creator</span>
            </Badge>
          </BadgeContainer>
        )}

        {/* Bio */}
        <BioText style={{ color: settings.textColor || '#ffffff' }}>
          Welcome to my profile! ✨ Passionate developer, designer, and creator.
          Always building something amazing! 🚀
        </BioText>

        {/* Social Links Preview */}
        <SocialLinks>
          <SocialLink color={settings.accentColor}>
            <HiGlobeAlt />
            <span>Website</span>
          </SocialLink>
          <SocialLink color={settings.accentColor}>
            <HiMusicalNote />
            <span>Spotify</span>
          </SocialLink>
          <SocialLink color={settings.accentColor}>
            <HiShare />
            <span>Social</span>
          </SocialLink>
        </SocialLinks>

        {/* Audio Player */}
        {settings.audioUrl && (
          <AudioPlayer>
            <PlayButton 
              onClick={toggleAudio}
              isPlaying={isPlaying}
              color={settings.accentColor}
            >
              <HiMusicalNote />
            </PlayButton>
            <AudioInfo>
              <span>Background Music</span>
              <VolumeBar>
                <div 
                  className="volume-fill" 
                  style={{ 
                    width: `${settings.volumeLevel}%`,
                    backgroundColor: settings.accentColor
                  }} 
                />
              </VolumeBar>
            </AudioInfo>
            {isPlaying && (
              <AudioVisualization>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bar" />
                ))}
              </AudioVisualization>
            )}
          </AudioPlayer>
        )}
      </ProfilePreview>

      {/* Footer Info */}
      <PreviewFooter>
        <FooterItem>
          <span>Theme: {settings.theme}</span>
        </FooterItem>
        <FooterItem>
          <span>Effect: {settings.backgroundEffect}</span>
        </FooterItem>
        <FooterItem>
          <span>Animations: {settings.enableAnimations ? 'On' : 'Off'}</span>
        </FooterItem>
      </PreviewFooter>
    </PreviewContainer>
  )
}

// Styled Components
const PreviewContainer = styled.div`
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.$active ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 20px;
  color: ${props => props.$active ? '#FF6B6B' : '#ffffff'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.05);
  }
  
  svg {
    font-size: 1rem;
  }
`

const ProfilePreview = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 400px;
  position: relative;
  transition: all 0.3s ease;
  background-size: cover;
  background-position: center;
`

const BackgroundEffect = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  
  .particles {
    position: absolute;
    width: 100%;
    height: 100%;
    
    .particle {
      position: absolute;
      width: 3px;
      height: 3px;
      background: #58A4B0;
      border-radius: 50%;
      animation: float 3s ease-in-out infinite;
      
      &:nth-child(odd) {
        animation-delay: -1s;
      }
      
      &:nth-child(even) {
        animation-delay: -2s;
      }
      
      ${Array.from({ length: 20 }, (_, i) => `
        &:nth-child(${i + 1}) {
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation-duration: ${2 + Math.random() * 3}s;
        }
      `).join('')}
    }
  }
  
  .matrix-text {
    position: absolute;
    top: 20%;
    left: 10%;
    font-family: 'Courier New', monospace;
    color: #00ff00;
    font-size: 0.8rem;
    opacity: 0.3;
    animation: scroll 5s linear infinite;
  }
  
  .wave-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50%;
    
    .wave {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 200%;
      height: 100%;
      background: linear-gradient(45deg, transparent, rgba(78, 205, 196, 0.1), transparent);
      border-radius: 50% 50% 0 0;
      animation: wave 4s ease-in-out infinite;
      
      &.wave-1 { animation-delay: 0s; }
      &.wave-2 { animation-delay: -1s; opacity: 0.7; }
      &.wave-3 { animation-delay: -2s; opacity: 0.5; }
    }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(180deg); }
  }
  
  @keyframes scroll {
    0% { transform: translateY(0); }
    100% { transform: translateY(-100px); }
  }
  
  @keyframes wave {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(5deg); }
  }
`

const CustomCursor = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  color: #58A4B0;
  font-size: 1.5rem;
  opacity: 0.7;
  animation: cursor-move 3s ease-in-out infinite;
  
  @keyframes cursor-move {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(10px, 5px); }
    50% { transform: translate(-5px, 10px); }
    75% { transform: translate(5px, -5px); }
  }
`

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 3px solid #58A4B0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  
  svg {
    font-size: 3rem;
    color: #58A4B0;
  }
`

const ThemeIndicator = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  background: linear-gradient(45deg, #1a1a1a 50%, #ffffff 50%);
  border-radius: 50%;
  border: 2px solid #58A4B0;
`

const Username = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
  position: relative;
  
  ${props => {
    switch (props.effect) {
      case 'glow':
        return `
          text-shadow: 0 0 20px ${props.color}, 0 0 40px ${props.color};
          animation: ${props.animated ? 'glow-pulse 2s ease-in-out infinite alternate' : 'none'};
        `
      case 'rainbow':
        return `
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 400% 400%;
          animation: ${props.animated ? 'rainbow-shift 3s ease-in-out infinite' : 'none'};
        `
      case 'typewriter':
        return `
          overflow: hidden;
          border-right: 2px solid ${props.color};
          white-space: nowrap;
          animation: ${props.animated ? 'typewriter 4s steps(12) infinite, blink 0.75s step-end infinite' : 'none'};
        `
      case 'bounce':
        return `
          animation: ${props.animated ? 'bounce 2s ease-in-out infinite' : 'none'};
        `
      case 'fade':
        return `
          animation: ${props.animated ? 'fade-in-out 3s ease-in-out infinite' : 'none'};
        `
      default:
        return ''
    }
  }}
  
  @keyframes glow-pulse {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.3); }
  }
  
  @keyframes rainbow-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes typewriter {
    0%, 50% { width: 0; }
    51%, 100% { width: 100%; }
  }
  
  @keyframes blink {
    0%, 50% { border-color: transparent; }
    51%, 100% { border-color: currentColor; }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes fade-in-out {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const BadgeContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`

const Badge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: ${props => props.color}20;
  border: 1px solid ${props => props.color};
  border-radius: 20px;
  color: ${props => props.color};
  font-size: 0.7rem;
  font-weight: 600;
  
  svg {
    font-size: 0.8rem;
  }
`

const BioText = styled.p`
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  max-width: 280px;
  opacity: 0.9;
`

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`

const SocialLink = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid ${props => props.color}40;
  border-radius: 12px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.color}20;
    border-color: ${props => props.color};
    transform: translateY(-2px);
  }
  
  svg {
    font-size: 1.2rem;
    color: ${props => props.color};
  }
  
  span {
    font-size: 0.7rem;
    font-weight: 500;
  }
`

const AudioPlayer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 280px;
`

const PlayButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: ${props => props.color};
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 16px ${props => props.color}40;
  }
  
  svg {
    font-size: 1.2rem;
    animation: ${props => props.isPlaying ? 'spin 2s linear infinite' : 'none'};
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`

const AudioInfo = styled.div`
  flex: 1;
  
  span {
    font-size: 0.8rem;
    color: #ffffff;
    display: block;
    margin-bottom: 0.5rem;
  }
`

const VolumeBar = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  
  .volume-fill {
    height: 100%;
    border-radius: 2px;
    transition: all 0.3s ease;
  }
`

const AudioVisualization = styled.div`
  display: flex;
  align-items: end;
  gap: 2px;
  height: 20px;
  
  .bar {
    width: 3px;
    background: #58A4B0;
    border-radius: 2px;
    animation: visualize 1s ease-in-out infinite alternate;
    
    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.1s; }
    &:nth-child(3) { animation-delay: 0.2s; }
    &:nth-child(4) { animation-delay: 0.3s; }
    &:nth-child(5) { animation-delay: 0.4s; }
  }
  
  @keyframes visualize {
    0% { height: 4px; }
    100% { height: 16px; }
  }
`

const PreviewFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`

const FooterItem = styled.div`
  span {
    font-size: 0.75rem;
    color: #a0a0a0;
    font-weight: 500;
  }
`

export default LivePreview