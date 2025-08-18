import React, { useState, useEffect } from 'react'
import { usePerformance } from '../../providers/PerformanceProvider'
import { useTheme } from '../../contexts/ThemeContext'

const PerformanceDashboard = ({ isOpen, onClose }) => {
  const { getReport } = usePerformance()
  const { colors } = useTheme()
  const [report, setReport] = useState(null)
  const [refreshInterval, setRefreshInterval] = useState(null)

  useEffect(() => {
    if (isOpen) {
      // Get initial report
      setReport(getReport())
      
      // Set up auto-refresh
      const interval = setInterval(() => {
        setReport(getReport())
      }, 5000)
      
      setRefreshInterval(interval)
      
      return () => {
        if (interval) clearInterval(interval)
      }
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
    }
  }, [isOpen, getReport, refreshInterval])

  if (!isOpen || !report) return null

  const formatValue = (value, unit = 'ms') => {
    if (typeof value === 'number') {
      return `${Math.round(value)}${unit}`
    }
    return value?.toString() || 'N/A'
  }

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'good': return '#0CCE6B'
      case 'needs-improvement': return '#FFA400'
      case 'poor': return '#FF4E42'
      default: return colors.text
    }
  }

  const dashboardStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '400px',
    maxHeight: '80vh',
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    zIndex: 9999,
    overflow: 'auto',
    color: colors.text,
    fontSize: '14px'
  }

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${colors.border}`
  }

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: colors.text,
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px'
  }

  const sectionStyle = {
    marginBottom: '16px'
  }

  const sectionTitleStyle = {
    fontWeight: 'bold',
    marginBottom: '8px',
    color: colors.accent
  }

  const metricStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    padding: '4px 0'
  }

  const recommendationStyle = {
    backgroundColor: colors.background,
    padding: '8px',
    borderRadius: '4px',
    marginBottom: '8px',
    border: `1px solid ${colors.border}`
  }

  return (
    <div style={dashboardStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0 }}>Performance Dashboard</h3>
        <button style={closeButtonStyle} onClick={onClose}>×</button>
      </div>

      {/* Core Web Vitals */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Core Web Vitals</div>
        {Object.entries(report.webVitals || {}).map(([name, metric]) => (
          <div key={name} style={metricStyle}>
            <span>{name}:</span>
            <span style={{ color: getRatingColor(metric.rating) }}>
              {formatValue(metric.value)} ({metric.rating})
            </span>
          </div>
        ))}
      </div>

      {/* Memory Usage */}
      {report.memoryUsage && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Memory Usage</div>
          <div style={metricStyle}>
            <span>Used:</span>
            <span>{formatValue(report.memoryUsage.used / 1024 / 1024, 'MB')}</span>
          </div>
          <div style={metricStyle}>
            <span>Total:</span>
            <span>{formatValue(report.memoryUsage.total / 1024 / 1024, 'MB')}</span>
          </div>
          <div style={metricStyle}>
            <span>Limit:</span>
            <span>{formatValue(report.memoryUsage.limit / 1024 / 1024, 'MB')}</span>
          </div>
        </div>
      )}

      {/* Custom Metrics Summary */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Custom Metrics</div>
        {Object.entries(report.customMetrics || {}).map(([name, metrics]) => (
          <div key={name} style={metricStyle}>
            <span>{name}:</span>
            <span>{metrics.length} entries</span>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {report.recommendations?.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Recommendations</div>
          {report.recommendations.map((rec, index) => (
            <div key={index} style={recommendationStyle}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {rec.type}
              </div>
              <div style={{ marginBottom: '8px' }}>{rec.message}</div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
                {rec.suggestions.slice(0, 2).map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        fontSize: '12px', 
        color: colors.muted, 
        textAlign: 'center',
        paddingTop: '8px',
        borderTop: `1px solid ${colors.border}`
      }}>
        Last updated: {new Date(report.timestamp).toLocaleTimeString()}
      </div>
    </div>
  )
}

// Toggle button for the performance dashboard
export const PerformanceToggle = () => {
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  // Only show in development
  if (import.meta.env.PROD) {
    return null
  }

  const toggleStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: colors.accent,
    color: colors.background,
    border: 'none',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    zIndex: 9998,
    fontSize: '12px',
    fontWeight: 'bold'
  }

  return (
    <>
      <button 
        style={toggleStyle} 
        onClick={() => setIsOpen(!isOpen)}
        title="Performance Dashboard"
      >
        PERF
      </button>
      <PerformanceDashboard 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  )
}

export default PerformanceDashboard