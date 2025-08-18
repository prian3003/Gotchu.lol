import React from 'react'
import styled from 'styled-components'
import { HiCheckCircle, HiXCircle } from 'react-icons/hi2'

const ProfileSection = ({ user, profileCompletion }) => {
  if (!user) return null

  return (
    <ProfileContainer>
      <ProfileCard>
        <ProfileHeader>
          <AvatarSection>
            {user.avatarURL ? (
              <ProfileAvatar src={user.avatarURL} alt="Profile" />
            ) : (
              <DefaultAvatar>
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </DefaultAvatar>
            )}
            <StatusIndicator className={user.isVerified ? 'verified' : 'unverified'}>
              {user.isVerified ? <HiCheckCircle /> : <HiXCircle />}
            </StatusIndicator>
          </AvatarSection>
          
          <ProfileInfo>
            <ProfileName>{user.displayName || user.username}</ProfileName>
            <ProfileUsername>@{user.username}</ProfileUsername>
            {user.email && <ProfileEmail>{user.email}</ProfileEmail>}
          </ProfileInfo>
        </ProfileHeader>

        <ProfileStats>
          <StatItem>
            <StatLabel>Profile Completion</StatLabel>
            <CompletionBar>
              <CompletionFill style={{ width: `${profileCompletion}%` }} />
            </CompletionBar>
            <StatValue>{profileCompletion}%</StatValue>
          </StatItem>
        </ProfileStats>
      </ProfileCard>
    </ProfileContainer>
  )
}

const ProfileContainer = styled.div`
  margin-bottom: 2rem;
`

const ProfileCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.15);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: rgba(88, 164, 176, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`

const AvatarSection = styled.div`
  position: relative;
`

const ProfileAvatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid rgba(88, 164, 176, 0.3);
`

const DefaultAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #58A4B0, #4a8a94);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  border: 2px solid rgba(88, 164, 176, 0.3);
`

const StatusIndicator = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  
  &.verified {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    border: 2px solid #22c55e;
  }
  
  &.unverified {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 2px solid #ef4444;
  }
`

const ProfileInfo = styled.div`
  flex: 1;
`

const ProfileName = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
`

const ProfileUsername = styled.p`
  font-size: 1rem;
  color: #58A4B0;
  margin: 0 0 0.25rem 0;
  font-weight: 500;
`

const ProfileEmail = styled.p`
  font-size: 0.875rem;
  color: #a0a0a0;
  margin: 0;
`

const ProfileStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const StatLabel = styled.span`
  font-size: 0.875rem;
  color: #a0a0a0;
  min-width: 120px;
`

const CompletionBar = styled.div`
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`

const CompletionFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #58A4B0, #4a8a94);
  border-radius: 4px;
  transition: width 0.3s ease;
`

const StatValue = styled.span`
  font-size: 0.875rem;
  color: #58A4B0;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
`

export default ProfileSection