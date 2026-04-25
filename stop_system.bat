@echo off
echo ============================================
echo   Smart Parking System — Stopping...
echo ============================================
echo.

echo Stopping PM2 processes...
call pm2 stop all
call pm2 delete all

echo.
echo Stopping Mosquitto...
net stop mosquitto

echo.
echo ============================================
echo   System stopped successfully.
echo ============================================
echo.
pause
