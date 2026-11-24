@echo off
setlocal
title TypingMaster Pro Server

cd /d "C:\Users\Administrator\Pictures\typingmaster"

echo ==========================================================
echo   Starting TypingMaster Pro Development Server...
echo ==========================================================
echo.
echo 1. Opening Google Chrome to http://localhost:3000 in 2 seconds...
echo 2. Starting Vite server...
echo.
echo Leave this window open while practicing. Press Ctrl+C to stop.
echo ==========================================================

rem Launch Chrome in 2 seconds in background
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; if (Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe') { Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' 'http://localhost:3000' } else { Start-Process 'http://localhost:3000' }"

rem Run the Vite dev server directly in this window
call npm run dev

echo.
echo Server stopped.
pause
