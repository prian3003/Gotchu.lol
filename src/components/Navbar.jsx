import React, { useState } from 'react'
import StartButton from './StartButton'
import StartMenuOverlay from './StartMenuOverlay'
import ParticleBackground from './ParticleBackground'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isDarkMode, toggleTheme, colors } = useTheme()

  const menuItems = [
    { label: "Work", href: "#work" },
    { label: "Process", href: "#process" },
    { label: "Services", href: "#services" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" }
  ]

  const handleStartClick = () => {
    setIsMenuOpen(true)
  }

  const handleCloseMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-24" style={{ zIndex: 1000 }}>
        {/* Background with theme support */}
        <div className="absolute inset-0" style={{
          background: isDarkMode 
            ? "radial-gradient(circle at center, #1a1a1a 0%, #131515 100%)"
            : "radial-gradient(circle at center, #f8f8f8 0%, #ffffff 100%)"
        }}></div>
        
        {/* Particle Background */}
        <ParticleBackground />
        
        {/* Navbar Content */}
        <nav className="relative z-10 h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Left - Logo */}
          <div className="flex items-baseline">
            <span className="text-3xl font-bold" style={{ color: colors.text }}>eamagine</span>
            <span className="text-xl font-light ml-1 relative top-[-2px]" style={{ color: colors.accent }}>labs</span>
          </div>
          
          {/* Center - Navigation Links */}
          <div className="hidden md:flex items-center space-x-10">
            <a href="#work" className="text-lg transition-colors duration-300 font-medium" 
               style={{ color: colors.text }} 
               onMouseEnter={(e) => e.target.style.color = colors.accent}
               onMouseLeave={(e) => e.target.style.color = colors.text}>work</a>
            <a href="#process" className="text-lg transition-colors duration-300 font-medium" 
               style={{ color: colors.text }}
               onMouseEnter={(e) => e.target.style.color = colors.accent}
               onMouseLeave={(e) => e.target.style.color = colors.text}>process</a>
            <a href="#services" className="text-lg transition-colors duration-300 font-medium" 
               style={{ color: colors.text }}
               onMouseEnter={(e) => e.target.style.color = colors.accent}
               onMouseLeave={(e) => e.target.style.color = colors.text}>services</a>
            <a href="#about" className="text-lg transition-colors duration-300 font-medium" 
               style={{ color: colors.text }}
               onMouseEnter={(e) => e.target.style.color = colors.accent}
               onMouseLeave={(e) => e.target.style.color = colors.text}>about</a>
            <a href="#contact" className="text-lg transition-colors duration-300 font-medium" 
               style={{ color: colors.text }}
               onMouseEnter={(e) => e.target.style.color = colors.accent}
               onMouseLeave={(e) => e.target.style.color = colors.text}>contact</a>
          </div>
          
          {/* Right - Start Button */}
          <div className="flex items-center space-x-4">
            <StartButton onClick={handleStartClick} />
            {/* Theme Toggle - Far Right */}
            <div className="ml-6">
              <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
            </div>
          </div>
        </nav>
      </header>

      {/* Start Menu Overlay */}
      <StartMenuOverlay
        items={menuItems}
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        buttonPosition={{ left: "90%", top: "48px" }}
        overlayBackground="#131515"
        zIndex={50000}
      />
    </>
  )
}

export default Navbar