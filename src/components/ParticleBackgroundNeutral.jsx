import React, { useMemo } from 'react'

const ParticleBackgroundNeutral = () => {
  // Generate particles with random properties
  const particles = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      size: Math.random() * 8 + 4, // 4-12px
      startX: Math.random() * 100, // 0-100vw
      startY: Math.random() * 20 + 100, // 100-120vh
      endX: Math.random() * 100, // 0-100vw
      endY: -(Math.random() * 50 + 100), // -100 to -150vh
      duration: Math.random() * 15 + 10, // 10-25s
      delay: Math.random() * 10, // 0-10s
      fadeDelay: Math.random() * 3, // 0-3s
    }))
  }, [])

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-float"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            '--start-x': `${particle.startX}vw`,
            '--start-y': `${particle.startY}vh`,
            '--end-x': `${particle.endX}vw`,
            '--end-y': `${particle.endY}vh`,
            '--duration': `${particle.duration}s`,
            '--delay': `${particle.delay}s`,
            '--fade-delay': `${particle.fadeDelay}s`,
            animation: `float var(--duration) linear infinite var(--delay)`,
          }}
        >
          <div
            className="w-full h-full rounded-full animate-pulse-scale"
            style={{
              background: `radial-gradient(
                circle,
                rgba(255, 255, 255, 0.1) 0%,
                rgba(255, 255, 255, 0.05) 30%,
                rgba(255, 255, 255, 0.02) 60%,
                transparent 100%
              )`,
              mixBlendMode: 'screen',
              animationDelay: `var(--fade-delay)`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

export default ParticleBackgroundNeutral