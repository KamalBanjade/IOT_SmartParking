@echo off
echo ============================================
echo   Smart Parking System — Startup Script
echo ============================================
echo.

echo [1/4] Starting Mosquitto MQTT Broker...
net start mosquitto
if %errorlevel% neq 0 (
  echo WARNING: Mosquitto may already be running.
)
timeout /t 2 /nobreak > nul

echo.
echo [2/4] Starting Backend API (PM2)...
cd /d D:\IOT\backend
call pm2 start ecosystem.config.cjs --env production
timeout /t 3 /nobreak > nul

echo.
echo [3/4] Starting Frontend...
cd /d D:\IOT\frontend
call pm2 serve dist 5173 --name smart-parking-ui --spa
timeout /t 2 /nobreak > nul

echo.
echo [4/4] System Status:
call pm2 list

echo.
echo ============================================
echo   Smart Parking System is RUNNING
echo ============================================
echo.
echo   Dashboard:  http://localhost:5173
echo   Admin:      http://localhost:5173/admin
echo   Analytics:  http://localhost:5173/analytics
echo   Display:    http://localhost:5173/display
echo   API Health: http://localhost:3000/health
echo.
echo   LAN Access: Replace localhost with your IP
echo   (run: ipconfig to find IPv4 Address)
echo ============================================
echo.
pause
