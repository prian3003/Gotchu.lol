import React, { useState, useEffect, useRef } from 'react'
import ParticleBackgroundNeutral from './ParticleBackgroundNeutral'
import ShinyText from './ShinyText'
import { useTheme } from '../contexts/ThemeContext'

const timelineData = [
  {
    id: "1",
    year: "2024",
    title: "Digital Innovation",
    subtitle: "Future-Forward Solutions",
    description: "Leading breakthrough projects in AI-powered design solutions and immersive web experiences that define the next generation of digital interaction.",
    icon: "🚀"
  },
  {
    id: "2", 
    year: "2023",
    title: "Creative Excellence",
    subtitle: "Award-Winning Design",
    description: "Established award-winning design studio specializing in luxury brand transformations and innovative visual storytelling.",
    icon: "🎨"
  },
  {
    id: "3",
    year: "2022",
    title: "Technical Mastery",
    subtitle: "Development Innovation",
    description: "Pioneered cutting-edge development frameworks for next-generation digital products and scalable web applications.",
    icon: "⚡"
  },
  {
    id: "4",
    year: "2021",
    title: "Global Recognition",
    subtitle: "International Acclaim",
    description: "Received international recognition for innovative portfolio showcasing creative excellence and technical achievement.",
    icon: "🌟"
  }
]

