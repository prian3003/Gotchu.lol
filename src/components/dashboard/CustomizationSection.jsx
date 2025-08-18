import React from 'react'
import styled from 'styled-components'
import { HiPaintBrush, HiArrowRight } from 'react-icons/hi2'

const CustomizationSection = ({ user, settings }) => {
  const handleNavigateToCustomization = () => {
    // This would trigger the parent component's navigation handler
    const customizationNavButton = document.querySelector('[data-nav="customization"]')
    if (customizationNavButton) {
      customizationNavButton.click()
    }
  }

  const getPreviewStyle = () => {
    return {
      background: settings.accentColor ? `linear-gradient(135deg, ${settings.accentColor}20, ${settings.accentColor}10)` : 'linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1))',
      borderColor: settings.accentColor || '#58A4B0'
    }
  }

  return (
    <CustomizationContainer>
      <SectionHeader>
        <SectionTitle>
          <HiPaintBrush style={{ color: '#58A4B0' }} />
          Profile Customization
        </SectionTitle>
        <CustomizeButton onClick={handleNavigateToCustomization}>
          Customize
          <HiArrowRight />
        </CustomizeButton>
      </SectionHeader>

      <CustomizationGrid>
        <PreviewCard style={getPreviewStyle()}>
          <PreviewHeader>
            <PreviewTitle>Live Preview</PreviewTitle>
            <PreviewBadge>
              {settings.theme || 'Default'} Theme
            </PreviewBadge>
          </PreviewHeader>

          <ProfilePreview>
            <PreviewAvatar style={{ borderColor: settings.accentColor || '#58A4B0' }}>
              {user.avatarURL ? (
                <img src={user.avatarURL} alt="Profile" />
              ) : (
                user.username?.charAt(0).toUpperCase() || 'U'
              )}
            </PreviewAvatar>
            
            <PreviewUsername style={{ color: settings.textColor || '#ffffff' }}>
              @{user.username}
            </PreviewUsername>
            
            <PreviewBio style={{ color: settings.textColor || '#a0a0a0' }}>
              {user.bio || 'Welcome to my profile!'}
            </PreviewBio>

            <PreviewLinks>
              <PreviewLink style={{ borderColor: settings.accentColor || '#58A4B0' }}>
                <LinkIcon>🔗</LinkIcon>
                <span>Sample Link</span>
              </PreviewLink>
              <PreviewLink style={{ borderColor: settings.accentColor || '#58A4B0' }}>
                <LinkIcon>🌐</LinkIcon>
                <span>Another Link</span>
              </PreviewLink>
            </PreviewLinks>
          </ProfilePreview>
        </PreviewCard>

        <SettingsOverview>
          <OverviewTitle>Current Settings</OverviewTitle>
          
          <SettingsList>
            <SettingItem>
              <SettingIcon style={{ backgroundColor: settings.accentColor + '20' || 'rgba(88, 164, 176, 0.2)' }}>
                🎨
              </SettingIcon>
              <SettingInfo>
                <SettingLabel>Accent Color</SettingLabel>
                <SettingValue>
                  <ColorSwatch style={{ backgroundColor: settings.accentColor || '#58A4B0' }} />
                  {settings.accentColor || '#58A4B0'}
                </SettingValue>
              </SettingInfo>
            </SettingItem>

            <SettingItem>
              <SettingIcon style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}>
                🌙
              </SettingIcon>
              <SettingInfo>
                <SettingLabel>Theme</SettingLabel>
                <SettingValue>{settings.theme || 'Dark'}</SettingValue>
              </SettingInfo>
            </SettingItem>

            <SettingItem>
              <SettingIcon style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}>
                ✨
              </SettingIcon>
              <SettingInfo>
                <SettingLabel>Animations</SettingLabel>
                <SettingValue>{settings.enableAnimations ? 'Enabled' : 'Disabled'}</SettingValue>
              </SettingInfo>
            </SettingItem>

            <SettingItem>
              <SettingIcon style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                🖼️
              </SettingIcon>
              <SettingInfo>
                <SettingLabel>Background</SettingLabel>
                <SettingValue>
                  {settings.backgroundUrl ? 'Custom Image' : 'Default'}
                </SettingValue>
              </SettingInfo>
            </SettingItem>

            <SettingItem>
              <SettingIcon style={{ backgroundColor: 'rgba(244, 63, 94, 0.2)' }}>
                🎵
              </SettingIcon>
              <SettingInfo>
                <SettingLabel>Audio</SettingLabel>
                <SettingValue>
                  {settings.audioUrl ? 'Custom Track' : 'None'}
                </SettingValue>
              </SettingInfo>
            </SettingItem>

            <SettingItem>
              <SettingIcon style={{ backgroundColor: 'rgba(251, 146, 60, 0.2)' }}>
                👆
              </SettingIcon>
              <SettingInfo>
                <SettingLabel>Custom Cursor</SettingLabel>
                <SettingValue>{settings.customCursor ? 'Enabled' : 'Disabled'}</SettingValue>
              </SettingInfo>
            </SettingItem>
          </SettingsList>

          <QuickActions>
            <QuickActionButton onClick={handleNavigateToCustomization}>
              <QuickActionIcon>🎨</QuickActionIcon>
              <QuickActionText>
                <span>Customize Appearance</span>
                <small>Colors, theme, effects</small>
              </QuickActionText>
            </QuickActionButton>

            <QuickActionButton onClick={handleNavigateToCustomization}>
              <QuickActionIcon>📁</QuickActionIcon>
              <QuickActionText>
                <span>Upload Assets</span>
                <small>Background, avatar, audio</small>
              </QuickActionText>
            </QuickActionButton>

            <QuickActionButton onClick={handleNavigateToCustomization}>
              <QuickActionIcon>⚡</QuickActionIcon>
              <QuickActionText>
                <span>Advanced Settings</span>
                <small>Animations, effects, opacity</small>
              </QuickActionText>
            </QuickActionButton>
          </QuickActions>
        </SettingsOverview>
      </CustomizationGrid>
    </CustomizationContainer>
  )
}

