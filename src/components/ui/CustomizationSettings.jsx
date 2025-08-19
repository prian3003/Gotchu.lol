import React, { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import FileUpload from './FileUpload'
import { 
  HiPaintBrush, 
  HiSparkles, 
  HiMusicalNote, 
  HiAdjustmentsHorizontal,
  HiEye,
  HiSpeakerWave,
  HiCursorArrowRays,
  HiPhoto
} from 'react-icons/hi2'
import { HiColorSwatch } from 'react-icons/hi'

const CustomizationSettings = ({ settings, onSettingsChange, onSave, isSaving }) => {
  const { colors } = useTheme()
  const [activeSection, setActiveSection] = useState('appearance')
  const [uploadErrors, setUploadErrors] = useState({})

  const sections = [
    {
      id: 'appearance',
      title: 'Appearance',
      icon: HiPaintBrush,
      color: '#FF6B6B'
    },
    {
      id: 'effects', 
      title: 'Effects',
      icon: HiSparkles,
      color: '#4ECDC4'
    },
    {
      id: 'media',
      title: 'Media', 
      icon: HiMusicalNote,
      color: '#45B7D1'
    },
    {
      id: 'advanced',
      title: 'Advanced',
      icon: HiAdjustmentsHorizontal,
      color: '#96CEB4'
    }
  ]

  const colorPresets = [
    { name: 'Ocean', color: '#58A4B0' },
    { name: 'Sunset', color: '#FF6B6B' },
    { name: 'Forest', color: '#4ECDC4' },
    { name: 'Royal', color: '#6C5CE7' },
    { name: 'Fire', color: '#FD79A8' },
    { name: 'Gold', color: '#FDCB6E' },
    { name: 'Purple', color: '#A29BFE' },
    { name: 'Mint', color: '#00CEC9' }
  ]

  const backgroundEffects = [
    { id: 'none', name: 'None', preview: '🚫' },
    { id: 'particles', name: 'Particles', preview: '✨' },
    { id: 'matrix', name: 'Matrix', preview: '🟢' },
    { id: 'waves', name: 'Waves', preview: '🌊' },
    { id: 'gradient', name: 'Gradient', preview: '🎨' },
    { id: 'geometric', name: 'Geometric', preview: '🔷' }
  ]

  const usernameEffects = [
    { id: 'none', name: 'None' },
    { id: 'glow', name: 'Glow' },
    { id: 'rainbow', name: 'Rainbow' },
    { id: 'typewriter', name: 'Typewriter' },
    { id: 'bounce', name: 'Bounce' },
    { id: 'shake', name: 'Shake' }
  ]

  const handleUploadSuccess = (type, fileData) => {
    // Map backend asset types to settings keys
    const settingsMap = {
      backgroundImage: 'background',
      avatar: 'avatar',
      audio: 'audio',
      cursor: 'customCursor'
    }
    
    const settingKey = settingsMap[type] || type
    
    onSettingsChange({
      ...settings,
      [`${settingKey}Url`]: fileData.url,
      [`${settingKey}FileName`]: fileData.fileName
    })
    
    // Clear any previous errors
    setUploadErrors(prev => ({ ...prev, [type]: null }))
  }

  const handleUploadError = (type, error) => {
    setUploadErrors(prev => ({ ...prev, [type]: error }))
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HiColorSwatch size={20} style={{ color: colors.accent }} />
                <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: '600' }}>
                  Theme
                </h3>
              </div>
              <div className="flex gap-3">
                {['light', 'dark', 'auto'].map(theme => (
                  <button
                    key={theme}
                    onClick={() => onSettingsChange({ ...settings, theme })}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '8px',
                      border: `2px solid ${settings.theme === theme ? colors.accent : colors.border}`,
                      backgroundColor: settings.theme === theme ? `${colors.accent}20` : colors.surface,
                      color: colors.text,
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HiPaintBrush size={20} style={{ color: colors.accent }} />
                <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: '600' }}>
                  Accent Color
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {colorPresets.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => onSettingsChange({ ...settings, accentColor: preset.color })}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: `2px solid ${settings.accentColor === preset.color ? colors.accent : colors.border}`,
                      backgroundColor: colors.surface,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: preset.color,
                        border: '2px solid rgba(255,255,255,0.2)'
                      }}
                    />
                    <span style={{ color: colors.text, fontSize: '12px' }}>
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Upload */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HiPhoto size={20} style={{ color: colors.accent }} />
                <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: '600' }}>
                  Background Image
                </h3>
              </div>
              <FileUpload
                type="backgroundImage"
                currentFile={settings.backgroundUrl ? { 
                  originalName: settings.backgroundFileName || 'Current background',
                  url: settings.backgroundUrl 
                } : null}
                onUploadSuccess={(fileData) => handleUploadSuccess('backgroundImage', fileData)}
                onUploadError={(error) => handleUploadError('backgroundImage', error)}
              />
              {uploadErrors.backgroundImage && (
                <div style={{ 
                  color: '#EF4444', 
                  fontSize: '14px', 
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#FEF2F2',
                  borderRadius: '6px',
                  border: '1px solid #FECACA'
                }}>
                  {uploadErrors.backgroundImage}
                </div>
              )}
            </div>

            {/* Avatar Upload */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HiPhoto size={20} style={{ color: colors.accent }} />
                <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: '600' }}>
                  Profile Avatar
                </h3>
              </div>
              <FileUpload
                type="avatar"
                currentFile={settings.avatarUrl ? { 
                  originalName: settings.avatarFileName || 'Current avatar',
                  url: settings.avatarUrl 
                } : null}
                onUploadSuccess={(fileData) => handleUploadSuccess('avatar', fileData)}
                onUploadError={(error) => handleUploadError('avatar', error)}
              />
              {uploadErrors.avatar && (
                <div style={{ 
                  color: '#EF4444', 
                  fontSize: '14px', 
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#FEF2F2',
                  borderRadius: '6px',
                  border: '1px solid #FECACA'
                }}>
                  {uploadErrors.avatar}
                </div>
              )}
            </div>
          </div>
        )

      case 'effects':
        return (
          <div className="space-y-6">
            {/* Background Effects */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HiSparkles size={20} style={{ color: colors.accent }} />
                <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: '600' }}>
                  Background Effects
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {backgroundEffects.map(effect => (
                  <button
                    key={effect.id}
                    onClick={() => onSettingsChange({ ...settings, backgroundEffect: effect.id })}
                    style={{
                      padding: '16px 12px',
                      borderRadius: '8px',
                      border: `2px solid ${settings.backgroundEffect === effect.id ? colors.accent : colors.border}`,
                      backgroundColor: settings.backgroundEffect === effect.id ? `${colors.accent}20` : colors.surface,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                      {effect.preview}
                    </div>
                    <div style={{ color: colors.text, fontSize: '14px', fontWeight: '500' }}>
                      {effect.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Username Effects */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HiCursorArrowRays size={20} style={{ color: colors.accent }} />
                <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: '600' }}>
                  Username Effects
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {usernameEffects.map(effect => (
                  <button
                    key={effect.id}
                    onClick={() => onSettingsChange({ ...settings, usernameEffect: effect.id })}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: `2px solid ${settings.usernameEffect === effect.id ? colors.accent : colors.border}`,
                      backgroundColor: settings.usernameEffect === effect.id ? `${colors.accent}20` : colors.surface,
                      color: colors.text,
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    {effect.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Animations Toggle */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                    Enable Animations
                  </h3>
                  <p style={{ color: colors.muted, fontSize: '14px' }}>
                    Turn on smooth transitions and animations
                  </p>
                </div>
                <button
                  onClick={() => onSettingsChange({ ...settings, enableAnimations: !settings.enableAnimations })}
                  style={{
                    width: '48px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: settings.enableAnimations ? colors.accent : colors.border,
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: settings.enableAnimations ? '26px' : '2px',
                      transition: 'all 0.2s'
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        )

      case 'media':
        return (
          <div className="space-y-6">
            {/* Audio Upload */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HiMusicalNote size={20} style={{ color: colors.accent }} />
                <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: '600' }}>
                  Background Audio
                </h3>
              </div>
              <FileUpload
                type="audio"
                currentFile={settings.audioUrl ? { 
                  originalName: settings.audioFileName || 'Current audio',
                  url: settings.audioUrl 
                } : null}
                onUploadSuccess={(fileData) => handleUploadSuccess('audio', fileData)}
                onUploadError={(error) => handleUploadError('audio', error)}
              />
              {uploadErrors.audio && (
                <div style={{ 
                  color: '#EF4444', 
                  fontSize: '14px', 
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#FEF2F2',
                  borderRadius: '6px',
                  border: '1px solid #FECACA'
                }}>
                  {uploadErrors.audio}
                </div>
              )}
            </div>

            {/* Volume Control */}
            {settings.audioUrl && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <HiSpeakerWave size={20} style={{ color: colors.accent }} />
                  <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                    Volume Level: {settings.volumeLevel}%
                  </h3>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.volumeLevel}
                  onChange={(e) => onSettingsChange({ ...settings, volumeLevel: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: colors.border,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
            )}

            {/* Auto Play Toggle */}
            {settings.audioUrl && (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                      Auto Play
                    </h3>
                    <p style={{ color: colors.muted, fontSize: '14px' }}>
                      Start playing when visitors arrive
                    </p>
                  </div>
                  <button
                    onClick={() => onSettingsChange({ ...settings, autoPlay: !settings.autoPlay })}
                    style={{
                      width: '48px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: settings.autoPlay ? colors.accent : colors.border,
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        position: 'absolute',
                        top: '2px',
                        left: settings.autoPlay ? '26px' : '2px',
                        transition: 'all 0.2s'
                      }}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        )

      case 'advanced':
        return (
          <div className="space-y-6">
            {/* Custom Cursor */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HiCursorArrowRays size={20} style={{ color: colors.accent }} />
                <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: '600' }}>
                  Custom Cursor
                </h3>
              </div>
              <FileUpload
                type="cursor"
                currentFile={settings.customCursor ? { 
                  originalName: settings.cursorFileName || 'Current cursor',
                  url: settings.customCursor 
                } : null}
                onUploadSuccess={(fileData) => handleUploadSuccess('customCursor', fileData)}
                onUploadError={(error) => handleUploadError('cursor', error)}
              />
              {uploadErrors.cursor && (
                <div style={{ 
                  color: '#EF4444', 
                  fontSize: '14px', 
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#FEF2F2',
                  borderRadius: '6px',
                  border: '1px solid #FECACA'
                }}>
                  {uploadErrors.cursor}
                </div>
              )}
            </div>

            {/* Profile Opacity */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HiEye size={20} style={{ color: colors.accent }} />
                <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                  Profile Opacity: {settings.profileOpacity}%
                </h3>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.profileOpacity}
                onChange={(e) => onSettingsChange({ ...settings, profileOpacity: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: colors.border,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Profile Blur */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HiAdjustmentsHorizontal size={20} style={{ color: colors.accent }} />
                <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                  Background Blur: {settings.profileBlur}px
                </h3>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={settings.profileBlur}
                onChange={(e) => onSettingsChange({ ...settings, profileBlur: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: colors.border,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Show Badges Toggle */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                    Show Badges
                  </h3>
                  <p style={{ color: colors.muted, fontSize: '14px' }}>
                    Display achievement badges on profile
                  </p>
                </div>
                <button
                  onClick={() => onSettingsChange({ ...settings, showBadges: !settings.showBadges })}
                  style={{
                    width: '48px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: settings.showBadges ? colors.accent : colors.border,
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: settings.showBadges ? '26px' : '2px',
                      transition: 'all 0.2s'
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={{ 
      backgroundColor: colors.background, 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            color: colors.text, 
            fontSize: '32px', 
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            Customize Your Profile
          </h1>
          <p style={{ 
            color: colors.muted, 
            fontSize: '16px'
          }}>
            Make your profile uniquely yours
          </p>
        </div>

        <div style={{ display: 'flex', gap: '32px' }}>
          {/* Navigation Sidebar */}
          <div style={{ 
            width: '280px',
            flexShrink: 0
          }}>
            <div style={{
              backgroundColor: colors.surface,
              borderRadius: '16px',
              padding: '8px',
              border: `1px solid ${colors.border}`
            }}>
              {sections.map(section => {
                const IconComponent = section.icon
                const isActive = activeSection === section.id
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: isActive ? `${section.color}20` : 'transparent',
                      color: isActive ? section.color : colors.text,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '16px',
                      fontWeight: '500'
                    }}
                  >
                    <IconComponent size={20} />
                    {section.title}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1 }}>
            <div style={{
              backgroundColor: colors.surface,
              borderRadius: '16px',
              padding: '32px',
              border: `1px solid ${colors.border}`,
              minHeight: '600px'
            }}>
              {renderSection()}
            </div>

            {/* Save Button */}
            <div style={{ 
              marginTop: '24px',
              textAlign: 'center'
            }}>
              <button
                onClick={onSave}
                disabled={isSaving}
                style={{
                  padding: '16px 32px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: colors.accent,
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1,
                  transition: 'all 0.2s',
                  minWidth: '160px'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomizationSettings