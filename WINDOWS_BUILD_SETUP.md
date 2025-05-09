# Windows Build Environment Setup Guide

This guide explains how to set up the proper Windows build environment for Bolt DIY Electron app development.

## Required Components

1. **Visual Studio Build Tools**
2. **Windows 10 SDK**
3. **Python 2.7** (for node-gyp)
4. **Git**
5. **Node.js and npm/pnpm**

## 1. Install Visual Studio Build Tools

Visual Studio Build Tools are required for compiling native Node.js modules.

1. Download the Visual Studio Build Tools installer:
   - Go to: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Click on "Download Build Tools"

2. Run the installer and select the following components:
   - Desktop development with C++
   - Under Installation details, make sure these are selected:
     - MSVC v143 - VS 2022 C++ x64/x86 build tools (or the latest version)
     - Windows 10 SDK (latest version)
     - C++ CMake tools for Windows
     - Testing tools core features - Build Tools
     - C++ AddressSanitizer

3. Click "Install" and wait for the installation to complete.

## 2. Install Windows 10 SDK

If the Windows 10 SDK was not installed with Visual Studio Build Tools:

1. Download the Windows 10 SDK:
   - Go to: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
   - Click "Download the Windows SDK"

2. Run the installer and select the following components:
   - Windows SDK for UWP Managed Apps
   - Windows SDK for UWP C++ Apps
   - Windows SDK for Desktop C++ x86 Apps
   - Windows SDK for Desktop C++ x64 Apps

3. Complete the installation.

## 3. Install Python 2.7 for node-gyp

Node-gyp requires Python 2.7 to build native modules:

1. Download Python 2.7 from the official website:
   - Go to: https://www.python.org/downloads/release/python-2718/
   - Scroll down to the "Files" section
   - For Windows, download "Windows x86-64 MSI installer" for 64-bit systems

2. Run the installer:
   - Make sure to check "Add Python.exe to PATH" during installation
   - Choose "Install for all users"
   - Click "Next" and complete the installation

3. Verify installation:
   - Open Command Prompt and type:
     ```
     python --version
     ```
   - You should see "Python 2.7.x"

## 4. Configure npm to use Python 2.7

1. Open Command Prompt and run:
   ```
   npm config set python python2.7
   ```

2. Configure node-gyp to use the installed Visual Studio Build Tools:
   ```
   npm config set msvs_version 2022
   ```
   (Adjust the year to match your Visual Studio version)

## 5. Environment Variables

Ensure the following environment variables are set:

1. Right-click on "This PC" or "My Computer" > Properties > Advanced system settings > Environment Variables

2. Under "System variables", make sure these exist and have correct paths:
   - `PYTHON` should point to your Python 2.7 installation (e.g., `C:\Python27\python.exe`)
   - Ensure Python is in your `PATH` variable

## 6. Install Required Global npm Packages

1. Open Command Prompt with administrator privileges

2. Install required global packages:
   ```
   npm install -g node-gyp windows-build-tools electron-builder cross-env
   ```

## Testing the Setup

To verify your setup is working correctly:

1. Open Command Prompt in your project directory:
   ```
   cd path\to\bolt-diy-55
   ```

2. Run a test build:
   ```
   .\build-electron-win-patched.bat
   ```

## Troubleshooting

### Common Issues

1. **'node-gyp' errors**:
   - Ensure Python 2.7 is properly installed and in your PATH
   - Verify Visual Studio Build Tools are properly installed

2. **'MSBuild.exe' not found**:
   - Check if Visual Studio Build Tools are correctly installed
   - Make sure environment variables are set correctly

3. **Windows SDK errors**:
   - Reinstall the Windows 10 SDK
   - Make sure you have the correct version installed

4. **Permission issues**:
   - Run Command Prompt as Administrator
   - Check file permissions in your project directory

### Getting Help

If you encounter issues not covered in this guide:

1. Check the Electron documentation: https://www.electronjs.org/docs/latest/development/build-instructions-windows
2. Consult the node-gyp README: https://github.com/nodejs/node-gyp#on-windows
3. Open an issue in the Bolt DIY GitHub repository

## Next Steps

After setting up your build environment, you can:

1. Run `.\build-electron-win-patched.bat` to build the Electron app with the Remix routes patch
2. Test the persona customization interface you've added
3. Make further improvements to the app 