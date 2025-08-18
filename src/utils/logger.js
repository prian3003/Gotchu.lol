// Production-safe logging utility
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  // Log levels
  debug(message, ...args) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  }

  info(message, ...args) {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, ...args)
    }
  }

  warn(message, ...args) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args)
    }
    // In production, you might want to send warnings to a logging service
    if (this.isProduction) {
      this.sendToLoggingService('warn', message, args)
    }
  }

  error(message, error, ...args) {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error, ...args)
    }
    // In production, always log errors to a service
    if (this.isProduction) {
      this.sendToLoggingService('error', message, { error, args })
    }
  }

  // Performance logging
  time(label) {
    if (this.isDevelopment) {
      console.time(label)
    }
  }

  timeEnd(label) {
    if (this.isDevelopment) {
      console.timeEnd(label)
    }
  }

  // API call logging
  apiCall(method, url, data = null) {
    if (this.isDevelopment) {
      console.group(`🌐 API ${method.toUpperCase()} ${url}`)
      if (data) {
        console.log('Request data:', data)
      }
      console.groupEnd()
    }
  }

  apiResponse(method, url, response, duration) {
    if (this.isDevelopment) {
      console.group(`✅ API ${method.toUpperCase()} ${url} (${duration}ms)`)
      console.log('Response:', response)
      console.groupEnd()
    }
  }

  apiError(method, url, error, duration) {
    if (this.isDevelopment) {
      console.group(`❌ API ${method.toUpperCase()} ${url} (${duration}ms)`)
      console.error('Error:', error)
      console.groupEnd()
    }
    if (this.isProduction) {
      this.sendToLoggingService('api_error', `API ${method} ${url}`, { error, duration })
    }
  }

  // User action logging
  userAction(action, data = null) {
    if (this.isDevelopment) {
      console.log(`👤 User Action: ${action}`, data)
    }
    // In production, send user actions to analytics
    if (this.isProduction) {
      this.sendToAnalytics(action, data)
    }
  }

  // Navigation logging
  navigation(from, to) {
    if (this.isDevelopment) {
      console.log(`🧭 Navigation: ${from} → ${to}`)
    }
  }

  // Component lifecycle logging
  componentMount(componentName) {
    if (this.isDevelopment) {
      console.log(`🔧 Component Mounted: ${componentName}`)
    }
  }

  componentUnmount(componentName) {
    if (this.isDevelopment) {
      console.log(`🗑️ Component Unmounted: ${componentName}`)
    }
  }

  // Authentication logging
  auth(action, success, details = null) {
    if (this.isDevelopment) {
      const status = success ? '✅' : '❌'
      console.log(`🔐 Auth ${action}: ${status}`, details)
    }
    if (this.isProduction && !success) {
      this.sendToLoggingService('auth_error', `Auth ${action} failed`, details)
    }
  }

  // File upload logging
  upload(fileName, size, success, error = null) {
    if (this.isDevelopment) {
      const status = success ? '✅' : '❌'
      console.log(`📁 Upload ${fileName} (${this.formatBytes(size)}): ${status}`, error)
    }
    if (this.isProduction && !success) {
      this.sendToLoggingService('upload_error', `Upload failed: ${fileName}`, { error, size })
    }
  }

  // Utility methods
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  // Mock logging service - replace with actual service in production
  sendToLoggingService(level, message, data) {
    // In a real app, this would send to services like:
    // - Sentry for error tracking
    // - LogRocket for user session recording
    // - DataDog for application monitoring
    // - Custom logging endpoints
    
    // For now, we'll store in localStorage for demo purposes
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      
      const logs = JSON.parse(localStorage.getItem('production_logs') || '[]')
      logs.push(logEntry)
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100)
      }
      
      localStorage.setItem('production_logs', JSON.stringify(logs))
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }

  // Mock analytics service
  sendToAnalytics(action, data) {
    // In a real app, this would send to services like:
    // - Google Analytics
    // - Mixpanel
    // - Amplitude
    // - Custom analytics endpoints
    
    if (this.isDevelopment) {
      console.log(`📊 Analytics: ${action}`, data)
    }
  }

  // Get production logs (for debugging)
  getProductionLogs() {
    try {
      return JSON.parse(localStorage.getItem('production_logs') || '[]')
    } catch (error) {
      return []
    }
  }

  // Clear production logs
  clearProductionLogs() {
    try {
      localStorage.removeItem('production_logs')
    } catch (error) {
      // Silently fail
    }
  }
}

// Create singleton instance
const logger = new Logger()

export default logger