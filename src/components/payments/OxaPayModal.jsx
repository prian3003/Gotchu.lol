import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { PaymentAPI } from '../../utils/api'
import CryptoCurrencySelector from './CryptoCurrencySelector'
import { HiXMark, HiSparkles, HiClock, HiCheckCircle, HiExclamationTriangle } from 'react-icons/hi2'
import { FaSpinner, FaCopy, FaExternalLinkAlt } from 'react-icons/fa'

const OxaPayModal = ({ isOpen, onClose }) => {
  const { colors } = useTheme()
  const { user, refreshUser } = useAuth()
  
  const [step, setStep] = useState('select') // select, processing, success, error
  const [selectedCurrency, setSelectedCurrency] = useState('USDT')
  const [paymentData, setPaymentData] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [copied, setCopied] = useState(false)

  // Lifetime plan details
  const plan = {
    id: 'premium_lifetime',
    name: 'Premium Lifetime',
    price: 5.00,
    originalPrice: 49.99,
    currency: 'USD',
    features: [
      'Lifetime premium access',
      'Unlimited profile views',
      'Advanced analytics (30 days)',
      'Priority support',
      'Custom themes',
      'No branding',
      'All future premium features'
    ]
  }

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('select')
      setPaymentData(null)
      setPaymentStatus('pending')
      setError('')
      setTimeRemaining(null)
    }
  }, [isOpen])

  // Timer countdown
  useEffect(() => {
    if (paymentData && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setStep('error')
            setError('Payment expired. Please try again.')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [paymentData, timeRemaining])

  // Poll payment status
  useEffect(() => {
    if (paymentData && paymentStatus === 'pending') {
      const interval = setInterval(async () => {
        try {
          const response = await PaymentAPI.getPaymentStatus(paymentData.payment_id)
          const data = await response.json()
          
          if (data.success && data.data.status !== 'pending') {
            setPaymentStatus(data.data.status)
            
            if (data.data.status === 'completed') {
              setStep('success')
              await refreshUser() // Refresh user data to update premium status
            } else if (data.data.status === 'expired' || data.data.status === 'cancelled') {
              setStep('error')
              setError('Payment was not completed in time.')
            }
          }
        } catch (err) {
          console.error('Error checking payment status:', err)
        }
      }, 3000)
      
      return () => clearInterval(interval)
    }
  }, [paymentData, paymentStatus, refreshUser])

  const createPayment = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await PaymentAPI.createPayment(plan.id, selectedCurrency)
      const data = await response.json()
      
      if (data.success) {
        setPaymentData(data.data)
        setTimeRemaining(1800) // 30 minutes in seconds
        setStep('processing')
      } else {
        setError(data.message || 'Failed to create payment')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  if (!isOpen) return null

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()} colors={colors}>
        <ModalHeader>
          <HeaderContent>
            <PremiumBadge>
              <HiSparkles />
              PREMIUM LIFETIME
            </PremiumBadge>
            <CloseButton onClick={onClose}>
              <HiXMark />
            </CloseButton>
          </HeaderContent>
        </ModalHeader>

        <ModalBody>
          {step === 'select' && (
            <SelectStep>
              <PlanCard colors={colors}>
                <PlanHeader>
                  <PlanName>{plan.name}</PlanName>
                  <PriceSection>
                    <CurrentPrice>{formatCurrency(plan.price, plan.currency)}</CurrentPrice>
                    <OriginalPrice>{formatCurrency(plan.originalPrice, plan.currency)}</OriginalPrice>
                    <Discount>90% OFF</Discount>
                  </PriceSection>
                </PlanHeader>
                
                <FeaturesList>
                  {plan.features.map((feature, index) => (
                    <FeatureItem key={index}>
                      <HiCheckCircle />
                      {feature}
                    </FeatureItem>
                  ))}
                </FeaturesList>
              </PlanCard>

              <PaymentSection>
                <SectionTitle>Select Cryptocurrency</SectionTitle>
                <CryptoCurrencySelector
                  selectedCurrency={selectedCurrency}
                  onCurrencySelect={setSelectedCurrency}
                  placeholder="Choose your preferred crypto"
                />
                
                {error && <ErrorMessage>{error}</ErrorMessage>}
                
                <PayButton 
                  onClick={createPayment} 
                  disabled={!selectedCurrency || isLoading}
                  colors={colors}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Creating Payment...
                    </>
                  ) : (
                    <>
                      Pay {formatCurrency(plan.price, plan.currency)} with {selectedCurrency?.toUpperCase()}
                    </>
                  )}
                </PayButton>
              </PaymentSection>
            </SelectStep>
          )}

          {step === 'processing' && paymentData && (
            <ProcessingStep>
              <PaymentInfo colors={colors}>
                <InfoHeader>
                  <HiClock />
                  <InfoTitle>Payment Processing</InfoTitle>
                  {timeRemaining && (
                    <Timer colors={colors}>
                      Expires in {formatTime(timeRemaining)}
                    </Timer>
                  )}
                </InfoHeader>
                
                <PaymentDetails>
                  <DetailRow>
                    <DetailLabel>Amount:</DetailLabel>
                    <DetailValue>{paymentData.amount} {paymentData.currency}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Payment ID:</DetailLabel>
                    <DetailValue>#{paymentData.track_id}</DetailValue>
                  </DetailRow>
                </PaymentDetails>

                <PaymentActions>
                  <ActionButton 
                    onClick={() => window.open(paymentData.pay_url, '_blank')}
                    colors={colors}
                  >
                    <FaExternalLinkAlt />
                    Open Payment Page
                  </ActionButton>
                  
                  <CopyButton 
                    onClick={() => copyToClipboard(paymentData.pay_url)}
                    colors={colors}
                  >
                    <FaCopy />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </CopyButton>
                </PaymentActions>

                <StatusIndicator>
                  <FaSpinner className="animate-spin" />
                  Waiting for payment confirmation...
                </StatusIndicator>
              </PaymentInfo>
            </ProcessingStep>
          )}

          {step === 'success' && (
            <SuccessStep>
              <SuccessIcon colors={colors}>
                <HiCheckCircle />
              </SuccessIcon>
              <SuccessTitle>Payment Successful!</SuccessTitle>
              <SuccessMessage>
                Congratulations! You now have lifetime premium access to all features.
              </SuccessMessage>
              <SuccessButton onClick={onClose} colors={colors}>
                Continue to Dashboard
              </SuccessButton>
            </SuccessStep>
          )}

          {step === 'error' && (
            <ErrorStep>
              <ErrorIcon colors={colors}>
                <HiExclamationTriangle />
              </ErrorIcon>
              <ErrorTitle>Payment Issue</ErrorTitle>
              <ErrorMessage>{error}</ErrorMessage>
              <ErrorActions>
                <RetryButton 
                  onClick={() => setStep('select')} 
                  colors={colors}
                >
                  Try Again
                </RetryButton>
                <CancelButton onClick={onClose}>
                  Close
                </CancelButton>
              </ErrorActions>
            </ErrorStep>
          )}
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  )
}

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`

const ModalContainer = styled.div`
  background: ${props => props.colors.surface};
  border: 1px solid ${props => props.colors.border};
  border-radius: 20px;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
