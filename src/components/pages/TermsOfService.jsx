import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useTheme } from '../../contexts/ThemeContext'
import { Icon } from '@iconify/react'
import ParticleBackground from '../effects/ParticleBackground'

const TermsOfService = () => {
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
            <Icon icon="mdi:file-document" style={{ fontSize: '18px' }} />
            Terms of Service
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
            Terms of Service
          </Title>
          
          <Subtitle style={{
            fontSize: '1.1rem',
            color: colors.muted,
            margin: '0 0 8px 0'
          }}>
            Terms and conditions for using gotchu.lol
          </Subtitle>
          
          <LastUpdated style={{
            fontSize: '0.9rem',
            color: colors.muted,
            fontStyle: 'italic'
          }}>
            Last updated: January 9, 2025
          </LastUpdated>
        </Header>

        {/* Terms of Service Content */}
        <PolicyContent>
          
          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <h2 style={{ color: colors.text, marginTop: 0 }}>Agreement to Terms</h2>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              By using the gotchu.lol bio link (referred to as the "Service"), you agree to be bound by these Terms of Service ("ToS"). If you do not agree to these Terms of Service, please refrain from further use of our platform. The materials contained in this Website are protected by copyright.
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
              Changes To Terms
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              gotchu.lol may modify these Terms at any time. Changes take effect when posted. Your continued use of the Service means you accept the updated Terms. Review the Terms periodically.
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
              <Icon icon="mdi:account-check" style={{ marginRight: '8px', color: colors.accent }} />
              Use of the Service
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              When creating an account, you agree not to use any username that is illegal, trademarked, offensive, vulgar, or otherwise unlawful. We may remove such usernames to keep the platform safe and respectful.
            </p>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              We may terminate, suspend, remove, or edit your account at any time without notice. You must use the Service in compliance with all applicable laws.
            </p>
            
            <ProhibitionsList style={{ color: colors.muted }}>
              <li>Do not use the Service for illegal activity. Do not upload or transmit viruses, spyware, or other harmful, infringing, illegal, disruptive, or destructive content or files.</li>
              <li>Do not interfere with or attempt to interfere with the proper working of gotchu.lol or its networks. Do not bypass any access controls or restrictions.</li>
              <li>Do not impersonate any person or entity or misrepresent your affiliation. Do not suggest your content comes from gotchu.lol if it does not.</li>
              <li>Do not use or attempt to use another person's account, services, or systems without authorization. Do not create a false identity on gotchu.lol.</li>
              <li>Do not use or authorize automated scripts, scrapers, or similar tools to collect information from your Page or from gotchu.lol or to otherwise interact with the Service.</li>
              <li>Do not include sexually explicit material, graphic violence, or other content we deem inappropriate or offensive on your Page or account.</li>
            </ProhibitionsList>
          </Section>

          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <SectionTitle style={{ color: colors.text }}>
              <Icon icon="mdi:image" style={{ marginRight: '8px', color: colors.accent }} />
              Image Hosting
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              The image hosting feature is for personal, non-commercial use only. It is intended for casual uploads such as avatars or social content. You may not use it to store, serve, or deliver files for any automated system, business operation, platform, bot, tool, or service, whether public or private.
            </p>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              The image hosting feature may not be used as a content delivery network or any backend infrastructure. Misuse may lead to suspension, feature restrictions, or termination.
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
              <Icon icon="mdi:shield-check" style={{ marginRight: '8px', color: colors.accent }} />
              Security
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              We take reasonable measures to protect user data, but no method of transmission or storage is completely secure. We cannot guarantee absolute security.
            </p>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              You are responsible for safeguarding your account credentials and notifying us promptly of any unauthorized access or suspicious activity.
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
              <Icon icon="mdi:file-document-edit" style={{ marginRight: '8px', color: colors.accent }} />
              User-Posted Content and Licensing Rights
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              You are solely responsible for the legality, reliability, and appropriateness of content you post. If third parties own rights in your content, you must obtain all necessary permissions. By posting, you confirm you have the right to do so and that your content does not infringe third-party rights, including intellectual property, privacy, or publicity rights.
            </p>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              You grant gotchu.lol a non-exclusive, transferable, sublicensable, royalty-free, worldwide license to use, display, reproduce, modify, distribute, and create derivative works from your content for operating, promoting, and improving the Service. This license ends when you delete the content, except where others have shared it and not deleted it or where we retain it for legal reasons.
            </p>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              You retain your rights to your content. You agree to indemnify gotchu.lol and its affiliates from claims or damages arising from your content.
            </p>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              If we provide images, icons, video, graphics, or other assets for use with gotchu.lol, you may use them only on your gotchu.lol page and must follow any written guidelines or terms, including third-party terms.
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
              <Icon icon="mdi:cancel" style={{ marginRight: '8px', color: colors.accent }} />
              Prohibited Content
            </SectionTitle>
            <ProhibitionsList style={{ color: colors.muted }}>
              <li>Content that violates local, national, or international law</li>
              <li>Content that infringes intellectual property, privacy, or other rights</li>
              <li>Defamatory, obscene, pornographic, abusive, or otherwise objectionable content</li>
              <li>Malware, spam, or other malicious code</li>
              <li>Attempts to bypass or interfere with security features of the Service</li>
              <li>Content that promotes violence, discrimination, illegal activities, or hate</li>
            </ProhibitionsList>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginTop: '16px' }}>
              We may remove content, suspend or terminate accounts, and report illegal activity to law enforcement at our discretion.
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
              <Icon icon="mdi:link" style={{ marginRight: '8px', color: colors.accent }} />
              Third-Party Links
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              The Service may contain links to third-party websites or services. We do not control and are not responsible for their content, policies, or practices. Inclusion of a link does not imply endorsement.
            </p>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              We are not liable for any damage or loss arising from use of or reliance on third-party content, goods, or services.
            </p>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              Users may include third-party links in their bios, provided it is fair and legal and does not harm our reputation or suggest association, approval, or endorsement where none exists. We may remove links or content that we deem inappropriate or in violation of these Terms.
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
              <Icon icon="mdi:account-multiple" style={{ marginRight: '8px', color: colors.accent }} />
              Account Limitations and Usage
            </SectionTitle>
            <ProhibitionsList style={{ color: colors.muted }}>
              <li>Users may create only one account. Attempts to create multiple accounts may result in removal of additional accounts without notice.</li>
              <li>Do not share your login credentials. Accounts are for individual use only. Sharing access is a violation of these Terms.</li>
            </ProhibitionsList>
          </Section>

          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <SectionTitle style={{ color: colors.text }}>
              <Icon icon="mdi:currency-usd" style={{ marginRight: '8px', color: colors.accent }} />
              Pricing and Additional Charges
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              Prices are shown before applicable taxes, handling fees, and other charges. These are calculated at checkout and the final total will include all applicable amounts, which may vary by location and item.
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
              <Icon icon="mdi:shield-star" style={{ marginRight: '8px', color: colors.accent }} />
              Custom Badges
            </SectionTitle>
            <ProhibitionsList style={{ color: colors.muted }}>
              <li>Badges must be original and not replicate or closely imitate official gotchu.lol badges.</li>
              <li>Badges must comply with these Terms, including content and trademark rules.</li>
              <li>We may review, restrict, or remove badges that violate these conditions, with or without notice.</li>
              <li>Abuse of the badge system may result in restrictions or loss of customization features.</li>
            </ProhibitionsList>
          </Section>

          <Section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <SectionTitle style={{ color: colors.text }}>
              <Icon icon="mdi:cash-remove" style={{ marginRight: '8px', color: colors.accent }} />
              No Refund Policy
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              Payments to gotchu.lol are generally non-refundable. If an error is on our side, a refund may be issued at our discretion.
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
              <Icon icon="mdi:copyright" style={{ marginRight: '8px', color: colors.accent }} />
              Intellectual Property
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              gotchu.lol and its content are protected by copyright, trademark, and other intellectual property laws. These Terms do not transfer any rights to you, and all rights not expressly granted remain with gotchu.lol or its licensors.
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
              <Icon icon="mdi:police-badge" style={{ marginRight: '8px', color: colors.accent }} />
              Law Enforcement Requests
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6', marginBottom: '16px' }}>
              gotchu.lol complies with valid legal process, including subpoenas, court orders, and search warrants, as required by applicable law.
            </p>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              All law enforcement requests must be submitted in writing to: legal@gotchu.lol
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
              <Icon icon="mdi:shield-alert" style={{ marginRight: '8px', color: colors.accent }} />
              Limitation of Liability
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              To the maximum extent permitted by law, gotchu.lol is not liable for any direct, indirect, incidental, special, consequential, or exemplary damages, including loss of profits, goodwill, data, or other intangible losses.
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
              <Icon icon="mdi:handshake" style={{ marginRight: '8px', color: colors.accent }} />
              Indemnity
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              You agree to defend, indemnify, and hold harmless gotchu.lol and anyone acting on its behalf, including owners, managers, officers, affiliates, employees, licensors, and suppliers, from losses, costs, claims, and damages (including reasonable attorneys' fees and expert fees) arising from your content or your breach of these Terms.
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
              <Icon icon="mdi:alert-circle" style={{ marginRight: '8px', color: colors.accent }} />
              Disclaimer of Warranties
            </SectionTitle>
            <p style={{ color: colors.muted, lineHeight: '1.6' }}>
              The Service is provided on an "as is" and "as available" basis without warranties of any kind. gotchu.lol disclaims all express or implied warranties, including merchantability, fitness for a particular purpose, and non-infringement.
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

const ProhibitionsList = styled.ul`
  line-height: 1.8;
  
  li {
    margin-bottom: 12px;
  }
`

const ContactSection = styled.div``

export default TermsOfService