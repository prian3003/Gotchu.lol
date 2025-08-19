@echo off
echo Testing Template Database Setup...

REM Check if Go is installed
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Go is not installed or not in PATH
    pause
    exit /b 1
)

REM Run the debug script
echo Running template debug script...
go run debug-template.go

pause