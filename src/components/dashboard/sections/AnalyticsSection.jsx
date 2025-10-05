import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../../../config/api'
import { 
  HiChartBar, 
  HiEye, 
  HiClock,
  HiGlobeAlt,
  HiDevicePhoneMobile,
  HiComputerDesktop,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiCalendarDays,
  HiUsers,
  HiHeart,
  HiShare,
  HiChartPie,
  HiLink,
  HiCursorArrowRays,
  HiChevronDown,
  HiBars3,
  HiSparkles
} from 'react-icons/hi2'
import { useTheme } from '../../../contexts/ThemeContext'
import { SimpleIconComponent } from '../../../utils/simpleIconsHelper.jsx'

// Helper function to render social icons using Simple Icons
const renderSocialIcon = (iconName) => {
  if (!iconName) return <HiLink size={18} />
  
  // Skip emoji detection for now and force Simple Icons
  // If it's an emoji, return as is
  // if (/[\u{1F000}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(iconName)) {
  //   return <span style={{ fontSize: '18px' }}>{iconName}</span>
  // }
  
  // Use Simple Icons with brand colors
  return <SimpleIconComponent iconName={iconName} size={18} useWhite={false} />
}

// Helper function to render country flags using flag-icons package
const renderCountryFlag = (countryName) => {
  if (!countryName) {
    return <HiGlobeAlt size={18} style={{ color: '#666' }} />
  }
  
  // Map common country names to ISO 2-letter codes for flag-icons
  const countryCodeMap = {
    'United States': 'us',
    'United Kingdom': 'gb',
    'Canada': 'ca',
    'Australia': 'au',
    'Germany': 'de',
    'France': 'fr',
    'Spain': 'es',
    'Italy': 'it',
    'Netherlands': 'nl',
    'Japan': 'jp',
    'China': 'cn',
    'India': 'in',
    'Brazil': 'br',
    'Mexico': 'mx',
    'Russia': 'ru',
    'South Korea': 'kr',
    'Singapore': 'sg',
    'Sweden': 'se',
    'Norway': 'no',
    'Denmark': 'dk',
    'Finland': 'fi',
    'Poland': 'pl',
    'South Africa': 'za',
    'New Zealand': 'nz',
    'Ireland': 'ie',
    'Belgium': 'be',
    'Switzerland': 'ch',
    'Austria': 'at',
    'Portugal': 'pt'
  }
  
  const countryCode = countryCodeMap[countryName] || countryName.toLowerCase().slice(0, 2)
  
  return (
    <span 
      className={`fi fi-${countryCode}`}
      style={{
        width: '1.33em',
        height: '1em',
        display: 'inline-block',
        borderRadius: '2px',
        fontSize: '18px',
        lineHeight: '1'
      }}
      title={countryName}
    >
      {/* Fallback text if flag doesn't load */}
      <span style={{ 
        fontSize: '10px', 
        color: '#666',
        position: 'absolute',
        opacity: 0.3
      }}>
        {countryCode.toUpperCase()}
      </span>
    </span>
  )
}

