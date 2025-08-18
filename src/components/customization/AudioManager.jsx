import React from 'react'
import styled from 'styled-components'
import {
  HiMusicalNote,
  HiXMark,
  HiSpeakerWave,
  HiInformationCircle
} from 'react-icons/hi2'

const AudioManager = ({ 
  showAudioModal,
  setShowAudioModal,
  settings,
  setSettings,
  uploading,
  fileInputRefs,
  handleFileUpload,
  saveAudioSettings
}) => {
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
          {/* Current Audio Section */}
          {settings.audioUrl ? (
            <CurrentAudioSection>
              <h3 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '0.75rem' }}>Current Audio</h3>
              <AudioPlayer controls src={settings.audioUrl} style={{ width: '100%', borderRadius: '8px' }} />
              <AudioControls>
                <AudioControlButton onClick={() => {
                  setSettings(prev => ({ ...prev, audioUrl: '' }))
                  // Auto-save immediately when removing audio
                  setTimeout(() => saveAudioSettings(), 100)
                }}>
                  <HiXMark style={{ marginRight: '0.5rem' }} />
                  Remove
                </AudioControlButton>
              </AudioControls>
            </CurrentAudioSection>
          ) : (
            <EmptyAudioState>
              <HiSpeakerWave style={{ fontSize: '2.5rem', color: '#58A4B0', marginBottom: '0.5rem' }} />
              <h4 style={{ color: '#ffffff', marginBottom: '0.25rem', fontSize: '1rem' }}>No Audio Selected</h4>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0', fontSize: '0.85rem' }}>Upload an audio file to play on your profile</p>
            </EmptyAudioState>
          )}

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
                onChange={(e) => handleFileUpload(e.target.files[0], 'audio')}
                style={{ display: 'none' }}
              />
            </AudioUploadZone>
            
            <AudioFormatInfo>
              <HiInformationCircle style={{ marginRight: '0.5rem' }} />
              MP3, WAV, OGG, M4A (Max: 10MB)
            </AudioFormatInfo>
          </UploadSection>
        </AudioModalBody>
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
  z-index: 1000;
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
  max-width: 600px;
  max-height: 70vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
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
  max-height: calc(80vh - 100px);
  overflow-y: auto;
  
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

const CurrentAudioSection = styled.div`
  background: linear-gradient(145deg, rgba(88, 164, 176, 0.1), rgba(88, 164, 176, 0.05));
  border: 1px solid rgba(88, 164, 176, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`

const AudioPlayer = styled.audio`
  width: 100%;
  margin-bottom: 1rem;
  
  &::-webkit-media-controls-panel {
    background-color: rgba(88, 164, 176, 0.1);
  }
`

const AudioControls = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`

const AudioControlButton = styled.button`
  background: rgba(220, 38, 38, 0.8);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
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

const EmptyAudioState = styled.div`
  text-align: center;
  padding: 2rem;
  background: linear-gradient(145deg, rgba(88, 164, 176, 0.05), rgba(88, 164, 176, 0.02));
  border: 2px dashed rgba(88, 164, 176, 0.3);
  border-radius: 12px;
  margin-bottom: 2rem;
`

const UploadSection = styled.div`
  margin-bottom: 1rem;
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

export default AudioManager