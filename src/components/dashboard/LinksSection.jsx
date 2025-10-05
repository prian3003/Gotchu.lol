import React, { useState, useRef } from 'react'
import logger from '../../utils/logger'
import styled from 'styled-components'
import { HiLink, HiPlus, HiPencil, HiTrash, HiEye, HiCursorArrowRays, HiXMark, HiArrowsPointingOut } from 'react-icons/hi2'
import { SimpleIconComponent } from '../../utils/simpleIconsHelper.jsx'
import { API_BASE_URL } from '../../config/api'

// Social Media Icons Data - Using Simple Icons names (colors are now pulled from Simple Icons)
const socialMediaPlatforms = [
  // Row 1
  { name: 'Snapchat', icon: 'snapchat', placeholder: 'snapchat.com/add/yourusername' },
  { name: 'YouTube', icon: 'youtube', placeholder: 'youtube.com/c/yourchannel' },
  { name: 'Discord', icon: 'discord', placeholder: 'discord.gg/yourinvite' },
  { name: 'Spotify', icon: 'spotify', placeholder: 'open.spotify.com/user/yourid' },
  { name: 'X (Twitter)', icon: 'x', placeholder: 'x.com/yourusername' },
  { name: 'TikTok', icon: 'tiktok', placeholder: 'tiktok.com/@yourusername' },
  { name: 'Telegram', icon: 'telegram', placeholder: 't.me/yourusername' },
  { name: 'SoundCloud', icon: 'soundcloud', placeholder: 'soundcloud.com/yourusername' },
  { name: 'PayPal', icon: 'paypal', placeholder: 'paypal.me/yourusername' },
  { name: 'GitHub', icon: 'github', placeholder: 'github.com/yourusername' },
  { name: 'Roblox', icon: 'roblox', placeholder: 'roblox.com/users/youruserid' },
  { name: 'Cash App', icon: 'cashapp', placeholder: '$yourcashtag' },
  { name: 'Apple Music', icon: 'applemusic', placeholder: 'music.apple.com/profile/yourusername' },
  { name: 'GitLab', icon: 'gitlab', placeholder: 'gitlab.com/yourusername' },
  { name: 'Twitch', icon: 'twitch', placeholder: 'twitch.tv/yourusername' },
  { name: 'Reddit', icon: 'reddit', placeholder: 'reddit.com/u/yourusername' },
  
  // Row 2
  { name: 'VK', icon: 'vk', placeholder: 'vk.com/yourusername' },
  { name: 'DeviantArt', icon: 'deviantart', placeholder: 'deviantart.com/yourusername' },
  { name: 'itch.io', icon: 'itchdotio', placeholder: 'yourusername.itch.io' },
  { name: 'LinkedIn', icon: 'linkedin', placeholder: 'linkedin.com/in/yourusername' },
  { name: 'Steam', icon: 'steam', placeholder: 'steamcommunity.com/id/yourusername' },
  { name: 'Kickstarter', icon: 'kickstarter', placeholder: 'kickstarter.com/profile/yourusername' },
  { name: 'Pinterest', icon: 'pinterest', placeholder: 'pinterest.com/yourusername' },
  { name: 'Last.fm', icon: 'lastdotfm', placeholder: 'last.fm/user/yourusername' },
  { name: 'Buy Me a Coffee', icon: 'buymeacoffee', placeholder: 'buymeacoffee.com/yourusername' },
  { name: 'Ko-fi', icon: 'kofi', placeholder: 'ko-fi.com/yourusername' },
  { name: 'Facebook', icon: 'facebook', placeholder: 'facebook.com/yourusername' },
  { name: 'Gitee', icon: 'gitee', placeholder: 'gitee.com/yourusername' },
  { name: 'Patreon', icon: 'patreon', placeholder: 'patreon.com/yourusername' },
  { name: 'Discord Server', icon: 'discord', placeholder: 'discord.gg/yourinvite' },
  { name: 'Bitcoin', icon: 'bitcoin', placeholder: 'Your BTC address' },
  { name: 'Ethereum', icon: 'ethereum', placeholder: 'Your ETH address' },
  { name: 'Litecoin', icon: 'litecoin', placeholder: 'Your LTC address' },
  
  // Row 3
  { name: 'Solana', icon: 'solana', placeholder: 'Your SOL address' },
  { name: 'XRP', icon: 'xrp', placeholder: 'Your XRP address' },
  { name: 'Monero', icon: 'monero', placeholder: 'Your XMR address' },
  { name: 'Email', icon: 'gmail', placeholder: 'your.email@domain.com' },
  { name: 'Custom URL', icon: 'link', placeholder: 'https://yourwebsite.com' },
]

const LinksSection = ({ 
  links, 
  setLinks, 
  user, 
  setUser, 
  setHasUnsavedChanges,
  fetchLinks
}) => {
  // Show loading state if links data hasn't been loaded yet
  const isLoading = links === undefined || links === null
  
  // Ensure links is always an array
  const safeLinks = Array.isArray(links) ? links : []
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [editingLink, setEditingLink] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [modalMode, setModalMode] = useState('menu') // 'menu', 'link', 'text'
  const [linkData, setLinkData] = useState({ url: '', text: '', customTitle: '', customIcon: '' })
  const [draggedLink, setDraggedLink] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [reorderedLinks, setReorderedLinks] = useState(safeLinks)
  const [deletingLinks, setDeletingLinks] = useState(new Set())
  const [alerts, setAlerts] = useState([])
  const [showModeTooltip, setShowModeTooltip] = useState(false)
  const fileInputRef = useRef(null)

  // Helper function to check if platform already exists
  const isPlatformAlreadyAdded = (platformIcon) => {
    return reorderedLinks.some(link => link.icon === platformIcon)
  }

  // Alert management functions
  const showAlert = (message, type = 'info', duration = 4000) => {
    const id = Date.now()
    const alert = { id, message, type, duration }
    setAlerts(prev => [...prev, alert])
    
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id))
    }, duration)
  }

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const updateLink = async (linkId, updatedData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/links/${linkId}`, {
        method: 'PUT',
        credentials: 'include', // Include httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setEditingLink(null)
          setHasUnsavedChanges(false)
          // Refresh links from server
          if (fetchLinks) {
            await fetchLinks()
          }
        }
      }
    } catch (error) {
      logger.error('Failed to update link', error)
    }
  }

  const deleteLink = async (linkId) => {
    try {
      // Start optimistic deletion - mark as deleting
      setDeletingLinks(prev => new Set([...prev, linkId]))
      
      // Store current state for potential restoration
      const currentLinks = [...reorderedLinks]
      
      // Immediately remove from UI (optimistic update)
      const linkToDelete = reorderedLinks.find(link => link.id === linkId)
      const optimisticLinks = reorderedLinks.filter(link => link.id !== linkId)
      setReorderedLinks(optimisticLinks)
      setLinks(optimisticLinks)
      
      // Show deletion alert
      showAlert(`Deleting ${linkToDelete?.title || 'link'}...`, 'info', 2000)
      
      const response = await fetch(`${API_BASE_URL}/links/${linkId}`, {
        method: 'DELETE',
        credentials: 'include', // Include httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Success - show success alert
        showAlert('Link deleted successfully', 'success', 3000)
        setHasUnsavedChanges(false)
      } else {
        // Error - restore the link and show error
        const errorData = await response.json()
        setReorderedLinks(currentLinks)
        setLinks(currentLinks)
        showAlert('Failed to delete link. Please try again.', 'error', 4000)
        logger.error('Failed to delete link - backend error', errorData)
      }
    } catch (error) {
      // Error - restore the link and show error
      setReorderedLinks(reorderedLinks)
      setLinks(reorderedLinks)
      showAlert('Failed to delete link. Please try again.', 'error', 4000)
      logger.error('Failed to delete link', error)
    } finally {
      // Remove from deleting state
      setDeletingLinks(prev => {
        const newSet = new Set(prev)
        newSet.delete(linkId)
        return newSet
      })
    }
  }

  const handleLinkEdit = (link) => {
    setEditingLink({
      ...link,
      originalTitle: link.title,
      originalUrl: link.url,
      originalIcon: link.icon
    })
    setShowEditModal(true)
  }

  const saveEditedLink = () => {
    if (!editingLink.title.trim() || !editingLink.url.trim()) return
    
    updateLink(editingLink.id, {
      title: editingLink.title.trim(),
      url: editingLink.url.trim(),
      icon: editingLink.icon || '🔗'
    })
    setShowEditModal(false)
    setEditingLink(null)
  }

  const cancelLinkEdit = () => {
    setEditingLink(null)
    setShowEditModal(false)
  }

  // Handle icon click to show modal
  const handleIconClick = (platform) => {
    // Check if platform already exists (except for Custom URL which can have multiple)
    if (platform.name !== 'Custom URL' && isPlatformAlreadyAdded(platform.icon)) {
      // Show notification that platform already exists
      alert(`You already have a ${platform.name} link. Each platform can only be added once.`)
      return
    }

    setSelectedPlatform(platform)
    setModalMode('link')
    setLinkData({ url: '', text: '', customTitle: '', customIcon: '' })
    setShowLinkModal(true)
  }

  // Save link data
  const saveLinkData = async () => {
    if (!linkData.url.trim()) return

    try {
      // Ensure URL has proper protocol
      let formattedUrl = linkData.url.trim()
      if (formattedUrl && !formattedUrl.match(/^https?:\/\//)) {
        formattedUrl = `https://${formattedUrl}`
      }
      
      const payload = {
        title: selectedPlatform.name === 'Custom URL' ? (linkData.customTitle || 'Custom Link') : selectedPlatform.name,
        url: formattedUrl,
        icon: selectedPlatform.name === 'Custom URL' ? (linkData.customIcon || 'link') : selectedPlatform.icon,
        type: 'DEFAULT'
      }
      
      
      const response = await fetch('${API_BASE_URL}/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setShowLinkModal(false)
          setHasUnsavedChanges(false)
          // Refresh links from server
          if (fetchLinks) {
            await fetchLinks()
          }
        }
      } else {
        const errorData = await response.json()
        console.error('Backend error response:', errorData)
        logger.error('Failed to save link - backend error', errorData)
      }
    } catch (error) {
      logger.error('Failed to save link', error)
    }
  }

  // Save text data
  const saveTextData = async () => {
    if (!linkData.text.trim()) return

    try {
      const response = await fetch('${API_BASE_URL}/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
        body: JSON.stringify({
          title: selectedPlatform.name,
          description: linkData.text.trim(), // Store text in description field
          icon: selectedPlatform.icon,
          type: 'DEFAULT'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setShowLinkModal(false)
          setHasUnsavedChanges(false)
          // Refresh links from server
          if (fetchLinks) {
            await fetchLinks()
          }
        }
      }
    } catch (error) {
      logger.error('Failed to save text', error)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e, link, index) => {
    setDraggedLink({ link, index })
    setDraggedIndex(index)
    setReorderedLinks([...safeLinks])
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', '')
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedIndex === null || draggedIndex === index) {
      setDragOverIndex(index)
      return
    }

    // Real-time visual reordering
    const newLinks = [...reorderedLinks]
    const draggedItem = newLinks[draggedIndex]
    
    // Remove dragged item from current position
    newLinks.splice(draggedIndex, 1)
    
    // Insert at new position
    newLinks.splice(index, 0, draggedItem)
    
    setReorderedLinks(newLinks)
    setDraggedIndex(index)
    setDragOverIndex(index)
  }

  const handleDragLeave = (e) => {
    // Only clear if leaving the entire container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null)
    }
  }

  const handleDragEnd = () => {
    if (draggedIndex === null) {
      setReorderedLinks(safeLinks)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault()
    setDragOverIndex(null)
    setDraggedIndex(null)

    if (!draggedLink) {
      setDraggedLink(null)
      setReorderedLinks(safeLinks)
      return
    }

    // Use the current reordered state for backend update
    const finalLinks = [...reorderedLinks]
    
    // Update local state immediately
    setLinks(finalLinks)

    // Update order values and send to backend
    try {
      const reorderData = finalLinks.map((link, index) => ({
        id: link.id,
        order: index + 1
      }))

      const response = await fetch('${API_BASE_URL}/links/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
        body: JSON.stringify({ links: reorderData })
      })

      if (!response.ok) {
        // If backend fails, refresh from server to restore correct order
        if (fetchLinks) {
          await fetchLinks()
        }
        logger.error('Failed to reorder links')
      }
    } catch (error) {
      logger.error('Error reordering links:', error)
      // Refresh from server on error
      if (fetchLinks) {
        await fetchLinks()
      }
    }

    setDraggedLink(null)
  }

  // Sync reorderedLinks with safeLinks when not dragging
  React.useEffect(() => {
    if (draggedIndex === null) {
      setReorderedLinks(safeLinks)
    }
  }, [safeLinks, draggedIndex])

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <LinksWrapper>
        <SectionHeader>
          <SectionTitle>Your Links</SectionTitle>
          <SectionDescription>
            Manage and organize your social media links and custom URLs
          </SectionDescription>
        </SectionHeader>

        <SocialIconsGrid>
          {/* Show skeleton social icons */}
          {[...Array(16)].map((_, i) => (
            <SkeletonSocialIcon key={i}>
              <SkeletonIcon />
            </SkeletonSocialIcon>
          ))}
        </SocialIconsGrid>

        <LinksGrid>
          {/* Show skeleton link cards */}
          {[...Array(3)].map((_, i) => (
            <SkeletonLinkCard key={i}>
              <SkeletonLinkHeader>
                <SkeletonDragHandle />
                <SkeletonIcon />
                <SkeletonLinkInfo>
                  <SkeletonLine width="60%" height="18px" />
                  <SkeletonLine width="80%" height="14px" />
                </SkeletonLinkInfo>
                <SkeletonActions>
                  <SkeletonActionButton />
                  <SkeletonActionButton />
                </SkeletonActions>
              </SkeletonLinkHeader>
              <SkeletonLinkStats>
                <SkeletonStat>
                  <SkeletonStatIcon />
                  <SkeletonLine width="60px" height="14px" />
                </SkeletonStat>
                <SkeletonStat>
                  <SkeletonStatIcon />
                  <SkeletonLine width="50px" height="14px" />
                </SkeletonStat>
              </SkeletonLinkStats>
            </SkeletonLinkCard>
          ))}
        </LinksGrid>
      </LinksWrapper>
    )
  }

  return (
    <LinksWrapper>
      {/* Custom Alert System */}
      <AlertContainer>
        {alerts.map(alert => (
          <Alert key={alert.id} type={alert.type}>
            <AlertIcon type={alert.type}>
              {alert.type === 'success' && '✓'}
              {alert.type === 'error' && '✕'}
              {alert.type === 'info' && 'ℹ'}
            </AlertIcon>
            <AlertMessage>{alert.message}</AlertMessage>
            <AlertClose onClick={() => removeAlert(alert.id)}>×</AlertClose>
          </Alert>
        ))}
      </AlertContainer>
      <ContentWrapper>
        <SectionHeader>
          <HiLink style={{ fontSize: '2rem', color: '#58A4B0' }} />
          <HeaderContent>
            <h2>Social Media Links</h2>
            <p>Connect and showcase your social media profiles</p>
          </HeaderContent>
        </SectionHeader>

        <SettingsGroup>
          <GroupHeader>
            <GroupTitle>Social Icons</GroupTitle>
          </GroupHeader>
          
          {/* Social Icons Grid - Direct Access */}
          <SocialGrid>
            {socialMediaPlatforms.map((platform) => {
              const isAlreadyAdded = platform.name !== 'Custom URL' && isPlatformAlreadyAdded(platform.icon)
              return (
                <SocialIcon
                  key={platform.name}
                  onClick={() => handleIconClick(platform)}
                  $isDisabled={isAlreadyAdded}
                >
                  <SimpleIconComponent iconName={platform.icon} size={24} />
                  <div className="tooltip">
                    {platform.name}
                    {isAlreadyAdded && ' (Already added)'}
                  </div>
                  {isAlreadyAdded && <div className="added-indicator">✓</div>}
                </SocialIcon>
              )
            })}
          </SocialGrid>

      {/* Link/Text Modal */}
      {showLinkModal && (
        <SocialMediaModal>
          <SocialModalContent>
            <SocialModalHeader>
              <SocialModalTitle>
                Add {selectedPlatform?.name} Social
              </SocialModalTitle>
              <CloseButton onClick={() => setShowLinkModal(false)}>
                <HiXMark />
              </CloseButton>
            </SocialModalHeader>
            
            <SocialModeSection>
              <SocialModeLabel>
                Social Mode
                <HelpIcon 
                  onMouseEnter={() => setShowModeTooltip(true)}
                  onMouseLeave={() => setShowModeTooltip(false)}
                  onClick={() => setShowModeTooltip(!showModeTooltip)}
                >
                  ?
                  {showModeTooltip && (
                    <ModeTooltip>
                      <div><strong>🔗 Link Mode:</strong> Redirects to URL</div>
                      <div><strong>📋 Text Mode:</strong> Copies text to clipboard</div>
                    </ModeTooltip>
                  )}
                </HelpIcon>
              </SocialModeLabel>
              <ModeToggleButtons>
                <ModeButton 
                  $active={modalMode === 'link'}
                  onClick={() => setModalMode('link')}
                >
                  🔗 Link
                </ModeButton>
                <ModeButton 
                  $active={modalMode === 'text'}
                  onClick={() => setModalMode('text')}
                >
                  ⚠️ Text
                </ModeButton>
              </ModeToggleButtons>
            </SocialModeSection>
            
            {/* URL Input Section */}
            <UrlInputSection>
              <PlatformDisplay>
                <SimpleIconComponent iconName={selectedPlatform?.icon} size={20} />
                <UrlInput
                  type={modalMode === 'link' ? 'url' : 'text'}
                  value={modalMode === 'link' ? linkData.url : linkData.text}
                  onChange={(e) => setLinkData(prev => ({ 
                    ...prev, 
                    [modalMode === 'link' ? 'url' : 'text']: e.target.value 
                  }))}
                  placeholder={selectedPlatform?.placeholder || `${selectedPlatform?.name.toLowerCase()}.com/...`}
                />
              </PlatformDisplay>
            </UrlInputSection>
            
            {/* Action Buttons */}
            <ModalActions>
              <ModalActionButton primary onClick={modalMode === 'link' ? saveLinkData : saveTextData}>
                Add
              </ModalActionButton>
              <ModalActionButton onClick={() => setShowLinkModal(false)}>
                Need help?
              </ModalActionButton>
            </ModalActions>
          </SocialModalContent>
        </SocialMediaModal>
      )}

      {/* Edit Link Modal */}
      {showEditModal && editingLink && (
        <SocialMediaModal>
          <SocialModalContent>
            <SocialModalHeader>
              <SocialModalTitle>
                Edit Link
              </SocialModalTitle>
              <CloseButton onClick={cancelLinkEdit}>
                <HiXMark />
              </CloseButton>
            </SocialModalHeader>

            {/* Edit Form */}
            <div style={{ padding: '1.5rem 0' }}>
              <FormGroup>
                <FormLabel>Title</FormLabel>
                <FormInput
                  type="text"
                  value={editingLink.title}
                  onChange={(e) => setEditingLink(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter link title"
                />
              </FormGroup>
              
              <FormGroup>
                <FormLabel>URL</FormLabel>
                <FormInput
                  type="url"
                  value={editingLink.url}
                  onChange={(e) => setEditingLink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                />
              </FormGroup>
              
              <FormGroup>
                <FormLabel>Icon (emoji)</FormLabel>
                <FormInput
                  type="text"
                  value={editingLink.icon}
                  onChange={(e) => setEditingLink(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🔗"
                  maxLength="2"
                />
              </FormGroup>
            </div>

            {/* Action Buttons */}
            <ModalActions>
              <ModalActionButton primary onClick={saveEditedLink}>
                Save Changes
              </ModalActionButton>
              <ModalActionButton onClick={cancelLinkEdit}>
                Cancel
              </ModalActionButton>
            </ModalActions>
          </SocialModalContent>
        </SocialMediaModal>
      )}

      <LinksGrid>
        {/* User's Configured Links */}
        {reorderedLinks.map((link, index) => (
          <LinkCard 
            key={link.id}
            draggable
            onDragStart={(e) => handleDragStart(e, link, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            $isDragging={draggedLink?.link.id === link.id}
            $isDragOver={dragOverIndex === index}
            $isBeingDragged={draggedIndex === index}
            $isDeleting={deletingLinks.has(link.id)}
          >
            <LinkHeader>
              <DragHandle className="drag-handle">
                <HiArrowsPointingOut />
              </DragHandle>
              <LinkIcon>
                <SimpleIconComponent iconName={link.icon} size={24} />
              </LinkIcon>
              <LinkInfo>
                <LinkTitle>{link.title}</LinkTitle>
                <LinkUrl>{link.url}</LinkUrl>
              </LinkInfo>
              <LinkActions>
                <ActionButton onClick={() => handleLinkEdit(link)}>
                  <HiPencil />
                </ActionButton>
                <ActionButton 
                  onClick={() => deleteLink(link.id)} 
                  className="danger"
                  disabled={deletingLinks.has(link.id)}
                >
                  {deletingLinks.has(link.id) ? (
                    <div className="spinner" />
                  ) : (
                    <HiTrash />
                  )}
                </ActionButton>
              </LinkActions>
            </LinkHeader>
            <LinkStats>
              <StatItem>
                <HiCursorArrowRays />
                <span>{link.clicks || 0} clicks</span>
              </StatItem>
              <StatItem>
                <HiEye />
                <span>Active</span>
              </StatItem>
            </LinkStats>
          </LinkCard>
        ))}
      </LinksGrid>

      {reorderedLinks.length === 0 && (
        <EmptyState>
          <HiLink style={{ fontSize: '3rem', color: '#58A4B0', marginBottom: '1rem' }} />
          <h3>No links configured yet</h3>
          <p>Click on any social icon above to add a link or text</p>
        </EmptyState>
      )}
        </SettingsGroup>
      </ContentWrapper>
    </LinksWrapper>
  )
}

// Main wrapper to match CustomizationPage structure
const LinksWrapper = styled.div`
  min-height: 100vh;
  position: relative;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 200px);
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  
  svg {
    font-size: 2rem;
    color: #58A4B0;
  }
`

const HeaderContent = styled.div`
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
  }
  
  p {
    font-size: 0.9rem;
    color: #a0a0a0;
    margin: 0.25rem 0 0 0;
  }
`

const SettingsGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`

const GroupTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`


const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(145deg, rgba(88, 164, 176, 0.2), rgba(88, 164, 176, 0.1));
  border: 1px solid rgba(88, 164, 176, 0.3);
  border-radius: 8px;
  color: #58A4B0;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: linear-gradient(145deg, rgba(88, 164, 176, 0.3), rgba(88, 164, 176, 0.2));
    border-color: rgba(88, 164, 176, 0.5);
    transform: translateY(-2px);
  }
`

const LinksGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(4, 1fr);
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const LinkCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.15);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
  backdrop-filter: blur(10px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: ${props => props.draggable ? 'grab' : 'default'};
  position: relative;
  will-change: transform, opacity, box-shadow;

  /* Responsive padding */
  @media (max-width: 768px) {
    padding: 1rem;
    margin-top: 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    margin-top: 1rem;
  }

  &:hover {
    border-color: rgba(88, 164, 176, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &.add-form {
    border-style: dashed;
    border-color: rgba(88, 164, 176, 0.3);
  }

  ${props => props.$isBeingDragged && `
    opacity: 0.3;
    transform: scale(0.98) rotate(2deg);
    cursor: grabbing;
    z-index: 1000;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(88, 164, 176, 0.4);
  `}

  ${props => props.$isDragOver && !props.$isBeingDragged && `
    border-color: rgba(88, 164, 176, 0.6);
    background: linear-gradient(145deg, rgba(88, 164, 176, 0.12), rgba(88, 164, 176, 0.06));
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 30px rgba(88, 164, 176, 0.2);
  `}

  ${props => props.$isDeleting && `
    opacity: 0.6;
    transform: scale(0.95);
    pointer-events: none;
    border-color: rgba(239, 68, 68, 0.3);
    background: linear-gradient(145deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  `}

  /* Smooth transitions for reordering */
  &:not(.dragging) {
    transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1), 
                opacity 0.3s ease, 
                box-shadow 0.3s ease,
                border-color 0.3s ease,
                background 0.3s ease;
  }
`

const LinkHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
  position: relative;

  /* Responsive adjustments */
  @media (max-width: 768px) {
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
    flex-wrap: wrap;
  }
`

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-top: 0.25rem;
  cursor: grab;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
  border-radius: 4px;
  
  &:hover {
    color: #58A4B0;
    background: rgba(88, 164, 176, 0.1);
  }
  
  &:active {
    cursor: grabbing;
    transform: scale(1.1);
  }
  
  svg {
    font-size: 0.875rem;
  }
`

const LinkIcon = styled.div`
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(88, 164, 176, 0.2);
  border-radius: 12px;
  flex-shrink: 0;

  /* Responsive icon size */
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 1.75rem;
    border-radius: 10px;
  }

  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
    font-size: 1.5rem;
    border-radius: 8px;
  }
`

const LinkInfo = styled.div`
  flex: 1;
  min-width: 0;
  margin-top: 0.125rem;
`

const LinkTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;

  /* Responsive font size */
  @media (max-width: 768px) {
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    font-size: 0.95rem;
    margin-bottom: 0.125rem;
  }
`

const LinkUrl = styled.p`
  font-size: 0.9rem;
  color: #58A4B0;
  margin: 0;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  /* Responsive font size */
  @media (max-width: 768px) {
    font-size: 0.85rem;
    -webkit-line-clamp: 1;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`

const LinkActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.125rem;
  flex-shrink: 0;

  /* Responsive adjustments */
  @media (max-width: 480px) {
    gap: 0.25rem;
    flex-direction: column;
    align-items: flex-end;
    width: auto;
    min-width: 32px;
  }
`

const ActionButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  /* Responsive size */
  @media (max-width: 768px) {
    width: 30px;
    height: 30px;
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    border-radius: 4px;
  }

  &:hover {
    background: rgba(88, 164, 176, 0.2);
    transform: scale(1.1);
  }

  &.danger:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: none;
    }
  }

  &.drag-handle {
    cursor: grab;
    
    &:hover {
      background: rgba(88, 164, 176, 0.3);
      color: #58A4B0;
    }
    
    &:active {
      cursor: grabbing;
    }
  }
  
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const LinkStats = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  /* Responsive adjustments */
  @media (max-width: 768px) {
    gap: 0.75rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    flex-wrap: wrap;
  }
`

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #a0a0a0;
  white-space: nowrap;

  svg {
    color: #58A4B0;
    flex-shrink: 0;
  }

  /* Responsive font size */
  @media (max-width: 768px) {
    font-size: 0.8rem;
    gap: 0.375rem;
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
    gap: 0.25rem;
  }
`

const LinkForm = styled.div`
  width: 100%;
`

const FormTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 1rem 0;
`

const FormGroup = styled.div`
  margin-bottom: 1rem;
`

const FormLabel = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0.5rem;
`

const FormInput = styled.input`
  width: 100%;
  padding: 1rem 1.25rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(88, 164, 176, 0.2);
  border-radius: 12px;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  
  &:focus {
    outline: none;
    border-color: rgba(88, 164, 176, 0.6);
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
    box-shadow: 
      0 0 0 3px rgba(88, 164, 176, 0.1),
      0 8px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
    font-weight: 400;
  }
`

const FormHint = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
  
  a {
    color: #58A4B0;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`

const FormActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
`

const FormButton = styled.button`
  padding: 1rem 2rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  color: #ffffff;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }

  &.primary {
    background: linear-gradient(145deg, #58A4B0, #4a8a94);
    border-color: #58A4B0;
    color: #ffffff;
    box-shadow: 
      0 8px 16px rgba(88, 164, 176, 0.3),
      0 0 0 1px rgba(88, 164, 176, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);

    &::before {
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    }

    &:hover {
      background: linear-gradient(145deg, #4a8a94, #3c7580);
      transform: translateY(-2px) scale(1.02);
      box-shadow: 
        0 12px 24px rgba(88, 164, 176, 0.4),
        0 0 0 1px rgba(88, 164, 176, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }
    
    &:active {
      transform: translateY(-1px) scale(1.01);
      box-shadow: 
        0 6px 12px rgba(88, 164, 176, 0.3),
        0 0 0 1px rgba(88, 164, 176, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
  }

  &:hover {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
    box-shadow: 
      0 8px 16px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  &:active {
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    
    &:hover {
      transform: none;
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: none;
    }
  }
  
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #a0a0a0;

  h3 {
    color: #ffffff;
    margin-bottom: 0.5rem;
  }

  p {
    margin-bottom: 2rem;
  }
`

// Social Media Modal Styles - Enhanced HQ Design
const SocialMediaModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(8px);
  animation: modalFadeIn 0.3s ease-out;
  
  @keyframes modalFadeIn {
    from {
      opacity: 0;
      backdrop-filter: blur(0px);
    }
    to {
      opacity: 1;
      backdrop-filter: blur(8px);
    }
  }
`

const SocialModalContent = styled.div`
  background: linear-gradient(145deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 45, 0.9));
  border: 1px solid rgba(88, 164, 176, 0.2);
  border-radius: 24px;
  padding: 2.5rem;
  max-width: 600px;
  max-height: 85vh;
  overflow-y: auto;
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  width: 100%;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(88, 164, 176, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }
`

const SocialModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(88, 164, 176, 0.15);
`

const SocialModalTitle = styled.h3`
  color: #ffffff;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  background: linear-gradient(135deg, #ffffff, #58A4B0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: #ef4444;
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`

const SocialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
  max-height: none;
  width: 100%;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 0.75rem;
  }
`

const SocialIcon = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  position: relative;
  
  ${props => props.$isDisabled && `
    opacity: 0.5;
    background: rgba(88, 164, 176, 0.1);
    border-color: rgba(88, 164, 176, 0.2);
  `}
  
  &:hover {
    ${props => !props.$isDisabled && `
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(88, 164, 176, 0.3);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    `}
      
    .tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
  }
  
  /* Ensure consistent icon sizing */
  > div {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .name {
    display: none;
  }
  
  .added-indicator {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    background: #4ade80;
    border-radius: 50%;
    color: white;
    font-size: 0.7rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(0, 0, 0, 0.2);
  }
  
  .tooltip {
    position: absolute;
    bottom: -35px;
    left: 50%;
    transform: translateX(-50%) translateY(5px);
    background: rgba(0, 0, 0, 0.9);
    color: #ffffff;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 10;
    
    &::before {
      content: '';
      position: absolute;
      top: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-bottom: 5px solid rgba(0, 0, 0, 0.9);
    }
  }
  
  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
    padding: 0.4rem;
    
    > div {
      width: 20px;
      height: 20px;
    }
    
    .tooltip {
      font-size: 0.65rem;
      padding: 0.4rem 0.6rem;
      bottom: -30px;
    }
    
    .added-indicator {
      width: 14px;
      height: 14px;
      font-size: 0.6rem;
    }
  }
`

// Menu Options Grid
const MenuOptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const MenuOption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 1.5rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(88, 164, 176, 0.2);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(88, 164, 176, 0.1), rgba(88, 164, 176, 0.05));
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }
  
  &:hover {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
    border-color: rgba(88, 164, 176, 0.4);
    transform: translateY(-4px) scale(1.02);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(88, 164, 176, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  &:active {
    transform: translateY(-2px) scale(1.01);
  }
  
  .icon {
    font-size: 2.5rem;
    margin-bottom: 1.25rem;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  }
  
  .label {
    font-size: 1.2rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 0.75rem;
    background: linear-gradient(135deg, #ffffff, #58A4B0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .description {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.5;
    font-weight: 400;
  }
`

// New Modal Components for Screenshot Design
const SocialModeSection = styled.div`
  margin-bottom: 2rem;
`

const SocialModeLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 1rem;
`

const HelpIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(88, 164, 176, 0.2);
    color: #58A4B0;
    transform: scale(1.1);
  }
`

const ModeTooltip = styled.div`
  position: absolute;
  top: 25px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.95);
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  line-height: 1.3;
  white-space: nowrap;
  z-index: 1000;
  border: 1px solid rgba(88, 164, 176, 0.3);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  animation: tooltipFadeIn 0.2s ease-out;
  
  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid rgba(0, 0, 0, 0.95);
  }
  
  div {
    margin: 2px 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  strong {
    color: #58A4B0;
    font-weight: 600;
  }
  
  @media (max-width: 768px) {
    white-space: normal;
    width: 180px;
    left: 0;
    transform: translateX(-50%);
    font-size: 0.7rem;
  }
`

const ModeToggleButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`

const ModeButton = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: ${props => props.$active ? 'rgba(88, 164, 176, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$active ? 'rgba(88, 164, 176, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  color: #ffffff;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: rgba(88, 164, 176, 0.1);
    border-color: rgba(88, 164, 176, 0.3);
  }
`

const UrlInputSection = styled.div`
  margin-bottom: 2rem;
`

const PlatformDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  
  span {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }
`

const UrlInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 0.9rem;
  outline: none;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
`

const ModalActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid ${props => props.primary ? '#58A4B0' : 'rgba(255, 255, 255, 0.2)'};
  background: ${props => props.primary ? '#58A4B0' : 'transparent'};
  color: ${props => props.primary ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.primary ? '#4a8a94' : 'rgba(255, 255, 255, 0.05)'};
    border-color: ${props => props.primary ? '#4a8a94' : 'rgba(255, 255, 255, 0.3)'};
  }
`

// Alert System Styled Components
const AlertContainer = styled.div`
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  
  @media (max-width: 768px) {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
`

const Alert = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: ${props => {
    switch (props.type) {
      case 'success': return 'linear-gradient(145deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.1))'
      case 'error': return 'linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.1))'
      case 'info': return 'linear-gradient(145deg, rgba(88, 164, 176, 0.15), rgba(88, 164, 176, 0.1))'
      default: return 'linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1))'
    }
  }};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'success': return 'rgba(34, 197, 94, 0.3)'
      case 'error': return 'rgba(239, 68, 68, 0.3)'
      case 'info': return 'rgba(88, 164, 176, 0.3)'
      default: return 'rgba(255, 255, 255, 0.3)'
    }
  }};
  border-radius: 12px;
  backdrop-filter: blur(20px);
  color: #ffffff;
  animation: alertSlideIn 0.3s ease-out;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  
  @keyframes alertSlideIn {
    from {
      opacity: 0;
      transform: translateX(100%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }
`

const AlertIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => {
    switch (props.type) {
      case 'success': return 'rgba(34, 197, 94, 0.2)'
      case 'error': return 'rgba(239, 68, 68, 0.2)'
      case 'info': return 'rgba(88, 164, 176, 0.2)'
      default: return 'rgba(255, 255, 255, 0.2)'
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success': return '#22c55e'
      case 'error': return '#ef4444'
      case 'info': return '#58A4B0'
      default: return '#ffffff'
    }
  }};
  font-weight: bold;
  font-size: 0.875rem;
  flex-shrink: 0;
`

const AlertMessage = styled.div`
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.4;
`

const AlertClose = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: bold;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    transform: scale(1.1);
  }
`

// Loading Components
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1.5rem;
`

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(88, 164, 176, 0.2);
  border-top: 4px solid #58A4B0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const LoadingText = styled.div`
  color: #58A4B0;
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
`

// Skeleton Loading Components
const SocialIconsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 0.75rem;
  }
`

const SkeletonSocialIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: skeletonShimmer 1.5s infinite;
  }
  
  @keyframes skeletonShimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }
  
  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
  }
`

const SkeletonIcon = styled.div`
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  
  @media (max-width: 768px) {
    width: 20px;
    height: 20px;
  }
`

const SkeletonLinkCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.15);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: skeletonShimmer 1.5s infinite;
  }
`

const SkeletonLinkHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
`

const SkeletonDragHandle = styled.div`
  width: 20px;
  height: 20px;
  margin-top: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
`

const SkeletonLinkInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.125rem;
`

const SkeletonLine = styled.div`
  width: ${props => props.width || '100%'};
  height: ${props => props.height || '16px'};
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
`

const SkeletonActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.125rem;
`

const SkeletonActionButton = styled.div`
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
`

const SkeletonLinkStats = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`

const SkeletonStat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const SkeletonStatIcon = styled.div`
  width: 16px;
  height: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
`

export default LinksSection