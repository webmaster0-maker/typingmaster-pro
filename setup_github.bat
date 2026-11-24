@echo off
setlocal
title GitHub Upload Setup - webmaster0-maker

cd /d "C:\Users\Administrator\Pictures\typingmaster"

echo ==========================================================
echo   GitHub Upload Setup for: webmaster0-maker
echo   Email: webmaster.central0@gmail.com
echo ==========================================================
echo.
echo Step 1: Login to your GitHub account...
echo A one-time code will appear below and Google Chrome will open.
echo Confirm authorization in your browser for webmaster0-maker.
echo.

"C:\Program Files\GitHub CLI\gh.exe" auth login -w -p https

echo.
echo ==========================================================
echo Step 2: Creating repository and pushing code to GitHub...
echo ==========================================================

"C:\Program Files\GitHub CLI\gh.exe" repo create typingmaster-pro --public --source=. --remote=origin --push

if errorlevel 1 (
    echo.
    echo Pushing to origin main...
    git push -u origin main
)

echo.
echo ==========================================================
echo   Upload Complete!
echo   Repository: https://github.com/webmaster0-maker/typingmaster-pro
echo ==========================================================
pause
