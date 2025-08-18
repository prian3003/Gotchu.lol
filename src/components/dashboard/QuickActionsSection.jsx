import React from 'react'
import logger from '../../utils/logger'
import styled from 'styled-components'
import { 
  HiRocketLaunch, 
  HiShare, 
  HiEye, 
  HiQrCode, 
  HiArrowDownTray,
  HiCog6Tooth,
  HiChartBar,
  HiUserPlus
} from 'react-icons/hi2'

const QuickActionsSection = ({ user, onNavigate }) => {
  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/u/${user.username}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.username}'s Profile`,
          text: `Check out ${user.username}'s profile on gotchu.lol`,
          url: profileUrl
        })
      } catch (error) {
        // Fall back to clipboard if share fails
        copyToClipboard(profileUrl)
      }
    } else {
      copyToClipboard(profileUrl)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      logger.userAction('profile_url_copied', { url: text })
    })
  }

  const handleViewProfile = () => {
    const profileUrl = `${window.location.origin}/u/${user.username}`
    window.open(profileUrl, '_blank')
  }

  const handleGenerateQR = () => {
    const profileUrl = `${window.location.origin}/u/${user.username}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}`
    window.open(qrUrl, '_blank')
  }

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8080/api/user/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${user.username}-profile-data.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      logger.error('Data export failed', error)
    }
  }

  const handleInviteFriends = () => {
    const shareText = `Join me on gotchu.lol! Create your personalized profile and share your links in style. Sign up today!`
    const shareUrl = `${window.location.origin}/signup?ref=${user.username}`
    
    if (navigator.share) {
      navigator.share({
        title: 'Join gotchu.lol',
        text: shareText,
        url: shareUrl
      })
    } else {
      copyToClipboard(`${shareText} ${shareUrl}`)
    }
  }

  return (
    <QuickActionsContainer>
      <SectionHeader>
        <SectionTitle>
          <HiRocketLaunch style={{ color: '#58A4B0' }} />
          Quick Actions
        </SectionTitle>
      </SectionHeader>

      <ActionsGrid>
        <ActionCard onClick={handleViewProfile} className="primary">
          <ActionIcon>
            <HiEye />
          </ActionIcon>
          <ActionContent>
            <ActionTitle>View Live Profile</ActionTitle>
            <ActionDescription>See how your profile appears to visitors</ActionDescription>
          </ActionContent>
          <ActionBadge>Live</ActionBadge>
        </ActionCard>

        <ActionCard onClick={handleShareProfile}>
          <ActionIcon>
            <HiShare />
          </ActionIcon>
          <ActionContent>
            <ActionTitle>Share Profile</ActionTitle>
            <ActionDescription>Share your profile URL with others</ActionDescription>
          </ActionContent>
        </ActionCard>

        <ActionCard onClick={() => onNavigate('analytics')}>
          <ActionIcon>
            <HiChartBar />
          </ActionIcon>
          <ActionContent>
            <ActionTitle>View Analytics</ActionTitle>
            <ActionDescription>Check your profile performance</ActionDescription>
          </ActionContent>
        </ActionCard>

        <ActionCard onClick={() => onNavigate('customization')}>
          <ActionIcon>
            <HiCog6Tooth />
          </ActionIcon>
          <ActionContent>
            <ActionTitle>Customize</ActionTitle>
            <ActionDescription>Personalize your profile appearance</ActionDescription>
          </ActionContent>
        </ActionCard>

        <ActionCard onClick={handleGenerateQR}>
          <ActionIcon>
            <HiQrCode />
          </ActionIcon>
          <ActionContent>
            <ActionTitle>QR Code</ActionTitle>
            <ActionDescription>Generate QR code for easy sharing</ActionDescription>
          </ActionContent>
        </ActionCard>

        <ActionCard onClick={handleExportData}>
          <ActionIcon>
            <HiArrowDownTray />
          </ActionIcon>
          <ActionContent>
            <ActionTitle>Export Data</ActionTitle>
            <ActionDescription>Download your profile data</ActionDescription>
          </ActionContent>
        </ActionCard>

        <ActionCard onClick={handleInviteFriends}>
          <ActionIcon>
            <HiUserPlus />
          </ActionIcon>
          <ActionContent>
            <ActionTitle>Invite Friends</ActionTitle>
            <ActionDescription>Share gotchu.lol with others</ActionDescription>
          </ActionContent>
          <ActionBadge className="referral">+Bonus</ActionBadge>
        </ActionCard>
      </ActionsGrid>

      <ProfileUrlSection>
        <UrlHeader>
          <UrlTitle>Your Profile URL</UrlTitle>
          <UrlActions>
            <UrlButton onClick={() => copyToClipboard(`${window.location.origin}/u/${user.username}`)}>
              Copy Link
            </UrlButton>
            <UrlButton onClick={handleViewProfile} className="primary">
              Visit
            </UrlButton>
          </UrlActions>
        </UrlHeader>
        <UrlDisplay>
          <UrlText>
            {window.location.origin}/u/{user.username}
          </UrlText>
        </UrlDisplay>
      </ProfileUrlSection>
    </QuickActionsContainer>
  )
}

const QuickActionsContainer = styled.div`
  margin-bottom: 2rem;
`

const SectionHeader = styled.div`
  margin-bottom: 1.5rem;
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

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`

const ActionCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.15);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;

  &:hover {
    border-color: rgba(88, 164, 176, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &.primary {
    background: linear-gradient(145deg, rgba(88, 164, 176, 0.15), rgba(88, 164, 176, 0.08));
    border-color: rgba(88, 164, 176, 0.3);

    &:hover {
      background: linear-gradient(145deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.12));
      border-color: rgba(88, 164, 176, 0.4);
    }
  }
`

const ActionIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(88, 164, 176, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #58A4B0;
  flex-shrink: 0;
  transition: all 0.3s ease;

  ${ActionCard}:hover & {
    background: rgba(88, 164, 176, 0.3);
    transform: scale(1.1);
  }
`

const ActionContent = styled.div`
  flex: 1;
  min-width: 0;
`

const ActionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
`

const ActionDescription = styled.p`
  font-size: 0.875rem;
  color: #a0a0a0;
  margin: 0;
  line-height: 1.4;
`

const ActionBadge = styled.div`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid #22c55e;

  &.referral {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
    border-color: #f59e0b;
  }
`

const ProfileUrlSection = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.15);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
`

const UrlHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`

const UrlTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`

const UrlActions = styled.div`
  display: flex;
  gap: 0.5rem;
`

const UrlButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }

  &.primary {
    background: linear-gradient(145deg, #58A4B0, #4a8a94);
    border-color: #58A4B0;

    &:hover {
      background: linear-gradient(145deg, #4a8a94, #3c7580);
    }
  }
`

const UrlDisplay = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  position: relative;
`

const UrlText = styled.code`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #58A4B0;
  word-break: break-all;
`

export default QuickActionsSection