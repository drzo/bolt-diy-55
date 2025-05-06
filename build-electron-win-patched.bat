@echo off
echo Starting Bolt DIY Electron build with Remix routes patch...

REM Step 1: Build the Electron app
echo Building Electron app...
call npm run electron:build:win

REM Check if the build was successful
if not exist "dist\win-unpacked\resources\app.asar" (
  echo Build failed! Could not find app.asar
  exit /b 1
)

REM Step 2: Apply the Remix routes patch
echo Applying Remix routes patch...
node patch-remix-routes.cjs

echo Build and patch completed successfully!
echo You can now run the app from dist\win-unpacked\Bolt.exe 