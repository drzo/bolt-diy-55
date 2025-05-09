# Stepped Electron build script for Windows (with Remix patch)
# This script breaks down the electron build into steps to avoid memory issues

Write-Host "Starting Bolt DIY Electron stepped build with Remix routes patch..." -ForegroundColor Green

# Step 0: Clean up environment
Write-Host "Step 0: Cleaning up environment..." -ForegroundColor Cyan
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Step 1: Clean up previous build
Write-Host "Step 1: Cleaning up previous build..." -ForegroundColor Cyan
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Build the renderer
Write-Host "Step 2: Building renderer..." -ForegroundColor Cyan
npm run electron:build:renderer
Start-Sleep -Seconds 2

# Step 3: Build main and preload separately
Write-Host "Step 3: Building main and preload..." -ForegroundColor Cyan
npm run electron:build:main
Start-Sleep -Seconds 2
npm run electron:build:preload
Start-Sleep -Seconds 2

# Step 4: Build the Electron app
Write-Host "Step 4: Building Electron app..." -ForegroundColor Cyan
npx electron-builder --win --dir
Start-Sleep -Seconds 2

# Check if the build was successful
if (-not (Test-Path "dist\win-unpacked\resources\app.asar")) {
    Write-Host "Build failed! Could not find app.asar" -ForegroundColor Red
    exit 1
}

# Step 5: Apply the Remix routes patch
Write-Host "Step 5: Applying Remix routes patch..." -ForegroundColor Cyan
node patch-remix-routes.cjs

Write-Host "Build and patch completed successfully!" -ForegroundColor Green
Write-Host "You can now run the app from dist\win-unpacked\Bolt.exe" -ForegroundColor Green 