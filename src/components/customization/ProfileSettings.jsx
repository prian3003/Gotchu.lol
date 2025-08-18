import React from 'react'
import styled from 'styled-components'
import { HiMusicalNote } from 'react-icons/hi2'

const ProfileSettings = ({ settings, setSettings, setShowAudioModal, validationErrors }) => {
  return (
    <ProfileContainer>
      <h2 style={{ color: '#ffffff', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Profile Settings</h2>
      
      {/* Bio Section */}
      <BioSection>
        <label>Bio</label>
        <textarea
          value={settings.bio}
          onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Tell people about yourself..."
          rows={4}
        />
        <CharCount>{settings.bio.length}/500</CharCount>
      </BioSection>

      {/* Description Section */}
      <DescriptionSection>
        <label>Description</label>
        <textarea
          value={settings.description}
          onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Additional description..."
          rows={3}
        />
        <CharCount>{settings.description.length}/300</CharCount>
      </DescriptionSection>

      {/* Audio Section */}
      <AudioSection>
        <div className="audio-header">
          <h3>Profile Audio</h3>
          <AudioButton onClick={() => setShowAudioModal(true)}>
            <HiMusicalNote style={{ marginRight: '0.5rem' }} />
            Audio Manager
          </AudioButton>
        </div>
        
        {settings.audioUrl ? (
          <AudioPreview>
            <div className="audio-info">
              <span>✓ Audio file uploaded</span>
              <p>Manage your audio in the Audio Manager</p>
            </div>
          </AudioPreview>
        ) : (
          <AudioPlaceholder>
            <span>No audio uploaded</span>
            <p>Click Audio Manager to upload a file</p>
          </AudioPlaceholder>
        )}
      </AudioSection>

      {/* Discord Integration */}
      <DiscordSection>
        <h3 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem' }}>Discord Integration</h3>
        <DiscordGrid>
          <ToggleItem>
            <div>
              <label>Discord Presence</label>
              <p>Show your Discord activity on your profile</p>
            </div>
            <ToggleSwitch
              $active={settings.discordPresence}
              onClick={() => setSettings(prev => ({ ...prev, discordPresence: !prev.discordPresence }))}
            >
              <div className="toggle-slider" />
            </ToggleSwitch>
          </ToggleItem>

          <ToggleItem>
            <div>
              <label>Use Discord Avatar</label>
              <p>Use your Discord avatar as profile picture</p>
            </div>
            <ToggleSwitch
              $active={settings.useDiscordAvatar}
              onClick={() => setSettings(prev => ({ ...prev, useDiscordAvatar: !prev.useDiscordAvatar }))}
            >
              <div className="toggle-slider" />
            </ToggleSwitch>
          </ToggleItem>

          <ToggleItem>
            <div>
              <label>Discord Avatar Decoration</label>
              <p>Show Discord avatar decorations</p>
            </div>
            <ToggleSwitch
              $active={settings.discordAvatarDecoration}
              onClick={() => setSettings(prev => ({ ...prev, discordAvatarDecoration: !prev.discordAvatarDecoration }))}
            >
              <div className="toggle-slider" />
            </ToggleSwitch>
          </ToggleItem>
        </DiscordGrid>
      </DiscordSection>
    </ProfileContainer>
  )
}

const ProfileContainer = styled.div`
  margin-bottom: 2rem;
`

const BioSection = styled.div`
  margin-bottom: 2rem;
  
  label {
    display: block;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(88, 164, 176, 0.3);
    border-radius: 8px;
    padding: 0.75rem;
    color: #ffffff;
    font-size: 0.9rem;
    font-family: inherit;
    resize: vertical;
    min-height: 100px;
    
    &:focus {
      outline: none;
      border-color: #58A4B0;
      box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.2);
    }
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }
`

const DescriptionSection = styled.div`
  margin-bottom: 2rem;
  
  label {
    display: block;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(88, 164, 176, 0.3);
    border-radius: 8px;
    padding: 0.75rem;
    color: #ffffff;
    font-size: 0.9rem;
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
    
    &:focus {
      outline: none;
      border-color: #58A4B0;
      box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.2);
    }
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }
`

const CharCount = styled.div`
  text-align: right;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  margin-top: 0.25rem;
`

const AudioSection = styled.div`
  margin-bottom: 2rem;
  
  .audio-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    h3 {
      color: #ffffff;
      font-size: 1rem;
      margin: 0;
    }
  }
`

const AudioButton = styled.button`
  background: linear-gradient(135deg, #58A4B0, #4A8C96);
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
    background: linear-gradient(135deg, #4A8C96, #58A4B0);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(88, 164, 176, 0.3);
  }
`

const AudioPreview = styled.div`
  background: linear-gradient(145deg, rgba(88, 164, 176, 0.1), rgba(88, 164, 176, 0.05));
  border: 1px solid rgba(88, 164, 176, 0.3);
  border-radius: 12px;
  padding: 1rem;
  
  .audio-info {
    span {
      color: #58A4B0;
      font-weight: 600;
      font-size: 0.9rem;
    }
    
    p {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.8rem;
      margin: 0.25rem 0 0 0;
    }
  }
`

const AudioPlaceholder = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(88, 164, 176, 0.3);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  
  span {
    color: rgba(255, 255, 255, 0.6);
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  p {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8rem;
    margin: 0.25rem 0 0 0;
  }
`

const DiscordSection = styled.div`
  h3 {
    margin: 0 0 1rem 0;
  }
`

const DiscordGrid = styled.div`
  display: grid;
  gap: 1rem;
`

const ToggleItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(145deg, rgba(114, 137, 218, 0.1), rgba(114, 137, 218, 0.05));
  border: 1px solid rgba(114, 137, 218, 0.2);
  border-radius: 12px;
  
  label {
    display: block;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem;
    margin: 0;
  }
`

const ToggleSwitch = styled.button`
  width: 60px;
  height: 32px;
  background: ${props => props.$active ? '#7289DA' : 'rgba(255, 255, 255, 0.2)'};
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  .toggle-slider {
    width: 24px;
    height: 24px;
    background: #ffffff;
    border-radius: 50%;
    position: absolute;
    top: 4px;
    left: ${props => props.$active ? '32px' : '4px'};
    transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
`

export default ProfileSettings