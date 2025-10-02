/**
 * Background Cache System
 * Shares background data between splash screen and username page
 * to avoid duplicate fetching and improve performance
 */

class BackgroundCache {
  constructor() {
    this.cache = new Map()
    this.preloadPromises = new Map()
  }

  // Store user data from splash screen
  setUserData(username, userData) {
    this.cache.set(username, {
      userData,
      timestamp: Date.now(),
      preloaded: false
    })
    
    // Start preloading background if it exists
    if (userData?.customization?.backgroundUrl) {
      this.preloadBackground(username, userData.customization.backgroundUrl)
    }
  }

  // Get cached user data
  getUserData(username) {
    const cached = this.cache.get(username)
    if (!cached) return null
    
    // Data expires after 5 minutes
    const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000
    if (isExpired) {
      this.cache.delete(username)
      this.preloadPromises.delete(username)
      return null
    }
    
    return cached.userData
  }

  // Check if background is already preloaded
  isBackgroundPreloaded(username) {
    const cached = this.cache.get(username)
    return cached?.preloaded || false
  }

  // Preload background (image or video)
  async preloadBackground(username, backgroundUrl) {
    if (this.preloadPromises.has(username)) {
      return this.preloadPromises.get(username)
    }

    const isVideo = this.isVideoUrl(backgroundUrl)
    
    const preloadPromise = isVideo 
      ? this.preloadVideo(backgroundUrl)
      : this.preloadImage(backgroundUrl)
    
    this.preloadPromises.set(username, preloadPromise)
    
    try {
      await preloadPromise
      const cached = this.cache.get(username)
      if (cached) {
        cached.preloaded = true
      }
    } catch (error) {
      console.warn('Background preload failed:', error)
      this.preloadPromises.delete(username)
    }
    
    return preloadPromise
  }

  // Preload image
  preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  // Preload video (load metadata for first frame)
  preloadVideo(url) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      
      video.onloadedmetadata = () => resolve(video)
      video.onerror = reject
      
      video.src = url
    })
  }

  // Check if URL is video
  isVideoUrl(url) {
    if (!url) return false
    return url.toLowerCase().includes('.mp4') || 
           url.toLowerCase().includes('.webm') || 
           url.toLowerCase().includes('.ogg') || 
           url.toLowerCase().includes('.avi') || 
           url.toLowerCase().includes('.mov') ||
           url.toLowerCase().includes('video/')
  }

  // Clear cache for a specific user
  clearUserCache(username) {
    this.cache.delete(username)
    this.preloadPromises.delete(username)
  }

  // Clear all cache
  clearAll() {
    this.cache.clear()
    this.preloadPromises.clear()
  }

  // Get cache stats
  getStats() {
    return {
      totalCached: this.cache.size,
      preloadingCount: this.preloadPromises.size,
      users: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const backgroundCache = new BackgroundCache()

export default backgroundCache