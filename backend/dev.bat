@echo off
echo Starting Gotchu Backend in Development Mode...

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

REM Check if air is installed
air -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing air for hot reload...
    go install github.com/air-verse/air@latest
)

REM Run with hot reload
echo Starting development server with hot reload...
cmd /c air

pause