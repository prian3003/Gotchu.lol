import React from 'react'
import Hero from './Hero'
import Work from './Work'
import ScrollStack from './ScrollStack'
import Timeline from './Timeline'
import ContactUs from './ContactUs'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { scrollStackCards } from '../data/scrollStackData'
import { useTheme } from '../contexts/ThemeContext'

const Home = () => {
  const { colors } = useTheme()
  
  useScrollReveal()

  return (
    <div style={{ background: colors.background, minHeight: '100vh' }}>
      {/* CustomCursor moved to App.jsx for global positioning */}
      <div className="pt-24">
        <Hero />
        <Work />
        <ScrollStack 
          cards={scrollStackCards}
          backgroundColor={colors.background}
          cardHeight="70vh"
          sectionHeightMultiplier={4}
        />
        <Timeline />
        <ContactUs />
      </div>
    </div>
  )
}

export default Home