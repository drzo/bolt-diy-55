import { createReadableStreamFromReadable } from '@remix-run/node';
import type { ServerBuild } from '@remix-run/node';
import mime from 'mime';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { app } from 'electron';
import { isDev } from './constants';

// Define a fallback server build for when loading fails
const FALLBACK_SERVER_BUILD: Partial<ServerBuild> = {
  entry: { module: { default: () => new Response('Bolt DIY is starting...') } },
  routes: {
    root: {
      id: 'root',
      path: '',
      module: { default: () => null }
    },
    routes: {
      'routes/index': {
        id: 'routes/index',
        parentId: 'root',
        path: '',
        index: true,
        module: { default: () => 'Loading application...' }
      }
    } as any,
  },
  assets: { 
    url: '/assets/', 
    version: '1.0.0',
    entry: { imports: [], module: '/build/entry.client-ABCDEF.js' },
    routes: {
      root: { 
        id: 'root', 
        imports: [], 
        module: '/build/root-ABCDEF.js',
        hasAction: false,
        hasLoader: false,
        hasClientAction: false,
        hasClientLoader: false,
        hasErrorBoundary: false
      },
      'routes/index': { 
        id: 'routes/index', 
        imports: [], 
        module: '/build/routes/index-ABCDEF.js',
        hasAction: false,
        hasLoader: false,
        hasClientAction: false,
        hasClientLoader: false,
        hasErrorBoundary: false
      }
    }
  },
  // Add missing required properties
  mode: 'production',
  publicPath: '/',
  assetsBuildDirectory: path.join(app.getAppPath(), 'build', 'client', 'assets'),
  future: {
    v3_fetcherPersist: false,
    v3_relativeSplatPath: false,
    v3_throwAbortReason: false,
    v3_lazyRouteDiscovery: false,
    v3_singleFetch: false
  },
  isSpaMode: false
};

export async function loadServerBuild(): Promise<ServerBuild> {
  if (isDev) {
    console.log('Dev mode: using fallback server build');
    return FALLBACK_SERVER_BUILD as unknown as ServerBuild;
  }

  const serverBuildPath = path.join(app.getAppPath(), 'build', 'server', 'index.js');
  console.log(`Loading server build... path is ${serverBuildPath}`);

  try {
    const fileUrl = pathToFileURL(serverBuildPath).href;
    console.log('Importing server build from:', fileUrl);
    
    // Use dynamic import to load the server build
    let serverBuild: ServerBuild;
    try {
      serverBuild = await import(fileUrl);
      console.log('Server build imported successfully');
    } catch (importError) {
      console.error('Failed to import server build:', importError);
      throw importError;
    }

    // Validate the server build to ensure it has the required properties
    if (!serverBuild || !serverBuild.routes || !serverBuild.routes.routes) {
      console.warn('Server build is missing routes - using fallback routes');
      serverBuild = {
        ...serverBuild,
        routes: {
          ...(serverBuild.routes || {}),
          root: serverBuild.routes?.root || FALLBACK_SERVER_BUILD.routes!.root,
          routes: serverBuild.routes?.routes || FALLBACK_SERVER_BUILD.routes!.routes
        }
      };
    }

    console.log('Server build processed successfully:', {
      hasRoutes: !!serverBuild.routes,
      hasRootRoute: !!serverBuild.routes?.root,
      routesCount: Array.isArray(serverBuild.routes?.routes) ? serverBuild.routes?.routes.length : 0
    });

    return serverBuild;
  } catch (buildError) {
    console.error('Failed to load server build:', {
      message: (buildError as Error)?.message,
      stack: (buildError as Error)?.stack,
      error: buildError instanceof Error 
        ? buildError.message 
        : JSON.stringify(buildError, Object.getOwnPropertyNames(buildError as object)),
    });

    console.log('Using fallback server build');
    return FALLBACK_SERVER_BUILD as unknown as ServerBuild;
  }
}

// serve assets built by vite.
export async function serveAsset(req: Request, assetsPath: string): Promise<Response | undefined> {
  const url = new URL(req.url);
  const fullPath = path.join(assetsPath, decodeURIComponent(url.pathname));
  console.log('Serving asset, path:', fullPath);

  if (!fullPath.startsWith(assetsPath)) {
    console.log('Path is outside assets directory:', fullPath);
    return;
  }

  const stat = await fs.stat(fullPath).catch((err) => {
    console.log('Failed to stat file:', fullPath, err);
    return undefined;
  });

  if (!stat?.isFile()) {
    console.log('Not a file:', fullPath);
    return;
  }

  const headers = new Headers();
  const mimeType = mime.getType(fullPath);

  if (mimeType) {
    headers.set('Content-Type', mimeType);
  }

  console.log('Serving file with mime type:', mimeType);

  const body = createReadableStreamFromReadable(createReadStream(fullPath));

  // eslint-disable-next-line consistent-return
  return new Response(body, { headers });
}
