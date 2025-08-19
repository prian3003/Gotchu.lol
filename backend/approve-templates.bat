@echo off
echo Approving Templates for Testing...

REM Check if Go is installed
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Go is not installed or not in PATH
    pause
    exit /b 1
)

REM Run the approval script
echo Approving all pending templates...
go run approve-templates.go

pause