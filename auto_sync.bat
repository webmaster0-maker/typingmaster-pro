@echo off
setlocal
title GitHub Auto-Sync Watcher - webmaster0-maker

cd /d "C:\Users\Administrator\Pictures\typingmaster"

echo ==========================================================
echo   TypeCrest - GitHub Real-Time Auto-Sync Watcher
echo   Repository: webmaster0-maker/typingmaster-pro (main)
echo ==========================================================
echo.
echo Whenever you create, edit, or delete files in this project,
echo they will be automatically committed and pushed to GitHub!
echo.
echo Leave this window open while working. Press Ctrl+C to stop.
echo ==========================================================
echo.

node scripts/auto-sync.js

pause
