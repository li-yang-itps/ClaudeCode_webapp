@echo off
cd /d "%~dp0"
echo Killing any existing processes on ports 3000-3002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 "') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002 "') do taskkill /PID %%a /F 2>nul
timeout /t 1 /nobreak >nul
echo Starting server...
node server.js
pause