const AnalyticsSection = ({ user }) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Get time range from URL params or default
  const urlTimeRange = searchParams.get('period') || 'Today'
  const [timeRange, setTimeRange] = useState(urlTimeRange)
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [previousPeriodData, setPreviousPeriodData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredBar, setHoveredBar] = useState(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { colors, isDarkMode } = useTheme()
  
  // Time range options based on user plan
  const timeRangeOptions = user?.is_premium || user?.plan === 'premium' 
    ? ['Today', 'Last 7 days', 'Last 14 days', 'Last 30 days', 'All Time'] 
    : ['Today', 'Last 7 days', 'Last 14 days', 'All Time']
  
  // Helper function to get days from time range
  const getDaysFromTimeRange = (range) => {
    switch (range) {
      case 'Today': return 1
      case 'Last 7 days': return 7
      case 'Last 14 days': return 14
      case 'Last 30 days': return 30
      case 'All Time': return 0 // 0 means no time limit - all historical data
      default: return 7 // Default to 7 days instead of 14
    }
  }

  // Helper function to calculate growth percentage
  const calculateGrowthPercentage = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100 * 10) / 10
  }

  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const days = getDaysFromTimeRange(timeRange)
        
        // Fetch current period data
        const response = await fetch(`${API_BASE_URL}/dashboard/analytics?days=${days}`, {
          method: 'GET',
          credentials: 'include', // Use httpOnly cookies for auth
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success) {
          setAnalyticsData(result.data)
          
          // Fetch previous period data for growth calculation
          try {
            const prevResponse = await fetch(`${API_BASE_URL}/dashboard/analytics?days=${days}&offset=${days}`, {
              method: 'GET',
              credentials: 'include', // Use httpOnly cookies for auth
              headers: {
                'Content-Type': 'application/json'
              }
            })
            
            if (prevResponse.ok) {
              const prevResult = await prevResponse.json()
              if (prevResult.success) {
                setPreviousPeriodData(prevResult.data)
              }
            }
          } catch (prevErr) {
            console.warn('Could not fetch previous period data for growth calculation:', prevErr)
          }
        } else {
          throw new Error(result.message || 'Failed to fetch analytics data')
        }
      } catch (err) {
        console.error('Error fetching analytics:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (user) {
      fetchAnalytics()
    }
  }, [user, timeRange])

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const formatPercentage = (num) => {
    return num > 0 ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`
  }

  if (isLoading) {
    return (
      <div style={{
        background: colors.background,
        color: colors.text,
        minHeight: '100vh',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${colors.border}`,
            borderTop: `3px solid ${colors.accent}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: colors.muted }}>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        background: colors.background,
        color: colors.text,
        minHeight: '100vh',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ff6b6b', marginBottom: '16px' }}>Failed to load analytics: {error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: colors.accent,
              color: colors.background,
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return null
  }

  return (
    <div style={{
      background: colors.background,
      color: colors.text,
      minHeight: '100vh',
      padding: '24px'
    }}>
      {/* Header with Time Range */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            margin: '0 0 8px 0',
            color: colors.text
          }}>Analytics Dashboard</h1>
          <p style={{
            color: colors.muted,
            margin: 0,
            fontSize: '14px'
          }}>Track your profile performance and visitor insights</p>
        </div>
        
        <div style={{
          position: 'relative',
          display: 'inline-block'
        }}>
          <button
            onClick={() => setShowTimeDropdown(!showTimeDropdown)}
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '8px 16px',
              color: colors.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            {timeRange}
            <HiChevronDown style={{ transform: showTimeDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          
          {showTimeDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 10,
              minWidth: '140px'
            }}>
              {timeRangeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setTimeRange(option)
                    setShowTimeDropdown(false)
                    // Update URL params
                    const newSearchParams = new URLSearchParams(searchParams)
                    newSearchParams.set('period', option)
                    setSearchParams(newSearchParams)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    background: 'none',
                    border: 'none',
                    color: colors.text,
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left',
                    borderRadius: option === timeRangeOptions[0] ? '8px 8px 0 0' : option === timeRangeOptions[timeRangeOptions.length - 1] ? '0 0 8px 8px' : '0'
                  }}
                  onMouseEnter={(e) => e.target.style.background = colors.border}
                  onMouseLeave={(e) => e.target.style.background = 'none'}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <HiLink style={{ color: colors.accent, fontSize: '20px' }} />
            <span style={{ color: colors.muted, fontSize: '14px' }}>Total Link Clicks</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
            {formatNumber(analyticsData.total_link_clicks || 0)}
          </div>
          {(() => {
            const growth = calculateGrowthPercentage(
              analyticsData.total_link_clicks || 0,
              previousPeriodData?.total_link_clicks || 0
            )
            const isPositive = growth >= 0
            return (
              <div style={{ 
                color: isPositive ? '#22c55e' : '#ef4444', 
                fontSize: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}>
                {isPositive ? <HiArrowTrendingUp /> : <HiArrowTrendingDown />}
                {isPositive ? '+' : ''}{growth}% from last period
              </div>
            )
          })()}
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <HiCursorArrowRays style={{ color: colors.accent, fontSize: '20px' }} />
            <span style={{ color: colors.muted, fontSize: '14px' }}>Click Rate</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
            {analyticsData.click_rate ? parseFloat(analyticsData.click_rate).toFixed(1) : 0}%
          </div>
          {(() => {
            const growth = calculateGrowthPercentage(
              analyticsData.click_rate || 0,
              previousPeriodData?.click_rate || 0
            )
            const isPositive = growth >= 0
            return (
              <div style={{ 
                color: isPositive ? '#22c55e' : '#ef4444', 
                fontSize: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}>
                {isPositive ? <HiArrowTrendingUp /> : <HiArrowTrendingDown />}
                {isPositive ? '+' : ''}{growth}% from last period
              </div>
            )
          })()}
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <HiEye style={{ color: colors.accent, fontSize: '20px' }} />
            <span style={{ color: colors.muted, fontSize: '14px' }}>Profile Views</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
            {formatNumber(analyticsData.profile_views || 0)}
          </div>
          {(() => {
            const growth = calculateGrowthPercentage(
              analyticsData.profile_views || 0,
              previousPeriodData?.profile_views || 0
            )
            const isPositive = growth >= 0
            return (
              <div style={{ 
                color: isPositive ? '#22c55e' : '#ef4444', 
                fontSize: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}>
                {isPositive ? <HiArrowTrendingUp /> : <HiArrowTrendingDown />}
                {isPositive ? '+' : ''}{growth}% from last period
              </div>
            )
          })()}
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <HiChartBar style={{ color: colors.accent, fontSize: '20px' }} />
            <span style={{ color: colors.muted, fontSize: '14px' }}>Average Daily Views</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
            {analyticsData.average_daily_views || 0}
          </div>
          {(() => {
            const growth = calculateGrowthPercentage(
              analyticsData.average_daily_views || 0,
              previousPeriodData?.average_daily_views || 0
            )
            const isPositive = growth >= 0
            return (
              <div style={{ 
                color: isPositive ? '#22c55e' : '#ef4444', 
                fontSize: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}>
                {isPositive ? <HiArrowTrendingUp /> : <HiArrowTrendingDown />}
                {isPositive ? '+' : ''}{growth}% from last period
              </div>
            )
          })()}
        </div>
      </div>

      {/* Charts and Data Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '20px'
      }}>
        {/* Profile Views Chart */}
        <div style={{
          gridColumn: 'span 8',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px',
          position: 'relative'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: colors.text }}>Profile Views</h3>
          <div style={{
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'space-between',
            height: '200px',
            gap: '12px',
            paddingTop: '20px'
          }}>
            {(() => {
              const chartData = analyticsData.profile_views_chart || []
              const totalProfileViews = analyticsData.profile_views || 0
              
              // Check if chart data exists but has all zeros, or no chart data at all
              const chartHasData = chartData.length > 0 && chartData.some(item => (item.views || 0) > 0)
              
              // If no meaningful chart data but we have profile views, create a simple chart
              if (!chartHasData && totalProfileViews > 0) {
                const todayData = [{
                  day: 'Today',
                  views: totalProfileViews
                }]
                const maxViews = Math.max(...todayData.map(item => item.views || 0), 1)
                const minHeight = 8
                
                return todayData.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    position: 'relative'
                  }}>
                    <div 
                      style={{
                        width: '100%',
                        height: `${Math.max(minHeight, (item.views / maxViews) * 160)}px`,
                        background: hoveredBar === index 
                          ? `linear-gradient(to top, ${colors.accent}, ${colors.accent})`
                          : `linear-gradient(to top, ${colors.accent}, ${colors.accent}80)`,
                        borderRadius: '4px 4px 0 0',
                        marginBottom: '8px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        transform: hoveredBar === index ? 'scaleY(1.05)' : 'scaleY(1)'
                      }}
                      onMouseEnter={(e) => {
                        setHoveredBar(index)
                        const rect = e.target.getBoundingClientRect()
                        setMousePosition({ 
                          x: rect.left + rect.width / 2, 
                          y: rect.top - 10 
                        })
                      }}
                      onMouseLeave={() => {
                        setHoveredBar(null)
                      }}
                    />
                    <span style={{ color: colors.muted, fontSize: '12px' }}>{item.day}</span>
                  </div>
                ))
              }
              
              // Calculate dynamic max value for better scaling
              const maxViews = Math.max(...chartData.map(item => item.views || 0), 1) // Ensure minimum of 1
              const minHeight = 8 // Minimum bar height in pixels for visibility
              
              return chartData.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  position: 'relative'
                }}>
                  <div 
                    style={{
                      width: '100%',
                      height: `${Math.max(minHeight, (item.views / maxViews) * 160)}px`,
                      background: hoveredBar === index 
                        ? `linear-gradient(to top, ${colors.accent}, ${colors.accent})`
                        : `linear-gradient(to top, ${colors.accent}, ${colors.accent}80)`,
                      borderRadius: '4px 4px 0 0',
                      marginBottom: '8px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      transform: hoveredBar === index ? 'scaleY(1.05)' : 'scaleY(1)'
                    }}
                    onMouseEnter={(e) => {
                      setHoveredBar(index)
                      const rect = e.target.getBoundingClientRect()
                      setMousePosition({ 
                        x: rect.left + rect.width / 2, 
                        y: rect.top - 10 
                      })
                    }}
                    onMouseLeave={() => {
                      setHoveredBar(null)
                    }}
                  />
                  <span style={{ color: colors.muted, fontSize: '12px' }}>{item.day}</span>
                </div>
              ))
            })()}
          </div>

          {/* Tooltip */}
          {hoveredBar !== null && (
            <div style={{
              position: 'fixed',
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y}px`,
              transform: 'translate(-50%, -100%)',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '8px 12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              pointerEvents: 'none',
              fontSize: '12px',
              color: colors.text,
              whiteSpace: 'nowrap'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                {(() => {
                  const chartData = analyticsData.profile_views_chart || []
                  const totalProfileViews = analyticsData.profile_views || 0
                  const chartHasData = chartData.length > 0 && chartData.some(item => (item.views || 0) > 0)
                  
                  // Use fallback data if no meaningful chart data
                  if (!chartHasData && totalProfileViews > 0) {
                    return 'Today'
                  }
                  return chartData[hoveredBar]?.day || 'Unknown'
                })()}
              </div>
              <div style={{ color: colors.accent, fontWeight: '600' }}>
                {(() => {
                  const chartData = analyticsData.profile_views_chart || []
                  const totalProfileViews = analyticsData.profile_views || 0
                  const chartHasData = chartData.length > 0 && chartData.some(item => (item.views || 0) > 0)
                  
                  // Use fallback data if no meaningful chart data
                  if (!chartHasData && totalProfileViews > 0) {
                    return `${totalProfileViews} view${totalProfileViews !== 1 ? 's' : ''}`
                  }
                  const views = chartData[hoveredBar]?.views || 0
                  return `${views} view${views !== 1 ? 's' : ''}`
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Visitor Devices */}
        <div style={{
          gridColumn: 'span 4',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: colors.text }}>Visitor Devices</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HiDevicePhoneMobile style={{ color: colors.accent, fontSize: '16px' }} />
                <span style={{ color: colors.text, fontSize: '14px' }}>Mobile</span>
              </div>
              <span style={{ color: colors.text, fontWeight: '600' }}>{analyticsData.devices?.mobile ? parseFloat(analyticsData.devices.mobile).toFixed(1) : 0}%</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HiComputerDesktop style={{ color: colors.accent, fontSize: '16px' }} />
                <span style={{ color: colors.text, fontSize: '14px' }}>Desktop</span>
              </div>
              <span style={{ color: colors.text, fontWeight: '600' }}>{analyticsData.devices?.desktop ? parseFloat(analyticsData.devices.desktop).toFixed(1) : 0}%</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HiChartPie style={{ color: colors.accent, fontSize: '16px' }} />
                <span style={{ color: colors.text, fontSize: '14px' }}>Tablet</span>
              </div>
              <span style={{ color: colors.text, fontWeight: '600' }}>{analyticsData.devices?.tablet ? parseFloat(analyticsData.devices.tablet).toFixed(1) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Most Clicked Socials */}
        <div style={{
          gridColumn: 'span 4',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: colors.text }}>Most Clicked Socials</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(analyticsData.top_socials || []).map((social, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {renderSocialIcon(social.icon)}
                  <span style={{ color: colors.text, fontSize: '14px' }}>{social.name}</span>
                </div>
                <span style={{ color: colors.text, fontWeight: '600', fontSize: '14px' }}>
                  {social.clicks}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Referrers */}
        <div style={{
          gridColumn: 'span 4',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: colors.text }}>Top Referrers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(analyticsData.top_referrers || []).map((referrer, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '16px' }}>{referrer.icon}</span>
                  <span style={{ color: colors.text, fontSize: '14px' }}>{referrer.source}</span>
                </div>
                <span style={{ color: colors.text, fontWeight: '600', fontSize: '14px' }}>
                  {referrer.visits ? parseFloat(referrer.visits).toFixed(1) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Countries by Views */}
        <div style={{
          gridColumn: 'span 4',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: colors.text }}>Top Countries by Views</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(analyticsData.top_countries || []).map((country, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 0'
              }}>
                <div style={{
                  width: '24px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {renderCountryFlag(country.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: colors.text, fontSize: '14px' }}>{country.name}</span>
                    <span style={{ color: colors.muted, fontSize: '12px' }}>{country.views}</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '4px',
                    background: colors.border,
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${country.percentage}%`,
                      height: '100%',
                      background: colors.accent,
                      borderRadius: '2px'
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsSection