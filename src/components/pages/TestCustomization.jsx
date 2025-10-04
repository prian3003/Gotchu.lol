import React, { useState } from 'react'
import CustomizationSettings from '../ui/CustomizationSettings'
import { useTheme } from '../../contexts/ThemeContext'
import { HiArrowLeft } from 'react-icons/hi2'

const TestCustomization = () => {
  const { colors } = useTheme()
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    // Appearance
    theme: 'dark',
    accentColor: '#58A4B0',
    backgroundUrl: '',
    backgroundFileName: '',
    avatarUrl: '',
    avatarFileName: '',
    
    // Effects
    backgroundEffect: 'particles',
    usernameEffect: 'glow',
    enableAnimations: true,
    
    // Audio
    audioUrl: '',
    audioFileName: '',
    volumeLevel: 50,
    autoPlay: false,
    
    // Advanced
    customCursor: '',
    cursorFileName: '',
    profileOpacity: 90,
    profileBlur: 0,
    showBadges: true
  })

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      
      // In real implementation, this would save to your backend/database
      // await saveUserSettings(settings)
      
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
      {/* Header with back button */}
      <div style={{ 
        padding: '20px',
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.surface
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              color: colors.text,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <HiArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Customization Settings */}
      <CustomizationSettings
        settings={settings}
        onSettingsChange={setSettings}
        onSave={handleSave}
        isSaving={isSaving}
      />
      
      {/* Debug Panel (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '300px',
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '16px',
          fontSize: '12px',
          color: colors.muted,
          maxHeight: '400px',
          overflow: 'auto',
          zIndex: 1000
        }}>
          <h4 style={{ color: colors.text, marginBottom: '8px' }}>Debug: Current Settings</h4>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '10px' }}>
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default TestCustomization