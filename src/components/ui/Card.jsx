import React from 'react'
import styled from 'styled-components'

const Card = ({
  children,
  variant = 'default',
  size = 'medium',
  hover = false,
  clickable = false,
  padding,
  className,
  onClick,
  ...props
}) => {
  return (
    <StyledCard
      $variant={variant}
      size={size}
      hover={hover}
      clickable={clickable}
      padding={padding}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </StyledCard>
  )
}

// Specialized card components
export const StatsCard = ({ icon, title, value, change, changeType, ...props }) => (
  <Card variant="stats" {...props}>
    <StatsHeader>
      {icon && <StatsIcon>{icon}</StatsIcon>}
      <StatsTitle>{title}</StatsTitle>
    </StatsHeader>
    <StatsValue>{value}</StatsValue>
    {change && (
      <StatsChange type={changeType}>
        {changeType === 'positive' ? '+' : ''}{change}
      </StatsChange>
    )}
  </Card>
)

export const FeatureCard = ({ icon, title, description, action, ...props }) => (
  <Card variant="feature" hover clickable {...props}>
    <FeatureIcon>{icon}</FeatureIcon>
    <FeatureContent>
      <FeatureTitle>{title}</FeatureTitle>
      <FeatureDescription>{description}</FeatureDescription>
    </FeatureContent>
    {action && <FeatureAction>{action}</FeatureAction>}
  </Card>
)

export const ProfileCard = ({ avatar, name, username, bio, stats, actions, ...props }) => (
  <Card variant="profile" {...props}>
    <ProfileHeader>
      <ProfileAvatar src={avatar} alt={name} />
      <ProfileInfo>
        <ProfileName>{name}</ProfileName>
        <ProfileUsername>@{username}</ProfileUsername>
      </ProfileInfo>
    </ProfileHeader>
    {bio && <ProfileBio>{bio}</ProfileBio>}
    {stats && (
      <ProfileStats>
        {stats.map((stat, index) => (
          <ProfileStat key={index}>
            <ProfileStatValue>{stat.value}</ProfileStatValue>
            <ProfileStatLabel>{stat.label}</ProfileStatLabel>
          </ProfileStat>
        ))}
      </ProfileStats>
    )}
    {actions && <ProfileActions>{actions}</ProfileActions>}
  </Card>
)

// Styled components
const StyledCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.15);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  /* Size variants */
  ${props => {
    if (props.padding) {
      return `padding: ${props.padding};`
    }
    
    switch (props.size) {
      case 'small':
        return 'padding: 1rem;'
      case 'large':
        return 'padding: 2rem;'
      case 'medium':
      default:
        return 'padding: 1.5rem;'
    }
  }}
  
  /* Variant styles */
  ${props => {
    switch (props.variant) {
      case 'elevated':
        return `
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
        `
      case 'outlined':
        return `
          background: transparent;
          border: 2px solid rgba(88, 164, 176, 0.2);
        `
      case 'filled':
        return `
          background: rgba(88, 164, 176, 0.1);
          border-color: rgba(88, 164, 176, 0.2);
        `
      case 'gradient':
        return `
          background: linear-gradient(135deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.05));
          border-color: rgba(88, 164, 176, 0.3);
        `
      case 'stats':
        return `
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
          border: 1px solid rgba(88, 164, 176, 0.2);
          padding: 1.5rem;
        `
      case 'feature':
        return `
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
          border: 1px solid rgba(88, 164, 176, 0.15);
          padding: 2rem;
          text-align: center;
        `
      case 'profile':
        return `
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
          border: 1px solid rgba(88, 164, 176, 0.2);
          padding: 1.5rem;
        `
      default:
        return ''
    }
  }}
  
  /* Interactive states */
  ${props => props.clickable && `
    cursor: pointer;
  `}
  
  ${props => props.hover && `
    &:hover {
      border-color: rgba(88, 164, 176, 0.25);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
  `}
  
  ${props => props.clickable && `
    &:active {
      transform: translateY(0);
    }
  `}
`

// Stats card components
const StatsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`

const StatsIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(88, 164, 176, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #58A4B0;
`

const StatsTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 500;
  color: #a0a0a0;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const StatsValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
`

const StatsChange = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  
  ${props => props.type === 'positive' && `
    color: #10b981;
  `}
  
  ${props => props.type === 'negative' && `
    color: #ef4444;
  `}
  
  ${props => props.type === 'neutral' && `
    color: #a0a0a0;
  `}
`

// Feature card components
const FeatureIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(88, 164, 176, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #58A4B0;
  margin: 0 auto 1.5rem auto;
`

const FeatureContent = styled.div`
  margin-bottom: 1.5rem;
`

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
`

const FeatureDescription = styled.p`
  font-size: 0.875rem;
  color: #a0a0a0;
  margin: 0;
  line-height: 1.5;
`

const FeatureAction = styled.div`
  margin-top: auto;
`

// Profile card components
const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`

const ProfileAvatar = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(88, 164, 176, 0.3);
  object-fit: cover;
`

const ProfileInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const ProfileName = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
`

const ProfileUsername = styled.p`
  font-size: 0.875rem;
  color: #58A4B0;
  margin: 0;
`

const ProfileBio = styled.p`
  font-size: 0.875rem;
  color: #a0a0a0;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`

const ProfileStats = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const ProfileStat = styled.div`
  text-align: center;
`

const ProfileStatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #58A4B0;
  margin-bottom: 0.25rem;
`

const ProfileStatLabel = styled.div`
  font-size: 0.75rem;
  color: #a0a0a0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const ProfileActions = styled.div`
  display: flex;
  gap: 0.75rem;
`

export default Card