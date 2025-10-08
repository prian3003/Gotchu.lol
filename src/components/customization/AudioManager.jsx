import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import {
  HiMusicalNote,
  HiXMark,
  HiSpeakerWave,
  HiInformationCircle,
  HiTrash,
  HiPlay,
  HiPause,
  HiCheck
} from 'react-icons/hi2'
import { STORAGE_BUCKETS } from '../../lib/supabase'
import { API_BASE_URL } from '../../config/api'

const AudioManager = ({ 
  showAudioModal,
  setShowAudioModal,
  settings,
  setSettings,
  uploading,
  fileInputRefs,
  handleFileUpload,
  saveAudioSettings,
  onAudioSaved
}) => {
  const [audioFiles, setAudioFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedAudio, setSelectedAudio] = useState(null)
  const [playingAudio, setPlayingAudio] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [userId, setUserId] = useState(null)

  // Get user ID from dashboard API
  const fetchUserId = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
      })

      if (!response.ok) {
        console.error('Failed to fetch user data:', response.status)
        return null
      }

      const data = await response.json()
      
      if (data.success && data.data && data.data.user) {
        return data.data.user.id
      }
      
      return null
    } catch (error) {
      console.error('Error fetching user ID:', error)
      return null
    }
  }

  // Load audio files from backend API
  const loadAudioFiles = async () => {
    setLoading(true)
    try {

      const response = await fetch(`${API_BASE_URL}/audio/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
      })

      if (!response.ok) {
        console.error('Failed to fetch audio files:', response.status)
        return
      }

      const data = await response.json()

      if (data.success && data.data) {
        // Handle empty array or missing files property
        const files = data.data.files || []
        setAudioFiles(files)
        if (files.length === 0) {
          console.log('No audio files found for this user')
        }
      } else {
        console.error('Failed to load audio files:', data.message || 'Unknown error')
      }
    } catch (error) {
      console.error('Error loading audio files:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load files when modal opens
  useEffect(() => {
    if (showAudioModal) {
      const initializeAudioManager = async () => {
        const id = await fetchUserId()
        if (id) {
          setUserId(id)
        }
        // Load audio files directly from backend API
        loadAudioFiles()
      }
      initializeAudioManager()
    }
  }, [showAudioModal])

  // Handle audio selection
  const handleSelectAudio = async (audioFile) => {
    setSelectedAudio(audioFile.url)
    
    // Save directly to backend without triggering settings state change
    try {
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) return

      const response = await fetch(`${API_BASE_URL}/customization/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          // Only update audio URL, keep other settings unchanged
          audio_url: audioFile.url,
          volume_level: settings.volumeLevel,
          volume_control: settings.volumeControl,
          // Include current settings to avoid validation errors
          theme: settings.theme,
          accent_color: settings.accentColor,
          text_color: settings.textColor,
          background_color: settings.backgroundColor,
          primary_color: settings.primaryColor,
          secondary_color: settings.secondaryColor,
          icon_color: settings.iconColor,
          description: settings.description || '',
          bio: settings.bio || '',
          background_effect: settings.backgroundEffect,
          username_effect: settings.usernameEffect,
          show_badges: settings.showBadges,
          profile_blur: settings.profileBlur,
          profile_opacity: settings.profileOpacity,
          profile_gradient: settings.profileGradient,
          glow_username: settings.glowUsername,
          glow_socials: settings.glowSocials,
          glow_badges: settings.glowBadges,
          animated_title: settings.animatedTitle,
          monochrome_icons: settings.monochromeIcons,
          swap_box_colors: settings.swapBoxColors,
          discord_presence: settings.discordPresence,
          use_discord_avatar: settings.useDiscordAvatar,
          discord_avatar_decoration: settings.discordAvatarDecoration,
          background_url: settings.backgroundUrl,
          cursor_url: settings.cursorUrl
        })
      })

      if (response.ok) {
        // Update local settings state AFTER successful save
        setSettings(prev => ({ ...prev, audioUrl: audioFile.url }))
        // Notify parent component that audio was saved
        if (onAudioSaved) {
          onAudioSaved({ ...settings, audioUrl: audioFile.url })
        }
      } else {
        console.error('Failed to save audio settings:', response.status)
      }
    } catch (error) {
      console.error('Error saving audio:', error)
    }
  }

  // Handle removing audio selection
  const handleRemoveAudio = async () => {
    setSelectedAudio(null)
    
    // Save directly to backend without triggering settings state change
    try {
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) return

      const response = await fetch(`${API_BASE_URL}/customization/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          // Remove audio URL, keep other settings unchanged
          audio_url: '',
          volume_level: settings.volumeLevel,
          volume_control: settings.volumeControl,
          // Include current settings to avoid validation errors
          theme: settings.theme,
          accent_color: settings.accentColor,
          text_color: settings.textColor,
          background_color: settings.backgroundColor,
          primary_color: settings.primaryColor,
          secondary_color: settings.secondaryColor,
          icon_color: settings.iconColor,
          description: settings.description || '',
          bio: settings.bio || '',
          background_effect: settings.backgroundEffect,
          username_effect: settings.usernameEffect,
          show_badges: settings.showBadges,
          profile_blur: settings.profileBlur,
          profile_opacity: settings.profileOpacity,
          profile_gradient: settings.profileGradient,
          glow_username: settings.glowUsername,
          glow_socials: settings.glowSocials,
          glow_badges: settings.glowBadges,
          animated_title: settings.animatedTitle,
          monochrome_icons: settings.monochromeIcons,
          swap_box_colors: settings.swapBoxColors,
          discord_presence: settings.discordPresence,
          use_discord_avatar: settings.useDiscordAvatar,
          discord_avatar_decoration: settings.discordAvatarDecoration,
          background_url: settings.backgroundUrl,
          cursor_url: settings.cursorUrl
        })
      })

      if (response.ok) {
        // Update local settings state AFTER successful save
        setSettings(prev => ({ ...prev, audioUrl: '' }))
        // Notify parent component that audio was removed
        if (onAudioSaved) {
          onAudioSaved({ ...settings, audioUrl: '' })
        }
      } else {
        console.error('Failed to remove audio settings:', response.status)
      }
    } catch (error) {
      console.error('Error removing audio:', error)
    }
  }

  // Handle audio deletion
  const handleDeleteAudio = async (audioFile) => {
    setDeleteLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/assets/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use httpOnly cookies for auth
        body: JSON.stringify({
          filePath: audioFile.filePath,
          assetType: 'audio'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Remove from local state
          setAudioFiles(prev => prev.filter(file => file.fileName !== audioFile.fileName))
          
          // If this was the currently selected audio, remove it
          if (settings.audioUrl === audioFile.url) {
            await handleRemoveAudio()
          }
          
          setShowDeleteConfirm(null)
        } else {
          console.error('Error deleting file:', data.message)
        }
      } else {
        console.error('Failed to delete audio file:', response.status)
      }
    } catch (error) {
      console.error('Error deleting audio:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle audio playback
  const togglePlayback = (audioUrl) => {
    if (playingAudio === audioUrl) {
      setPlayingAudio(null)
    } else {
      setPlayingAudio(audioUrl)
    }
  }

  if (!showAudioModal) return null

  return (
    <AudioManagerModal>
      <AudioModalOverlay onClick={() => setShowAudioModal(false)} />
      <AudioModalContent>
        <AudioModalHeader>
          <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.5rem', fontWeight: '600' }}>
            <HiMusicalNote style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Audio Manager
          </h2>
          <button 
            onClick={() => setShowAudioModal(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '1.5rem',
              padding: '0.5rem'
            }}
          >
            <HiXMark />
          </button>
        </AudioModalHeader>

        <AudioModalBody>
          {/* Audio Library Section */}
          <AudioLibrarySection>
            <AudioLibraryHeader>
              <h3 style={{ color: '#ffffff', fontSize: '1rem', margin: 0 }}>Your Audio Library</h3>
              {settings.audioUrl && (
                <RemoveAudioButton onClick={handleRemoveAudio}>
                  <HiXMark style={{ marginRight: '0.5rem' }} />
                  Remove Selected Audio
                </RemoveAudioButton>
              )}
            </AudioLibraryHeader>
            {loading ? (
              <LoadingState>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid rgba(88, 164, 176, 0.3)',
                  borderTop: '2px solid #58A4B0',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '0.75rem'
                }} />
                <p style={{ color: '#58A4B0', margin: 0 }}>Loading audio files...</p>
              </LoadingState>
            ) : audioFiles.length > 0 ? (
              <AudioGrid>
                {audioFiles.map((audioFile, index) => (
                  <AudioFileCard key={index} $isSelected={settings.audioUrl === audioFile.url}>
                    <AudioFileHeader>
                      <AudioFileName>{audioFile.name}</AudioFileName>
                      <AudioFileActions>
                        <AudioActionButton
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePlayback(audioFile.url)
                          }}
                          $variant="play"
                        >
                          {playingAudio === audioFile.url ? <HiPause /> : <HiPlay />}
                        </AudioActionButton>
                        <AudioActionButton
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowDeleteConfirm(audioFile)
                          }}
                          $variant="delete"
                        >
                          <HiTrash />
                        </AudioActionButton>
                      </AudioFileActions>
                    </AudioFileHeader>
                    
                    <AudioFilePreview>
                      <audio 
                        controls 
                        src={audioFile.url}
                        style={{ width: '100%', height: '30px' }}
                        onPlay={() => setPlayingAudio(audioFile.url)}
                        onPause={() => setPlayingAudio(null)}
                        onEnded={() => setPlayingAudio(null)}
                      />
                    </AudioFilePreview>

                    <AudioFileFooter>
                      <AudioSelectButton
                        onClick={() => handleSelectAudio(audioFile)}
                        $isSelected={settings.audioUrl === audioFile.url}
                      >
                        {settings.audioUrl === audioFile.url ? (
                          <>
                            <HiCheck style={{ marginRight: '0.5rem' }} />
                            Selected
                          </>
                        ) : (
                          'Select'
                        )}
                      </AudioSelectButton>
                    </AudioFileFooter>
                  </AudioFileCard>
                ))}
              </AudioGrid>
            ) : (
              <EmptyLibraryState>
                <HiMusicalNote style={{ fontSize: '2rem', color: 'rgba(88, 164, 176, 0.5)', marginBottom: '0.5rem' }} />
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.9rem' }}>
                  {userId ? 'No audio files uploaded yet' : 'Loading user data...'}
                </p>
                {userId && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', margin: '0.5rem 0 0 0', fontSize: '0.8rem' }}>
                    User ID: {userId}
                  </p>
                )}
              </EmptyLibraryState>
            )}
          </AudioLibrarySection>

          {/* Upload Section */}
          <UploadSection>
            <h3 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '0.75rem' }}>Upload New Audio</h3>
            <AudioUploadZone
              onClick={() => fileInputRefs.current.audio?.click()}
              style={{
                border: uploading.audio ? '2px solid #58A4B0' : '2px dashed rgba(88, 164, 176, 0.3)',
                padding: '1.5rem'
              }}
            >
              {uploading.audio ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid rgba(88, 164, 176, 0.3)',
                    borderTop: '2px solid #58A4B0',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '0.75rem'
                  }} />
                  <p style={{ color: '#58A4B0', fontWeight: '600', margin: 0 }}>Uploading...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiSpeakerWave style={{ fontSize: '1.5rem', color: '#58A4B0', marginRight: '0.75rem' }} />
                  <div>
                    <h4 style={{ color: '#ffffff', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Drop audio file here</h4>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0', fontSize: '0.8rem' }}>or click to browse</p>
                  </div>
                </div>
              )}
              <input
                ref={el => fileInputRefs.current.audio = el}
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  handleFileUpload(e.target.files[0], 'audio')
                  // Reload the library after upload
                  setTimeout(() => {
                    loadAudioFiles()
                  }, 1000)
                }}
                style={{ display: 'none' }}
              />
            </AudioUploadZone>
            
            <AudioFormatInfo>
              <HiInformationCircle style={{ marginRight: '0.5rem' }} />
              MP3, WAV, OGG, M4A, OPUS (Max: 10MB)
            </AudioFormatInfo>
          </UploadSection>
        </AudioModalBody>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <DeleteConfirmModal>
            <DeleteConfirmOverlay onClick={() => setShowDeleteConfirm(null)} />
            <DeleteConfirmContent>
              <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Delete Audio File?</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>
                Are you sure you want to delete "{showDeleteConfirm.name}"? This action cannot be undone.
              </p>
              <DeleteConfirmActions>
                <DeleteConfirmButton
                  onClick={() => setShowDeleteConfirm(null)}
                  $variant="cancel"
                >
                  Cancel
                </DeleteConfirmButton>
                <DeleteConfirmButton
                  onClick={() => handleDeleteAudio(showDeleteConfirm)}
                  $variant="delete"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </DeleteConfirmButton>
              </DeleteConfirmActions>
            </DeleteConfirmContent>
          </DeleteConfirmModal>
        )}
      </AudioModalContent>
    </AudioManagerModal>
  )
}

const AudioManagerModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`

const AudioModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
`

const AudioModalContent = styled.div`
  position: relative;
  background: linear-gradient(145deg, rgba(15, 15, 35, 0.95), rgba(20, 20, 40, 0.95));
  border: 1px solid rgba(88, 164, 176, 0.2);
  border-radius: 20px;
  width: 100%;
  max-width: 800px;
  max-height: 85vh;
  min-height: 600px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
`

const AudioModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(88, 164, 176, 0.2);
  background: linear-gradient(135deg, rgba(88, 164, 176, 0.1), rgba(88, 164, 176, 0.05));
`

const AudioModalBody = styled.div`
  padding: 2rem;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-height: 0;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #58A4B0;
    border-radius: 4px;
    
    &:hover {
      background: #4A8C96;
    }
  }
`


const UploadSection = styled.div`
  flex-shrink: 0;
  min-height: 200px;
`

const AudioUploadZone = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
  
  &:hover {
    background: linear-gradient(145deg, rgba(88, 164, 176, 0.08), rgba(88, 164, 176, 0.03));
    border-color: rgba(88, 164, 176, 0.5) !important;
    transform: translateY(-2px);
  }
`

const AudioFormatInfo = styled.div`
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  justify-content: center;
`

const AudioLibrarySection = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`

const AudioLibraryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`

const RemoveAudioButton = styled.button`
  background: rgba(220, 38, 38, 0.8);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(220, 38, 38, 1);
    transform: translateY(-1px);
  }
`

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(145deg, rgba(88, 164, 176, 0.05), rgba(88, 164, 176, 0.02));
  border-radius: 12px;
`

const AudioGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  min-height: 200px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #58A4B0;
    border-radius: 3px;
    
    &:hover {
      background: #4A8C96;
    }
  }
