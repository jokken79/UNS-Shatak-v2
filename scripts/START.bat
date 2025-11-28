@echo off
chcp 65001 > nul
echo ========================================
echo  UNS-Shatak 社宅管理システム
echo  Starting Services...
echo ========================================
echo.

cd /d "%~dp0.."

echo [1/3] Starting Docker containers...
docker compose up -d

echo.
echo [2/3] Waiting for services to be ready...
timeout /t 10 /nobreak > nul

echo.
echo [3/3] Checking health...
curl -s http://localhost:8100/api/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend is healthy
) else (
    echo ⚠ Backend may still be starting...
)

echo.
echo ========================================
echo  Services Started!
echo ========================================
echo.
echo  Frontend:  http://localhost:3100
echo  API Docs:  http://localhost:8100/api/docs
echo  Adminer:   http://localhost:8180
echo.
echo  Login: admin / admin123
echo ========================================
echo.
pause
