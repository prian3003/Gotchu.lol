import React, { useState, useRef } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { uploadFile, validateFile, STORAGE_BUCKETS } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { 
  HiCloudArrowUp, 
  HiXMark, 
  HiCheck, 
  HiExclamationTriangle,
  HiPhoto,
  HiMusicalNote,
  HiCursorArrowRays
} from 'react-icons/hi2'

const FileUpload = ({ 
  type, 
  currentFile, 
  onUploadSuccess, 
  onUploadError,
  className = '',
  disabled = false 
}) => {
  const { colors } = useTheme()
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const typeConfig = {
    backgroundImage: {
      bucket: STORAGE_BUCKETS.BACKGROUNDS,
      fileType: 'image',
      icon: HiPhoto,
      title: 'Background Image',
      description: 'Upload PNG, JPG, or WebP (max 5MB)',
      accept: '.jpg,.jpeg,.png,.gif,.webp'
    },
    avatar: {
      bucket: STORAGE_BUCKETS.AVATARS,
      fileType: 'image', 
      icon: HiPhoto,
      title: 'Profile Avatar',
      description: 'Upload PNG, JPG, or WebP (max 5MB)',
      accept: '.jpg,.jpeg,.png,.gif,.webp'
    },
    audio: {
      bucket: STORAGE_BUCKETS.AUDIO,
      fileType: 'audio',
      icon: HiMusicalNote,
      title: 'Audio Track',
      description: 'Upload MP3, WAV, or OGG (max 10MB)',
      accept: '.mp3,.wav,.ogg,.m4a'
    },
    cursor: {
      bucket: STORAGE_BUCKETS.CURSORS,
      fileType: 'cursor',
      icon: HiCursorArrowRays,
      title: 'Custom Cursor',
      description: 'Upload PNG, ICO, or SVG (max 1MB)',
      accept: '.png,.ico,.svg'
    }
  }

  const config = typeConfig[type]
  const IconComponent = config.icon

  const handleFileSelect = async (file) => {
    if (!file || !user || disabled) return

    // Validate file
    const validation = validateFile(file, config.fileType)
    if (!validation.valid) {
      onUploadError?.(validation.error)
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // Upload to Supabase
      const result = await uploadFile(
        file, 
        config.bucket, 
        user.id, 
        currentFile?.fileName
      )

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success) {
        onUploadSuccess?.({
          url: result.url,
          fileName: result.fileName,
          filePath: result.filePath,
          originalName: file.name,
          size: file.size,
          type: file.type
        })
        
        setTimeout(() => {
          setUploadProgress(0)
          setIsUploading(false)
        }, 1000)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      onUploadError?.(error.message || 'Upload failed')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const containerStyle = {
    border: `2px dashed ${dragActive ? colors.accent : colors.border}`,
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    backgroundColor: dragActive ? `${colors.accent}10` : colors.surface,
    transition: 'all 0.3s ease',
    opacity: disabled ? 0.6 : 1,
    position: 'relative',
    overflow: 'hidden'
  }

  const progressStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '4px',
    width: `${uploadProgress}%`,
    backgroundColor: colors.accent,
    transition: 'width 0.3s ease',
    borderRadius: '0 0 12px 12px'
  }

  return (
    <div className={`file-upload ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled || isUploading}
      />
      
      <div
        style={containerStyle}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isUploading && <div style={progressStyle} />}
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {isUploading ? (
            <div>
              <HiCloudArrowUp 
                size={48} 
                style={{ 
                  color: colors.accent, 
                  margin: '0 auto 16px',
                  animation: 'pulse 2s infinite'
                }} 
              />
              <div style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                Uploading... {uploadProgress}%
              </div>
              <div style={{ color: colors.muted, fontSize: '14px', marginTop: '8px' }}>
                Please wait while we upload your file
              </div>
            </div>
          ) : currentFile ? (
            <div>
              <HiCheck 
                size={48} 
                style={{ 
                  color: '#10B981', 
                  margin: '0 auto 16px'
                }} 
              />
              <div style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                {currentFile.originalName || config.title}
              </div>
              <div style={{ color: colors.muted, fontSize: '14px', marginTop: '8px' }}>
                Click to replace or drag a new file
              </div>
              {currentFile.size && (
                <div style={{ color: colors.muted, fontSize: '12px', marginTop: '4px' }}>
                  {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
          ) : (
            <div>
              <IconComponent 
                size={48} 
                style={{ 
                  color: colors.muted, 
                  margin: '0 auto 16px'
                }} 
              />
              <div style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                {config.title}
              </div>
              <div style={{ color: colors.muted, fontSize: '14px', marginTop: '8px' }}>
                {config.description}
              </div>
              <div style={{ color: colors.muted, fontSize: '12px', marginTop: '12px' }}>
                Click to browse or drag and drop
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileUpload