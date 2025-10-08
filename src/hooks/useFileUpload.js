import { useState, useRef } from 'react'
import logger from '../utils/logger'
import { API_BASE_URL } from '../config/api'

export const useFileUpload = (setSettings, saveAudioSettings) => {
  const [uploading, setUploading] = useState({
    backgroundImage: false,
    avatar: false,
    audio: false,
    cursor: false
  })
  const fileInputRefs = useRef({})

  const handleFileUpload = async (file, type) => {
    if (!file) return

    // Validate file size and type
    const maxSize = type === 'audio' ? 10 * 1024 * 1024 : 5 * 1024 * 1024 // 10MB for audio, 5MB for others
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${type === 'audio' ? '10MB' : '5MB'}`)
    }

    // Fixed: Use correct type mapping to match backend
    const allowedTypes = {
      backgroundImage: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      avatar: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a'],
      cursor: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml']
    }

    if (!allowedTypes[type]?.includes(file.type)) {
      throw new Error(`Invalid file type for ${type}. Please select a valid file. Supported: PNG, JPG, WebP`)
    }

    try {
      setUploading(prev => ({ ...prev, [type]: true }))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) {
        throw new Error('No session found. Please log in again.')
      }

      const response = await fetch(`${API_BASE_URL}/upload/asset`, {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        // Update the appropriate setting with the uploaded file URL
        const settingKey = {
          backgroundImage: 'backgroundUrl',
          avatar: 'avatarUrl',
          audio: 'audioUrl',
          cursor: 'cursorUrl'
        }[type]

        // Update settings
        setSettings(prev => ({ ...prev, [settingKey]: data.data.url }))
        
        // Auto-save immediately for audio uploads
        if (type === 'audio') {
          setTimeout(() => saveAudioSettings(), 200)
        }

        return data.data.url
      } else {
        throw new Error(data.message || 'Upload failed')
      }
    } catch (error) {
      logger.error(`Upload failed for ${file?.name || 'unknown'}:`, error)
      throw error
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }))
    }
  }

  const triggerFileUpload = (type) => {
    fileInputRefs.current[type]?.click()
  }

  return {
    uploading,
    fileInputRefs,
    handleFileUpload,
    triggerFileUpload
  }
}