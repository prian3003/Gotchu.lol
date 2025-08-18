import React, { lazy } from 'react'
import Hero from '../sections/Hero'
import LazySection from '../ui/LazySection'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { useTheme } from '../../contexts/ThemeContext'
import { scrollStackCards } from '../../data/scrollStackData'

// Lazy load non-critical sections for better LCP
const Work = lazy(() => import('../sections/Work'))
const ScrollStack = lazy(() => import('../sections/ScrollStack'))
const Timeline = lazy(() => import('../sections/Timeline'))
const ContactUs = lazy(() => import('../sections/ContactUs'))

const Home = () => {
  const { colors } = useTheme()
  
  useScrollReveal()

  return (
    <div style={{ background: colors.background, minHeight: '100vh' }}>
      <div className="pt-24">
        {/* Hero loads immediately for better LCP */}
        <Hero />
        
        {/* Lazy load sections below the fold */}
        <LazySection minHeight="400px">
          <Work />
        </LazySection>
        
        <LazySection minHeight="800px">
          <ScrollStack 
            cards={scrollStackCards}
            backgroundColor={colors.background}
            cardHeight="70vh"
            sectionHeightMultiplier={4}
          />
        </LazySection>
        
        <LazySection minHeight="600px">
          <Timeline />
        </LazySection>
        
        <LazySection minHeight="400px">
          <ContactUs />
        </LazySection>
      </div>
    </div>
  )
}

export default Home