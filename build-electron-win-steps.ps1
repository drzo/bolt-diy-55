# PowerShell script for building Bolt DIY Electron app for Windows (Step by Step)
Write-Host "Building Bolt DIY Electron App for Windows (Step by Step)..." -ForegroundColor Green

function CleanupMemory {
    Write-Host "Cleaning up memory..." -ForegroundColor Yellow
    [System.GC]::Collect()
    Start-Sleep -Seconds 2
}

# Step 1: Clean dist directory
Write-Host "Step 1: Cleaning dist directory" -ForegroundColor Cyan
if (Test-Path -Path "dist") {
    Remove-Item -Recurse -Force "dist"
}
New-Item -ItemType Directory -Force -Path "dist"
CleanupMemory

# Step 2: Build renderer with optimized memory
Write-Host "Step 2: Building renderer (frontend)" -ForegroundColor Cyan
$env:NODE_OPTIONS = "--max-old-space-size=8192"
npx cross-env NODE_OPTIONS=--max-old-space-size=8192 vite build --config vite-electron.config.js
CleanupMemory

# Step 3: Build main process
Write-Host "Step 3: Building main process" -ForegroundColor Cyan
$env:NODE_OPTIONS = "--max-old-space-size=4096"
npx vite build --config electron/main/vite.config.ts
CleanupMemory

# Step 4: Build preload scripts
Write-Host "Step 4: Building preload scripts" -ForegroundColor Cyan
npx vite build --config electron/preload/vite.config.ts
CleanupMemory

# Step 5: Package for Windows
Write-Host "Step 5: Packaging Electron app for Windows" -ForegroundColor Cyan
npx electron-builder --win --config electron-builder.yml

Write-Host "Build process completed! Check the dist directory for output." -ForegroundColor Green 