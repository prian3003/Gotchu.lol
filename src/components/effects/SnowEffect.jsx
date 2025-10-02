import React from 'react'
import styled, { keyframes } from 'styled-components'

// Snow fall animation
const fall = keyframes`
  0% { 
    transform: scale(0);
    top: -50px;
  }
  2% { 
    transform: scale(1);
    top: -50px;
  } 
  100% { 
    transform: scale(0);
    top: 100vh;
  }
`

// Generate snowflakes with random properties
const generateSnowflakes = (count = 100) => {
  const snowflakes = []
  
  for (let i = 0; i < count; i++) {
    // Random values for each snowflake
    const width = Math.random() * 10 + 1 // 1-11px
    const animationDuration = Math.random() * 20 + 10 // 10-30s
    const animationDelay = Math.random() * 10 + 1 // 1-11s
    const opacity = (Math.random() * 10 + 90) / 100 // 90-100% brightness
    
    snowflakes.push({
      id: i,
      left: `${(100 / count) * i}%`,
      width: `${width}px`,
      height: `${width}px`,
      animationDuration: `${animationDuration}s`,
      animationDelay: `${animationDelay}s`,
      background: `hsla(0, 0%, ${opacity * 100}%, 0.8)`,
      boxShadow: `0 0 15px 10px hsla(0, 0%, ${opacity * 100}%, 0.5)`
    })
  }
  
  return snowflakes
}

const SnowContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
`

const Snowflake = styled.div`
  border-radius: 50%;
  position: absolute;
  margin-top: -50px;
  animation: ${fall} ${props => props.duration} ${props => props.delay} infinite;
  width: ${props => props.width};
  height: ${props => props.height};
  left: ${props => props.left};
  background: ${props => props.background};
  box-shadow: ${props => props.boxShadow};
`

const SnowEffect = ({ 
  enabled = true, 
  intensity = 100, // Number of snowflakes (1-200)
  speed = 1 // Animation speed multiplier (0.5-2)
}) => {
  if (!enabled) return null

  // Clamp intensity between 1 and 200
  const clampedIntensity = Math.max(1, Math.min(200, intensity))
  
  const snowflakes = generateSnowflakes(clampedIntensity)

  return (
    <SnowContainer>
      {snowflakes.map((snowflake) => (
        <Snowflake
          key={snowflake.id}
          left={snowflake.left}
          width={snowflake.width}
          height={snowflake.height}
          duration={`${parseFloat(snowflake.animationDuration) / speed}s`}
          delay={snowflake.animationDelay}
          background={snowflake.background}
          boxShadow={snowflake.boxShadow}
        />
      ))}
    </SnowContainer>
  )
}

export default SnowEffect