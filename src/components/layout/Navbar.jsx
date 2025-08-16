import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import StartMenuOverlay from '../ui/StartMenuOverlay'
import ParticleBackground from '../effects/ParticleBackground'
import styled from 'styled-components'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Using dark theme colors directly
  const colors = {
    text: '#ffffff',
    accent: '#64ffda',
    background: '#1a1a1a'
  }

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
        {/* Background - dark theme only */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at center, #1a1a1a 0%, #131515 100%)"
        }}></div>
        
        {/* Particle Background */}
        <ParticleBackground />
        
        {/* Navbar Content */}
        <nav className="relative z-10 h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Left - Logo */}
          <div className="flex items-center">
            <span className="text-2xl font-bold" style={{ color: colors.text }}>gotchu</span>
            <span className="text-2xl font-bold mx-1" style={{ color: colors.accent }}>.lol</span>
            <span className="text-xs ml-2 px-2 py-1 rounded-full border" 
                  style={{ 
                    color: colors.accent, 
                    borderColor: colors.accent,
                    backgroundColor: 'rgba(100, 255, 218, 0.1)'
                  }}>BETA</span>
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
          
          {/* Right - Auth Buttons */}
          <div className="flex items-center space-x-4">
            <StyledButtonWrapper>
              <Link to="/signin" className="button">
                <span className="button_lg">
                  <span className="button_sl" />
                  <span className="button_text">sign in</span>
                </span>
              </Link>
            </StyledButtonWrapper>
            <StyledButtonWrapper>
              <Link to="/signup" className="button">
                <span className="button_lg">
                  <span className="button_sl" />
                  <span className="button_text">sign up</span>
                </span>
              </Link>
            </StyledButtonWrapper>
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

const StyledButtonWrapper = styled.div`
  .button {
    -moz-appearance: none;
    -webkit-appearance: none;
    appearance: none;
    border: none;
    background: none;
    color: #0f1923;
    cursor: pointer;
    position: relative;
    padding: 4px;
    text-decoration: none;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 14px;
    transition: all .15s ease;
  }

  .button::before,
  .button::after {
    content: '';
    display: block;
    position: absolute;
    right: 0;
    left: 0;
    height: calc(50% - 1px);
    border: 1px solid #7D8082;
    transition: all .15s ease;
  }

  .button::before {
    top: 0;
    border-bottom-width: 0;
  }

  .button::after {
    bottom: 0;
    border-top-width: 0;
  }

  .button:active,
  .button:focus {
    outline: none;
  }

  .button:active::before,
  .button:active::after {
    right: 3px;
    left: 3px;
  }

  .button:active::before {
    top: 3px;
  }

  .button:active::after {
    bottom: 3px;
  }

  .button_lg {
    position: relative;
    display: block;
    padding: 10px 20px;
    color: #fff;
    background-color: #0f1923;
    overflow: hidden;
    box-shadow: inset 0px 0px 0px 1px transparent;
  }

  .button_lg::before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 2px;
    background-color: #0f1923;
  }

  .button_lg::after {
    content: '';
    display: block;
    position: absolute;
    right: 0;
    bottom: 0;
    width: 4px;
    height: 4px;
    background-color: #0f1923;
    transition: all .2s ease;
  }

  .button_sl {
    display: block;
    position: absolute;
    top: 0;
    bottom: -1px;
    left: -8px;
    width: 0;
    background-color: #A9CC3E;
    transform: skew(-15deg);
    transition: all .2s ease;
  }

  .button_text {
    position: relative;
  }

  .button:hover {
    color: #0f1923;
  }

  .button:hover .button_sl {
    width: calc(100% + 15px);
  }

  .button:hover .button_lg::after {
    background-color: #fff;
  }
`;

export default Navbar