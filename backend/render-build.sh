#!/bin/bash
set -e

echo "Starting Render build process..."

# Install dependencies
echo "Installing Go dependencies..."
go mod download
go mod verify

# Run any migrations or setup
echo "Setting up database..."
# Add your migration commands here if needed
# go run migrate.go

# Build the application
echo "Building Go application..."
go build -o main .

echo "Build completed successfully!"