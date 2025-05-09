@echo off
echo Starting Bolt DIY Electron build with Remix routes patch...

REM Step 1: Clean dist directory if it exists
echo Cleaning dist directory...
if exist "dist" (
  rmdir /s /q "dist"
)

REM Step 2: Build renderer (frontend)
echo Building renderer (frontend)...
call npx cross-env NODE_OPTIONS=--max-old-space-size=8192 vite build --config vite-electron.config.js

REM Step 3: Build main process and preload scripts
echo Building main process and preload scripts...
call npx vite build --config ./electron/main/vite.config.ts
call npx vite build --config ./electron/preload/vite.config.ts

REM Step 4: Package for Windows
echo Packaging Electron app for Windows...
call npx electron-builder --win --config electron-builder.yml

REM Check if the build was successful
if not exist "dist\win-unpacked\resources\app.asar" (
  echo Build failed! Could not find app.asar
  exit /b 1
)

REM Step 5: Apply the Remix routes patch
echo Applying Remix routes patch...
node patch-remix-routes.cjs

echo Build and patch completed successfully!
echo You can now run the app from dist\win-unpacked\Bolt.exe 