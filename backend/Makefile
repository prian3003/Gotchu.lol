# Go backend Makefile for gotchu.lol

.PHONY: help build run dev test clean docker-build docker-run deps migrate

# Default target
help:
	@echo "Available commands:"
	@echo "  build      - Build the application"
	@echo "  run        - Run the application"
	@echo "  dev        - Run in development mode with air (hot reload)"
	@echo "  test       - Run tests"
	@echo "  clean      - Clean build artifacts"
	@echo "  deps       - Download dependencies"
	@echo "  migrate    - Run database migrations"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run - Run with Docker"

# Build the application
build:
	@echo "Building gotchu-backend..."
	go build -o bin/gotchu-backend cmd/main.go

# Run the application
run: build
	@echo "Starting gotchu-backend..."
	./bin/gotchu-backend

# Development mode with hot reload (requires air)
dev:
	@echo "Starting development server with hot reload..."
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "Installing air for hot reload..."; \
		go install github.com/cosmtrek/air@latest; \
		air; \
	fi

# Run tests
test:
	@echo "Running tests..."
	go test -v ./...

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf bin/
	go clean

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy

# Run database migrations
migrate:
	@echo "Running database migrations..."
	go run cmd/main.go --migrate-only

# Build Docker image
docker-build:
	@echo "Building Docker image..."
	docker build -t gotchu-backend .

# Run with Docker
docker-run:
	@echo "Running with Docker..."
	docker run -p 8080:8080 --env-file .env gotchu-backend

# Initialize project (run once)
init:
	@echo "Initializing project..."
	go mod init gotchu-backend || true
	go mod tidy
	@echo "Project initialized!"

# Format code
fmt:
	@echo "Formatting code..."
	go fmt ./...

# Lint code (requires golangci-lint)
lint:
	@echo "Linting code..."
	@if command -v golangci-lint > /dev/null; then \
		golangci-lint run; \
	else \
		echo "Installing golangci-lint..."; \
		curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin v1.54.2; \
		golangci-lint run; \
	fi

# Security check (requires gosec)
security:
	@echo "Running security check..."
	@if command -v gosec > /dev/null; then \
		gosec ./...; \
	else \
		echo "Installing gosec..."; \
		go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest; \
		gosec ./...; \
	fi

# Generate docs (requires swag)
docs:
	@echo "Generating API documentation..."
	@if command -v swag > /dev/null; then \
		swag init -g cmd/main.go; \
	else \
		echo "Installing swag..."; \
		go install github.com/swaggo/swag/cmd/swag@latest; \
		swag init -g cmd/main.go; \
	fi

# Database operations
db-reset:
	@echo "Resetting database..."
	@echo "WARNING: This will drop all data. Are you sure? (y/N)"
	@read confirm && [ "$$confirm" = "y" ] || exit 1
	go run cmd/main.go --reset-db

# Load test data
db-seed:
	@echo "Seeding test data..."
	go run cmd/main.go --seed

# Check dependencies
check-deps:
	@echo "Checking for required dependencies..."
	@command -v go > /dev/null || (echo "Go is not installed" && exit 1)
	@echo "✓ Go is installed"
	@command -v docker > /dev/null || echo "⚠ Docker is not installed (optional)"
	@command -v redis-server > /dev/null || echo "⚠ Redis is not installed locally (using remote)"
	@echo "✓ Dependencies check complete"

# Full setup for new development environment
setup: check-deps deps
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then \
		echo "Creating .env file from example..."; \
		cp .env.example .env 2>/dev/null || echo "No .env.example found, create .env manually"; \
	fi
	@echo "✓ Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Update .env file with your configuration"
	@echo "2. Run 'make migrate' to set up the database"
	@echo "3. Run 'make dev' to start development server"

# Production build
prod-build:
	@echo "Building for production..."
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-extldflags "-static"' -o bin/gotchu-backend cmd/main.go

# Show logs (when running with Docker)
logs:
	docker logs -f gotchu-backend

# Stop Docker container
stop:
	docker stop gotchu-backend || true
	docker rm gotchu-backend || true