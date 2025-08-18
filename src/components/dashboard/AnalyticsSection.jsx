import React from 'react'
import styled from 'styled-components'
import { HiChartBar, HiEye, HiCursorArrowRays, HiUsers, HiCalendarDays } from 'react-icons/hi2'

const AnalyticsSection = ({ analytics }) => {
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <AnalyticsContainer>
      <SectionHeader>
        <SectionTitle>
          <HiChartBar style={{ color: '#58A4B0' }} />
          Analytics Overview
        </SectionTitle>
      </SectionHeader>

      <MetricsGrid>
        <MetricCard>
          <MetricIcon className="views">
            <HiEye />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{formatNumber(analytics.totalViews)}</MetricValue>
            <MetricLabel>Total Views</MetricLabel>
            <MetricChange positive={analytics.viewsChange >= 0}>
              {analytics.viewsChange >= 0 ? '+' : ''}
              {analytics.viewsChange}% this week
            </MetricChange>
          </MetricContent>
        </MetricCard>

        <MetricCard>
          <MetricIcon className="clicks">
            <HiCursorArrowRays />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{formatNumber(analytics.totalClicks)}</MetricValue>
            <MetricLabel>Total Clicks</MetricLabel>
            <MetricChange positive={analytics.clicksChange >= 0}>
              {analytics.clicksChange >= 0 ? '+' : ''}
              {analytics.clicksChange}% this week
            </MetricChange>
          </MetricContent>
        </MetricCard>

        <MetricCard>
          <MetricIcon className="visitors">
            <HiUsers />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{formatNumber(analytics.uniqueVisitors)}</MetricValue>
            <MetricLabel>Unique Visitors</MetricLabel>
            <MetricChange positive={analytics.visitorsChange >= 0}>
              {analytics.visitorsChange >= 0 ? '+' : ''}
              {analytics.visitorsChange}% this week
            </MetricChange>
          </MetricContent>
        </MetricCard>

        <MetricCard>
          <MetricIcon className="conversion">
            <HiChartBar />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{analytics.conversionRate}%</MetricValue>
            <MetricLabel>Click Rate</MetricLabel>
            <MetricChange positive={analytics.conversionChange >= 0}>
              {analytics.conversionChange >= 0 ? '+' : ''}
              {analytics.conversionChange}% this week
            </MetricChange>
          </MetricContent>
        </MetricCard>
      </MetricsGrid>

      <ChartsGrid>
        <ChartCard>
          <ChartHeader>
            <ChartTitle>
              <HiCalendarDays />
              Last 7 Days Activity
            </ChartTitle>
          </ChartHeader>
          <ChartContent>
            <SimpleChart>
              {analytics.dailyStats.map((day, index) => (
                <ChartBar key={index}>
                  <Bar 
                    height={`${(day.views / Math.max(...analytics.dailyStats.map(d => d.views))) * 100}%`}
                    className="views"
                  />
                  <Bar 
                    height={`${(day.clicks / Math.max(...analytics.dailyStats.map(d => d.clicks))) * 100}%`}
                    className="clicks"
                  />
                  <BarLabel>{formatDate(day.date)}</BarLabel>
                </ChartBar>
              ))}
            </SimpleChart>
            <ChartLegend>
              <LegendItem>
                <LegendColor className="views" />
                <span>Views</span>
              </LegendItem>
              <LegendItem>
                <LegendColor className="clicks" />
                <span>Clicks</span>
              </LegendItem>
            </ChartLegend>
          </ChartContent>
        </ChartCard>

        <ChartCard>
          <ChartHeader>
            <ChartTitle>
              <HiCursorArrowRays />
              Top Performing Links
            </ChartTitle>
          </ChartHeader>
          <ChartContent>
            <TopLinksList>
              {analytics.topLinks.map((link, index) => (
                <TopLinkItem key={link.id}>
                  <LinkRank>#{index + 1}</LinkRank>
                  <LinkInfo>
                    <LinkTitle>{link.title}</LinkTitle>
                    <LinkClicks>{formatNumber(link.clicks)} clicks</LinkClicks>
                  </LinkInfo>
                  <LinkProgress>
                    <ProgressBar 
                      width={`${(link.clicks / Math.max(...analytics.topLinks.map(l => l.clicks))) * 100}%`}
                    />
                  </LinkProgress>
                </TopLinkItem>
              ))}
            </TopLinksList>
          </ChartContent>
        </ChartCard>
      </ChartsGrid>

      <InsightsCard>
        <InsightHeader>
          <InsightTitle>📊 Insights & Recommendations</InsightTitle>
        </InsightHeader>
        <InsightsList>
          {analytics.insights.map((insight, index) => (
            <InsightItem key={index} type={insight.type}>
              <InsightIcon>{insight.icon}</InsightIcon>
              <InsightContent>
                <InsightText>{insight.text}</InsightText>
                {insight.action && (
                  <InsightAction>{insight.action}</InsightAction>
                )}
              </InsightContent>
            </InsightItem>
          ))}
        </InsightsList>
      </InsightsCard>
    </AnalyticsContainer>
  )
}

