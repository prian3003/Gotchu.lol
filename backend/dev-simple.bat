@echo off
echo Starting Gotchu Backend in Simple Development Mode...

REM Check if Go is installed
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Go is not installed or not in PATH
    pause
    exit /b 1
)

REM Download dependencies
echo Downloading dependencies...
go mod download
go mod tidy

REM Run the application directly
echo Starting server on port 8080...
echo Note: You'll need to manually restart when making changes
go run cmd/main.go

pause