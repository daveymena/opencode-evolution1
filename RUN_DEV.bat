@echo off
REM OpenCode Evolution - Windows Local Development Startup

setlocal enabledelayedexpansion

echo.
echo ====================================================
echo OpenCode Evolution - Development Environment
echo ====================================================
echo.

REM Check Node.js
where node >nul 2>nul
if !errorlevel! neq 0 (
    echo [ERROR] Node.js is not installed
    echo Please install from: https://nodejs.org/
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% installed

REM Check pnpm
where pnpm >nul 2>nul
if !errorlevel! neq 0 (
    echo [ERROR] pnpm is not installed
    echo Installing globally...
    npm install -g pnpm@10
)
for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
echo [OK] pnpm %PNPM_VERSION% installed

REM Set environment variables
set NODE_ENV=development
set PORT=3001
set DATABASE_URL=postgresql://opencode:opencode@localhost:5432/opencode_evolved
set LOG_LEVEL=debug
set API_URL=http://localhost:3001

echo.
echo ====================================================
echo Configuration
echo ====================================================
echo NODE_ENV: %NODE_ENV%
echo API Port: %PORT%
echo Frontend Port: 5173
echo Database: %DATABASE_URL%
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call pnpm install
)

echo.
echo ====================================================
echo Build Status
echo ====================================================

REM Check if builds exist
if exist "artifacts\api-server\dist\index.mjs" (
    echo [OK] API server built
) else (
    echo [INFO] Building API server...
    call pnpm --filter @workspace/api-server run build
)

if exist "artifacts\opencode-evolved\dist\public\index.html" (
    echo [OK] Frontend built
) else (
    echo [INFO] Building Frontend...
    call pnpm --filter @workspace/opencode-evolved run build
)

echo.
echo ====================================================
echo IMPORTANT - Database Setup
echo ====================================================
echo.
echo 1. Ensure PostgreSQL is running on localhost:5432
echo    - Download from: https://www.postgresql.org/download/windows/
echo.
echo 2. Create database and user:
echo    - psql -U postgres
echo    - CREATE USER opencode WITH PASSWORD 'opencode';
echo    - CREATE DATABASE opencode_evolved OWNER opencode;
echo    - GRANT ALL PRIVILEGES ON DATABASE opencode_evolved TO opencode;
echo.
echo 3. Run migrations:
echo    - pnpm --filter @workspace/db run push
echo.

echo ====================================================
echo STARTUP INSTRUCTIONS
echo ====================================================
echo.
echo Open 2 terminals and run:
echo.
echo TERMINAL 1 (API Server):
echo   cd "%CD%"
echo   pnpm --filter @workspace/api-server run dev
echo.
echo TERMINAL 2 (Frontend):
echo   cd "%CD%"
echo   set VITE_API_URL=http://localhost:3001
echo   pnpm --filter @workspace/opencode-evolved run dev
echo.
echo THEN:
echo   Open http://localhost:5173 in your browser
echo.
echo ====================================================
echo Verify Health Check
echo ====================================================
echo.
echo Open another terminal and run:
echo   curl http://localhost:3001/api/healthz
echo.
echo Should return: {"status":"ok"}
echo.

pause
