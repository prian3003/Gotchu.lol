import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'

const HelpCenter = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSections, setFilteredSections] = useState([])

  // Help sections organized by categories
  const helpSections = {
    'Guides & Tutorials': [
      {
        id: 'getting-started',
        title: 'Getting Started with gotchu.lol',
        description: 'Learn the basics of creating and setting up your profile',
        icon: 'heroicons:rocket-launch',
        color: '#58A4B0',
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
    console.log(`Navigate to help section: ${sectionId}`)
  }

  const handleArticleClick = (articleId) => {
    // Navigate to specific article (future implementation)
    console.log(`Navigate to article: ${articleId}`)
  }

  return (
    <HelpContainer>
      <BackButton onClick={() => navigate('/dashboard')}>
        <Icon icon="heroicons:arrow-left" width={20} height={20} />
        <span>Back to Dashboard</span>
      </BackButton>

      <Header>
        <HeaderIcon>
          <Icon icon="heroicons:question-mark-circle" width={40} height={40} />
        </HeaderIcon>
        <Title>gotchu.lol Help Center</Title>
        <Subtitle>How can we help you?</Subtitle>
        <Description>
          Need help? Start by searching for answers to common questions. Whether you're setting up your profile,
          adding social media links, or exploring premium features, we've got you covered.
        </Description>
      </Header>

      <SearchSection>
        <SearchContainer>
          <SearchIcon>
            <Icon icon="heroicons:magnifying-glass" width={20} height={20} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                    color={section.color}
                    onClick={() => handleSectionClick(section.id)}
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
    </HelpContainer>
  )
}

// Styled Components
const HelpContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0F0F23 0%, #1A1A2E 100%);
  color: #ffffff;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 2rem;
  font-size: 0.9rem;
  font-weight: 500;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
  
  svg {
    width: 1.2rem;
    height: 1.2rem;
  }
`

const Header = styled.div`
  text-align: center;
  max-width: 800px;
  margin: 0 auto 4rem auto;
`

const HeaderIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #58A4B0, #4A8C96);
  border-radius: 20px;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(88, 164, 176, 0.3);
  
  svg {
    width: 2.5rem;
    height: 2.5rem;
    color: #ffffff;
  }
`

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #ffffff, #58A4B0);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`

const Subtitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #58A4B0;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`

const Description = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`

const SearchSection = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 4rem;
`

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
`

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  z-index: 2;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #58A4B0;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 4px rgba(88, 164, 176, 0.1);
  }
`

const ContentWrapper = styled.div`
  display: flex;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 3rem;
  }
`

const MainContent = styled.div`
  flex: 1;
`

const CategorySection = styled.div`
  margin-bottom: 4rem;
`

const SectionTitle = styled.h3`
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:before {
    content: '';
    width: 4px;
    height: 2rem;
    background: linear-gradient(135deg, #58A4B0, #4A8C96);
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
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.color || '#58A4B0'};
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.06);
    border-color: ${props => props.color || '#58A4B0'};
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    
    &:before {
      opacity: 1;
    }
  }
  
  display: flex;
  align-items: flex-start;
  gap: 1rem;
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
  color: #ffffff;
  margin-bottom: 0.5rem;
`

const SectionCardDescription = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin-bottom: 0.75rem;
`

const CategoryTag = styled.span`
  display: inline-block;
  background: rgba(88, 164, 176, 0.2);
  color: #58A4B0;
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
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  margin-bottom: 1.5rem;
  
  svg {
    width: 2rem;
    height: 2rem;
    color: rgba(255, 255, 255, 0.5);
  }
`

const NoResultsTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.75rem;
`

const NoResultsDescription = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
`

const Sidebar = styled.div`
  width: 300px;
  
  @media (max-width: 1024px) {
    width: 100%;
  }
`

const SidebarSection = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(10px);
`

const SidebarTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 1rem;
`

const SidebarLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const SidebarLink = styled.a`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    color: #58A4B0;
    background: rgba(88, 164, 176, 0.1);
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
  background: rgba(88, 164, 176, 0.2);
  border-radius: 10px;
  flex-shrink: 0;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: #58A4B0;
  }
`

const ContactContent = styled.div`
  flex: 1;
`

const ContactTitle = styled.h5`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
`

const ContactDescription = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
  margin-bottom: 1rem;
`

const ContactButton = styled.button`
  background: linear-gradient(135deg, #58A4B0, #4A8C96);
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(88, 164, 176, 0.3);
  }
`

export default HelpCenter