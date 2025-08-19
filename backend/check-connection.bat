@echo off
echo Checking Database Connection...

REM Check if Go is installed
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Go is not installed or not in PATH
    pause
    exit /b 1
)

REM Run the connection check
echo Checking where we're actually connected...
go run check-connection.go

pause