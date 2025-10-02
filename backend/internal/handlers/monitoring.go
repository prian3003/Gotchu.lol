package handlers

import (
	"net/http"
	"time"

	"gotchu-backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// MonitoringHandler handles performance monitoring endpoints
type MonitoringHandler struct {
	db *gorm.DB
}

// NewMonitoringHandler creates a new monitoring handler
func NewMonitoringHandler(db *gorm.DB) *MonitoringHandler {
	return &MonitoringHandler{
		db: db,
	}
}

// DatabaseMetrics represents database performance metrics
type DatabaseMetrics struct {
	ConnectionPool ConnectionPoolStats `json:"connection_pool"`
	QueryMetrics   QueryPerformance    `json:"query_metrics"`
	SlowQueries    []SlowQuery         `json:"slow_queries"`
}

// ConnectionPoolStats represents connection pool statistics
type ConnectionPoolStats struct {
	OpenConnections int           `json:"open_connections"`
	InUse          int           `json:"in_use"`
	Idle           int           `json:"idle"`
	MaxOpen        int           `json:"max_open"`
	MaxIdle        int           `json:"max_idle"`
	MaxLifetime    time.Duration `json:"max_lifetime"`
	MaxIdleTime    time.Duration `json:"max_idle_time"`
}

// QueryPerformance represents query performance statistics  
type QueryPerformance struct {
	TotalQueries     int           `json:"total_queries"`
	AverageDuration  time.Duration `json:"average_duration"`
	SlowQueryCount   int           `json:"slow_query_count"`
	SlowQueryPercent float64       `json:"slow_query_percent"`
	FastestQuery     time.Duration `json:"fastest_query"`
	SlowestQuery     time.Duration `json:"slowest_query"`
}

// SlowQuery represents a slow query record
type SlowQuery struct {
	Query       string        `json:"query"`
	Duration    time.Duration `json:"duration"`
	Timestamp   time.Time     `json:"timestamp"`
	RowsAffected int64        `json:"rows_affected"`
}

// GetDatabaseMetrics returns database performance metrics
func (h *MonitoringHandler) GetDatabaseMetrics(c *gin.Context) {
	// Get database connection pool stats
	sqlDB, err := h.db.DB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get database connection",
		})
		return
	}

	stats := sqlDB.Stats()
	
	poolStats := ConnectionPoolStats{
		OpenConnections: stats.OpenConnections,
		InUse:          stats.InUse,
		Idle:           stats.Idle,
		MaxOpen:        stats.MaxOpenConnections,
		MaxIdle:        5,  // From our configuration
		MaxLifetime:    5 * time.Minute, // From our configuration
		MaxIdleTime:    2 * time.Minute, // From our configuration
	}

	// Get recent query metrics
	recentMetrics := middleware.GetQueryMetrics()
	
	// Calculate query performance statistics
	var queryPerf QueryPerformance
	if len(recentMetrics) > 0 {
		var totalDuration time.Duration
		slowCount := 0
		fastest := recentMetrics[0].Duration
		slowest := recentMetrics[0].Duration
		slowThreshold := 100 * time.Millisecond
		
		for _, metric := range recentMetrics {
			totalDuration += metric.Duration
			if metric.Duration >= slowThreshold {
				slowCount++
			}
			if metric.Duration < fastest {
				fastest = metric.Duration
			}
			if metric.Duration > slowest {
				slowest = metric.Duration
			}
		}
		
		queryPerf = QueryPerformance{
			TotalQueries:     len(recentMetrics),
			AverageDuration:  totalDuration / time.Duration(len(recentMetrics)),
			SlowQueryCount:   slowCount,
			SlowQueryPercent: float64(slowCount) / float64(len(recentMetrics)) * 100,
			FastestQuery:     fastest,
			SlowestQuery:     slowest,
		}
	}

	// Get recent slow queries
	slowQueries := make([]SlowQuery, 0)
	for _, metric := range recentMetrics {
		if metric.Duration >= 100*time.Millisecond {
			slowQueries = append(slowQueries, SlowQuery{
				Query:        metric.Query,
				Duration:     metric.Duration,
				Timestamp:    metric.Timestamp,
				RowsAffected: metric.RowsAffected,
			})
		}
	}

	// Limit to most recent 20 slow queries
	if len(slowQueries) > 20 {
		slowQueries = slowQueries[:20]
	}

	metrics := DatabaseMetrics{
		ConnectionPool: poolStats,
		QueryMetrics:   queryPerf,
		SlowQueries:    slowQueries,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Database metrics retrieved successfully",
		"data":    metrics,
	})
}

// HealthCheck returns basic health status
func (h *MonitoringHandler) HealthCheck(c *gin.Context) {
	// Test database connection
	sqlDB, err := h.db.DB()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"success": false,
			"message": "Database connection unavailable",
		})
		return
	}

	// Ping database
	if err := sqlDB.Ping(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"success": false, 
			"message": "Database ping failed",
			"error":   err.Error(),
		})
		return
	}

	// Get basic stats
	stats := sqlDB.Stats()
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Service is healthy",
		"data": gin.H{
			"database": gin.H{
				"status":           "connected",
				"open_connections": stats.OpenConnections,
				"in_use":          stats.InUse,
			},
			"timestamp": time.Now(),
		},
	})
}