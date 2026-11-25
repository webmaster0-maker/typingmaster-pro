@echo off
setlocal
title Cloudflare Pages Deployment - $0 Free Plan

cd /d "C:\Users\Administrator\Pictures\typingmaster"

echo ==========================================================
echo   Deploying TypeCrest to Cloudflare Pages ($0 Plan)
echo   Project: typecrest
echo ==========================================================
echo.
echo Step 1: Building production bundle...
call npm run build

if errorlevel 1 (
    echo.
    echo Build failed! Aborting deployment.
    pause
    exit /b 1
)

echo.
echo Step 2: Deploying to Cloudflare Pages...
npx wrangler pages deploy dist --project-name=typecrest --branch=main

echo.
echo ==========================================================
echo   Deployment Complete!
echo   Live URL: https://typecrest.pages.dev
echo ==========================================================
pause
