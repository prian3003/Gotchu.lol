import React from 'react'
import Hero from '../sections/Hero'
import Work from '../sections/Work'
import ScrollStack from '../sections/ScrollStack'
import Timeline from '../sections/Timeline'
import ContactUs from '../sections/ContactUs'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { scrollStackCards } from '../../data/scrollStackData'
import { useTheme } from '../../contexts/ThemeContext'

const Home = () => {
  const { colors } = useTheme()
  
  useScrollReveal()

  return (
    <div style={{ background: colors.background, minHeight: '100vh' }}>
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