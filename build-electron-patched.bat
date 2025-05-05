@echo off
echo Building Patched Bolt DIY Electron App...

echo Step 1: Cleaning dist directory
if exist "dist" (
    rmdir /s /q "dist"
)
mkdir "dist"

echo Step 2: Installing dependencies
call pnpm install

echo Step 3: Building renderer (frontend)
set NODE_OPTIONS=--max-old-space-size=8192
call npx cross-env NODE_OPTIONS=--max-old-space-size=8192 vite build --config vite-electron.config.js

echo Step 4: Building main process
call npx vite build --config electron/main/vite.config.ts

echo Step 5: Building preload scripts with Remix patch
call npx vite build --config electron/preload/vite.config.ts

echo Step 6: Packaging fixed Electron app for Windows
call npx electron-builder --win --config electron-builder.yml

echo Step 7: Creating launcher
(
echo @echo off
echo echo Starting Patched Bolt DIY...
echo cd "%%~dp0\dist\win-unpacked"
echo start "" "Bolt Local.exe" --allow-file-access-from-files --js-flags="--max-old-space-size=8192" --disable-features=OutOfBlinkCors
echo echo Patched Bolt DIY launched! If you still encounter issues, check the logs.
) > "run-bolt-patched.bat"

echo Build process completed!
echo Run the app using run-bolt-patched.bat 