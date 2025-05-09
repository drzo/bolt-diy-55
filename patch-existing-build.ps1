# Script to patch an existing Electron build
# Use this if you already have a built app but need to fix the Remix routes issue

Write-Host "Patching existing Electron build with Remix routes fix..." -ForegroundColor Green

# Step 1: Check if build exists
Write-Host "Step 1: Checking for existing build..." -ForegroundColor Cyan
if (-not (Test-Path "dist\win-unpacked\resources\app.asar")) {
    Write-Host "No existing build found! Please build the app first." -ForegroundColor Red
    exit 1
}

# Step 2: Apply the Remix routes patch
Write-Host "Step 2: Applying Remix routes patch..." -ForegroundColor Cyan
node patch-remix-routes.cjs

Write-Host "Patch applied successfully!" -ForegroundColor Green
Write-Host "You can now run the app from dist\win-unpacked\Bolt.exe" -ForegroundColor Green 