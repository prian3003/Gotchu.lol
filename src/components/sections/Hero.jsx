import React from 'react'
import ParticleBackground from '../effects/ParticleBackground'
import { useTheme } from '../../contexts/ThemeContext'

const Hero = () => {
  const { colors, isDarkMode } = useTheme()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Theme-aware Gradient Background */}
      <div className="absolute inset-0" style={{
        background: isDarkMode 
          ? "radial-gradient(circle at center, #1a1a1a 0%, #131515 100%)"
          : "radial-gradient(circle at center, #f8f8f8 0%, #ffffff 100%)"
      }}></div>
      
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Theme-aware dot pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent bg-repeat" 
             style={{
               backgroundImage: isDarkMode 
                 ? "radial-gradient(circle at 2px 2px, rgba(156, 146, 172, 0.1) 1px, transparent 0)"
                 : "radial-gradient(circle at 2px 2px, rgba(169, 204, 62, 0.1) 1px, transparent 0)",
               backgroundSize: "60px 60px"
             }}></div>
      </div>
      
      <div className="relative z-10 text-center px-6 w-full max-w-none mx-auto">
        <div className="mb-8 animate-fade-in">
          <div className="dm-serif-text-regular text-3xl md:text-6xl lg:text-7xl xl:text-8xl font-bold w-full mx-auto leading-tight">
            <div className="typewriter-line-1 mb-4">
              Creative studio crafting digital excellence.
            </div>
            <div className="typewriter-line-2">
              Transforming visions into award-
            </div>
            <div className="typewriter-line-3">
              winning experiences.
            </div>
          </div>
        </div>
        
        
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textSecondary }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  )
}

export default Hero