`

const AudioFileCard = styled.div`
  background: linear-gradient(145deg, 
    ${props => props.$isSelected ? 'rgba(88, 164, 176, 0.2)' : 'rgba(255, 255, 255, 0.05)'}, 
    ${props => props.$isSelected ? 'rgba(88, 164, 176, 0.1)' : 'rgba(255, 255, 255, 0.02)'}
  );
  border: 1px solid ${props => props.$isSelected ? 'rgba(88, 164, 176, 0.5)' : 'rgba(88, 164, 176, 0.2)'};
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(145deg, rgba(88, 164, 176, 0.15), rgba(88, 164, 176, 0.08));
    border-color: rgba(88, 164, 176, 0.4);
    transform: translateY(-2px);
  }
`

const AudioFileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`

const AudioFileName = styled.div`
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 600;
  flex: 1;
  margin-right: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const AudioFileActions = styled.div`
  display: flex;
  gap: 0.5rem;
`

const AudioActionButton = styled.button`
  background: ${props => props.$variant === 'delete' ? 'rgba(220, 38, 38, 0.8)' : 'rgba(88, 164, 176, 0.8)'};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.4rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 28px;
  height: 28px;
  
  &:hover {
    background: ${props => props.$variant === 'delete' ? 'rgba(220, 38, 38, 1)' : 'rgba(88, 164, 176, 1)'};
    transform: translateY(-1px);
  }
