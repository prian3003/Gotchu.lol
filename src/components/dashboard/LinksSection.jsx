import React, { useState, useRef } from 'react'
import logger from '../../utils/logger'
import styled from 'styled-components'
import { HiLink, HiPlus, HiPencil, HiTrash, HiEye, HiCursorArrowRays, HiXMark } from 'react-icons/hi2'

// Social Media Icons Data
const socialMediaPlatforms = [
  { name: 'YouTube', icon: '🔴', color: '#FF0000', placeholder: 'youtube.com/c/yourchannel' },
  { name: 'Instagram', icon: '📷', color: '#E4405F', placeholder: 'instagram.com/yourusername' },
  { name: 'Twitter', icon: '🐦', color: '#1DA1F2', placeholder: 'twitter.com/yourusername' },
  { name: 'TikTok', icon: '🎵', color: '#000000', placeholder: 'tiktok.com/@yourusername' },
  { name: 'Discord', icon: '💬', color: '#5865F2', placeholder: 'discord.gg/yourinvite' },
  { name: 'Spotify', icon: '🎧', color: '#1DB954', placeholder: 'open.spotify.com/user/yourid' },
  { name: 'Snapchat', icon: '👻', color: '#FFFC00', placeholder: 'snapchat.com/add/yourusername' },
  { name: 'Telegram', icon: '✈️', color: '#0088cc', placeholder: 't.me/yourusername' },
  { name: 'SoundCloud', icon: '🎶', color: '#ff5500', placeholder: 'soundcloud.com/yourusername' },
  { name: 'PayPal', icon: '💰', color: '#0070ba', placeholder: 'paypal.me/yourusername' },
  { name: 'GitHub', icon: '🐙', color: '#333', placeholder: 'github.com/yourusername' },
  { name: 'LinkedIn', icon: '💼', color: '#0A66C2', placeholder: 'linkedin.com/in/yourusername' },
  { name: 'Facebook', icon: '📘', color: '#1877F2', placeholder: 'facebook.com/yourusername' },
  { name: 'Twitch', icon: '🎮', color: '#9146FF', placeholder: 'twitch.tv/yourusername' },
  { name: 'OnlyFans', icon: '🔞', color: '#00AFF0', placeholder: 'onlyfans.com/yourusername' },
  { name: 'Reddit', icon: '📱', color: '#FF4500', placeholder: 'reddit.com/u/yourusername' },
  { name: 'Email', icon: '📧', color: '#EA4335', placeholder: 'your.email@domain.com' },
  { name: 'Website', icon: '🌐', color: '#6B7280', placeholder: 'https://yourwebsite.com' },
]

