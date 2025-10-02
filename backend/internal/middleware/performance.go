package middleware

import (
	"context"
	"fmt"
	"log"
	"time"

	"gorm.io/gorm/logger"
)

// PerformanceMonitor tracks database query performance
type PerformanceMonitor struct {
	slowThreshold time.Duration
	logger        logger.Interface
}

// NewPerformanceMonitor creates a new performance monitoring middleware
func NewPerformanceMonitor(slowThreshold time.Duration) *PerformanceMonitor {
	return &PerformanceMonitor{
		slowThreshold: slowThreshold,
	}
}

// QueryMetrics represents database query metrics
type QueryMetrics struct {
	Query       string        `json:"query"`
	Duration    time.Duration `json:"duration"`
	Timestamp   time.Time     `json:"timestamp"`
	RowsAffected int64        `json:"rows_affected"`
	Source      string        `json:"source"`
}

// Global metrics collection
var QueryMetricsChannel = make(chan QueryMetrics, 1000)

// LogMode returns logger mode
func (pm *PerformanceMonitor) LogMode(level logger.LogLevel) logger.Interface {
	newLogger := *pm
	return &newLogger
}

// Info logs info level messages
func (pm *PerformanceMonitor) Info(ctx context.Context, msg string, data ...interface{}) {
	log.Printf("[INFO] "+msg, data...)
}

// Warn logs warning level messages  
func (pm *PerformanceMonitor) Warn(ctx context.Context, msg string, data ...interface{}) {
	log.Printf("[WARN] "+msg, data...)
}

// Error logs error level messages
func (pm *PerformanceMonitor) Error(ctx context.Context, msg string, data ...interface{}) {
	log.Printf("[ERROR] "+msg, data...)
}

// Trace logs SQL queries with performance monitoring
func (pm *PerformanceMonitor) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	elapsed := time.Since(begin)
	sql, rowsAffected := fc()
	
	// Always log to metrics channel for analysis
	select {
	case QueryMetricsChannel <- QueryMetrics{
		Query:        sql,
		Duration:     elapsed,
		Timestamp:    begin,
		RowsAffected: rowsAffected,
		Source:       "gorm",
	}:
	default:
		// Channel is full, skip this metric
	}

	// Log slow queries
	if elapsed >= pm.slowThreshold {
		if err != nil {
			log.Printf("[SLOW QUERY - ERROR] Duration: %v | Error: %v | SQL: %s | Rows: %d", 
				elapsed, err, sql, rowsAffected)
		} else {
			log.Printf("[SLOW QUERY] Duration: %v | SQL: %s | Rows: %d", 
				elapsed, sql, rowsAffected)
		}
	} else if err != nil {
		// Log errors even for fast queries
		log.Printf("[QUERY ERROR] Duration: %v | Error: %v | SQL: %s", elapsed, err, sql)
	}
}

// StartMetricsProcessor starts background processing of query metrics
func StartMetricsProcessor() {
	go func() {
		slowQueryCount := 0
		totalQueries := 0
		var totalDuration time.Duration
		
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		
		for {
			select {
			case metric := <-QueryMetricsChannel:
				totalQueries++
				totalDuration += metric.Duration
				
				if metric.Duration >= 100*time.Millisecond {
					slowQueryCount++
				}
				
			case <-ticker.C:
				if totalQueries > 0 {
					avgDuration := totalDuration / time.Duration(totalQueries)
					slowPercentage := float64(slowQueryCount) / float64(totalQueries) * 100
					
					log.Printf("[DB METRICS] Queries: %d | Avg Duration: %v | Slow Queries: %d (%.1f%%)",
						totalQueries, avgDuration, slowQueryCount, slowPercentage)
					
					// Reset counters
					slowQueryCount = 0
					totalQueries = 0
					totalDuration = 0
				}
			}
		}
	}()
}

// GetQueryMetrics returns recent query metrics for monitoring
func GetQueryMetrics() []QueryMetrics {
	metrics := make([]QueryMetrics, 0)
	timeout := time.After(100 * time.Millisecond)
	
	for len(metrics) < 100 {
		select {
		case metric := <-QueryMetricsChannel:
			metrics = append(metrics, metric)
		case <-timeout:
			break
		}
	}
	
	return metrics
}

// initializePerformanceLogging sets up enhanced performance logging
func InitializePerformanceLogging() {
	fmt.Println("🔍 Database performance monitoring initialized")
	fmt.Printf("   - Slow query threshold: %v\n", 100*time.Millisecond)
	fmt.Printf("   - Metrics collection: enabled\n")
	fmt.Printf("   - Background processing: started\n")
	
	StartMetricsProcessor()
}