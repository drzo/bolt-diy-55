/**
 * Remix Routes Fix for Electron
 * 
 * This script fixes the common issue with Remix routes in Electron packaged apps.
 * Run this script after building the Electron app.
 */
const fs = require('fs');
const path = require('path');

console.log('Starting Remix routes fix for Electron...');

// Path to the electron main process file in the packaged app
let mainFilePath;

// Try to find the main process file
const possiblePaths = [
  path.join(__dirname, 'dist', 'win-unpacked', 'resources', 'app.asar', 'build', 'electron', 'main', 'index.mjs'),
  path.join(__dirname, 'out', 'win-unpacked', 'resources', 'app.asar', 'build', 'electron', 'main', 'index.mjs'),
  path.join(__dirname, 'dist', 'win-unpacked', 'resources', 'app.asar', 'build', 'electron', 'main', 'index.js'),
  path.join(__dirname, 'out', 'win-unpacked', 'resources', 'app.asar', 'build', 'electron', 'main', 'index.js')
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    mainFilePath = p;
    break;
  }
}

if (!mainFilePath) {
  console.error('Could not find the main process file. Make sure you have built the app first.');
  process.exit(1);
}

console.log(`Found main process file at: ${mainFilePath}`);

// Patch for the node_modules/@remix-run/server-runtime module
const runtimePatch = `
// === BEGIN PATCHED CODE ===
// Add a patch for Remix server runtime to handle undefined routes
const REMIX_FALLBACK_ROUTES = {
  root: {
    id: "root",
    path: "",
    module: { default: () => null }
  },
  routes: [
    {
      id: "index",
      parentId: "root",
      path: "",
      index: true,
      module: { default: () => "Loading Bolt DIY..." }
    }
  ]
};

// Patch Module._load to intercept Remix modules
try {
  const Module = require("module");
  const originalLoad = Module._load;
  
  Module._load = function(request, parent, isMain) {
    // Detect if it's a Remix-related module
    const isRemixModule = 
      request === "@remix-run/server-runtime" || 
      request.includes("@remix-run/server-runtime/dist/server") ||
      request.includes("remix-run") && request.includes("server");
      
    if (isRemixModule) {
      console.log("Intercepting Remix module:", request);
      const original = originalLoad.apply(this, arguments);
      
      // Patch the derive function
      if (typeof original.derive === "function") {
        const originalDerive = original.derive;
        original.derive = function(routes, ...args) {
          console.log("Checking routes for derive:", routes);
          if (!routes || !routes.routes) {
            console.log("Remix routes undefined in derive, using fallback");
            routes = REMIX_FALLBACK_ROUTES;
          }
          return originalDerive(routes, ...args);
        };
        console.log("Patched derive function");
      }
      
      // Patch createRequestHandler
      if (typeof original.createRequestHandler === "function") {
        const originalCreateRequestHandler = original.createRequestHandler;
        original.createRequestHandler = function(options, ...args) {
          console.log("Checking routes for requestHandler:", options?.routes);
          if (!options || !options.routes || !options.routes.routes) {
            console.log("Remix createRequestHandler routes undefined, using fallback");
            options = options || {};
            options.routes = REMIX_FALLBACK_ROUTES;
          }
          return originalCreateRequestHandler(options, ...args);
        };
        console.log("Patched createRequestHandler function");
      }
      
      // Patch default export if it exists
      if (original.default && typeof original.default.createRequestHandler === "function") {
        const originalDefaultCreate = original.default.createRequestHandler;
        original.default.createRequestHandler = function(options, ...args) {
          console.log("Checking routes for default requestHandler:", options?.routes);
          if (!options || !options.routes || !options.routes.routes) {
            console.log("Default createRequestHandler routes undefined, using fallback");
            options = options || {};
            options.routes = REMIX_FALLBACK_ROUTES;
          }
          return originalDefaultCreate(options, ...args);
        };
        console.log("Patched default createRequestHandler function");
      }
      
      return original;
    }
    
    return originalLoad.apply(this, arguments);
  };
  
  console.log("Remix runtime patch applied successfully");
} catch (error) {
  console.error("Failed to apply Remix runtime patch:", error);
}
// === END PATCHED CODE ===
`;

// Create a patch file for the asar package
console.log('Creating patch file for the asar package...');

// Create the patch script that will run before the main app code
const patchScript = `
// Load the remix patch first before anything else
${runtimePatch}

// Then continue with the original code
`;

// Create a temporary directory to extract and modify the asar package
const tempDir = path.join(__dirname, 'temp-asar-extract');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Create a post-build script that can be run after the app is built
const postBuildScript = `
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the built app
const appPath = path.join(__dirname, 'dist', 'win-unpacked', 'resources', 'app.asar');
const tempDir = path.join(__dirname, 'temp-asar-extract');

console.log('Patching Remix routes in packaged app...');

// Extract the asar package
execSync('npx asar extract ' + appPath + ' ' + tempDir);

// Inject our patch into the main process file
const mainFile = path.join(tempDir, 'build', 'electron', 'main', 'index.mjs');
if (fs.existsSync(mainFile)) {
  console.log('Found main file: ' + mainFile);
  let content = fs.readFileSync(mainFile, 'utf8');
  
  // Add our patch at the beginning of the file
  content = \`${runtimePatch}\n\` + content;
  
  fs.writeFileSync(mainFile, content);
  console.log('Injected Remix routes patch into main process file');
} else {
  console.error('Could not find main process file');
}

// Pack the modified files back into an asar package
const appBackupPath = appPath + '.backup';
if (fs.existsSync(appPath)) {
  fs.renameSync(appPath, appBackupPath);
  console.log('Created backup of original asar package: ' + appBackupPath);
}

execSync('npx asar pack ' + tempDir + ' ' + appPath);
console.log('Packed modified files back into asar package');

// Clean up
fs.rmSync(tempDir, { recursive: true, force: true });
console.log('Cleaned up temporary files');

console.log('Finished patching Remix routes in packaged app');
`;

// Write the post-build script to a file
const postBuildScriptPath = path.join(__dirname, 'patch-remix-routes.js');
fs.writeFileSync(postBuildScriptPath, postBuildScript);
console.log(`Created post-build script: ${postBuildScriptPath}`);

// Create a batch file to run the post-build script
const batchFilePath = path.join(__dirname, 'patch-remix-routes.bat');
fs.writeFileSync(batchFilePath, `@echo off
echo Patching Remix routes in packaged app...
node patch-remix-routes.js
echo Done!
`);
console.log(`Created batch file: ${batchFilePath}`);

console.log('\nInstructions:');
console.log('1. Build your Electron app normally');
console.log('2. Run the patch-remix-routes.bat file to fix the Remix routes issue');
console.log('3. Test your app to ensure the routes issue is fixed');

console.log('\nAlternatively, you can run:');
console.log('node patch-remix-routes.js'); 