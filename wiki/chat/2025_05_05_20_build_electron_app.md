# Building Electron Windows App for Bolt DIY

## Project Analysis
- Found Electron build configuration in `electron-builder.yml`
- Windows build is configured to use NSIS installer
- The project uses pnpm as package manager
- Build commands are available in package.json:
  - `electron:build:win` - Build for Windows
  - `electron:build:dist` - Build for all platforms

## Build Process

### Prerequisites
1. Node.js and npm installed
2. pnpm installed globally: `npm install -g pnpm`
3. Windows build tools installed

### Building Steps
1. Install dependencies:
   ```
   pnpm install
   ```

2. Build the Electron app for Windows:
   ```
   pnpm run electron:build:win
   ```

3. Find the built app in the `dist` directory

## Menu Customization Plan
The menu customization for persona selection will need:

1. Create a new menu item in `electron/main/ui/menu.ts`
2. Add a submenu for different persona options
3. Implement IPC communication to change persona
4. Create UI components for persona cards
5. Save selected persona in electron-store

This will be implemented after successful Windows build. 