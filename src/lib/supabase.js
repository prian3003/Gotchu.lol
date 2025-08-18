import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket names - matching backend asset types
export const STORAGE_BUCKETS = {
  BACKGROUNDS: 'user-backgrounds',  // for 'backgroundImage' type
  AVATARS: 'user-avatars',          // for 'avatar' type
  AUDIO: 'user-audio',              // for 'audio' type  
  CURSORS: 'user-cursors'           // for 'cursor' type
}

// File upload utility
export const uploadFile = async (file, bucket, userId, oldFileName = null) => {
  try {
    // Delete old file if exists
    if (oldFileName) {
      await supabase.storage
        .from(bucket)
        .remove([`${userId}/${oldFileName}`])
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl,
      fileName: fileName,
      filePath: filePath
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Delete file utility
export const deleteFile = async (bucket, filePath) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return { success: false, error: error.message }
  }
}

// File validation utilities
export const validateFile = (file, type) => {
  const validations = {
    image: {
      types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    audio: {
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a'],
      maxSize: 10 * 1024 * 1024, // 10MB
      extensions: ['.mp3', '.wav', '.ogg', '.m4a']
    },
    cursor: {
      types: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'],
      maxSize: 1 * 1024 * 1024, // 1MB
      extensions: ['.png', '.ico', '.svg']
    }
  }

  const config = validations[type]
  if (!config) {
    return { valid: false, error: 'Unknown file type' }
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

export default supabase