const LinksSection = ({ 
  links, 
  setLinks, 
  user, 
  setUser, 
  setHasUnsavedChanges
}) => {
  // Ensure links is always an array
  const safeLinks = Array.isArray(links) ? links : []
  const [showAddLink, setShowAddLink] = useState(false)
  const [showSocialGrid, setShowSocialGrid] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [editingLink, setEditingLink] = useState(null)
  const [newLink, setNewLink] = useState({ title: '', url: '', icon: '🔗' })
  const fileInputRef = useRef(null)

  const addLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8080/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newLink.title.trim(),
          url: newLink.url.trim(),
          icon: newLink.icon || '🔗'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setLinks(prev => [...prev, data.data])
          setNewLink({ title: '', url: '', icon: '🔗' })
          setShowAddLink(false)
          setHasUnsavedChanges(false)
        }
      }
    } catch (error) {
      logger.error('Failed to add link', error)
    }
  }

  const updateLink = async (linkId, updatedData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8080/api/links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setLinks(prev => prev.map(link => 
            link.id === linkId ? data.data : link
          ))
          setEditingLink(null)
          setHasUnsavedChanges(false)
        }
      }
    } catch (error) {
      logger.error('Failed to update link', error)
    }
  }

  const deleteLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8080/api/links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setLinks(prev => prev.filter(link => link.id !== linkId))
        setHasUnsavedChanges(false)
      }
    } catch (error) {
      logger.error('Failed to delete link', error)
    }
  }

  const handleLinkEdit = (link) => {
    setEditingLink({
      ...link,
      originalTitle: link.title,
      originalUrl: link.url,
      originalIcon: link.icon
    })
  }

  const saveEditedLink = () => {
    if (!editingLink.title.trim() || !editingLink.url.trim()) return
    
    updateLink(editingLink.id, {
      title: editingLink.title.trim(),
      url: editingLink.url.trim(),
      icon: editingLink.icon || '🔗'
    })
  }

  const cancelLinkEdit = () => {
    setEditingLink(null)
  }

  const handlePlatformSelect = (platform) => {
    setSelectedPlatform(platform)
    setNewLink({
      title: platform.name,
      url: '',
      icon: platform.icon
    })
    setShowSocialGrid(false)
    setShowAddLink(true)
  }

  const closeSocialGrid = () => {
    setShowSocialGrid(false)
    setSelectedPlatform(null)
  }

  return (
    <LinksWrapper>
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
            <GroupTitle>Your Links</GroupTitle>
            <AddButton onClick={() => setShowSocialGrid(true)}>
              <HiPlus />
              Add Social Link
            </AddButton>
          </GroupHeader>

      {/* Social Media Grid */}
      {showSocialGrid && (
        <SocialMediaModal>
          <SocialModalContent>
            <SocialModalHeader>
              <SocialModalTitle>Add Social Media</SocialModalTitle>
              <CloseButton onClick={closeSocialGrid}>
                <HiXMark />
              </CloseButton>
            </SocialModalHeader>
            <SocialGrid>
              {socialMediaPlatforms.map((platform) => (
                <SocialIcon
                  key={platform.name}
                  onClick={() => handlePlatformSelect(platform)}
                  color={platform.color}
                >
                  <span className="icon">{platform.icon}</span>
                  <span className="name">{platform.name}</span>
                </SocialIcon>
              ))}
            </SocialGrid>
          </SocialModalContent>
        </SocialMediaModal>
      )}

      <LinksGrid>
        {/* Add Link Form */}
        {showAddLink && (
          <LinkCard className="add-form">
            <LinkForm>
              {selectedPlatform ? (
                <FormTitle>
                  <span style={{ marginRight: '0.5rem' }}>{selectedPlatform.icon}</span>
                  Add {selectedPlatform.name} Link
                </FormTitle>
              ) : (
                <FormTitle>Add New Link</FormTitle>
              )}
              <FormGroup>
                <FormLabel>Title</FormLabel>
                <FormInput
                  type="text"
                  value={newLink.title}
                  onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter link title"
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>URL</FormLabel>
                <FormInput
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder={selectedPlatform?.placeholder || "https://example.com"}
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>Icon (Emoji)</FormLabel>
                <FormInput
                  type="text"
                  value={newLink.icon}
                  onChange={(e) => setNewLink(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🔗"
                  maxLength="2"
                />
              </FormGroup>
              <FormActions>
                <FormButton onClick={addLink} className="primary">
                  Add Link
                </FormButton>
                <FormButton onClick={() => {
                  setShowAddLink(false)
                  setSelectedPlatform(null)
                  setNewLink({ title: '', url: '', icon: '🔗' })
                }}>
                  Cancel
                </FormButton>
              </FormActions>
            </LinkForm>
          </LinkCard>
        )}

        {/* Existing Links */}
        {safeLinks.map((link) => (
          <LinkCard key={link.id}>
            {editingLink && editingLink.id === link.id ? (
              <LinkForm>
                <FormTitle>Edit Link</FormTitle>
                <FormGroup>
                  <FormLabel>Title</FormLabel>
                  <FormInput
                    type="text"
                    value={editingLink.title}
                    onChange={(e) => setEditingLink(prev => ({ ...prev, title: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>URL</FormLabel>
                  <FormInput
                    type="url"
                    value={editingLink.url}
                    onChange={(e) => setEditingLink(prev => ({ ...prev, url: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Icon</FormLabel>
                  <FormInput
                    type="text"
                    value={editingLink.icon}
                    onChange={(e) => setEditingLink(prev => ({ ...prev, icon: e.target.value }))}
                    maxLength="2"
                  />
                </FormGroup>
                <FormActions>
                  <FormButton onClick={saveEditedLink} className="primary">
                    Save
                  </FormButton>
                  <FormButton onClick={cancelLinkEdit}>
                    Cancel
                  </FormButton>
                </FormActions>
              </LinkForm>
            ) : (
              <>
                <LinkHeader>
                  <LinkIcon>{link.icon}</LinkIcon>
                  <LinkInfo>
                    <LinkTitle>{link.title}</LinkTitle>
                    <LinkUrl>{link.url}</LinkUrl>
                  </LinkInfo>
                  <LinkActions>
                    <ActionButton onClick={() => handleLinkEdit(link)}>
                      <HiPencil />
                    </ActionButton>
                    <ActionButton onClick={() => deleteLink(link.id)} className="danger">
                      <HiTrash />
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
              </>
            )}
          </LinkCard>
        ))}
      </LinksGrid>

      {safeLinks.length === 0 && !showAddLink && (
        <EmptyState>
          <HiLink style={{ fontSize: '3rem', color: '#58A4B0', marginBottom: '1rem' }} />
          <h3>No links yet</h3>
          <p>Add your first link to get started</p>
          <AddButton onClick={() => setShowAddLink(true)}>
            <HiPlus />
            Add First Link
          </AddButton>
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
  grid-template-columns: 1fr;
`

const LinkCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.15);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: rgba(88, 164, 176, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &.add-form {
    border-style: dashed;
    border-color: rgba(88, 164, 176, 0.3);
  }
`

const LinkHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
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
`

const LinkInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const LinkTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
  word-break: break-word;
`

const LinkUrl = styled.p`
  font-size: 0.9rem;
  color: #58A4B0;
  margin: 0;
  word-break: break-all;
`

const LinkActions = styled.div`
  display: flex;
  gap: 0.5rem;
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

  &:hover {
    background: rgba(88, 164, 176, 0.2);
    transform: scale(1.1);
  }

  &.danger:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
`

const LinkStats = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #a0a0a0;

  svg {
    color: #58A4B0;
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
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #58A4B0;
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: #666;
  }
`

const FormActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
`

const FormButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &.primary {
    background: linear-gradient(145deg, #58A4B0, #4a8a94);
    border-color: #58A4B0;
    color: #ffffff;

    &:hover {
      background: linear-gradient(145deg, #4a8a94, #3c7580);
      transform: translateY(-1px);
    }
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
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

// Social Media Modal Styles
const SocialMediaModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`

const SocialModalContent = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 2rem;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  width: 100%;
`

const SocialModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`

const SocialModalTitle = styled.h3`
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ffffff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`

const SocialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 0.75rem;
  }
`

const SocialIcon = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: ${props => props.color || '#58A4B0'};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }
  
  .icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    display: block;
  }
  
  .name {
    font-size: 0.75rem;
    color: #ffffff;
    font-weight: 500;
    line-height: 1.2;
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 0.25rem;
    
    .icon {
      font-size: 1.5rem;
      margin-bottom: 0.25rem;
    }
    
    .name {
      font-size: 0.65rem;
    }
  }
`

export default LinksSection