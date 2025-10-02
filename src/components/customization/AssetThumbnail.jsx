import React, { useState } from 'react'
import styled from 'styled-components'
import {
  HiXMark,
  HiPencilSquare,
  HiTrash,
  HiPhoto,
  HiMusicalNote,
  HiCursorArrowRays,
  HiUser
} from 'react-icons/hi2'

const AssetThumbnail = ({ 
  assetType, 
  assetUrl, 
  onRemove, 
  onChange, 
  loading = false 
}) => {
  const [showActions, setShowActions] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const getAssetIcon = () => {
    switch (assetType) {
      case 'backgroundImage':
        return <HiPhoto />
      case 'avatar':
        return <HiUser />
      case 'audio':
        return <HiMusicalNote />
      case 'cursor':
        return <HiCursorArrowRays />
      default:
        return <HiPhoto />
    }
  }

  const getAssetLabel = () => {
    switch (assetType) {
      case 'backgroundImage':
        return 'Background'
      case 'avatar':
        return 'Avatar'
      case 'audio':
        return 'Audio'
      case 'cursor':
        return 'Cursor'
      default:
        return 'Asset'
    }
  }

  const handleRemove = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await onRemove()
    } finally {
      setDeleting(false)
      setShowActions(false)
    }
  }

  const handleChange = () => {
    onChange()
    setShowActions(false)
  }

  const isVideoAsset = assetType === 'backgroundImage' && assetUrl && 
    (assetUrl.includes('.mp4') || assetUrl.includes('.webm') || assetUrl.includes('.ogg') || 
     assetUrl.includes('.avi') || assetUrl.includes('.mov') || assetUrl.includes('video/'))
  const isImageAsset = (assetType === 'backgroundImage' || assetType === 'avatar' || assetType === 'cursor') && !isVideoAsset
  const isAudioAsset = assetType === 'audio'

  if (!assetUrl) {
    return (
      <ThumbnailContainer>
        <ThumbnailContent>
          <ThumbnailPlaceholder assetType={assetType}>
            {getAssetIcon()}
          </ThumbnailPlaceholder>
        </ThumbnailContent>
        <ThumbnailLabel>{getAssetLabel()}</ThumbnailLabel>
      </ThumbnailContainer>
    )
  }

  return (
    <ThumbnailContainer
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <ThumbnailContent>
        {isImageAsset ? (
          <ThumbnailImage 
            src={assetUrl} 
            alt={getAssetLabel()}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : isVideoAsset ? (
          <ThumbnailVideo 
            src={assetUrl}
            muted
            loop
            autoPlay
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : (
          <ThumbnailPlaceholder assetType={assetType}>
            {getAssetIcon()}
          </ThumbnailPlaceholder>
        )}
        
        <ThumbnailOverlay $show={showActions || loading}>
          {loading ? (
            <LoadingIndicator>
              <div className="spinner" />
              <span>Uploading...</span>
            </LoadingIndicator>
          ) : (
            <ThumbnailActions>
              <ActionButton 
                onClick={handleChange}
                $variant="change"
                title="Change"
              >
                <HiPencilSquare />
              </ActionButton>
              <ActionButton 
                onClick={handleRemove}
                $variant="remove"
                disabled={deleting}
                title="Remove"
              >
                {deleting ? (
                  <div className="spinner-small" />
                ) : (
                  <HiTrash />
                )}
              </ActionButton>
            </ThumbnailActions>
          )}
        </ThumbnailOverlay>
      </ThumbnailContent>

      <ThumbnailLabel>{getAssetLabel()}</ThumbnailLabel>
      
      {isAudioAsset && (
        <AudioPreview>
          <audio controls style={{ width: '100%', height: '30px' }}>
            <source src={assetUrl} />
            Your browser does not support audio playback.
          </audio>
        </AudioPreview>
      )}
    </ThumbnailContainer>
  )
}

const ThumbnailContainer = styled.div`
  position: relative;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const ThumbnailContent = styled.div`
  position: relative;
  width: 200px;
  height: 140px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(88, 164, 176, 0.4);
    transform: translateY(-2px);
  }
`

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const ThumbnailVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const ThumbnailPlaceholder = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'assetType'
})`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(88, 164, 176, 0.6);
  font-size: 2rem;
  background: linear-gradient(145deg, rgba(88, 164, 176, 0.1), rgba(88, 164, 176, 0.05));
  gap: 0.5rem;
  
  &::after {
    content: 'No ${props => props.assetType || 'asset'} uploaded';
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
  }
`

const ThumbnailOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.$show ? 1 : 0};
  transition: opacity 0.3s ease;
  backdrop-filter: blur(4px);
`

const ThumbnailActions = styled.div`
  display: flex;
  gap: 0.5rem;
`

const ActionButton = styled.button`
  background: ${props => props.$variant === 'remove' ? 'rgba(220, 38, 38, 0.9)' : 'rgba(88, 164, 176, 0.9)'};
  color: white;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;

  &:hover:not(:disabled) {
    background: ${props => props.$variant === 'remove' ? 'rgba(220, 38, 38, 1)' : 'rgba(88, 164, 176, 1)'};
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
`

const LoadingIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #ffffff;

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  span {
    font-size: 0.8rem;
    font-weight: 600;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const ThumbnailLabel = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  font-weight: 600;
`

const AudioPreview = styled.div`
  width: 100%;
  
  audio {
    border-radius: 6px;
    outline: none;
    
    &::-webkit-media-controls-panel {
      background-color: rgba(88, 164, 176, 0.1);
    }
  }
`

export default AssetThumbnail