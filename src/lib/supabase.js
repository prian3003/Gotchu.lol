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
        .remove([`user_${userId}/${oldFileName}`])
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `user_${userId}/${fileName}`

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

// List files in a bucket for a specific user
export const listUserFiles = async (bucket, userId) => {
  try {
    console.log(`Listing files in bucket: ${bucket} for user: ${userId} (folder: user_${userId})`)
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(`user_${userId}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    console.log('Supabase list response:', { data, error })
    console.log('Query details:', { bucket, folder: `user_${userId}` })

    if (error) {
      console.error('Supabase list error:', error)
      throw error
    }

    console.log('Raw files from Supabase:', data)
    
    // Let's also try listing the root to see what folders exist
    const { data: rootFolders, error: rootError } = await supabase.storage
      .from(bucket)
      .list('', { limit: 100 })
    
    console.log('Root folders in bucket:', rootFolders)
    console.log('Root error:', rootError)
    
    // Test a direct file access to see if it's a permissions issue
    const testUrl = `user_3/audio_1755526419.opus`
    const { data: testData, error: testError } = await supabase.storage
      .from(bucket)
      .getPublicUrl(testUrl)
    
    console.log('Direct file test:', { url: testData?.publicUrl, error: testError })

    // Get public URLs for all files
    const filesWithUrls = data.map(file => {
      const filePath = `user_${userId}/${file.name}`
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      console.log(`File: ${file.name}, URL: ${publicUrl}`)

      return {
        ...file,
        url: publicUrl,
        filePath,
        fileName: file.name
      }
    })

    console.log('Processed files with URLs:', filesWithUrls)

    return {
      success: true,
      files: filesWithUrls
    }
  } catch (error) {
    console.error('List files error:', error)
    return {
      success: false,
      error: error.message,
      files: []
    }
  }
}

// Delete multiple files
export const deleteMultipleFiles = async (bucket, filePaths) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(filePaths)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Delete multiple files error:', error)
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