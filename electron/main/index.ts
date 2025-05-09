/// <reference types="vite/client" />
import { createRequestHandler } from '@remix-run/node';
import type { ServerBuild } from '@remix-run/node';
import electron, { app, BrowserWindow, ipcMain, protocol, session, shell } from 'electron';
import log from 'electron-log';
import path from 'node:path';
import * as pkg from '../../package.json';
import { setupAutoUpdater } from './utils/auto-update';
import { isDev, DEFAULT_PORT } from './utils/constants';
import { initViteServer, viteServer } from './utils/vite-server';
import { setupMenu } from './ui/menu';
import { createWindow } from './ui/window';
import { initCookies, storeCookies } from './utils/cookie';
import { loadServerBuild, serveAsset } from './utils/serve';
import { reloadOnChange } from './utils/reload';
import { loadPersonas, getActivePersona, setActivePersona } from './ui/persona';
import type { CharacterPersona } from './ui/persona';

Object.assign(console, log.functions);

console.debug('main: import.meta.env:', import.meta.env);
console.log('main: isDev:', isDev);
console.log('NODE_ENV:', global.process.env.NODE_ENV);
console.log('isPackaged:', app.isPackaged);

// Log unhandled errors
process.on('uncaughtException', async (error) => {
  console.log('Uncaught Exception:', error);
});

process.on('unhandledRejection', async (error) => {
  console.log('Unhandled Rejection:', error);
});

(() => {
  const root = global.process.env.APP_PATH_ROOT ?? import.meta.env.VITE_APP_PATH_ROOT;

  if (root === undefined) {
    console.log('no given APP_PATH_ROOT or VITE_APP_PATH_ROOT. default path is used.');
    return;
  }

  if (!path.isAbsolute(root)) {
    console.log('APP_PATH_ROOT must be absolute path.');
    global.process.exit(1);
  }

  console.log(`APP_PATH_ROOT: ${root}`);

  const subdirName = pkg.name;

  for (const [key, val] of [
    ['appData', ''],
    ['userData', subdirName],
    ['sessionData', subdirName],
  ] as const) {
    app.setPath(key, path.join(root, val));
  }

  app.setAppLogsPath(path.join(root, subdirName, 'Logs'));
})();

console.log('appPath:', app.getAppPath());

const keys: Parameters<typeof app.getPath>[number][] = ['home', 'appData', 'userData', 'sessionData', 'logs', 'temp'];
keys.forEach((key) => console.log(`${key}:`, app.getPath(key)));
console.log('start whenReady');

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention
  var __electron__: typeof electron;
}

