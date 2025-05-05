# PowerShell script for building Bolt DIY Electron app for Windows
Write-Host "Building Bolt DIY Electron App for Windows..." -ForegroundColor Green

Write-Host "Step 1: Setting up environment" -ForegroundColor Cyan
$env:NODE_OPTIONS = "--max-old-space-size=8192"

Write-Host "Step 2: Building renderer (frontend) with memory optimization" -ForegroundColor Cyan
npx cross-env NODE_OPTIONS=--max-old-space-size=8192 vite build --config vite-electron.config.js

Write-Host "Step 3: Waiting for memory cleanup..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "Step 4: Building main process" -ForegroundColor Cyan
npx vite build --config electron/main/vite.config.ts

Write-Host "Step 5: Building preload scripts" -ForegroundColor Cyan
npx vite build --config electron/preload/vite.config.ts

Write-Host "Step 6: Packaging Electron app for Windows" -ForegroundColor Cyan
npx electron-builder --win --config electron-builder.yml

Write-Host "Build process completed! Check the dist directory for output." -ForegroundColor Green 