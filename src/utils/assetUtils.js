// Utility functions for asset management

export const deleteAsset = async (assetType, filePath) => {
  try {
    const token = localStorage.getItem('authToken')
    const sessionId = localStorage.getItem('sessionId')
    
    const response = await fetch('/api/assets/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'X-Session-ID': sessionId || '',
      },
      body: JSON.stringify({
        filePath,
        assetType
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to delete ${assetType}: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || `Failed to delete ${assetType}`)
    }

    return { success: true, message: data.message }
  } catch (error) {
    console.error(`Error deleting ${assetType}:`, error)
    return { success: false, error: error.message }
  }
}

export const getAssetFileName = (assetUrl) => {
  if (!assetUrl) return null
  
  try {
    // Extract filename from URL
    const url = new URL(assetUrl)
    const pathParts = url.pathname.split('/')
    return pathParts[pathParts.length - 1]
  } catch (error) {
    console.error('Error extracting filename from URL:', error)
    return null
  }
}

export const getAssetFilePath = (assetUrl, userId) => {
  if (!assetUrl || !userId) return null
  
  try {
    // Extract the file path that would be used in storage
    const url = new URL(assetUrl)
    const pathParts = url.pathname.split('/')
    
    // Find the user folder and filename
    const userFolderIndex = pathParts.findIndex(part => part.startsWith('user_'))
    if (userFolderIndex === -1) {
      // Fallback: assume it's user_userId/filename format
      const filename = pathParts[pathParts.length - 1]
      return `user_${userId}/${filename}`
    }
    
    // Return the path from user folder onwards
    return pathParts.slice(userFolderIndex).join('/')
  } catch (error) {
    console.error('Error extracting file path from URL:', error)
    return null
  }
}

export const getAssetTypeFromUrl = (assetUrl) => {
  if (!assetUrl) return null
  
  try {
    const url = new URL(assetUrl)
    const pathParts = url.pathname.split('/')
    
    // Check which bucket the file is in based on the URL structure
    if (pathParts.includes('user-backgrounds')) return 'backgroundImage'
    if (pathParts.includes('user-avatars')) return 'avatar'
    if (pathParts.includes('user-audio')) return 'audio'
    if (pathParts.includes('user-cursors')) return 'cursor'
    
    return null
  } catch (error) {
    console.error('Error determining asset type from URL:', error)
    return null
  }
}

export const validateAssetFile = (file, assetType) => {
  const validations = {
    backgroundImage: {
      types: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'
      ],
      maxSize: 15 * 1024 * 1024, // 15MB
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.ogg', '.avi', '.mov']
    },
    avatar: {
      types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    audio: {
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a', 'audio/opus'],
      maxSize: 10 * 1024 * 1024, // 10MB
      extensions: ['.mp3', '.wav', '.ogg', '.m4a', '.opus']
    },
    cursor: {
      types: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'],
      maxSize: 1 * 1024 * 1024, // 1MB
      extensions: ['.png', '.ico', '.svg']
    }
  }

  const config = validations[assetType]
  if (!config) {
    return { valid: false, error: 'Unknown asset type' }
  }

  // Check file size
  if (file.size > config.maxSize) {
    const sizeMB = (config.maxSize / (1024 * 1024)).toFixed(0)
    return { valid: false, error: `File too large. Maximum size is ${sizeMB}MB` }
  }

  // Check file type
  if (!config.types.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${config.extensions.join(', ')}` }
  }

  return { valid: true }
}