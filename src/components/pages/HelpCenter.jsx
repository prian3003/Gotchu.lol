import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useTheme } from '../../contexts/ThemeContext'
import ParticleBackground from '../effects/ParticleBackground'

const HelpCenter = () => {
  const { colors } = useTheme()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSections, setFilteredSections] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    window.scrollTo(0, 0)
  }, [])

  // Help sections organized by categories
  const helpSections = {
    'Guides & Tutorials': [
      {
        id: 'getting-started',
        title: 'Getting Started with gotchu.lol',
        description: 'Learn the basics of creating and setting up your profile',
        icon: 'mdi:rocket-launch',
        color: colors.accent,
        articles: [
          'Creating your first profile',
          'Profile customization basics', 
          'Adding your first links',
          'Understanding analytics'
        ]
      },
      {
        id: 'customization-guide',
        title: 'Profile Customization',
        description: 'Master advanced customization features and effects',
        icon: 'heroicons:paint-brush',
        color: '#8B5CF6',
        articles: [
          'Theme colors and effects',
          'Background customization',
          'Typography and fonts',
          'Animation settings'
        ]
      },
      {
        id: 'social-links',
        title: 'Adding Social Media Links',
        description: 'Connect all your social platforms and content',
        icon: 'heroicons:link',
        color: '#EF4444',
        articles: [
          'Supported platforms',
          'Link organization',
          'Custom icons and styling',
          'Link analytics tracking'
        ]
      }
    ],
    'Features & Tools': [
      {
        id: 'discord-integration',
        title: 'Discord Integration',
        description: 'Connect and showcase your Discord presence',
        icon: 'simple-icons:discord',
        color: '#5865F2',
        articles: [
          'Linking Discord account',
          'Discord presence display',
          'Avatar synchronization',
          'Status and activity tracking'
        ]
      },
      {
        id: 'analytics',
        title: 'Profile Analytics',
        description: 'Track your profile performance and engagement',
        icon: 'heroicons:chart-bar',
        color: '#10B981',
        articles: [
          'Understanding analytics dashboard',
          'Profile views tracking',
          'Link click analytics',
          'Performance insights'
        ]
      },
      {
        id: 'premium-features',
        title: 'Premium Features',
        description: 'Unlock advanced customization and tools',
        icon: 'heroicons:gift',
        color: '#F59E0B',
        articles: [
          'Premium subscription benefits',
          'Advanced customization options',
          'Priority support access',
          'Exclusive templates'
        ]
      }
    ],
    'Account & Security': [
      {
        id: 'account-settings',
        title: 'Account Management',
        description: 'Manage your account settings and preferences',
        icon: 'heroicons:user',
        color: '#6366F1',
        articles: [
          'Profile settings',
          'Privacy controls',
          'Email preferences',
          'Account verification'
        ]
      },
      {
        id: 'security',
        title: 'Security & Privacy',
        description: 'Protect your account with security features',
        icon: 'heroicons:shield-check',
        color: '#DC2626',
        articles: [
          'Two-factor authentication',
          'Password security',
          'Privacy settings',
          'Data protection'
        ]
      },
      {
        id: 'badges',
        title: 'Badges & Verification',
        description: 'Learn about profile badges and verification',
        icon: 'heroicons:check-badge',
        color: '#059669',
        articles: [
          'Verification process',
          'Badge types and meanings',
          'How to earn badges',
          'Badge display settings'
        ]
      }
    ],
    'Support & Troubleshooting': [
      {
        id: 'common-issues',
        title: 'Troubleshooting & Issues',
        description: 'Resolve common problems and technical issues',
        icon: 'heroicons:exclamation-triangle',
        color: '#F97316',
        articles: [
          'Profile not loading',
          'Link click tracking issues',
          'Discord connection problems',
          'Customization not saving'
        ]
      },
      {
        id: 'contact-support',
        title: 'Contact Support',
        description: 'Get help from our support team',
        icon: 'heroicons:chat-bubble-left-ellipsis',
        color: '#8B5CF6',
        articles: [
          'Submit support ticket',
          'Community Discord server',
          'Feature requests',
          'Bug reports'
        ]
      }
    ]
  }

  // Popular articles based on common user needs
  const popularArticles = [
    {
      id: 'setup-profile',
      title: 'Setting Up Your First Profile',
      description: 'Complete guide to creating your gotchu.lol profile',
      icon: 'heroicons:user',
      color: '#58A4B0'
    },
    {
      id: 'add-links',
      title: 'Adding Social Media Links',
      description: 'Connect all your social platforms in one place',
      icon: 'heroicons:link',
      color: '#EF4444'
    },
    {
      id: 'discord-connect',
      title: 'Connect Your Discord Account',
      description: 'Show your Discord status and activity',
      icon: 'simple-icons:discord',
      color: '#5865F2'
    },
    {
      id: 'customize-theme',
      title: 'Customizing Your Theme',
      description: 'Make your profile unique with custom themes',
      icon: 'heroicons:paint-brush',
      color: '#8B5CF6'
    },
    {
      id: 'enable-2fa',
      title: 'Enable Two-Factor Authentication',
      description: 'Secure your account with 2FA',
      icon: 'heroicons:shield-check',
      color: '#DC2626'
    },
    {
      id: 'premium-upgrade',
      title: 'Upgrading to Premium',
      description: 'Unlock advanced features and customization',
      icon: 'heroicons:sparkles',
      color: '#F59E0B'
    }
  ]

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSections([])
      return
    }

    const filtered = []
    Object.entries(helpSections).forEach(([category, sections]) => {
      sections.forEach(section => {
        const matchTitle = section.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchDescription = section.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchArticles = section.articles.some(article => 
          article.toLowerCase().includes(searchQuery.toLowerCase())
        )
        
        if (matchTitle || matchDescription || matchArticles) {
          filtered.push({ ...section, category })
        }
      })
    })
    setFilteredSections(filtered)
  }, [searchQuery])

  const handleSectionClick = (sectionId) => {
    // Navigate to specific help section (future implementation)
  }

  const handleArticleClick = (articleId) => {
    // Navigate to specific article (future implementation)
  }

  return (
    <HelpContainer style={{
      background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 50%, ${colors.background} 100%)`,
      color: colors.text,
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <ParticleBackground />
      
      <ContentWrapper style={{
        padding: '120px 24px 80px',
        position: 'relative',
        zIndex: 2,
        maxWidth: '1200px',
        margin: '0 auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease'
      }}>
      
      <BackButton onClick={() => navigate('/dashboard')} style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        color: colors.text
      }}>
        <Icon icon="mdi:arrow-left" width={20} height={20} />
        <span>Back to Dashboard</span>
      </BackButton>

      <Header style={{ textAlign: 'center', marginBottom: '48px' }}>
        <HeaderBadge style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: `${colors.accent}20`,
          border: `1px solid ${colors.accent}40`,
          borderRadius: '50px',
          padding: '8px 16px',
          marginBottom: '24px',
          fontSize: '14px',
          color: colors.accent
        }}>
          <Icon icon="mdi:help-circle" style={{ fontSize: '18px' }} />
          Help Center
        </HeaderBadge>
        
        <Title style={{
          fontSize: '3rem',
          fontWeight: '800',
          margin: '0 0 16px 0',
          background: `linear-gradient(135deg, ${colors.accent}, ${colors.text})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: '1.2'
        }}>
          How can we help you?
        </Title>
        
        <Description style={{
          fontSize: '1.1rem',
          color: colors.muted,
          margin: '0 auto',
          maxWidth: '600px',
          lineHeight: '1.6'
        }}>
          Need help? Start by searching for answers to common questions. Whether you're setting up your profile,
          adding social media links, or exploring premium features, we've got you covered.
        </Description>
      </Header>

      <SearchSection style={{ marginBottom: '48px' }}>
        <SearchContainer>
          <SearchIcon style={{ color: colors.muted }}>
            <Icon icon="mdi:magnify" width={20} height={20} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: colors.surface,
              border: `2px solid ${colors.border}`,
              color: colors.text,
              borderRadius: '16px',
              padding: '16px 16px 16px 48px'
            }}
          />
        </SearchContainer>
      </SearchSection>

      <ContentWrapper>
        <MainContent>
          {searchQuery && filteredSections.length > 0 ? (
            <SearchResults>
              <SectionTitle>Search Results</SectionTitle>
              <SectionGrid>
                {filteredSections.map((section) => (
                  <SectionCard 
                    key={section.id} 
                    onClick={() => handleSectionClick(section.id)}
                    style={{
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '16px',
                      padding: '24px'
                    }}
                  >
                    <SectionIcon color={section.color}>
                      <Icon icon={section.icon} width={24} height={24} />
                    </SectionIcon>
                    <SectionContent>
                      <SectionCardTitle>{section.title}</SectionCardTitle>
                      <SectionCardDescription>{section.description}</SectionCardDescription>
                      <CategoryTag>{section.category}</CategoryTag>
                    </SectionContent>
                  </SectionCard>
                ))}
              </SectionGrid>
            </SearchResults>
          ) : searchQuery && filteredSections.length === 0 ? (
            <NoResults>
              <NoResultsIcon>
                <Icon icon="heroicons:magnifying-glass" width={32} height={32} />
              </NoResultsIcon>
              <NoResultsTitle>No results found</NoResultsTitle>
              <NoResultsDescription>
                Try adjusting your search terms or browse our help categories below.
              </NoResultsDescription>
            </NoResults>
          ) : (
            <>
              {/* Help Categories */}
              {Object.entries(helpSections).map(([category, sections]) => (
                <CategorySection key={category}>
                  <SectionTitle>{category}</SectionTitle>
                  <SectionGrid>
                    {sections.map((section) => (
                      <SectionCard 
                        key={section.id} 
                        color={section.color}
                        onClick={() => handleSectionClick(section.id)}
                      >
                        <SectionIcon color={section.color}>
                          <Icon icon={section.icon} width={24} height={24} />
                        </SectionIcon>
                        <SectionContent>
                          <SectionCardTitle>{section.title}</SectionCardTitle>
                          <SectionCardDescription>{section.description}</SectionCardDescription>
                        </SectionContent>
                      </SectionCard>
                    ))}
                  </SectionGrid>
                </CategorySection>
              ))}

              {/* Popular Articles */}
              <CategorySection>
                <SectionTitle>Popular Articles</SectionTitle>
                <SectionGrid>
                  {popularArticles.map((article) => (
                    <SectionCard 
                      key={article.id} 
                      color={article.color}
                      onClick={() => handleArticleClick(article.id)}
                    >
                      <SectionIcon color={article.color}>
                        <Icon icon={article.icon} width={24} height={24} />
                      </SectionIcon>
                      <SectionContent>
                        <SectionCardTitle>{article.title}</SectionCardTitle>
                        <SectionCardDescription>{article.description}</SectionCardDescription>
                      </SectionContent>
                    </SectionCard>
                  ))}
                </SectionGrid>
              </CategorySection>
            </>
          )}
        </MainContent>

        <Sidebar>
          <SidebarSection>
            <SidebarTitle>On This Page</SidebarTitle>
            <SidebarLinks>
              <SidebarLink href="#guides">Guides & Tutorials</SidebarLink>
              <SidebarLink href="#features">Features & Tools</SidebarLink>
              <SidebarLink href="#security">Account & Security</SidebarLink>
              <SidebarLink href="#support">Support & Troubleshooting</SidebarLink>
              <SidebarLink href="#popular">Popular Articles</SidebarLink>
            </SidebarLinks>
          </SidebarSection>

          <SidebarSection>
            <SidebarTitle>Need More Help?</SidebarTitle>
            <ContactCard>
              <ContactIcon>
                <Icon icon="heroicons:envelope" width={20} height={20} />
              </ContactIcon>
              <ContactContent>
                <ContactTitle>Contact Support</ContactTitle>
                <ContactDescription>
                  Can't find what you're looking for? Reach out to our support team.
                </ContactDescription>
                <ContactButton>Get Help</ContactButton>
              </ContactContent>
            </ContactCard>
          </SidebarSection>
        </Sidebar>
      </ContentWrapper>
      </ContentWrapper>
    </HelpContainer>
  )
}

