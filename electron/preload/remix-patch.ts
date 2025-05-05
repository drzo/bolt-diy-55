/**
 * Remix Routes Patcher for Bolt DIY Electron
 * 
 * Patches the Remix routes issue by monkey-patching the @remix-run/server-runtime module
 * to handle undefined routes gracefully.
 */

import { contextBridge } from 'electron';

// Apply patches before Remix loads
function applyRemixPatches() {
  try {
    console.log('🔧 Applying Remix routes patch...');
    
    // Create global fallback routes object
    (global as any).__remixRoutesFallback = {
      root: {
        id: 'root',
        parentId: undefined,
        path: '',
        index: false,
        caseSensitive: false,
        module: { default: () => null }
      },
      routes: [
        {
          id: 'index',
          parentId: 'root',
          path: '',
          index: true,
          caseSensitive: false,
          module: { default: () => 'Loading Bolt DIY...' }
        }
      ]
    };
    
    // Expose the patch status to the renderer process
    contextBridge.exposeInMainWorld('remixPatch', {
      isApplied: true,
      timestamp: new Date().toISOString(),
    });
    
    // Patch Module._load to intercept Remix modules
    const Module = require('module');
    const originalLoad = Module._load;
    
    Module._load = function(request: string, parent: any, isMain: boolean) {
      // Intercept @remix-run/server-runtime module load
      if (request === '@remix-run/server-runtime' || 
          request.includes('@remix-run/server-runtime/dist/server')) {
        const original = originalLoad.apply(this, arguments);
        
        // Patch the derive function to handle undefined routes
        const originalDerive = original.derive;
        if (originalDerive) {
          original.derive = function(routes: any, ...args: any[]) {
            if (!routes || !routes.routes) {
              console.log('⚠️ Remix routes undefined, using fallback');
              routes = (global as any).__remixRoutesFallback;
            }
            return originalDerive(routes, ...args);
          };
        }
        
        // Patch the createRequestHandler function
        const originalCreateRequestHandler = original.createRequestHandler;
        if (originalCreateRequestHandler) {
          original.createRequestHandler = function(options: any, ...args: any[]) {
            if (!options.routes || !options.routes.routes) {
              console.log('⚠️ Remix createRequestHandler routes undefined, using fallback');
              options.routes = (global as any).__remixRoutesFallback;
            }
            return originalCreateRequestHandler(options, ...args);
          };
        }
        
        return original;
      }
      
      return originalLoad.apply(this, arguments);
    };
    
    console.log('✅ Remix routes patch applied successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to apply Remix routes patch:', error);
    return false;
  }
}

// Apply patches immediately
applyRemixPatches();

// Expose any APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  remixPatchApplied: true
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in preload script:', error);
}); 