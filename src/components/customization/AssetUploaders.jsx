import React from 'react'
import styled from 'styled-components'
import {
  HiUser,
  HiPhoto,
  HiCursorArrowRays,
  HiXMark,
  HiInformationCircle
} from 'react-icons/hi2'

const AssetUploaders = ({ 
  settings, 
  uploading, 
  fileInputRefs, 
  handleFileUpload, 
  setSettings, 
  saveAudioSettings 
}) => {
  return (
    <AssetsSection>
      <h2 style={{ color: '#ffffff', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Assets</h2>
      
      <AssetsGrid>
        {/* Background Image Upload */}
        <div style={{ 
          padding: settings.backgroundUrl ? '1rem' : '2rem', 
          background: settings.backgroundUrl 
            ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("${settings.backgroundUrl}")` 
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: settings.backgroundUrl 
            ? '2px solid rgba(88, 164, 176, 0.4)' 
            : '2px dashed rgba(88, 164, 176, 0.3)', 
          borderRadius: '12px', 
          textAlign: 'center', 
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          minHeight: settings.backgroundUrl ? '150px' : 'auto',
          position: 'relative',
          overflow: 'hidden'
        }} 
        onMouseEnter={(e) => {
          e.target.style.borderColor = 'rgba(88, 164, 176, 0.6)'
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = '0 8px 25px rgba(88, 164, 176, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = settings.backgroundUrl ? 'rgba(88, 164, 176, 0.4)' : 'rgba(88, 164, 176, 0.3)'
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = 'none'
        }}
        onClick={() => fileInputRefs.current.backgroundImage?.click()}>
          {settings.backgroundUrl ? (
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ffffff', display: 'flex', alignItems: 'center' }}>
                  <HiPhoto style={{ marginRight: '0.5rem', fontSize: '1.1rem' }} />
                  Background Active
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSettings(prev => ({ ...prev, backgroundUrl: '' }))
                  }}
                  style={{
                    background: 'rgba(220, 38, 38, 0.8)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(220, 38, 38, 1)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(220, 38, 38, 0.8)'
                  }}
                >
                  <HiXMark style={{ fontSize: '0.9rem' }} />
                  Remove
                </button>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                {uploading.backgroundImage ? 'Uploading new background...' : 'Click to change background'}
              </div>
            </div>
          ) : (
            <>
              {uploading.backgroundImage ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid rgba(88, 164, 176, 0.3)',
                    borderTop: '3px solid #58A4B0',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '1rem'
                  }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', color: '#58A4B0' }}>Uploading Background...</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Please wait</div>
                </div>
              ) : (
                <>
                  <HiPhoto style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#58A4B0' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', color: '#ffffff' }}>Background Image</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Click to upload background image</div>
                </>
              )}
            </>
          )}
          <input
            ref={el => fileInputRefs.current.backgroundImage = el}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files[0], 'backgroundImage')}
            style={{ display: 'none' }}
          />
        </div>

        {/* Profile Avatar Upload */}
        <div style={{ 
          padding: settings.avatarUrl ? '1rem' : '2rem', 
          background: settings.avatarUrl 
            ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("${settings.avatarUrl}")` 
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: settings.avatarUrl 
            ? '2px solid rgba(88, 164, 176, 0.4)' 
            : '2px dashed rgba(88, 164, 176, 0.3)', 
          borderRadius: '12px', 
          textAlign: 'center', 
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          minHeight: settings.avatarUrl ? '120px' : 'auto',
          position: 'relative',
          overflow: 'hidden'
        }} 
        onMouseEnter={(e) => {
          e.target.style.borderColor = 'rgba(88, 164, 176, 0.6)'
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = '0 8px 25px rgba(88, 164, 176, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = settings.avatarUrl ? 'rgba(88, 164, 176, 0.4)' : 'rgba(88, 164, 176, 0.3)'
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = 'none'
        }}
        onClick={() => fileInputRefs.current.avatar?.click()}>
          {settings.avatarUrl ? (
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ffffff', display: 'flex', alignItems: 'center' }}>
                  <HiUser style={{ marginRight: '0.5rem', fontSize: '1.1rem' }} />
                  Avatar Active
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSettings(prev => ({ ...prev, avatarUrl: '' }))
                  }}
                  style={{
                    background: 'rgba(220, 38, 38, 0.8)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(220, 38, 38, 1)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(220, 38, 38, 0.8)'
                  }}
                >
                  <HiXMark style={{ fontSize: '0.9rem' }} />
                  Remove
                </button>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                {uploading.avatar ? 'Uploading new avatar...' : 'Click to change avatar'}
              </div>
            </div>
          ) : (
            <>
              {uploading.avatar ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid rgba(88, 164, 176, 0.3)',
                    borderTop: '3px solid #58A4B0',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '1rem'
                  }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', color: '#58A4B0' }}>Uploading Avatar...</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Please wait</div>
                </div>
              ) : (
                <>
                  <HiUser style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#58A4B0' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', color: '#ffffff' }}>Profile Avatar</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Click to upload avatar image</div>
                </>
              )}
            </>
          )}
          <input
            ref={el => fileInputRefs.current.avatar = el}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files[0], 'avatar')}
            style={{ display: 'none' }}
          />
        </div>

        {/* Custom Cursor Upload */}
        <div style={{ 
          padding: settings.cursorUrl ? '1rem' : '2rem', 
          background: settings.cursorUrl 
            ? 'linear-gradient(145deg, rgba(88, 164, 176, 0.15), rgba(88, 164, 176, 0.05))'
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
          border: `2px dashed ${settings.cursorUrl ? 'rgba(88, 164, 176, 0.6)' : 'rgba(88, 164, 176, 0.3)'}`, 
          borderRadius: '12px', 
          textAlign: 'center', 
          cursor: settings.cursorUrl ? `url(${settings.cursorUrl}), pointer` : 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          minHeight: settings.cursorUrl ? '120px' : 'auto'
        }} 
        onMouseEnter={(e) => {
          e.target.style.borderColor = 'rgba(88, 164, 176, 0.8)'
          e.target.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = settings.cursorUrl ? 'rgba(88, 164, 176, 0.6)' : 'rgba(88, 164, 176, 0.3)'
          e.target.style.transform = 'translateY(0)'
        }}
        onClick={() => fileInputRefs.current.cursor?.click()}>
          {settings.cursorUrl ? (
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ffffff', display: 'flex', alignItems: 'center' }}>
                  <HiCursorArrowRays style={{ marginRight: '0.5rem', fontSize: '1.1rem' }} />
                  Cursor Active
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSettings(prev => ({ ...prev, cursorUrl: '' }))
                  }}
                  style={{
                    background: 'rgba(220, 38, 38, 0.8)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(220, 38, 38, 1)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(220, 38, 38, 0.8)'
                  }}
                >
                  <HiXMark style={{ fontSize: '0.9rem' }} />
                  Remove
                </button>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundImage: `url(${settings.cursorUrl})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                marginBottom: '0.5rem',
                margin: '0 auto 0.5rem auto',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }} />
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                {uploading.cursor ? 'Uploading new cursor...' : 'Click to change cursor'}
              </div>
            </div>
          ) : (
            <>
              {uploading.cursor ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid rgba(88, 164, 176, 0.3)',
                    borderTop: '3px solid #58A4B0',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '1rem'
                  }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', color: '#58A4B0' }}>Uploading Cursor...</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Please wait</div>
                </div>
              ) : (
                <>
                  <HiCursorArrowRays style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#58A4B0' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem', color: '#ffffff' }}>Custom Cursor</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Click to upload cursor file</div>
                </>
              )}
            </>
          )}
          <input
            ref={el => fileInputRefs.current.cursor = el}
            type="file"
            accept="image/png,image/gif"
            onChange={(e) => handleFileUpload(e.target.files[0], 'cursor')}
            style={{ display: 'none' }}
          />
        </div>
      </AssetsGrid>
    </AssetsSection>
  )
}

const AssetsSection = styled.div`
  margin-bottom: 2rem;
`

const AssetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

export default AssetUploaders