// Simple styled components for structure
const HelpContainer = styled.div``
const ContentWrapper = styled.div``
const Header = styled.div``
const HeaderBadge = styled.div``
const Title = styled.h1``
const Description = styled.p``
const SearchSection = styled.div`
  display: flex;
  justify-content: center;
`
const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
`
const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
`
const SearchInput = styled.input`
  width: 100%;
  &::placeholder {
    color: ${props => props.colors?.muted || '#a0a0a0'};
  }
  &:focus {
    outline: none;
    border-color: ${props => props.colors?.accent || '#58A4B0'};
    box-shadow: 0 0 0 4px ${props => props.colors?.accent || '#58A4B0'}20;
  }
`
const MainContent = styled.div`
  flex: 1;
`
const CategorySection = styled.div`
  margin-bottom: 3rem;
`
const SectionTitle = styled.h3`
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:before {
    content: '';
    width: 4px;
    height: 2rem;
    background: ${props => props.colors?.accent || '#58A4B0'};
    border-radius: 2px;
  }
`
const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`
const SectionCard = styled.div`
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`
const SectionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: ${props => `${props.color}20` || 'rgba(88, 164, 176, 0.2)'};
  border-radius: 12px;
  flex-shrink: 0;
  
  svg {
    width: 1.5rem;
    height: 1.5rem;
    color: ${props => props.color || '#58A4B0'};
  }
`
const SectionContent = styled.div`
  flex: 1;
`
const SectionCardTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`
const SectionCardDescription = styled.p`
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
`
const CategoryTag = styled.span`
  display: inline-block;
  background: ${props => `${props.colors?.accent || '#58A4B0'}20`};
  color: ${props => props.colors?.accent || '#58A4B0'};
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
`
const SearchResults = styled.div`
  margin-bottom: 2rem;
