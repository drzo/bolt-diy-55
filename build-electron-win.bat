@echo off
echo Building Bolt DIY Electron App for Windows...

echo Step 1: Setting up environment
set NODE_OPTIONS=--max-old-space-size=8192

echo Step 2: Building renderer (frontend) with memory optimization
npx cross-env NODE_OPTIONS=--max-old-space-size=8192 vite build --config vite-electron.config.js

echo Step 3: Waiting for memory cleanup...
timeout /t 5

echo Step 4: Building main process
npx vite build --config electron/main/vite.config.ts

echo Step 5: Building preload scripts
npx vite build --config electron/preload/vite.config.ts

echo Step 6: Packaging Electron app for Windows
npx electron-builder --win --config electron-builder.yml

echo Build process completed! Check the dist directory for output. 