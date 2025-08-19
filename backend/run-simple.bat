@echo off
echo Starting Gotchu Backend...

REM Check if Go is installed
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Go is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo Error: .env file not found!
    echo Please create a .env file with your configuration
    pause
    exit /b 1
)

REM Ensure tmp directory exists
if not exist "tmp" mkdir tmp

REM Clean previous build
if exist "tmp\main.exe" del "tmp\main.exe"

REM Download dependencies
echo Downloading dependencies...
go mod download
go mod tidy

REM Build the application
echo Building application...
go build -o tmp\main.exe cmd\main.go
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

REM Check if executable was created
if not exist "tmp\main.exe" (
    echo Executable not created!
    pause
    exit /b 1
)

REM Run the application
echo Starting server...
echo .env file found - configuration will be loaded automatically
echo Running with database migrations enabled
tmp\main.exe

pause