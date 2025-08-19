@echo off
echo Setting up Supabase Storage Buckets...

REM Check if Go is installed
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Go is not installed or not in PATH
    pause
    exit /b 1
)

REM Load .env file and set environment variables
echo Loading environment variables from .env file...
for /f "usebackq tokens=1,2 delims==" %%A in (".env") do (
    if not "%%A"=="" if not "%%B"=="" (
        set "%%A=%%B"
    )
)

REM Remove quotes from environment variables if present
set NEXT_PUBLIC_SUPABASE_URL=%NEXT_PUBLIC_SUPABASE_URL:"=%
set SUPABASE_SERVICE_ROLE_KEY=%SUPABASE_SERVICE_ROLE_KEY:"=%

REM Check for environment variables
if "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo Error: NEXT_PUBLIC_SUPABASE_URL not found in .env file
    pause
    exit /b 1
)

if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo Error: SUPABASE_SERVICE_ROLE_KEY not found in .env file
    pause
    exit /b 1
)

echo Supabase URL: %NEXT_PUBLIC_SUPABASE_URL%
echo Service Key loaded successfully

REM Run the bucket setup script
echo Running bucket setup...
go run scripts/setup-buckets.go

pause