const Timeline = () => {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [progressHeight, setProgressHeight] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const timelineRef = useRef(null)
  const timelineItemRefs = useRef([])
  const { colors, isDarkMode } = useTheme()

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!timelineRef.current) return

          const timelineRect = timelineRef.current.getBoundingClientRect()
          const viewportHeight = window.innerHeight
          const timelineTop = timelineRect.top
          const timelineHeight = timelineRect.height

          // Enhanced progress calculation
          const progress = Math.max(0, Math.min(1, (viewportHeight - timelineTop) / (viewportHeight + timelineHeight)))
          setScrollProgress(progress)
          setProgressHeight(progress * 100)

          // Calculate active index with smooth transitions
          const newActiveIndex = Math.floor(progress * timelineData.length)
          if (newActiveIndex !== activeIndex && newActiveIndex >= -1 && newActiveIndex < timelineData.length) {
            setActiveIndex(newActiveIndex)
          }

          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call

    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeIndex])

  // Enhanced card reveal with staggered animations
  const getCardAnimation = (index) => {
    const isActive = index <= activeIndex
    const baseDelay = index * 0.1

    return {
      opacity: isActive ? 1 : 0.3,
      transform: isActive 
        ? 'translateY(0px) scale(1)' 
        : 'translateY(20px) scale(0.95)',
      transition: `all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${baseDelay}s`
    }
  }

  // Enhanced node animation
  const getNodeAnimation = (index) => {
    const isActive = index <= activeIndex
    return {
      transform: isActive ? 'scale(1.2)' : 'scale(1)',
      boxShadow: isActive 
        ? '0 0 20px rgba(99,102,241,0.8), 0 0 40px rgba(168,85,247,0.4)'
        : '0 0 0px rgba(99,102,241,0)',
      borderColor: isActive ? '#22d3ee' : 'rgba(255,255,255,0.3)',
      transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
  }

  return (
    <section ref={timelineRef} className="relative min-h-screen overflow-hidden" style={{background: colors.background}}>
      {/* Particle Background */}
      <ParticleBackgroundNeutral />
      
      {/* Large Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-165">
        <ShinyText
          size="4xl"
          weight="extrabold"
          speed={4}
          baseColor={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(19, 21, 21, 0.08)"}
          shineColor={isDarkMode ? "rgba(169, 204, 62, 0.3)" : "rgba(169, 204, 62, 0.4)"}
          intensity={1}
          direction="left-to-right"
          shineWidth={30}
          repeat="infinite"
          className="text-[18vw] dm-serif-text-regular tracking-tight leading-none select-none uppercase"
        >
          journey
        </ShinyText>
      </div>
      
      {/* Content */}
      <div className="relative z-10 px-4 py-16">

        {/* Modern Timeline Container */}
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="relative">
            {/* Clean Timeline Line */}
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 w-px h-full"
              style={{
                background: isDarkMode 
                  ? 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), rgba(255,255,255,0.2), rgba(255,255,255,0.1), transparent)'
                  : 'linear-gradient(to bottom, transparent, rgba(19,21,21,0.1), rgba(19,21,21,0.2), rgba(19,21,21,0.1), transparent)'
              }}
            ></div>
            
            {/* Progress Line */}
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 z-10 transition-all duration-700 ease-out"
              style={{
                width: '1px',
                height: `${progressHeight}%`,
                background: 'linear-gradient(to bottom, #A9CC3E, #22d3ee)',
                boxShadow: '0 0 8px rgba(169, 204, 62, 0.4)'
              }}
            ></div>

            {/* Minimalist Progress Indicator */}
            <div 
              className="absolute z-20 transition-all duration-700 ease-out"
              style={{
                left: '50%',
                top: `${progressHeight}%`,
                transform: 'translateX(-50%) translateY(-50%)',
              }}
            >
              <div 
                className="w-3 h-3 rounded-full border-2"
                style={{
                  background: '#A9CC3E',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(19,21,21,0.1)',
                  boxShadow: '0 0 12px rgba(169, 204, 62, 0.6), 0 0 24px rgba(169, 204, 62, 0.3)',
                  animation: 'gentle-pulse 2s ease-in-out infinite'
                }}
              ></div>
            </div>

            {/* Enhanced Timeline Items */}
            <div className="relative z-20">
              {timelineData.map((event, index) => {
                const isLeft = index % 2 === 0
                
                return (
                  <div
                    key={event.id}
                    ref={el => timelineItemRefs.current[index] = el}
                    className={`relative flex items-center mb-20 py-4 flex-col lg:flex-row ${
                      isLeft 
                        ? 'lg:justify-start' 
                        : 'lg:flex-row-reverse lg:justify-start'
                    }`}
                  >
                    {/* Clean Timeline Node */}
                    <div className="absolute top-1/2 transform -translate-y-1/2 z-30 left-1/2 -translate-x-1/2">
                      <div 
                        className="w-4 h-4 rounded-full border-2 transition-all duration-500 ease-out"
                        style={{
                          background: index <= activeIndex ? '#A9CC3E' : 'transparent',
                          borderColor: index <= activeIndex ? '#A9CC3E' : (isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(19,21,21,0.3)'),
                          boxShadow: index <= activeIndex 
                            ? '0 0 16px rgba(169, 204, 62, 0.6), 0 0 32px rgba(169, 204, 62, 0.3)'
                            : 'none',
                          transform: index <= activeIndex ? 'scale(1.3)' : 'scale(1)',
                        }}
                      ></div>
                    </div>

                    {/* Modern Timeline Card */}
                    <div 
                      className={`w-full lg:w-[calc(50%-40px)] mt-8 lg:mt-0 ${
                        isLeft 
                          ? 'lg:mr-[calc(50%+20px)]' 
                          : 'lg:ml-[calc(50%+20px)]'
                      }`}
                      style={getCardAnimation(index)}
                    >
                      <div 
                        className="group relative p-8 transition-all duration-700 ease-out"
                        style={{
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(19,21,21,0.03)',
                          borderLeft: index <= activeIndex 
                            ? `3px solid #A9CC3E` 
                            : `3px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(19,21,21,0.1)'}`,
                          borderRadius: '0 8px 8px 0',
                          backdropFilter: 'blur(10px)',
                          transform: index <= activeIndex ? 'translateX(8px)' : 'translateX(0)'
                        }}
                      >
                        {/* Year Badge */}
                        <div className="flex items-center mb-6">
                          <div 
                            className="px-4 py-1 rounded-full text-sm font-medium transition-all duration-500"
                            style={{
                              background: index <= activeIndex 
                                ? 'linear-gradient(135deg, #A9CC3E, #22d3ee)' 
                                : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(19,21,21,0.1)',
                              color: index <= activeIndex ? '#000' : (isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(19,21,21,0.6)')
                            }}
                          >
                            {event.year}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div>
                          <h3 
                            className="text-2xl font-bold mb-3 leading-tight transition-colors duration-500"
                            style={{
                              color: index <= activeIndex ? colors.text : (isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(19,21,21,0.7)')
                            }}
                          >
                            {event.title}
                          </h3>
                          
                          {event.subtitle && (
                            <p 
                              className="font-medium mb-4 text-lg"
                              style={{
                                color: index <= activeIndex ? '#A9CC3E' : (isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(19,21,21,0.5)')
                              }}
                            >
                              {event.subtitle}
                            </p>
                          )}
                          
                          <p 
                            className="leading-relaxed text-base"
                            style={{
                              color: index <= activeIndex ? colors.textSecondary : (isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(19,21,21,0.4)')
                            }}
                          >
                            {event.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modern CSS Animations */}
      <style jsx>{`
        @keyframes gentle-pulse {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Smooth hover effects */
        .group:hover {
          transform: translateX(12px) !important;
        }
      `}</style>
    </section>
  )
}

export default Timeline