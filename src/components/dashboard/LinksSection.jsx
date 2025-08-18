import React, { useState, useRef } from 'react'
import logger from '../../utils/logger'
import styled from 'styled-components'
import { HiLink, HiPlus, HiPencil, HiTrash, HiEye, HiCursorArrowRays } from 'react-icons/hi2'

const LinksSection = ({ 
  links, 
  setLinks, 
  user, 
  setUser, 
  setHasUnsavedChanges,
  setShowUnsavedModal,
  showUnsavedModal 
}) => {
  const [showAddLink, setShowAddLink] = useState(false)
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

  return (
    <LinksContainer>
      <SectionHeader>
        <SectionTitle>
          <HiLink style={{ color: '#58A4B0' }} />
          Links Management
        </SectionTitle>
        <AddButton onClick={() => setShowAddLink(true)}>
          <HiPlus />
          Add Link
        </AddButton>
      </SectionHeader>

      <LinksGrid>
        {/* Add Link Form */}
        {showAddLink && (
          <LinkCard className="add-form">
            <LinkForm>
              <FormTitle>Add New Link</FormTitle>
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
                  placeholder="https://example.com"
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
                  setNewLink({ title: '', url: '', icon: '🔗' })
                }}>
                  Cancel
                </FormButton>
              </FormActions>
            </LinkForm>
          </LinkCard>
        )}

        {/* Existing Links */}
        {links.map((link) => (
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

      {links.length === 0 && !showAddLink && (
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
    </LinksContainer>
  )
}

const LinksContainer = styled.div`
  margin-bottom: 2rem;
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
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

export default LinksSection