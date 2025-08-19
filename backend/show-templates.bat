@echo off
echo Showing Templates in Supabase...

REM Check if Go is installed
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Go is not installed or not in PATH
    pause
    exit /b 1
)

REM Show templates
echo Fetching all templates from Supabase database...
go run show-templates.go

pause