`

const AudioFilePreview = styled.div`
  margin-bottom: 0.75rem;
  
  audio {
    width: 100%;
    height: 30px;
    border-radius: 6px;
    
    &::-webkit-media-controls-panel {
      background-color: rgba(88, 164, 176, 0.1);
    }
  }
`

const AudioFileFooter = styled.div`
  display: flex;
  justify-content: center;
`

const AudioSelectButton = styled.button`
  background: ${props => props.$isSelected ? 'rgba(34, 197, 94, 0.8)' : 'rgba(88, 164, 176, 0.8)'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 100%;
  
  &:hover {
    background: ${props => props.$isSelected ? 'rgba(34, 197, 94, 1)' : 'rgba(88, 164, 176, 1)'};
    transform: translateY(-1px);
  }
`

const EmptyLibraryState = styled.div`
  text-align: center;
  padding: 2rem;
  background: linear-gradient(145deg, rgba(88, 164, 176, 0.05), rgba(88, 164, 176, 0.02));
  border: 2px dashed rgba(88, 164, 176, 0.3);
  border-radius: 12px;
`

const DeleteConfirmModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`

const DeleteConfirmOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
`

const DeleteConfirmContent = styled.div`
  position: relative;
  background: linear-gradient(145deg, rgba(15, 15, 35, 0.95), rgba(20, 20, 40, 0.95));
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 16px;
  padding: 2rem;
  min-width: 400px;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
`

const DeleteConfirmActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`

const DeleteConfirmButton = styled.button`
  background: ${props => props.$variant === 'cancel' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(220, 38, 38, 0.8)'};
  color: white;
  border: 1px solid ${props => props.$variant === 'cancel' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(220, 38, 38, 0.5)'};
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  
  &:hover {
    background: ${props => props.$variant === 'cancel' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(220, 38, 38, 1)'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

export default AudioManager