import { ipcRenderer, contextBridge, type IpcRendererEvent } from 'electron';
import './remix-patch'; // Import the Remix patch

console.debug('start preload.', ipcRenderer);

const ipc = {
  invoke(...args: any[]) {
    return ipcRenderer.invoke('ipcTest', ...args);
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  on(channel: string, func: Function) {
    const f = (event: IpcRendererEvent, ...args: any[]) => func(...[event, ...args]);
    console.debug('register listener', channel, f);
    ipcRenderer.on(channel, f);

    return () => {
      console.debug('remove listener', channel, f);
      ipcRenderer.removeListener(channel, f);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', {
  // Basic electron info
  platform: process.platform,
  appVersion: process.env.npm_package_version,
  
  // Remix patch status
  remixPatchApplied: true,
  
  // Persona management functions
  setPersona: (persona: any) => ipcRenderer.send('set-persona', persona),
  onPersonaChange: (callback: (persona: any) => void) => {
    ipcRenderer.on('persona-changed', (_event, persona) => callback(persona));
    return () => ipcRenderer.removeAllListeners('persona-changed');
  },
  getPersonas: () => ipcRenderer.invoke('get-personas'),
  getActivePersona: () => ipcRenderer.invoke('get-active-persona'),
  
  // Add other API functions as needed
});

contextBridge.exposeInMainWorld('ipc', ipc);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in main preload script:', error);
});