`

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(88, 164, 176, 0.2);
`

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const PremiumBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(45deg, #58A4B0, #4A90A4);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }
`

const ModalBody = styled.div`
  padding: 1.5rem;
`

const SelectStep = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const PlanCard = styled.div`
  background: rgba(88, 164, 176, 0.1);
  border: 1px solid rgba(88, 164, 176, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
`

const PlanHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`

const PlanName = styled.h3`
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
`

const PriceSection = styled.div`
  text-align: right;
`

const CurrentPrice = styled.div`
  color: #58A4B0;
  font-size: 1.5rem;
  font-weight: 700;
`

const OriginalPrice = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  text-decoration: line-through;
`

const Discount = styled.div`
  color: #22c55e;
  font-size: 0.8rem;
  font-weight: 600;
`

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  
  svg {
    color: #22c55e;
    font-size: 1rem;
  }
`

const PaymentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const SectionTitle = styled.h4`
  color: white;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
`

const PayButton = styled.button`
  background: linear-gradient(45deg, #58A4B0, #4A90A4);
  border: none;
  border-radius: 12px;
  padding: 0.875rem 1.5rem;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(88, 164, 176, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`

const ProcessingStep = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const PaymentInfo = styled.div`
  background: rgba(88, 164, 176, 0.1);
  border: 1px solid rgba(88, 164, 176, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
`

const InfoHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  
  svg {
    color: #58A4B0;
    font-size: 1.2rem;
  }
`

const InfoTitle = styled.h3`
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
  margin-left: 0.5rem;
`

const Timer = styled.div`
  background: ${props => props.colors.background};
  color: #58A4B0;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-family: monospace;
  font-size: 0.9rem;
  font-weight: 600;
`

const PaymentDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const DetailLabel = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
`

const DetailValue = styled.span`
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
`

const PaymentActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const ActionButton = styled.button`
  flex: 1;
  background: ${props => props.colors.accent};
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`

const CopyButton = styled(ActionButton)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  padding: 1rem;
  text-align: center;
  
  svg {
    color: #58A4B0;
  }
`

const SuccessStep = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 1rem 0;
`

const SuccessIcon = styled.div`
  color: #22c55e;
  font-size: 4rem;
`

const SuccessTitle = styled.h3`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`

const SuccessMessage = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
`

const SuccessButton = styled.button`
  background: linear-gradient(45deg, #22c55e, #16a34a);
  border: none;
  border-radius: 12px;
  padding: 0.875rem 2rem;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
  }
`

const ErrorStep = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 1rem 0;
`

const ErrorIcon = styled.div`
  color: #ef4444;
  font-size: 4rem;
`

const ErrorTitle = styled.h3`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`

const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: 1rem;
  margin: 0.5rem 0;
  text-align: center;
`

const ErrorActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`

const RetryButton = styled.button`
  background: ${props => props.colors.accent};
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.5rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`

const CancelButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.5rem 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`

export default OxaPayModal