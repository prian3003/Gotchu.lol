import React from 'react'
import styled from 'styled-components'
import { useTheme } from '../../contexts/ThemeContext'
import { HiXMark, HiSparkles } from 'react-icons/hi2'
import { FaGift } from 'react-icons/fa'

const PremiumModal = ({ isOpen, onClose }) => {
  const { colors } = useTheme()

  if (!isOpen) return null

  const features = [
    'Exclusive Badge',
    'Profile Layouts', 
    'Custom Fonts',
    'Typewriter Animation',
    'Special Profile Effects',
    'Advanced Customization',
    'Metadata & SEO Customization'
  ]

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <HiXMark />
        </CloseButton>
        
        <ModalHeader>
          <HeaderTitle>Upgrade to Premium</HeaderTitle>
        </ModalHeader>

        <PremiumSection>
          <PremiumIcon>
            <HiSparkles />
          </PremiumIcon>
          <PremiumTitle>Premium</PremiumTitle>
          
          <PriceSection>
            <Price>6,99€</Price>
            <PriceSubtext>/Lifetime</PriceSubtext>
          </PriceSection>
          
          <PayOnceText>Pay once. Keep it forever.</PayOnceText>
          
          <Description>
            The perfect plan to discover your creativity & unlock more features.
          </Description>
        </PremiumSection>

        <FeaturesSection>
          {features.map((feature, index) => (
            <FeatureItem key={index}>
              <FeatureCheck>✓</FeatureCheck>
              <FeatureText>{feature}</FeatureText>
            </FeatureItem>
          ))}
        </FeaturesSection>

        <ActionSection>
          <PurchaseButton>
            Purchase
          </PurchaseButton>
          <GiftButton>
            <FaGift />
          </GiftButton>
        </ActionSection>

        <LearnMoreText>
          Learn more at <LearnMoreLink href="/pricing" target="_blank" rel="noopener noreferrer">
            gotchu.lol/pricing
          </LearnMoreLink>
        </LearnMoreText>
      </ModalContent>
    </ModalOverlay>
  )
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
`

const ModalContent = styled.div`
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 380px;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(88, 164, 176, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
`

const CloseButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`

const ModalHeader = styled.div`
  text-align: left;
  margin-bottom: 1.25rem;
`

const HeaderTitle = styled.h2`
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`

const PremiumSection = styled.div`
  text-align: left;
  margin-bottom: 1.5rem;
`

const PremiumIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #58A4B0, #4A8C96);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  margin-bottom: 0.75rem;
`

const PremiumTitle = styled.h3`
  color: #ffffff;
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
`

const PriceSection = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
`

const Price = styled.span`
  color: #ffffff;
  font-size: 2.5rem;
  font-weight: 800;
`

const PriceSubtext = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  font-weight: 400;
`

const PayOnceText = styled.p`
  color: #58A4B0;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`

const Description = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
`

const FeaturesSection = styled.div`
  margin-bottom: 1.5rem;
`

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`

const FeatureCheck = styled.div`
  width: 20px;
  height: 20px;
  background: #58A4B0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
`

const FeatureText = styled.span`
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 500;
`

const ActionSection = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
`

const PurchaseButton = styled.button`
  flex: 1;
  background: linear-gradient(135deg, #58A4B0, #4A8C96);
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(88, 164, 176, 0.3);
  }
`

const GiftButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(88, 164, 176, 0.3);
  border-radius: 12px;
  padding: 0.75rem;
  color: #58A4B0;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(88, 164, 176, 0.1);
    border-color: #58A4B0;
    transform: translateY(-2px);
  }
`

const LearnMoreText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  text-align: center;
  margin: 0;
`

const LearnMoreLink = styled.a`
  color: #58A4B0;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`

export default PremiumModal