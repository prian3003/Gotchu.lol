import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'
import logger from './logger'

// Performance monitoring class
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.customMetrics = new Map()
    this.observers = new Map()
    this.isEnabled = true
    this.reportingQueue = []
    this.maxQueueSize = 100
    
    this.init()
  }

  init() {
    if (!this.isEnabled || typeof window === 'undefined') return

    // Initialize Core Web Vitals monitoring
    this.initWebVitals()
    
    // Initialize custom performance observers
    this.initPerformanceObservers()
    
    // Initialize navigation timing
    this.initNavigationTiming()
    
    // Initialize resource timing
    this.initResourceTiming()
    
    // Start periodic reporting
    this.startPeriodicReporting()

    logger.info('Performance Monitor initialized')
  }

  // Core Web Vitals monitoring
  initWebVitals() {
    const sendToAnalytics = (metric) => {
      const { name, value, rating, delta, id } = metric
      
      this.metrics.set(name, {
        value,
        rating,
        delta,
        id,
        timestamp: Date.now()
      })

      logger.info(`Core Web Vital - ${name}`, {
        value: Math.round(value),
        rating,
        delta: Math.round(delta),
        id
      })

      // Report critical metrics immediately
      if (rating === 'poor') {
        this.reportMetric(name, {
          value,
          rating,
          critical: true,
          timestamp: Date.now()
        })
      }
    }

    // Monitor Core Web Vitals
    onCLS(sendToAnalytics)   // Cumulative Layout Shift
    onFCP(sendToAnalytics)   // First Contentful Paint
    onLCP(sendToAnalytics)   // Largest Contentful Paint
    onTTFB(sendToAnalytics)  // Time to First Byte
    onINP(sendToAnalytics)   // Interaction to Next Paint
  }

  // Performance observers for detailed monitoring
  initPerformanceObservers() {
    // Long Task Observer
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.recordCustomMetric('long-task', {
                duration: entry.duration,
                startTime: entry.startTime,
                timestamp: Date.now()
              })

              logger.warn('Long Task detected', {
                duration: `${Math.round(entry.duration)}ms`,
                startTime: Math.round(entry.startTime)
              })
            }
          }
        })
        
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.set('longtask', longTaskObserver)
      } catch (error) {
        logger.error('Failed to initialize Long Task Observer', error)
      }

      // Layout Shift Observer
      try {
        const layoutShiftObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput && entry.value > 0.1) {
              this.recordCustomMetric('layout-shift', {
                value: entry.value,
                sources: entry.sources?.length || 0,
                timestamp: Date.now()
              })

              logger.warn('Significant Layout Shift detected', {
                value: entry.value.toFixed(4),
                sources: entry.sources?.length || 0
              })
            }
          }
        })
        
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.set('layout-shift', layoutShiftObserver)
      } catch (error) {
        logger.error('Failed to initialize Layout Shift Observer', error)
      }

      // Largest Contentful Paint Observer
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          const lastEntry = entries[entries.length - 1]
          
          this.recordCustomMetric('lcp-element', {
            element: lastEntry.element?.tagName || 'unknown',
            size: lastEntry.size,
            loadTime: lastEntry.loadTime,
            renderTime: lastEntry.renderTime,
            timestamp: Date.now()
          })
        })
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.set('lcp', lcpObserver)
      } catch (error) {
        logger.error('Failed to initialize LCP Observer', error)
      }
    }
  }

  // Navigation timing metrics
  initNavigationTiming() {
    if ('performance' in window && 'navigation' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0]
          
          if (navigation) {
            const metrics = {
              dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
              tcpConnect: navigation.connectEnd - navigation.connectStart,
              tlsNegotiation: navigation.secureConnectionStart > 0 
                ? navigation.connectEnd - navigation.secureConnectionStart : 0,
              requestTime: navigation.responseStart - navigation.requestStart,
              responseTime: navigation.responseEnd - navigation.responseStart,
              domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd,
              totalLoadTime: navigation.loadEventEnd - navigation.navigationStart
            }

            this.recordCustomMetric('navigation-timing', metrics)
            
            logger.info('Navigation Timing', {
              dnsLookup: `${Math.round(metrics.dnsLookup)}ms`,
              tcpConnect: `${Math.round(metrics.tcpConnect)}ms`,
              requestTime: `${Math.round(metrics.requestTime)}ms`,
              responseTime: `${Math.round(metrics.responseTime)}ms`,
              domProcessing: `${Math.round(metrics.domProcessing)}ms`,
              totalLoadTime: `${Math.round(metrics.totalLoadTime)}ms`
            })
          }
        }, 0)
      })
    }
  }

  // Resource timing monitoring
  initResourceTiming() {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            // Monitor slow resources
            if (entry.duration > 1000) { // Resources taking > 1s
              this.recordCustomMetric('slow-resource', {
                name: entry.name,
                type: entry.initiatorType,
                duration: entry.duration,
                size: entry.transferSize || 0,
                timestamp: Date.now()
              })

              logger.warn('Slow Resource detected', {
                resource: entry.name.split('/').pop(),
                type: entry.initiatorType,
                duration: `${Math.round(entry.duration)}ms`,
                size: this.formatBytes(entry.transferSize || 0)
              })
            }

            // Monitor large resources
            if ((entry.transferSize || 0) > 1000000) { // Resources > 1MB
              this.recordCustomMetric('large-resource', {
                name: entry.name,
                type: entry.initiatorType,
                size: entry.transferSize,
                duration: entry.duration,
                timestamp: Date.now()
              })

              logger.warn('Large Resource detected', {
                resource: entry.name.split('/').pop(),
                type: entry.initiatorType,
                size: this.formatBytes(entry.transferSize),
                duration: `${Math.round(entry.duration)}ms`
              })
            }
          }
        })
        
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.set('resource', resourceObserver)
      } catch (error) {
        logger.error('Failed to initialize Resource Observer', error)
      }
    }
  }

  // Record custom performance metrics
  recordCustomMetric(name, data) {
    if (!this.customMetrics.has(name)) {
      this.customMetrics.set(name, [])
    }
    
    const metrics = this.customMetrics.get(name)
    metrics.push({
      ...data,
      timestamp: Date.now()
    })

    // Keep only last 50 entries per metric
    if (metrics.length > 50) {
      metrics.splice(0, metrics.length - 50)
    }
  }

  // Measure component render time
  measureComponentRender(componentName, renderFn) {
    const startTime = performance.now()
    
    try {
      const result = renderFn()
      const endTime = performance.now()
      const duration = endTime - startTime

      this.recordCustomMetric('component-render', {
        component: componentName,
        duration,
        timestamp: Date.now()
      })

      if (duration > 16.67) { // Longer than 1 frame (60fps)
        logger.warn(`Slow component render: ${componentName}`, {
          duration: `${duration.toFixed(2)}ms`
        })
      }

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      this.recordCustomMetric('component-render-error', {
        component: componentName,
        duration,
        error: error.message,
        timestamp: Date.now()
      })

      logger.error(`Component render error: ${componentName}`, error)
      throw error
    }
  }

  // Measure async operations
  async measureAsync(operationName, asyncFn) {
    const startTime = performance.now()
    
    try {
      const result = await asyncFn()
      const endTime = performance.now()
      const duration = endTime - startTime

      this.recordCustomMetric('async-operation', {
        operation: operationName,
        duration,
        success: true,
        timestamp: Date.now()
      })

      if (duration > 3000) { // Operations longer than 3s
        logger.warn(`Slow async operation: ${operationName}`, {
          duration: `${Math.round(duration)}ms`
        })
      }

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      this.recordCustomMetric('async-operation', {
        operation: operationName,
        duration,
        success: false,
        error: error.message,
        timestamp: Date.now()
      })

      logger.error(`Async operation failed: ${operationName}`, error)
      throw error
    }
  }

  // Get memory usage (if available)
  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      }
    }
    return null
  }

  // Report metric to analytics service
  reportMetric(name, data) {
    this.reportingQueue.push({
      name,
      data,
      timestamp: Date.now()
    })

    // Keep queue size manageable
    if (this.reportingQueue.length > this.maxQueueSize) {
      this.reportingQueue.splice(0, this.reportingQueue.length - this.maxQueueSize)
    }

    // In a real app, this would send to services like:
    // - Google Analytics
    // - New Relic
    // - DataDog
    // - Custom analytics endpoint
    this.sendToAnalyticsService({ name, data })
  }

  // Mock analytics service
  sendToAnalyticsService(metric) {
    try {
      // Store in localStorage for demo purposes
      const analytics = JSON.parse(localStorage.getItem('performance_analytics') || '[]')
      analytics.push(metric)
      
      // Keep only last 100 metrics
      if (analytics.length > 100) {
        analytics.splice(0, analytics.length - 100)
      }
      
      localStorage.setItem('performance_analytics', JSON.stringify(analytics))
    } catch (error) {
      logger.error('Failed to send metric to analytics', error)
    }
  }

  // Start periodic reporting
  startPeriodicReporting() {
    setInterval(() => {
      const memoryUsage = this.getMemoryUsage()
      if (memoryUsage) {
        this.recordCustomMetric('memory-usage', memoryUsage)
        
        // Warn about high memory usage
        const usagePercent = (memoryUsage.used / memoryUsage.limit) * 100
        if (usagePercent > 80) {
          logger.warn('High memory usage detected', {
            used: this.formatBytes(memoryUsage.used),
            total: this.formatBytes(memoryUsage.total),
            limit: this.formatBytes(memoryUsage.limit),
            percentage: `${usagePercent.toFixed(1)}%`
          })
        }
      }

      // Report queued metrics
      if (this.reportingQueue.length > 0) {
        const metrics = this.reportingQueue.splice(0, 10) // Send 10 at a time
        metrics.forEach(metric => this.sendToAnalyticsService(metric))
      }
    }, 30000) // Every 30 seconds
  }

  // Get performance report
  getPerformanceReport() {
    const report = {
      webVitals: Object.fromEntries(this.metrics),
      customMetrics: Object.fromEntries(this.customMetrics),
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now(),
      recommendations: this.generateRecommendations()
    }

    logger.info('Performance Report Generated', report)
    return report
  }

  // Generate performance recommendations
  generateRecommendations() {
    const recommendations = []
    
    // Check Core Web Vitals
    const lcp = this.metrics.get('LCP')
    if (lcp && lcp.rating === 'poor') {
      recommendations.push({
        type: 'LCP',
        message: `Largest Contentful Paint is ${Math.round(lcp.value)}ms (should be < 2500ms)`,
        suggestions: [
          'Optimize images and use next-gen formats',
          'Implement lazy loading for images',
          'Reduce server response time',
          'Remove unused CSS and JavaScript'
        ]
      })
    }

    const cls = this.metrics.get('CLS')
    if (cls && cls.rating === 'poor') {
      recommendations.push({
        type: 'CLS',
        message: `Cumulative Layout Shift is ${cls.value.toFixed(3)} (should be < 0.1)`,
        suggestions: [
          'Add size attributes to images and videos',
          'Reserve space for dynamic content',
          'Avoid inserting content above existing content',
          'Use CSS transform instead of changing layout properties'
        ]
      })
    }

    const fid = this.metrics.get('FID')
    if (fid && fid.rating === 'poor') {
      recommendations.push({
        type: 'FID',
        message: `First Input Delay is ${Math.round(fid.value)}ms (should be < 100ms)`,
        suggestions: [
          'Break up long-running JavaScript tasks',
          'Optimize JavaScript execution',
          'Use web workers for heavy computations',
          'Reduce JavaScript bundle size'
        ]
      })
    }

    // Check for long tasks
    const longTasks = this.customMetrics.get('long-task') || []
    if (longTasks.length > 5) {
      recommendations.push({
        type: 'Long Tasks',
        message: `${longTasks.length} long tasks detected`,
        suggestions: [
          'Split large JavaScript bundles',
          'Use code splitting and lazy loading',
          'Optimize component rendering',
          'Move heavy computations to web workers'
        ]
      })
    }

    // Check memory usage
    const memoryMetrics = this.customMetrics.get('memory-usage') || []
    const latestMemory = memoryMetrics[memoryMetrics.length - 1]
    if (latestMemory) {
      const usagePercent = (latestMemory.used / latestMemory.limit) * 100
      if (usagePercent > 70) {
        recommendations.push({
          type: 'Memory Usage',
          message: `Memory usage is ${usagePercent.toFixed(1)}% of limit`,
          suggestions: [
            'Check for memory leaks',
            'Optimize component unmounting',
            'Remove unused dependencies',
            'Implement virtual scrolling for large lists'
          ]
        })
      }
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

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    logger.info('Performance Monitor cleaned up')
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor()

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const measureRender = (componentName, renderFn) => {
    return performanceMonitor.measureComponentRender(componentName, renderFn)
  }

  const measureAsync = (operationName, asyncFn) => {
    return performanceMonitor.measureAsync(operationName, asyncFn)
  }

  const getReport = () => {
    return performanceMonitor.getPerformanceReport()
  }

  const recordMetric = (name, data) => {
    performanceMonitor.recordCustomMetric(name, data)
  }

  return { measureRender, measureAsync, getReport, recordMetric }
}

export default performanceMonitor