`
const NoResults = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`
const NoResultsIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: ${props => props.colors?.surface || 'rgba(255, 255, 255, 0.05)'};
  border-radius: 20px;
  margin-bottom: 1.5rem;
`
const NoResultsTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
`
const NoResultsDescription = styled.p`
  font-size: 1rem;
`
const Sidebar = styled.div`
  width: 300px;
  
  @media (max-width: 1024px) {
    width: 100%;
  }
`
const SidebarSection = styled.div`
  background: ${props => props.colors?.surface || 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.colors?.border || 'rgba(255, 255, 255, 0.08)'};
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`
const SidebarTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
`
const SidebarLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`
const SidebarLink = styled.a`
  font-size: 0.9rem;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    color: ${props => props.colors?.accent || '#58A4B0'};
    background: ${props => `${props.colors?.accent || '#58A4B0'}10`};
  }
`
const ContactCard = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`
const ContactIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${props => `${props.colors?.accent || '#58A4B0'}20`};
  border-radius: 10px;
  flex-shrink: 0;
`
const ContactContent = styled.div`
  flex: 1;
`
const ContactTitle = styled.h5`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`
const ContactDescription = styled.p`
  font-size: 0.85rem;
  line-height: 1.4;
  margin-bottom: 1rem;
`
const ContactButton = styled.button`
  background: ${props => props.colors?.accent || '#58A4B0'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px ${props => `${props.colors?.accent || '#58A4B0'}30`};
  }
`
const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 2rem;
  font-size: 0.9rem;
  font-weight: 500;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`

export default HelpCenter