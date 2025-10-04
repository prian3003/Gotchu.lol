import React from 'react'
import styled, { keyframes } from 'styled-components'

const Loading = ({
  variant = 'spinner',
  size = 'medium',
  color = '#58A4B0',
  text,
  fullscreen = false,
  overlay = false,
  className,
  ...props
}) => {
  const LoadingComponent = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader size={size} color={color} />
      case 'pulse':
        return <PulseLoader size={size} color={color} />
      case 'bars':
        return <BarsLoader size={size} color={color} />
      case 'ring':
        return <RingLoader size={size} color={color} />
      case 'wave':
        return <WaveLoader size={size} color={color} />
      case 'spinner':
      default:
        return <SpinnerLoader size={size} color={color} />
    }
  }

  const content = (
    <LoadingContainer 
      $fullscreen={fullscreen} 
      $overlay={overlay} 
      className={className}
      {...props}
    >
      <LoadingContent>
        <LoadingComponent />
        {text && <LoadingText>{text}</LoadingText>}
      </LoadingContent>
    </LoadingContainer>
  )

  return content
}

// Spinner loader
const SpinnerLoader = ({ size, color }) => (
  <SpinnerContainer size={size}>
    <Spinner color={color} />
  </SpinnerContainer>
)

// Dots loader
const DotsLoader = ({ size, color }) => (
  <DotsContainer size={size}>
    <Dot color={color} delay="0s" />
    <Dot color={color} delay="0.2s" />
    <Dot color={color} delay="0.4s" />
  </DotsContainer>
)

// Pulse loader
const PulseLoader = ({ size, color }) => (
  <PulseContainer size={size}>
    <PulseCircle color={color} />
  </PulseContainer>
)

// Bars loader
const BarsLoader = ({ size, color }) => (
  <BarsContainer size={size}>
    <Bar color={color} delay="0s" />
    <Bar color={color} delay="0.1s" />
    <Bar color={color} delay="0.2s" />
    <Bar color={color} delay="0.3s" />
    <Bar color={color} delay="0.4s" />
  </BarsContainer>
)

// Ring loader
const RingLoader = ({ size, color }) => (
  <RingContainer size={size}>
    <Ring color={color} />
  </RingContainer>
)

// Wave loader
const WaveLoader = ({ size, color }) => (
  <WaveContainer size={size}>
    <Wave color={color} delay="0s" />
    <Wave color={color} delay="0.1s" />
    <Wave color={color} delay="0.2s" />
    <Wave color={color} delay="0.3s" />
    <Wave color={color} delay="0.4s" />
  </WaveContainer>
)

// Specialized loading components
export const ButtonLoading = ({ size = 'small', color = 'currentColor' }) => (
  <Loading variant="spinner" size={size} color={color} />
)

export const PageLoading = ({ text = 'Loading...' }) => (
  <Loading variant="spinner" size="large" text={text} fullscreen />
)

export const SectionLoading = ({ text, variant = 'spinner' }) => (
  <Loading variant={variant} size="medium" text={text} />
)

export const OverlayLoading = ({ text = 'Loading...', variant = 'spinner' }) => (
  <Loading variant={variant} size="large" text={text} overlay />
)

// Animations
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const bounce = keyframes`
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
`

const pulse = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
`

const bars = keyframes`
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
`

const wave = keyframes`
  0%, 60%, 100% {
    transform: initial;
  }
  30% {
    transform: translateY(-8px);
  }
`

// Styled components
const LoadingContainer = styled.div`
  ${props => props.fullscreen && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(4px);
    z-index: 9999;
  `}
  
  ${props => props.overlay && `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(2px);
    z-index: 999;
  `}
  
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: ${props => props.fullscreen || props.overlay ? 'auto' : '100px'};
`

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`

const LoadingText = styled.div`
  font-size: 0.875rem;
  color: #a0a0a0;
  font-weight: 500;
  text-align: center;
`

// Spinner components
const SpinnerContainer = styled.div`
  ${props => {
    switch (props.size) {
      case 'small':
        return 'width: 20px; height: 20px;'
      case 'large':
        return 'width: 48px; height: 48px;'
      case 'medium':
      default:
        return 'width: 32px; height: 32px;'
    }
  }}
`

const Spinner = styled.div`
  width: 100%;
  height: 100%;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid ${props => props.color};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`

// Dots components
const DotsContainer = styled.div`
  display: flex;
  gap: ${props => props.size === 'small' ? '4px' : props.size === 'large' ? '8px' : '6px'};
  align-items: center;
`

const Dot = styled.div`
  ${props => {
    switch (props.size) {
      case 'small':
        return 'width: 6px; height: 6px;'
      case 'large':
        return 'width: 12px; height: 12px;'
      default:
        return 'width: 8px; height: 8px;'
    }
  }}
  background: ${props => props.color};
  border-radius: 50%;
  animation: ${bounce} 1.4s ease-in-out infinite both;
  animation-delay: ${props => props.delay};
`

// Pulse components
const PulseContainer = styled.div`
  position: relative;
  ${props => {
    switch (props.size) {
      case 'small':
        return 'width: 24px; height: 24px;'
      case 'large':
        return 'width: 64px; height: 64px;'
      case 'medium':
      default:
        return 'width: 40px; height: 40px;'
    }
  }}
`

const PulseCircle = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${props => props.color};
  animation: ${pulse} 1.5s ease-in-out infinite;
`

// Bars components
const BarsContainer = styled.div`
  display: flex;
  gap: ${props => props.size === 'small' ? '2px' : props.size === 'large' ? '4px' : '3px'};
  align-items: center;
  height: ${props => props.size === 'small' ? '20px' : props.size === 'large' ? '40px' : '30px'};
`

const Bar = styled.div`
  width: ${props => props.size === 'small' ? '3px' : props.size === 'large' ? '6px' : '4px'};
  height: 100%;
  background: ${props => props.color};
  animation: ${bars} 1.2s infinite ease-in-out;
  animation-delay: ${props => props.delay};
`

// Ring components
const RingContainer = styled.div`
  ${props => {
    switch (props.size) {
      case 'small':
        return 'width: 24px; height: 24px;'
      case 'large':
        return 'width: 60px; height: 60px;'
      case 'medium':
      default:
        return 'width: 40px; height: 40px;'
    }
  }}
`

const Ring = styled.div`
  width: 100%;
  height: 100%;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left: 4px solid ${props => props.color};
  border-radius: 50%;
  animation: ${spin} 1.2s linear infinite;
`

// Wave components
const WaveContainer = styled.div`
  display: flex;
  gap: ${props => props.size === 'small' ? '2px' : props.size === 'large' ? '4px' : '3px'};
  align-items: end;
  height: ${props => props.size === 'small' ? '20px' : props.size === 'large' ? '40px' : '30px'};
`

const Wave = styled.div`
  width: ${props => props.size === 'small' ? '3px' : props.size === 'large' ? '5px' : '4px'};
  height: 100%;
  background: ${props => props.color};
  border-radius: 2px;
  animation: ${wave} 1.2s ease-in-out infinite;
  animation-delay: ${props => props.delay};
`

export default Loading