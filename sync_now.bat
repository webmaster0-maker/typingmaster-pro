@echo off
setlocal
title GitHub Immediate Sync - webmaster0-maker

cd /d "C:\Users\Administrator\Pictures\typingmaster"

echo ==========================================================
echo   TypeCrest - Immediate Sync to GitHub
echo   Repository: webmaster0-maker/typingmaster-pro (main)
echo ==========================================================
echo.

node scripts/auto-sync.js --once

echo.
echo ==========================================================
echo   Sync Complete!
echo ==========================================================
pause
