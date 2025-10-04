import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useTheme } from '../../contexts/ThemeContext'
import { Icon } from '@iconify/react'
import ParticleBackground from '../effects/ParticleBackground'

const PrivacyPolicy = () => {
  const { colors } = useTheme()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
  }, [])

  return (
    <PageContainer style={{
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
        maxWidth: '800px',
        margin: '0 auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease'
      }}>
        
        {/* Header */}
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
            <Icon icon="mdi:shield-check" style={{ fontSize: '18px' }} />
            Privacy Policy
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
            Privacy Policy
          </Title>
          
          <Subtitle style={{
            fontSize: '1.1rem',
            color: colors.muted,
            margin: '0 0 8px 0'
          }}>
            How we collect, use, and protect your information
          </Subtitle>
          
          <LastUpdated style={{
            fontSize: '0.9rem',
            color: colors.muted,
            fontStyle: 'italic'
          }}>
            Last updated: March 30, 2025
          </LastUpdated>
        </Header>

        {/* Privacy Policy Content */}
        <PolicyContent>
          
          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <h2 style={{ color: colors.text, marginTop: 0 }}>Welcome to gotchu.lol</h2>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              This Privacy Policy is designed to help you understand how we collect, use, disclose, and safeguard your personal information. By using our service, you consent to the practices described in this policy.
            </p>
          </Section>

          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <SectionTitle style={{ color: colors.text }}>
              <Icon icon="mdi:refresh" style={{ marginRight: '8px', color: colors.accent }} />
              Changes To Privacy Policy
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              gotchu.lol reserves the right to modify or revise the Privacy Policy at any time without notice. Your continued use of the Service after any changes constitutes acceptance of the modified Privacy Policy. It is your responsibility to review the Privacy Policy periodically.
            </p>
          </Section>

          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <SectionTitle style={{ color: colors.text }}>
              <Icon icon="mdi:database" style={{ marginRight: '8px', color: colors.accent }} />
              Information We Collect
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              When you use gotchu.lol, we collect certain types of information to provide and improve our services. This includes both personal information you provide directly and technical data collected automatically.
            </p>
            
            <InfoList style={{ color: colors.muted }}>
              <li><strong style={{ color: colors.text }}>IP Address:</strong> Collected by default when you interact with our service for security, analytics, and abuse prevention.</li>
              <li><strong style={{ color: colors.text }}>Account Information:</strong> Your username and email address when you sign up or log in.</li>
              <li><strong style={{ color: colors.text }}>Discord Authorization:</strong> When logging in via Discord, we collect your Discord access token (not your Discord account token).</li>
              <li><strong style={{ color: colors.text }}>Image Host Uploads:</strong> When using our image hosting service, we store the uploaded file's name, size, upload date, and the uploader's IP address.</li>
              <li><strong style={{ color: colors.text }}>Analytics Data:</strong> We collect non-sensitive information for analytics, including the referring website (referrer), your device type (mobile, tablet, or desktop), the country associated with your IP address, and the timestamp of the visit or interaction.</li>
            </InfoList>
          </Section>

          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <SectionTitle style={{ color: colors.text }}>
              <Icon icon="mdi:cookie" style={{ marginRight: '8px', color: colors.accent }} />
              Cookies
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              We utilize "cookies" to gather information. You can configure your browser settings to decline all cookies or notify you when a cookie is being sent. Nevertheless, if you opt not to accept cookies, certain parts of our Service may be inaccessible to you.
            </p>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              In the course of your site visit, specific information is recorded, typically anonymized and not disclosing your identity. However, if you are logged into your account, some of this information may be linked to your account.
            </p>
          </Section>

          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <SectionTitle style={{ color: colors.text }}>
              <Icon icon="mdi:cog" style={{ marginRight: '8px', color: colors.accent }} />
              How We Use Your Information
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              We may use the information we collect for various purposes, including but not limited to:
            </p>
            <InfoList style={{ color: colors.muted }}>
              <li>Analyzing usage patterns to enhance the user experience</li>
              <li>Protecting against unauthorized access and ensuring the security of our service</li>
              <li>Tracking profile views and ensuring the accurate display of your profile views</li>
              <li>Understanding referral traffic sources and user devices for analytics</li>
            </InfoList>
          </Section>

          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <SectionTitle style={{ color: colors.text }}>
              <Icon icon="mdi:link" style={{ marginRight: '8px', color: colors.accent }} />
              Links To Other Sites
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              Our Service may include links to external sites not under our operation. Clicking on a third-party link will redirect you to that specific site. We highly recommend reviewing the Privacy Policy of each site you visit. We lack control and disclaim responsibility for the content, privacy policies, or practices of any third-party sites or services.
            </p>
          </Section>

          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <SectionTitle style={{ color: colors.text }}>
              <Icon icon="mdi:share" style={{ marginRight: '8px', color: colors.accent }} />
              Disclosure of Your Information
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              We do not sell, trade, or rent your personal information to third parties. We may disclose your information in response to legal requests or when required to do so by law, court order, or governmental authority.
            </p>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              We may disclose your information to a third party that acquires, or to which we transfer, all or substantially all of our assets and business.
            </p>
          </Section>

          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <SectionTitle style={{ color: colors.text }}>
              <Icon icon="mdi:credit-card" style={{ marginRight: '8px', color: colors.accent }} />
              Third Party Payment Processors
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              To provide you with seamless payment options for our products/services, we partner with several third-party payment processors. These entities are crucial in processing your payment information securely and efficiently. It is important to note that when you make a payment, your financial details are handled and stored by these processors according to their privacy policies and security measures, which may differ from our practices.
            </p>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              We encourage you to review the privacy policies of the payment processors we use to understand how they collect, use, and protect your personal and payment information.
            </p>
            <PaymentProcessors style={{ color: colors.muted }}>
              <li><strong style={{ color: colors.text }}>Lemon Squeezy</strong> (privacy policy at <a href="https://lemonsqueezy.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: colors.accent }}>https://lemonsqueezy.com/privacy</a>)</li>
              <li><strong style={{ color: colors.text }}>PayPal</strong> (privacy policy at <a href="https://paypal.com/legalhub/privacy-full" target="_blank" rel="noopener noreferrer" style={{ color: colors.accent }}>https://paypal.com/legalhub/privacy-full</a>)</li>
            </PaymentProcessors>
          </Section>

          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <SectionTitle style={{ color: colors.text }}>
              <Icon icon="mdi:shield-check" style={{ marginRight: '8px', color: colors.accent }} />
              Security
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              We take reasonable measures to protect your personal information from unauthorized access, disclosure, or alteration. However, no method of transmission over the internet is entirely secure, and we cannot guarantee the absolute security of your data.
            </p>
          </Section>

          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <SectionTitle style={{ color: colors.text }}>
              <Icon icon="mdi:account-settings" style={{ marginRight: '8px', color: colors.accent }} />
              Your Choices
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              You have the right to access, correct, or delete your personal information. To request any of these actions, please join our Discord server at discord.gg/gotchu or contact us at support@gotchu.lol.
            </p>
          </Section>

          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <SectionTitle style={{ color: colors.text }}>
              <Icon icon="mdi:baby-face" style={{ marginRight: '8px', color: colors.accent }} />
              Children's Information
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under this age. If you are a parent or guardian and believe that your child has provided us with personal information without your consent, please contact us immediately. We will take steps to remove the information and terminate the child's account, if applicable.
            </p>
          </Section>

          <ContactSection style={{
            background: `linear-gradient(135deg, ${colors.accent}15, ${colors.surface})`,
            border: `2px solid ${colors.accent}`,
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: colors.text, margin: '0 0 16px 0' }}>Questions or Concerns?</h3>
            <p style={{ color: colors.muted, margin: '0 0 16px 0' }}>
              Please reach out to us at support@gotchu.lol
            </p>
            <a 
              href="mailto:support@gotchu.lol" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: colors.accent,
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = `0 8px 25px ${colors.accent}40`
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              <Icon icon="mdi:email" />
              Contact Support
            </a>
          </ContactSection>

        </PolicyContent>
      </ContentWrapper>
    </PageContainer>
  )
}

const PageContainer = styled.div``

const ContentWrapper = styled.div``

const Header = styled.div``

const HeaderBadge = styled.div``

const Title = styled.h1``

const Subtitle = styled.p``

const LastUpdated = styled.p``

const PolicyContent = styled.div``

const Section = styled.div``

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.25rem;
  font-weight: 600;
`

const InfoList = styled.ul`
  line-height: 1.8;
  
  li {
    margin-bottom: 8px;
  }
`

const PaymentProcessors = styled.ul`
  line-height: 1.8;
  
  li {
    margin-bottom: 8px;
  }
  
  a {
    text-decoration: none;
    transition: opacity 0.2s ease;
    
    &:hover {
      opacity: 0.8;
    }
  }
`

const ContactSection = styled.div``

export default PrivacyPolicy