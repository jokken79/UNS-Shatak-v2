@echo off
chcp 65001 > nul
echo ========================================
echo  UNS-Shatak - Stopping Services
echo ========================================
echo.

cd /d "%~dp0.."
docker compose down

echo.
echo ✓ All services stopped
echo.
pause
