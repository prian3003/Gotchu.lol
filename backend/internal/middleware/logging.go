package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// LoggingMiddleware provides detailed request/response logging
func LoggingMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		var statusColor, methodColor, resetColor string
		if param.IsOutputColor() {
			statusColor = param.StatusCodeColor()
			methodColor = param.MethodColor()
			resetColor = param.ResetColor()
		}

		if param.Latency > time.Minute {
			param.Latency = param.Latency.Truncate(time.Second)
		}

		return fmt.Sprintf("[GIN] %v |%s %3d %s| %13v | %15s |%s %-7s %s %#v\n%s",
			param.TimeStamp.Format("2006/01/02 - 15:04:05"),
			statusColor, param.StatusCode, resetColor,
			param.Latency,
			param.ClientIP,
			methodColor, param.Method, resetColor,
			param.Path,
			param.ErrorMessage,
		)
	})
}

// RequestResponseLogger logs detailed request and response data
func RequestResponseLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Log request
		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// Create response writer to capture response
		writer := &responseBodyWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		c.Writer = writer

		start := time.Now()
		c.Next()
		duration := time.Since(start)

		// Log details
		logData := map[string]interface{}{
			"timestamp":     start.Format(time.RFC3339),
			"method":        c.Request.Method,
			"path":          c.Request.URL.Path,
			"query":         c.Request.URL.RawQuery,
			"client_ip":     c.ClientIP(),
			"user_agent":    c.Request.UserAgent(),
			"status_code":   c.Writer.Status(),
			"duration_ms":   duration.Milliseconds(),
			"request_size":  len(requestBody),
			"response_size": writer.body.Len(),
		}

		// Add user info if available
		if userID, exists := c.Get("user_id"); exists {
			logData["user_id"] = userID
		}

		// Add request body for non-GET requests (but sanitize sensitive data)
		if c.Request.Method != "GET" && len(requestBody) > 0 {
			var body map[string]interface{}
			if json.Unmarshal(requestBody, &body) == nil {
				// Remove sensitive fields
				sanitizeFields := []string{"password", "confirmPassword", "token", "secret"}
				for _, field := range sanitizeFields {
					if _, exists := body[field]; exists {
						body[field] = "[REDACTED]"
					}
				}
				logData["request_body"] = body
			}
		}

		// Log different levels based on status code
		logJSON, _ := json.Marshal(logData)
		switch {
		case c.Writer.Status() >= 500:
			log.Printf("[ERROR] %s", logJSON)
		case c.Writer.Status() >= 400:
			log.Printf("[WARN] %s", logJSON)
		default:
			log.Printf("[INFO] %s", logJSON)
		}
	}
}

type responseBodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (r responseBodyWriter) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}