(async () => {
  await app.whenReady();
  console.log('App is ready');

  // Load any existing cookies from ElectronStore, set as cookie
  await initCookies();

  let serverBuild;
  try {
    serverBuild = await loadServerBuild();
    console.log('Server build loaded successfully');
    
    // Additional validation to ensure routes exist
    if (!serverBuild || !serverBuild.routes || !serverBuild.routes.routes) {
      console.warn('Server build missing required routes property, using fallback');
      serverBuild = {
        ...serverBuild,
        routes: {
          root: {
            id: 'root',
            path: '',
            module: { default: () => null }
          },
          routes: [
            {
              id: 'index',
              parentId: 'root',
              path: '',
              index: true,
              module: { default: () => 'Loading application...' }
            }
          ]
        },
        assets: serverBuild?.assets || { url: '/assets/', version: '1.0.0' },
        entry: serverBuild?.entry || { module: { default: () => new Response('Bolt DIY is starting...') } }
      };
    }
  } catch (error) {
    console.error('Failed to load server build:', error);
    // Create a minimal fallback server build
    serverBuild = {
      entry: { module: { default: () => new Response('Bolt DIY is starting...') } },
      routes: {
        root: {
          id: 'root',
          path: '',
          module: { default: () => null }
        },
        routes: [
          {
            id: 'index',
            parentId: 'root',
            path: '',
            index: true,
            module: { default: () => 'Loading application...' }
          }
        ]
      },
      assets: { url: '/assets/', version: '1.0.0' }
    };
  }

  protocol.handle('http', async (req) => {
    console.log('Handling request for:', req.url);

    if (isDev) {
      console.log('Dev mode: forwarding to vite server');
      return await fetch(req);
    }

    req.headers.append('Referer', req.referrer);

    try {
      const url = new URL(req.url);

      // Forward requests to specific local server ports
      if (url.port !== `${DEFAULT_PORT}`) {
        console.log('Forwarding request to local server:', req.url);
        return await fetch(req);
      }

      // Always try to serve asset first
      const assetPath = path.join(app.getAppPath(), 'build', 'client');
      const res = await serveAsset(req, assetPath);

      if (res) {
        console.log('Served asset:', req.url);
        return res;
      }

      // Forward all cookies to remix server
      const cookies = await session.defaultSession.cookies.get({});

      if (cookies.length > 0) {
        req.headers.set('Cookie', cookies.map((c) => `${c.name}=${c.value}`).join('; '));

        // Store all cookies
        await storeCookies(cookies);
      }

      // Create request handler with the server build
      const handler = createRequestHandler(serverBuild as unknown as ServerBuild, 'production');
      console.log('Handling request with server build:', req.url);

      // Add extra error handling around the handler
      try {
        const result = await handler(req, {
          /*
           * Remix app access cloudflare.env
           * Need to pass an empty object to prevent undefined
           */
          // @ts-ignore:next-line
          cloudflare: {},
        });
        
        return result;
      } catch (err) {
        console.log('Error in Remix handler:', {
          url: req.url,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        });
        
        // Provide a more helpful error message
        const errorMessage = `
        <html>
          <head>
            <title>Bolt DIY - Error</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 2rem; line-height: 1.5; }
              h1 { color: #e53e3e; }
              pre { background: #f7fafc; padding: 1rem; border-radius: 0.25rem; overflow: auto; }
            </style>
          </head>
          <body>
            <h1>Bolt DIY - Application Error</h1>
            <p>There was an error processing your request. This is often caused by missing routes or server-side code issues.</p>
            <p>Error: ${err instanceof Error ? err.message : String(err)}</p>
            <pre>${err instanceof Error ? err.stack : 'No stack trace available'}</pre>
          </body>
        </html>
        `;
        
        return new Response(errorMessage, {
          status: 500,
          headers: { 'content-type': 'text/html' },
        });
      }
    } catch (err) {
      console.log('Error handling request:', {
        url: req.url,
        error:
          err instanceof Error
            ? {
                message: err.message,
                stack: err.stack,
                cause: err.cause,
              }
            : err,
      });

      const error = err instanceof Error ? err : new Error(String(err));

      return new Response(`Error handling request to ${req.url}: ${error.stack ?? error.message}`, {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      });
    }
  });

  const rendererURL = await (isDev
    ? (async () => {
        await initViteServer();

        if (!viteServer) {
          throw new Error('Vite server is not initialized');
        }

        const listen = await viteServer.listen();
        global.__electron__ = electron;
        viteServer.printUrls();

        return `http://localhost:${listen.config.server.port}`;
      })()
    : `http://localhost:${DEFAULT_PORT}`);

  console.log('Using renderer URL:', rendererURL);

  const win = await createWindow(rendererURL);

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow(rendererURL);
    }
  });

  console.log('end whenReady');

  return win;
})()
  .then((win) => {
    // IPC samples : send and recieve.
    let count = 0;
    setInterval(() => win.webContents.send('ping', `hello from main! ${count++}`), 60 * 1000);
    ipcMain.handle('ipcTest', (event, ...args) => console.log('ipc: renderer -> main', { event, ...args }));

    // IPC handlers for persona management
    ipcMain.on('set-persona', (_event, persona: CharacterPersona) => {
      setActivePersona(persona);
      win.webContents.send('persona-changed', persona);
    });

    ipcMain.handle('get-personas', () => {
      return loadPersonas();
    });

    ipcMain.handle('get-active-persona', () => {
      return getActivePersona();
    });

    return win;
  })
  .then((win) => setupMenu(win));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

reloadOnChange();
setupAutoUpdater();
