import React from 'react'
import styled from 'styled-components'

const ThemeSection = ({ settings, setSettings, validationErrors }) => {
  const themeColors = [
    { name: 'Ocean', accent: '#58A4B0', bg: '#0F0F23', text: '#FFFFFF' },
    { name: 'Sunset', accent: '#FF6B6B', bg: '#2C1810', text: '#FFFFFF' },
    { name: 'Forest', accent: '#4ECDC4', bg: '#1A2F1A', text: '#FFFFFF' },
    { name: 'Purple', accent: '#8B5CF6', bg: '#1F1B2E', text: '#FFFFFF' },
    { name: 'Rose', accent: '#EC4899', bg: '#2D1B27', text: '#FFFFFF' },
    { name: 'Gold', accent: '#F59E0B', bg: '#2D2416', text: '#FFFFFF' }
  ]

  const applyTheme = (theme) => {
    setSettings(prev => ({
      ...prev,
      accentColor: theme.accent,
      backgroundColor: theme.bg,
      textColor: theme.text
    }))
  }

  return (
    <ThemeContainer>
      <h2 style={{ color: '#ffffff', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Theme & Colors</h2>
      
      {/* Quick Theme Presets */}
      <ThemePresets>
        <h3 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem' }}>Quick Themes</h3>
        <ThemeGrid>
          {themeColors.map((theme) => (
            <ThemeCard
              key={theme.name}
              onClick={() => applyTheme(theme)}
              $accent={theme.accent}
              $bg={theme.bg}
              $isActive={settings.accentColor === theme.accent}
            >
              <div className="theme-preview">
                <div className="theme-bg" style={{ backgroundColor: theme.bg }} />
                <div className="theme-accent" style={{ backgroundColor: theme.accent }} />
              </div>
              <span>{theme.name}</span>
            </ThemeCard>
          ))}
        </ThemeGrid>
      </ThemePresets>

      {/* Custom Colors */}
      <ColorSection>
        <h3 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem' }}>Custom Colors</h3>
        <ColorGrid>
          <ColorPicker>
            <label>Accent Color</label>
            <ColorInputWrapper>
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
              />
              <input
                type="text"
                value={settings.accentColor}
                onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                placeholder="#58A4B0"
              />
            </ColorInputWrapper>
            {validationErrors.accentColor && (
              <ErrorText>{validationErrors.accentColor}</ErrorText>
            )}
          </ColorPicker>

          <ColorPicker>
            <label>Text Color</label>
            <ColorInputWrapper>
              <input
                type="color"
                value={settings.textColor}
                onChange={(e) => setSettings(prev => ({ ...prev, textColor: e.target.value }))}
              />
              <input
                type="text"
                value={settings.textColor}
                onChange={(e) => setSettings(prev => ({ ...prev, textColor: e.target.value }))}
                placeholder="#FFFFFF"
              />
            </ColorInputWrapper>
            {validationErrors.textColor && (
              <ErrorText>{validationErrors.textColor}</ErrorText>
            )}
          </ColorPicker>

          <ColorPicker>
            <label>Background Color</label>
            <ColorInputWrapper>
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
              />
              <input
                type="text"
                value={settings.backgroundColor}
                onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                placeholder="#0F0F23"
              />
            </ColorInputWrapper>
            {validationErrors.backgroundColor && (
              <ErrorText>{validationErrors.backgroundColor}</ErrorText>
            )}
          </ColorPicker>

          <ColorPicker>
            <label>Primary Color</label>
            <ColorInputWrapper>
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
              />
              <input
                type="text"
                value={settings.primaryColor}
                onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                placeholder="#1bbd9a"
              />
            </ColorInputWrapper>
          </ColorPicker>

          <ColorPicker>
            <label>Secondary Color</label>
            <ColorInputWrapper>
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
              />
              <input
                type="text"
                value={settings.secondaryColor}
                onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                placeholder="#EC4899"
              />
            </ColorInputWrapper>
          </ColorPicker>

          <ColorPicker>
            <label>Icon Color</label>
            <ColorInputWrapper>
              <input
                type="color"
                value={settings.iconColor}
                onChange={(e) => setSettings(prev => ({ ...prev, iconColor: e.target.value }))}
              />
              <input
                type="text"
                value={settings.iconColor}
                onChange={(e) => setSettings(prev => ({ ...prev, iconColor: e.target.value }))}
                placeholder="#FFFFFF"
              />
            </ColorInputWrapper>
          </ColorPicker>
        </ColorGrid>
      </ColorSection>
    </ThemeContainer>
  )
}

const ThemeContainer = styled.div`
  margin-bottom: 2rem;
`

const ThemePresets = styled.div`
  margin-bottom: 2rem;
`

const ThemeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const ThemeCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 2px solid ${props => props.$isActive ? props.$accent : 'rgba(88, 164, 176, 0.3)'};
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 600;
  
  &:hover {
    border-color: ${props => props.$accent};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(88, 164, 176, 0.2);
  }
  
  .theme-preview {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    margin: 0 auto 0.5rem auto;
    position: relative;
    overflow: hidden;
    
    .theme-bg {
      width: 100%;
      height: 100%;
      position: absolute;
    }
    
    .theme-accent {
      width: 100%;
      height: 30%;
      position: absolute;
      bottom: 0;
    }
  }
`

const ColorSection = styled.div``

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const ColorPicker = styled.div`
  label {
    display: block;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
`

const ColorInputWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  input[type="color"] {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    background: none;
    
    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }
    
    &::-webkit-color-swatch {
      border: 2px solid rgba(88, 164, 176, 0.3);
      border-radius: 6px;
    }
  }
  
  input[type="text"] {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(88, 164, 176, 0.3);
    border-radius: 8px;
    padding: 0.75rem;
    color: #ffffff;
    font-size: 0.9rem;
    
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

const ErrorText = styled.div`
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`

export default ThemeSection