# Bolt DIY Electron Tasks

## Current Goals

1. Build and deploy Electron Windows app
   - [x] Research build configuration
   - [ ] Set up proper Windows build environment
     - [ ] Install Visual Studio Build Tools
     - [ ] Install Windows 10 SDK
     - [ ] Install Python 2.7 for node-gyp
   - [x] Fix memory issues during build
     - [x] Optimize Vite configuration
     - [x] Split build process into smaller chunks
   - [x] Create Windows-specific build script
     - [x] Create PowerShell build script alternative
     - [x] Create stepped build process script
   - [ ] Test building Windows app
   - [ ] Create proper installer
   - [ ] Test distribution

2. Add persona customization interface
   - [x] Add menu interface to customize Bolt persona
   - [x] Implement character v2 img/json cards support
   - [x] Create UI for selecting different personas
   - [x] Implement persistence for persona selection
   - [x] Create persona management interface
   - [ ] Test integration with the LLM system

## Build Commands
```bash
# Install dependencies
pnpm install

# Build for Windows (original method)
pnpm run electron:build:win

# Build using PowerShell script (better memory handling)
pnpm run electron:build:win:ps

# Build using stepped PowerShell script (best for memory issues)
pnpm run electron:build:win:steps

# Build for all platforms
pnpm run electron:build:dist
```

## Issues Encountered
- Memory issues during renderer build - Fixed with optimized build scripts
- PowerShell execution policy restrictions - Addressed with -ExecutionPolicy Bypass
- Bash script compatibility issues on Windows - Provided PowerShell alternatives
- File locking during dist folder cleanup - Need to make sure no locks exist when rebuilding
- See detailed analysis in `2025_05_05_22_electron_build_issues.md`

## Notes
- Electron builder configuration is in electron-builder.yml
- Current Windows build target is NSIS (installer)
- Persona customization menu is implemented in electron/main/ui/menu.ts
- Persona data is stored in the user's AppData folder
- Custom personas can be imported/exported as JSON files 