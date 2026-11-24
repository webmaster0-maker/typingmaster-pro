@echo off
setlocal
title TypingMaster Pro Server & Auto-Sync

cd /d "C:\Users\Administrator\Pictures\typingmaster"

echo ==========================================================
echo   Starting TypingMaster Pro Server & GitHub Auto-Sync...
echo ==========================================================
echo.
echo 1. Launching Google Chrome to http://localhost:3000...
echo 2. Starting GitHub real-time auto-sync watcher...
echo 3. Starting Vite development server...
echo.
echo Any changes you save will automatically be pushed to:
echo https://github.com/webmaster0-maker/typingmaster-pro
echo.
echo Leave this window open while working. Press Ctrl+C to stop.
echo ==========================================================

rem Launch Chrome in 2 seconds in background
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; if (Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe') { Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' 'http://localhost:3000' } else { Start-Process 'http://localhost:3000' }"

rem Start GitHub real-time auto-sync watcher minimized in background
start "GitHub Auto-Sync" /min node scripts/auto-sync.js

rem Run Vite dev server in this window
call npm run dev

echo.
echo Server stopped.
pause
