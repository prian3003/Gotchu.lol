import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import logger from '../../utils/logger'
import { SimpleIconComponent } from '../../utils/simpleIconsHelper.jsx'

// Helper function to render icon - supports Simple Icons and emojis as fallback
const renderIcon = (icon, useMonochrome = false) => {
  if (!icon) return <SimpleIconComponent iconName="link" useWhite={true} size={24} />
  
  // If it's an emoji (Unicode character), return as is
  if (/[\u{1F000}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon)) {
    return icon
  }
  
  // Render as Simple Icon with brand colors or monochrome
  return <SimpleIconComponent iconName={icon} size={24} useWhite={useMonochrome} />
}

const UserLinks = ({ username, monochromeIcons = false }) => {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (username) {
      fetchUserLinks()
    }
  }, [username])

  const fetchUserLinks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8080/api/users/${username}/links`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data && data.data.links) {
          setLinks(data.data.links)
        }
      }
    } catch (error) {
      logger.error('Failed to fetch user links', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkClick = (link) => {
    // Handle different link types immediately
    if (link.description && !link.url) {
      // Copy text to clipboard
      const copyText = async () => {
        try {
          await navigator.clipboard.writeText(link.description)
          // Show brief visual feedback
          const button = document.getElementById(`link-${link.id}`)
          if (button) {
            // Add a temporary class for visual feedback
            button.style.transform = 'translateY(-2px) scale(1.2)'
            button.style.filter = 'drop-shadow(0 8px 16px rgba(34, 197, 94, 0.6))'
            
            setTimeout(() => {
              button.style.transform = ''
              button.style.filter = ''
            }, 300)
          }
        } catch (error) {
          logger.error('Failed to copy text', error)
          // Fallback - try alternative copy method
          try {
            const textArea = document.createElement('textarea')
            textArea.value = link.description
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
          } catch (fallbackError) {
            logger.error('Fallback copy method also failed', fallbackError)
          }
        }
      }
      copyText()
    } else if (link.url) {
      // Open URL in new tab immediately
      window.open(link.url, '_blank', 'noopener,noreferrer')
    }
    
    // Track click in background (fire and forget)
    fetch(`http://localhost:8080/api/links/${link.id}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      logger.error('Failed to track link click', error)
    })
  }

  if (loading) {
    return null // Don't show anything while loading
  }

  if (links.length === 0) {
    return null // Don't show anything if no links
  }

  return (
    <LinksContainer>
      <IconsGrid>
        {links.map((link) => (
          <IconButton
            key={link.id}
            id={`link-${link.id}`}
            onClick={() => handleLinkClick(link)}
            linkType={link.description && !link.url ? 'text' : 'url'}
            title={link.description && !link.url ? `Click to copy: ${link.description}` : `Visit ${link.title}`}
          >
            {renderIcon(link.icon, monochromeIcons)}
          </IconButton>
        ))}
      </IconsGrid>
    </LinksContainer>
  )
}

const LinksContainer = styled.div`
  margin: 1.5rem 0 0 0;
  padding: 0;
  text-align: center;
  width: 100%;
`

// LoadingText component removed - no longer showing loading state

const IconsGrid = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  max-width: 350px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    gap: 0.4rem;
    max-width: 280px;
  }
`

const IconButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'linkType'
})`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
  position: relative;
  
  &:hover {
    transform: translateY(-3px) scale(1.15);
    filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.4));
  }
  
  &:active {
    transform: translateY(-1px) scale(1.08);
  }
  
  ${props => props.linkType === 'text' && `
    &:hover {
      filter: drop-shadow(0 12px 20px rgba(169, 204, 62, 0.5));
    }
    
    &:after {
      content: '📋';
      position: absolute;
      top: -8px;
      right: -8px;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    &:hover:after {
      opacity: 1;
    }
  `}
  
  /* Ensure consistent icon sizing */
  > div {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Add subtle glow effect on hover */
  &:hover > div {
    filter: brightness(1.2);
  }
  
  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    
    > div {
      width: 32px;
      height: 32px;
    }
    
    &:hover {
      transform: translateY(-2px) scale(1.1);
    }
  }
`

// Remove unused styled components since we're only showing icons

export default UserLinks