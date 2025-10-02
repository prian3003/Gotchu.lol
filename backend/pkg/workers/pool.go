package workers

import (
	"context"
	"log"
	"runtime"
	"sync"
	"time"
)

// Job represents a background job
type Job struct {
	ID      string
	Handler func() error
	Timeout time.Duration
}

// WorkerPool manages background job execution
type WorkerPool struct {
	workers    int
	jobQueue   chan Job
	quit       chan bool
	wg         sync.WaitGroup
	ctx        context.Context
	cancel     context.CancelFunc
	jobTimeout time.Duration
}

// NewWorkerPool creates a new worker pool
func NewWorkerPool(workers int, queueSize int) *WorkerPool {
	if workers <= 0 {
		workers = runtime.NumCPU()
	}
	if queueSize <= 0 {
		queueSize = workers * 100
	}

	ctx, cancel := context.WithCancel(context.Background())
	
	return &WorkerPool{
		workers:    workers,
		jobQueue:   make(chan Job, queueSize),
		quit:       make(chan bool),
		ctx:        ctx,
		cancel:     cancel,
		jobTimeout: 30 * time.Second, // Default timeout
	}
}

// Start initializes the worker pool
func (wp *WorkerPool) Start() {
	log.Printf("🔧 Starting worker pool with %d workers", wp.workers)
	
	for i := 0; i < wp.workers; i++ {
		wp.wg.Add(1)
		go wp.worker(i)
	}
	
	log.Printf("✅ Worker pool started successfully")
}

// worker processes jobs from the queue
func (wp *WorkerPool) worker(id int) {
	defer wp.wg.Done()
	
	for {
		select {
		case job := <-wp.jobQueue:
			wp.processJob(id, job)
		case <-wp.ctx.Done():
			log.Printf("🔧 Worker %d shutting down", id)
			return
		}
	}
}

// processJob executes a job with timeout and error recovery
func (wp *WorkerPool) processJob(workerID int, job Job) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("🚨 Worker %d: Job %s panicked: %v", workerID, job.ID, r)
		}
	}()

	timeout := job.Timeout
	if timeout == 0 {
		timeout = wp.jobTimeout
	}

	ctx, cancel := context.WithTimeout(wp.ctx, timeout)
	defer cancel()

	done := make(chan error, 1)
	go func() {
		done <- job.Handler()
	}()

	select {
	case err := <-done:
		if err != nil {
			log.Printf("🚨 Worker %d: Job %s failed: %v", workerID, job.ID, err)
		}
	case <-ctx.Done():
		log.Printf("⏰ Worker %d: Job %s timed out", workerID, job.ID)
	}
}

// Submit adds a job to the queue
func (wp *WorkerPool) Submit(job Job) bool {
	select {
	case wp.jobQueue <- job:
		return true
	default:
		log.Printf("⚠️ Worker pool queue full, dropping job %s", job.ID)
		return false
	}
}

// SubmitFunc is a convenience method to submit a function as a job
func (wp *WorkerPool) SubmitFunc(id string, handler func() error) bool {
	return wp.Submit(Job{
		ID:      id,
		Handler: handler,
		Timeout: wp.jobTimeout,
	})
}

// Stop gracefully shuts down the worker pool
func (wp *WorkerPool) Stop(timeout time.Duration) {
	log.Printf("🔧 Shutting down worker pool...")
	
	// Signal workers to stop
	wp.cancel()
	
	// Wait for workers to finish with timeout
	done := make(chan struct{})
	go func() {
		wp.wg.Wait()
		close(done)
	}()
	
	select {
	case <-done:
		log.Printf("✅ Worker pool shut down gracefully")
	case <-time.After(timeout):
		log.Printf("⚠️ Worker pool shutdown timed out")
	}
}

// GetStats returns worker pool statistics
func (wp *WorkerPool) GetStats() map[string]interface{} {
	return map[string]interface{}{
		"workers":     wp.workers,
		"queue_size":  cap(wp.jobQueue),
		"queue_used":  len(wp.jobQueue),
		"queue_free":  cap(wp.jobQueue) - len(wp.jobQueue),
	}
}