const AnalyticsContainer = styled.div`
  margin-bottom: 2rem;
`

const SectionHeader = styled.div`
  margin-bottom: 1.5rem;
`

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`

const MetricCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.15);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 1rem;

  &:hover {
    border-color: rgba(88, 164, 176, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`

const MetricIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  
  &.views {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }
  
  &.clicks {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }
  
  &.visitors {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }
  
  &.conversion {
    background: rgba(139, 92, 246, 0.2);
    color: #8b5cf6;
  }
`

const MetricContent = styled.div`
  flex: 1;
`

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
`

const MetricLabel = styled.div`
  font-size: 0.875rem;
  color: #a0a0a0;
  margin-bottom: 0.5rem;
`

const MetricChange = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${props => props.positive ? '#10b981' : '#ef4444'};
`

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`

const ChartCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.15);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
`

const ChartHeader = styled.div`
  margin-bottom: 1.5rem;
`

const ChartTitle = styled.h4`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`

const ChartContent = styled.div`
  /* Chart content styles */
`

const SimpleChart = styled.div`
  display: flex;
  align-items: end;
  gap: 1rem;
  height: 200px;
  margin-bottom: 1rem;
  padding: 1rem 0;
`

const ChartBar = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
`

const Bar = styled.div`
  width: 100%;
  max-width: 32px;
  background: ${props => props.className === 'views' ? '#3b82f6' : '#10b981'};
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  margin-top: auto;
  min-height: 4px;
`

const BarLabel = styled.div`
  font-size: 0.75rem;
  color: #a0a0a0;
  text-align: center;
  writing-mode: horizontal-tb;
`

const ChartLegend = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #a0a0a0;
`

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  
  &.views {
    background: #3b82f6;
  }
  
  &.clicks {
    background: #10b981;
  }
`

const TopLinksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const TopLinkItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`

const LinkRank = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #58A4B0;
  min-width: 32px;
`

const LinkInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const LinkTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const LinkClicks = styled.div`
  font-size: 0.75rem;
  color: #a0a0a0;
`

const LinkProgress = styled.div`
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
`

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #58A4B0, #4a8a94);
  border-radius: 2px;
  transition: width 0.3s ease;
`

const InsightsCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(88, 164, 176, 0.15);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
`

const InsightHeader = styled.div`
  margin-bottom: 1rem;
`

const InsightTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`

const InsightsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const InsightItem = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border-left: 3px solid ${props => {
    switch (props.type) {
      case 'success': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'info': return '#3b82f6'
      default: return '#58A4B0'
    }
  }};
`

const InsightIcon = styled.div`
  font-size: 1.25rem;
  margin-top: 0.125rem;
`

const InsightContent = styled.div`
  flex: 1;
`

const InsightText = styled.p`
  font-size: 0.875rem;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
`

const InsightAction = styled.div`
  font-size: 0.75rem;
  color: #58A4B0;
  font-weight: 600;
`

export default AnalyticsSection