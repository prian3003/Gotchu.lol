import React from 'react'
import styled from 'styled-components'
import { HiEye, HiEyeSlash, HiSparkles, HiPlay, HiPause, HiSwatch } from 'react-icons/hi2'

const SectionWrapper = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  
  h3 {
    color: #ffffff;
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`

const ControlGroup = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    color: #ffffff;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
`

const InputField = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #ffffff;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #58A4B0;
    box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.2);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`

const SelectField = styled.select`
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #ffffff;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #58A4B0;
    box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.2);
  }
  
  option {
    background: #1a1a2e;
    color: #ffffff;
  }
`

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${props => props.$active ? 'rgba(88, 164, 176, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.$active ? '#58A4B0' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 10px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$active ? 'rgba(88, 164, 176, 0.3)' : 'rgba(255, 255, 255, 0.2)'};
  }
`

const RangeSlider = styled.input`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    background: #58A4B0;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.2);
    }
  }
  
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: #58A4B0;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.2);
    }
  }
`


const GridLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const CompactGridLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`

const CompactControlGroup = styled.div`
  label {
    display: block;
    color: #ffffff;
    font-size: 0.85rem;
    margin-bottom: 0.4rem;
    font-weight: 500;
  }
`

const CompactToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem;
  background: ${props => props.$active ? 'rgba(88, 164, 176, 0.2)' : 'rgba(255, 255, 255, 0.08)'};
  border: 1px solid ${props => props.$active ? '#58A4B0' : 'rgba(255, 255, 255, 0.15)'};
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  width: 100%;
  height: 40px;
  
  &:hover {
    background: ${props => props.$active ? 'rgba(88, 164, 176, 0.3)' : 'rgba(255, 255, 255, 0.15)'};
    border-color: ${props => props.$active ? '#58A4B0' : 'rgba(255, 255, 255, 0.3)'};
    transform: translateY(-1px);
  }
  
  svg {
    font-size: 1rem;
  }
`

const CompactInput = styled.input`
  width: 100%;
  padding: 0.6rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  height: 40px;
  
  &:focus {
    outline: none;
    border-color: #58A4B0;
    box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.2);
    background: rgba(255, 255, 255, 0.12);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`

const CompactSelect = styled.select`
  width: 100%;
  padding: 0.6rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 40px;
  
  &:focus {
    outline: none;
    border-color: #58A4B0;
    box-shadow: 0 0 0 2px rgba(88, 164, 176, 0.2);
    background: rgba(255, 255, 255, 0.12);
  }
  
  option {
    background: #1a1a2e;
    color: #ffffff;
  }
`

const ColorPickerWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 40px;
`

const ColorPickerButton = styled.div`
  width: 100%;
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: ${props => props.color || '#0a0a0a'};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    border-color: #58A4B0;
    transform: translateY(-1px);
  }
  
  &::after {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 6px;
    background: ${props => props.transparent ? 
      'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 10px 10px' : 
      'transparent'};
  }
`

const ColorPickerInput = styled.input`
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
  border: none;
  
  &::-webkit-color-swatch-wrapper {
    padding: 0;
    border: none;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 8px;
  }