const CustomizationContainer = styled.div`
  margin-bottom: 2rem;
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`

const CustomizeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(145deg, #58A4B0, #4a8a94);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: linear-gradient(145deg, #4a8a94, #3c7580);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(88, 164, 176, 0.3);
  }
`

const CustomizationGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`

const PreviewCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.15);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`

const PreviewTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`

const PreviewBadge = styled.span`
  padding: 0.25rem 0.75rem;
  background: rgba(88, 164, 176, 0.2);
  border: 1px solid rgba(88, 164, 176, 0.3);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #58A4B0;
`

const ProfilePreview = styled.div`
  text-align: center;
  padding: 1rem;
`

const PreviewAvatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid #58A4B0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #58A4B0, #4a8a94);
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 auto 1rem auto;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const PreviewUsername = styled.h5`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
`

const PreviewBio = styled.p`
  font-size: 0.875rem;
  color: #a0a0a0;
  margin: 0 0 1rem 0;
  line-height: 1.4;
`

const PreviewLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const PreviewLink = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(88, 164, 176, 0.2);
  border-radius: 8px;
  font-size: 0.875rem;
  color: #ffffff;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`

const LinkIcon = styled.span`
  font-size: 1rem;
`

const SettingsOverview = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.15);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
`

const OverviewTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 1.5rem 0;
`

const SettingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`

const SettingIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
`

const SettingInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const SettingLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0.25rem;
`

const SettingValue = styled.div`
  font-size: 0.75rem;
  color: #a0a0a0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const ColorSwatch = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
`

const QuickActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`

const QuickActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;

  &:hover {
    background: rgba(88, 164, 176, 0.1);
    border-color: rgba(88, 164, 176, 0.2);
    transform: translateY(-1px);
  }
`

const QuickActionIcon = styled.div`
  font-size: 1.25rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(88, 164, 176, 0.2);
  border-radius: 8px;
  flex-shrink: 0;
`

const QuickActionText = styled.div`
  span {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 0.25rem;
  }

  small {
    font-size: 0.75rem;
    color: #a0a0a0;
  }
`

export default CustomizationSection