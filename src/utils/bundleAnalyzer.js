import logger from './logger'

// Bundle size monitoring and reporting
class BundleAnalyzer {
  constructor() {
    this.chunks = new Map()
    this.loadTimes = new Map()
    this.totalSize = 0
    this.isMonitoring = process.env.NODE_ENV === 'development'
  }

  // Track when a chunk starts loading
  trackChunkStart(chunkName) {
    if (!this.isMonitoring) return

    this.loadTimes.set(chunkName, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    })

    logger.info(`Bundle Analyzer - Chunk loading started: ${chunkName}`)
  }

  // Track when a chunk finishes loading
  trackChunkEnd(chunkName, size = 0) {
    if (!this.isMonitoring) return

    const loadTime = this.loadTimes.get(chunkName)
    if (loadTime) {
      loadTime.endTime = performance.now()
      loadTime.duration = loadTime.endTime - loadTime.startTime

      this.chunks.set(chunkName, {
        name: chunkName,
        size,
        loadTime: loadTime.duration,
        timestamp: new Date().toISOString()
      })

      this.totalSize += size

      logger.info(`Bundle Analyzer - Chunk loaded: ${chunkName}`, {
        size: this.formatBytes(size),
        loadTime: `${loadTime.duration.toFixed(2)}ms`,
        totalSize: this.formatBytes(this.totalSize)
      })

      // Warn about large chunks
      if (size > 1000000) { // > 1MB
        logger.warn(`Bundle Analyzer - Large chunk detected: ${chunkName}`, {
          size: this.formatBytes(size),
          recommendation: 'Consider splitting this chunk further'
        })
      }

      // Warn about slow loading chunks
      if (loadTime.duration > 3000) { // > 3s
        logger.warn(`Bundle Analyzer - Slow loading chunk: ${chunkName}`, {
          loadTime: `${loadTime.duration.toFixed(2)}ms`,
          recommendation: 'Optimize chunk loading or reduce size'
        })
      }
    }
  }

  // Track failed chunk loads
  trackChunkError(chunkName, error) {
    if (!this.isMonitoring) return

    logger.error(`Bundle Analyzer - Chunk failed to load: ${chunkName}`, error)

    this.chunks.set(chunkName, {
      name: chunkName,
      error: error.message,
      timestamp: new Date().toISOString(),
      failed: true
    })
  }

  // Get analysis report
  getAnalysisReport() {
    const chunks = Array.from(this.chunks.values())
    const successfulChunks = chunks.filter(chunk => !chunk.failed)
    const failedChunks = chunks.filter(chunk => chunk.failed)

    const report = {
      totalChunks: chunks.length,
      successfulChunks: successfulChunks.length,
      failedChunks: failedChunks.length,
      totalSize: this.totalSize,
      totalSizeFormatted: this.formatBytes(this.totalSize),
      averageLoadTime: this.calculateAverageLoadTime(successfulChunks),
      largestChunk: this.findLargestChunk(successfulChunks),
      slowestChunk: this.findSlowestChunk(successfulChunks),
      recommendations: this.generateRecommendations(chunks),
      chunks: chunks.sort((a, b) => (b.size || 0) - (a.size || 0))
    }

    logger.info('Bundle Analysis Report', report)
    return report
  }

  // Calculate average load time
  calculateAverageLoadTime(chunks) {
    if (chunks.length === 0) return 0
    const totalTime = chunks.reduce((sum, chunk) => sum + (chunk.loadTime || 0), 0)
    return totalTime / chunks.length
  }

  // Find largest chunk
  findLargestChunk(chunks) {
    return chunks.reduce((largest, chunk) => {
      return (chunk.size || 0) > (largest.size || 0) ? chunk : largest
    }, { size: 0 })
  }

  // Find slowest loading chunk
  findSlowestChunk(chunks) {
    return chunks.reduce((slowest, chunk) => {
      return (chunk.loadTime || 0) > (slowest.loadTime || 0) ? chunk : slowest
    }, { loadTime: 0 })
  }

  // Generate optimization recommendations
  generateRecommendations(chunks) {
    const recommendations = []

    // Check for large chunks
    const largeChunks = chunks.filter(chunk => (chunk.size || 0) > 500000) // > 500KB
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'size',
        message: `${largeChunks.length} chunk(s) are larger than 500KB`,
        suggestion: 'Consider splitting large chunks or removing unused code',
        chunks: largeChunks.map(c => c.name)
      })
    }

    // Check for slow chunks
    const slowChunks = chunks.filter(chunk => (chunk.loadTime || 0) > 2000) // > 2s
    if (slowChunks.length > 0) {
      recommendations.push({
        type: 'performance',
        message: `${slowChunks.length} chunk(s) take longer than 2s to load`,
        suggestion: 'Optimize network conditions or reduce chunk complexity',
        chunks: slowChunks.map(c => c.name)
      })
    }

    // Check for failed chunks
    const failedChunks = chunks.filter(chunk => chunk.failed)
    if (failedChunks.length > 0) {
      recommendations.push({
        type: 'reliability',
        message: `${failedChunks.length} chunk(s) failed to load`,
        suggestion: 'Check network connectivity and chunk availability',
        chunks: failedChunks.map(c => c.name)
      })
    }

    // Check total bundle size
    if (this.totalSize > 5000000) { // > 5MB
      recommendations.push({
        type: 'total_size',
        message: `Total bundle size is ${this.formatBytes(this.totalSize)}`,
        suggestion: 'Consider lazy loading more components or removing dependencies'
      })
    }

    return recommendations
  }

  // Format bytes for display
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  // Clear analysis data
  reset() {
    this.chunks.clear()
    this.loadTimes.clear()
    this.totalSize = 0
    logger.info('Bundle Analyzer - Data reset')
  }

  // Export data for external analysis
  exportData() {
    return {
      chunks: Array.from(this.chunks.values()),
      loadTimes: Object.fromEntries(this.loadTimes),
      totalSize: this.totalSize,
      timestamp: new Date().toISOString()
    }
  }
}

// Create singleton instance
const bundleAnalyzer = new BundleAnalyzer()

// Hook for React components to track bundle loading
export const useBundleAnalyzer = () => {
  const trackLoad = (chunkName, size) => {
    bundleAnalyzer.trackChunkEnd(chunkName, size)
  }

  const trackError = (chunkName, error) => {
    bundleAnalyzer.trackChunkError(chunkName, error)
  }

  const getReport = () => {
    return bundleAnalyzer.getAnalysisReport()
  }

  return { trackLoad, trackError, getReport }
}

// Enhanced dynamic import with tracking
export const trackedImport = (importFunc, chunkName = 'unknown') => {
  bundleAnalyzer.trackChunkStart(chunkName)
  
  return importFunc()
    .then(module => {
      // Estimate chunk size (rough approximation)
      const moduleSize = JSON.stringify(module).length
      bundleAnalyzer.trackChunkEnd(chunkName, moduleSize)
      return module
    })
    .catch(error => {
      bundleAnalyzer.trackChunkError(chunkName, error)
      throw error
    })
}

export default bundleAnalyzer