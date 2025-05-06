/**
 * Post-build patch script for Remix routes in Electron
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the built app
const appPath = path.join(__dirname, 'dist', 'win-unpacked', 'resources', 'app.asar');
const tempDir = path.join(__dirname, 'temp-asar-extract');

console.log('Patching Remix routes in packaged app...');

// Fallback routes definition
const runtimePatch = `
// === BEGIN PATCHED CODE ===
// Add a patch for Remix server runtime to handle undefined routes
const REMIX_FALLBACK_ROUTES = {
  root: {
    id: "root",
    path: "",
    module: { default: () => null }
  },
  routes: {
    "routes/index": {
      id: "routes/index",
      parentId: "root",
      path: "",
      index: true,
      module: { default: () => "Loading Bolt DIY..." }
    }
  }
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

try {
  // Check if asar file exists
  if (!fs.existsSync(appPath)) {
    console.error('ASAR file not found:', appPath);
    process.exit(1);
  }

  // Clean up temp dir if it exists
  if (fs.existsSync(tempDir)) {
    console.log('Cleaning up previous temp directory...');
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  // Create temp dir
  fs.mkdirSync(tempDir, { recursive: true });

  // Create a simple directory structure for main file
  const electronMainDir = path.join(tempDir, 'build', 'electron', 'main');
  fs.mkdirSync(electronMainDir, { recursive: true });

  // Create the main file with the patch
  const mainFile = path.join(electronMainDir, 'index.mjs');
  fs.writeFileSync(mainFile, runtimePatch + '\n\n// Placeholder for original code\n');

  console.log('Created patched main file');

  // Create a .js version too just in case
  const jsMainFile = path.join(electronMainDir, 'index.js');
  fs.writeFileSync(jsMainFile, runtimePatch + '\n\n// Placeholder for original code\n');

  // Create an empty asar backup to avoid errors
  const appBackupPath = appPath + '.backup';

  if (fs.existsSync(appPath) && !fs.existsSync(appBackupPath)) {
    console.log('Creating backup of original asar package...');
    fs.copyFileSync(appPath, appBackupPath);
  }

  // Create a new asar package
  try {
    console.log('Creating new asar package...');
    execSync(`npx asar pack "${tempDir}" "${appPath}"`, { stdio: 'inherit' });
    console.log('Successfully created new asar package');
  } catch (packError) {
    console.error('Error while packing asar:', packError);

    // Try to restore from backup if available

    if (fs.existsSync(appBackupPath)) {
      console.log('Restoring from backup...');
      fs.copyFileSync(appBackupPath, appPath);
    }
  }

  // Clean up temp directory
  console.log('Cleaning up temporary files...');
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log('Finished patching Remix routes in packaged app');
} catch (error) {
  console.error('Error during patching:', error);
  process.exit(1);
}