`

const SplashScreenSection = ({ 
  customization, 
  onUpdate,
  user
}) => {
  const handleUpdate = (field, value) => {
    onUpdate({
      ...customization,
      [field]: value
    })
  }

  return (
    <SectionWrapper>
      <h3>
        <HiSparkles />
        Profile Splash Screen
      </h3>
      
      {/* Main Enable Toggle */}
      <CompactGridLayout style={{ marginBottom: '1.5rem' }}>
        <CompactControlGroup>
          <label>Status</label>
          <CompactToggle
            $active={customization.enableSplashScreen !== false}
            onClick={() => handleUpdate('enableSplashScreen', customization.enableSplashScreen === false)}
          >
            {customization.enableSplashScreen !== false ? <HiEye /> : <HiEyeSlash />}
            {customization.enableSplashScreen !== false ? 'Enabled' : 'Disabled'}
          </CompactToggle>
        </CompactControlGroup>
      </CompactGridLayout>

      {customization.enableSplashScreen !== false && (
        <>
          {/* Text Content - Single Input */}
          <CompactGridLayout style={{ marginBottom: '1.5rem' }}>
            <CompactControlGroup>
              <label>Main Text</label>
              <CompactInput
                type="text"
                value={customization.splashText || 'click here'}
                onChange={(e) => handleUpdate('splashText', e.target.value)}
                placeholder="click here"
              />
            </CompactControlGroup>
          </CompactGridLayout>

          {/* Style Settings - 3 Grid */}
          <SettingsGrid>
            <CompactControlGroup>
              <label>Font Size</label>
              <CompactSelect
                value={customization.splashFontSize || '3rem'}
                onChange={(e) => handleUpdate('splashFontSize', e.target.value)}
              >
                <option value="2rem">Small</option>
                <option value="2.5rem">Medium</option>
                <option value="3rem">Large</option>
                <option value="3.5rem">XL</option>
                <option value="4rem">Huge</option>
              </CompactSelect>
            </CompactControlGroup>

            <CompactControlGroup>
              <label>Animation</label>
              <CompactToggle
                $active={customization.splashAnimated !== false}
                onClick={() => handleUpdate('splashAnimated', customization.splashAnimated === false)}
              >
                <HiSparkles />
                {customization.splashAnimated !== false ? 'On' : 'Off'}
              </CompactToggle>
            </CompactControlGroup>

            <CompactControlGroup>
              <label>Glow Effect</label>
              <CompactToggle
                $active={customization.splashGlowEffect === true}
                onClick={() => handleUpdate('splashGlowEffect', !customization.splashGlowEffect)}
              >
                <HiSparkles />
                {customization.splashGlowEffect ? 'On' : 'Off'}
              </CompactToggle>
            </CompactControlGroup>
          </SettingsGrid>

          {/* Background Settings - 4 Grid */}
          <SettingsGrid>
            <CompactControlGroup>
              <label>Background</label>
              <CompactToggle
                $active={customization.splashBackgroundVisible !== false}
                onClick={() => handleUpdate('splashBackgroundVisible', customization.splashBackgroundVisible === false)}
              >
                {customization.splashBackgroundVisible !== false ? <HiEye /> : <HiEyeSlash />}
                {customization.splashBackgroundVisible !== false ? 'Visible' : 'Hidden'}
              </CompactToggle>
            </CompactControlGroup>

            {customization.splashBackgroundVisible !== false && (
              <>
                <CompactControlGroup>
                  <label>Transparency</label>
                  <CompactToggle
                    $active={customization.splashTransparent === true}
                    onClick={() => handleUpdate('splashTransparent', !customization.splashTransparent)}
                  >
                    <HiSwatch />
                    {customization.splashTransparent ? 'Transparent' : 'Solid'}
                  </CompactToggle>
                </CompactControlGroup>

                {!customization.splashTransparent && (
                  <CompactControlGroup>
                    <label>Color</label>
                    <ColorPickerWrapper>
                      <ColorPickerButton 
                        color={customization.splashBackgroundColor || '#0a0a0a'}
                        transparent={customization.splashTransparent}
                      >
                        <ColorPickerInput
                          type="color"
                          value={customization.splashBackgroundColor || '#0a0a0a'}
                          onChange={(e) => handleUpdate('splashBackgroundColor', e.target.value)}
                        />
                      </ColorPickerButton>
                    </ColorPickerWrapper>
                  </CompactControlGroup>
                )}
              </>
            )}
          </SettingsGrid>

          {/* Effects & Behavior - 4 Grid */}
          <SettingsGrid>
            <CompactControlGroup>
              <label>Particles</label>
              <CompactToggle
                $active={customization.splashShowParticles !== false}
                onClick={() => handleUpdate('splashShowParticles', customization.splashShowParticles === false)}
              >
                <HiSparkles />
                {customization.splashShowParticles !== false ? 'On' : 'Off'}
              </CompactToggle>
            </CompactControlGroup>

            <CompactControlGroup>
              <label>Auto Hide</label>
              <CompactToggle
                $active={customization.splashAutoHide === true}
                onClick={() => handleUpdate('splashAutoHide', !customization.splashAutoHide)}
              >
                {customization.splashAutoHide ? <HiPlay /> : <HiPause />}
                {customization.splashAutoHide ? 'On' : 'Off'}
              </CompactToggle>
            </CompactControlGroup>

            {customization.splashAutoHide && (
              <>
                <CompactControlGroup>
                  <label>Delay (seconds)</label>
                  <RangeSlider
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={(customization.splashAutoHideDelay || 5000) / 1000}
                    onChange={(e) => handleUpdate('splashAutoHideDelay', parseFloat(e.target.value) * 1000)}
                    style={{ height: '40px' }}
                  />
                </CompactControlGroup>

                <CompactControlGroup>
                  <label>Duration</label>
                  <div style={{ 
                    height: '40px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#58A4B0',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    {(customization.splashAutoHideDelay || 5000) / 1000}s
                  </div>
                </CompactControlGroup>
              </>
            )}
          </SettingsGrid>
        </>
      )}
    </SectionWrapper>
  )
}

export default SplashScreenSection