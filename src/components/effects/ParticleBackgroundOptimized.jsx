import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

const ParticleBackgroundOptimized = () => {
  const { isDarkMode } = useTheme()
  const [isLoaded, setIsLoaded] = useState(false)

  // Defer particle creation until after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 1500) // Delay particles until LCP is done

    return () => clearTimeout(timer)
  }, [])

  if (!isLoaded) {
    return null // No particles during critical loading phase
  }

  // Simplified particles - fewer and more efficient
  const particleCount = 8 // Reduced from 30 to 8
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    size: 6 + (i % 3), // Fixed sizes: 6, 7, 8px
    x: (i * 12.5) % 100, // Evenly distributed
    delay: i * 2, // Staggered animation
  }))

  return (
    <>
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-30">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute particle-float"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.x}%`,
              top: '100%',
              animationDelay: `${particle.delay}s`,
              willChange: 'transform', // Optimize for transforms
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(169, 204, 62, 0.1)',
                filter: 'blur(1px)',
              }}
            />
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .particle-float {
          animation: floatUp 20s linear infinite;
        }
        
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}

export default ParticleBackgroundOptimized