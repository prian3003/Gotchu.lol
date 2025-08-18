import React from 'react'
import styled from 'styled-components'

const EffectsSection = ({ settings, setSettings, validationErrors }) => {
  const backgroundEffects = [
    { value: '', label: 'None' },
    { value: 'particles', label: 'Particles' },
    { value: 'matrix', label: 'Matrix' },
    { value: 'waves', label: 'Waves' },
    { value: 'gradient', label: 'Gradient' },
    { value: 'geometric', label: 'Geometric' }
  ]

  const usernameEffects = [
    { value: '', label: 'None' },
    { value: 'glow', label: 'Glow' },
    { value: 'rainbow', label: 'Rainbow' },
    { value: 'typewriter', label: 'Typewriter' },
    { value: 'bounce', label: 'Bounce' },
    { value: 'fade', label: 'Fade' }
  ]

  return (
    <EffectsContainer>
      <h2 style={{ color: '#ffffff', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Effects & Animations</h2>
      
      {/* Background Effects */}
      <EffectGroup>
        <h3 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem' }}>Background Effects</h3>
        <EffectGrid>
          {backgroundEffects.map((effect) => (
            <EffectCard
              key={effect.value}
              $isActive={settings.backgroundEffect === effect.value}
              onClick={() => setSettings(prev => ({ ...prev, backgroundEffect: effect.value }))}
            >
              <div className="effect-preview">
                {effect.value === 'particles' && <div className="particles-demo">●●●</div>}
                {effect.value === 'matrix' && <div className="matrix-demo">01010</div>}
                {effect.value === 'waves' && <div className="waves-demo">～～～</div>}
                {effect.value === 'gradient' && <div className="gradient-demo"></div>}
                {effect.value === 'geometric' && <div className="geometric-demo">◆◇◆</div>}
                {effect.value === '' && <div className="none-demo">✕</div>}
              </div>
              <span>{effect.label}</span>
            </EffectCard>
          ))}
        </EffectGrid>
      </EffectGroup>

      {/* Username Effects */}
      <EffectGroup>
        <h3 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem' }}>Username Effects</h3>
        <EffectGrid>
          {usernameEffects.map((effect) => (
            <EffectCard
              key={effect.value}
              $isActive={settings.usernameEffect === effect.value}
              onClick={() => setSettings(prev => ({ ...prev, usernameEffect: effect.value }))}
            >
              <div className="effect-preview">
                {effect.value === 'glow' && <div className="glow-demo">✨</div>}
                {effect.value === 'rainbow' && <div className="rainbow-demo">🌈</div>}
                {effect.value === 'typewriter' && <div className="typewriter-demo">|</div>}
                {effect.value === 'bounce' && <div className="bounce-demo">↕</div>}
                {effect.value === 'fade' && <div className="fade-demo">⚪</div>}
                {effect.value === '' && <div className="none-demo">✕</div>}
              </div>
              <span>{effect.label}</span>
            </EffectCard>
          ))}
        </EffectGrid>
      </EffectGroup>

      {/* Visual Settings */}
      <VisualSettings>
        <h3 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem' }}>Visual Settings</h3>
        <SettingsGrid>
          <SliderSetting>
            <div className="slider-label">
              <span>Profile Opacity</span>
              <span>{settings.profileOpacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.profileOpacity}
              onChange={(e) => setSettings(prev => ({ ...prev, profileOpacity: parseInt(e.target.value) }))}
              className="slider"
              style={{
                background: `linear-gradient(to right, #58A4B0 0%, #58A4B0 ${settings.profileOpacity}%, rgba(255,255,255,0.2) ${settings.profileOpacity}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            {validationErrors.profileOpacity && (
              <ErrorText>{validationErrors.profileOpacity}</ErrorText>
            )}
          </SliderSetting>

          <SliderSetting>
            <div className="slider-label">
              <span>Profile Blur</span>
              <span>{settings.profileBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={settings.profileBlur}
              onChange={(e) => setSettings(prev => ({ ...prev, profileBlur: parseInt(e.target.value) }))}
              className="slider"
              style={{
                background: `linear-gradient(to right, #58A4B0 0%, #58A4B0 ${(settings.profileBlur / 50) * 100}%, rgba(255,255,255,0.2) ${(settings.profileBlur / 50) * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            {validationErrors.profileBlur && (
              <ErrorText>{validationErrors.profileBlur}</ErrorText>
            )}
          </SliderSetting>
        </SettingsGrid>
      </VisualSettings>

      {/* Toggle Settings */}
      <ToggleSettings>
        <h3 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem' }}>Toggle Effects</h3>
        <ToggleGrid>
          <ToggleItem>
            <div>
              <label>Profile Gradient</label>
              <p>Enable gradient background on profile card</p>
            </div>
            <ToggleSwitch
              $active={settings.profileGradient}
              onClick={() => setSettings(prev => ({ ...prev, profileGradient: !prev.profileGradient }))}
            >
              <div className="toggle-slider" />
            </ToggleSwitch>
          </ToggleItem>

          <ToggleItem>
            <div>
              <label>Glow Username</label>
              <p>Add glow effect to username text</p>
            </div>
            <ToggleSwitch
              $active={settings.glowUsername}
              onClick={() => setSettings(prev => ({ ...prev, glowUsername: !prev.glowUsername }))}
            >
              <div className="toggle-slider" />
            </ToggleSwitch>
          </ToggleItem>

          <ToggleItem>
            <div>
              <label>Glow Socials</label>
              <p>Add glow effect to social icons</p>
            </div>
            <ToggleSwitch
              $active={settings.glowSocials}
              onClick={() => setSettings(prev => ({ ...prev, glowSocials: !prev.glowSocials }))}
            >
              <div className="toggle-slider" />
            </ToggleSwitch>
          </ToggleItem>

          <ToggleItem>
            <div>
              <label>Glow Badges</label>
              <p>Add glow effect to badges</p>
            </div>
            <ToggleSwitch
              $active={settings.glowBadges}
              onClick={() => setSettings(prev => ({ ...prev, glowBadges: !prev.glowBadges }))}
            >
              <div className="toggle-slider" />
            </ToggleSwitch>
          </ToggleItem>

          <ToggleItem>
            <div>
              <label>Show Badges</label>
              <p>Display verification and achievement badges</p>
            </div>
            <ToggleSwitch
              $active={settings.showBadges}
              onClick={() => setSettings(prev => ({ ...prev, showBadges: !prev.showBadges }))}
            >
              <div className="toggle-slider" />
            </ToggleSwitch>
          </ToggleItem>

          <ToggleItem>
            <div>
              <label>Animated Title</label>
              <p>Enable animated title effects</p>
            </div>
            <ToggleSwitch
              $active={settings.animatedTitle}
              onClick={() => setSettings(prev => ({ ...prev, animatedTitle: !prev.animatedTitle }))}
            >
              <div className="toggle-slider" />
            </ToggleSwitch>
          </ToggleItem>

          <ToggleItem>
            <div>
              <label>Monochrome Icons</label>
              <p>Use single color for all icons</p>
            </div>
            <ToggleSwitch
              $active={settings.monochromeIcons}
              onClick={() => setSettings(prev => ({ ...prev, monochromeIcons: !prev.monochromeIcons }))}
            >
              <div className="toggle-slider" />
            </ToggleSwitch>
          </ToggleItem>

          <ToggleItem>
            <div>
              <label>Swap Box Colors</label>
              <p>Invert background and text colors for boxes</p>
            </div>
            <ToggleSwitch
              $active={settings.swapBoxColors}
              onClick={() => setSettings(prev => ({ ...prev, swapBoxColors: !prev.swapBoxColors }))}
            >
              <div className="toggle-slider" />
            </ToggleSwitch>
          </ToggleItem>
        </ToggleGrid>
      </ToggleSettings>
    </EffectsContainer>
  )
}

const EffectsContainer = styled.div`
  margin-bottom: 2rem;
`

const EffectGroup = styled.div`
  margin-bottom: 2rem;
`

const EffectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const EffectCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 2px solid ${props => props.$isActive ? '#58A4B0' : 'rgba(88, 164, 176, 0.3)'};
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 600;
  
  &:hover {
    border-color: #58A4B0;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(88, 164, 176, 0.2);
  }
  
  .effect-preview {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    margin: 0 auto 0.5rem auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(88, 164, 176, 0.1);
    font-size: 1.2rem;
    
    .particles-demo { color: #58A4B0; }
    .matrix-demo { color: #00ff00; font-family: monospace; }
    .waves-demo { color: #4ECDC4; }
    .gradient-demo { 
      width: 100%; 
      height: 100%; 
      background: linear-gradient(45deg, #58A4B0, #EC4899);
      border-radius: 4px;
    }
    .geometric-demo { color: #F59E0B; }
    .glow-demo { color: #58A4B0; }
    .rainbow-demo { }
    .typewriter-demo { color: #58A4B0; animation: blink 1s infinite; }
    .bounce-demo { color: #58A4B0; animation: bounce 1s infinite; }
    .fade-demo { color: #58A4B0; opacity: 0.5; }
    .none-demo { color: rgba(255,255,255,0.4); }
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
`

const VisualSettings = styled.div`
  margin-bottom: 2rem;
`

const SettingsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`

const SliderSetting = styled.div`
  .slider-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    
    span {
      font-size: 0.9rem;
      color: #ffffff;
      
      &:last-child {
        color: #58A4B0;
        font-weight: 600;
      }
    }
  }
  
  .slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    outline: none;
    appearance: none;
    cursor: pointer;
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #58A4B0;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    
    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #58A4B0;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
  }
`

const ToggleSettings = styled.div``

const ToggleGrid = styled.div`
  display: grid;
  gap: 1rem;
`

const ToggleItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.2);
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
  background: ${props => props.$active ? '#58A4B0' : 'rgba(255, 255, 255, 0.2)'};
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

const ErrorText = styled.div`
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`

export default EffectsSection