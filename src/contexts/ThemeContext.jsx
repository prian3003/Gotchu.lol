import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  // Default to dark mode (current theme)
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }
  }, [])

  // Save theme to localStorage when changed
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    
    // Apply theme to document root
    if (isDarkMode) {
      document.documentElement.classList.remove('light-mode')
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
      document.documentElement.classList.add('light-mode')
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev)
  }

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode ? {
      // Dark Mode (Current Theme)
      background: '#131515',
      text: '#ffffff',
      textSecondary: '#ffffff80',
      accent: '#A9CC3E',
      accentHover: '#A9CC3E',
      border: '#ffffff20',
      cardBg: '#ffffff',
      cardText: '#000000',
      particle: '#ffffff',
      scrollbarThumb: 'rgba(169, 204, 62, 0.8)',
      scrollbarTrack: '#131515',
      modalBg: '#131515',
      modalText: '#ffffff',
      buttonBg: '#0f1923',
      buttonText: '#ffffff',
      buttonHover: '#A9CC3E'
    } : {
      // Light Mode
      background: '#ffffff',
      text: '#131515', // Dark text for readability on light background
      textSecondary: '#13151580',
      accent: '#A9CC3E', // Accent remains green for hover effects
      accentHover: '#8fb532',
      border: '#A9CC3E20',
      cardBg: '#131515', // Cards become dark
      cardText: '#ffffff', // Card text becomes white
      particle: '#A9CC3E',
      scrollbarThumb: 'rgba(169, 204, 62, 0.8)',
      scrollbarTrack: '#ffffff',
      modalBg: '#ffffff',
      modalText: '#131515', // Dark text for readability
      buttonBg: '#A9CC3E',
      buttonText: '#ffffff',
      buttonHover: '#8fb532'
    }
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}