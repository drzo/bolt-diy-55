/**
 * Remix Routes Patcher for Bolt DIY Electron
 * 
 * Patches the Remix routes issue by monkey-patching the @remix-run/server-runtime module
 * to handle undefined routes gracefully.
 */

import { contextBridge } from 'electron';

// Define a robust fallback routes object
const FALLBACK_ROUTES = {
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

// Apply patches before Remix loads
function applyRemixPatches() {
  try {
    console.log('🔧 Applying Remix routes patch...');
    
    // Create global fallback routes object - make it accessible everywhere
    (global as any).__remixRoutesFallback = FALLBACK_ROUTES;
    
    // Expose the patch status to the renderer process
    contextBridge.exposeInMainWorld('remixPatch', {
      isApplied: true,
      timestamp: new Date().toISOString(),
    });
    
    // Patch Module._load to intercept Remix modules
    const Module = require('module');
    const originalLoad = Module._load;
    
    Module._load = function(request: string, parent: any, isMain: boolean) {
      // Detect if it's a Remix-related module with more patterns
      const isRemixModule = 
        request === '@remix-run/server-runtime' || 
        request.includes('@remix-run/server-runtime/dist/server') ||
        request.includes('remix-run') && request.includes('server');
        
      if (isRemixModule) {
        console.log(`⚠️ Intercepting Remix module: ${request}`);
        const original = originalLoad.apply(this, arguments);
        
        // More aggressive patching for the derive function
        if (typeof original.derive === 'function') {
          const originalDerive = original.derive;
          original.derive = function(routes: any, ...args: any[]) {
            console.log('🔍 Checking routes for derive:', routes);
            if (!routes || !routes.routes) {
              console.log('⚠️ Remix routes undefined in derive, using fallback');
              routes = (global as any).__remixRoutesFallback;
            }
            return originalDerive(routes, ...args);
          };
          console.log('✅ Patched derive function');
        }
        
        // Patch the createRequestHandler function
        if (typeof original.createRequestHandler === 'function') {
          const originalCreateRequestHandler = original.createRequestHandler;
          original.createRequestHandler = function(options: any, ...args: any[]) {
            console.log('🔍 Checking routes for requestHandler:', options?.routes);
            if (!options || !options.routes || !options.routes.routes) {
              console.log('⚠️ Remix createRequestHandler routes undefined, using fallback');
              options = options || {};
              options.routes = (global as any).__remixRoutesFallback;
            }
            return originalCreateRequestHandler(options, ...args);
          };
          console.log('✅ Patched createRequestHandler function');
        }
        
        // Add an extra patch for the default export
        if (original.default && typeof original.default.createRequestHandler === 'function') {
          const originalDefaultCreate = original.default.createRequestHandler;
          original.default.createRequestHandler = function(options: any, ...args: any[]) {
            console.log('🔍 Checking routes for default requestHandler:', options?.routes);
            if (!options || !options.routes || !options.routes.routes) {
              console.log('⚠️ Default createRequestHandler routes undefined, using fallback');
              options = options || {};
              options.routes = (global as any).__remixRoutesFallback;
            }
            return originalDefaultCreate(options, ...args);
          };
          console.log('✅ Patched default createRequestHandler function');
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
console.log('🚀 Initializing Remix routes patch...');
const patchResult = applyRemixPatches();
console.log(`📊 Remix patch result: ${patchResult ? 'SUCCESS' : 'FAILED'}`);

// Expose the patch status globally to help with debugging
(global as any).__remixPatchApplied = patchResult;

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception in remix-patch script:', error);
}); 