import { BrowserWindow, Menu, dialog, ipcMain, app } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { loadPersonas, savePersonas, getActivePersona, setActivePersona } from './persona';
import type { CharacterPersona } from './persona';

// Initialize personas
let currentPersonas: CharacterPersona[] = loadPersonas();
let activePersona: CharacterPersona = getActivePersona();

export function setupMenu(win: BrowserWindow): void {
  const appMenu = Menu.getApplicationMenu();
  
  // Refresh personas list
  currentPersonas = loadPersonas();
  activePersona = getActivePersona();
  
  const activePersonaIndex = currentPersonas.findIndex(p => 
    p.name === activePersona.name && p.description === activePersona.description
  );
  
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      ...(appMenu ? appMenu.items : []),
      {
        label: 'Go',
        submenu: [
          {
            label: 'Back',
            accelerator: 'CmdOrCtrl+[',
            click: () => {
              win?.webContents.navigationHistory.goBack();
            },
          },
          {
            label: 'Forward',
            accelerator: 'CmdOrCtrl+]',
            click: () => {
              win?.webContents.navigationHistory.goForward();
            },
          },
        ],
      } as MenuItemConstructorOptions,
      {
        label: 'Personas',
        submenu: [
          ...currentPersonas.map((persona, index) => ({
            label: persona.name,
            type: 'radio' as const,
            checked: index === (activePersonaIndex >= 0 ? activePersonaIndex : 0),
            click: () => {
              setActivePersona(persona);
              win?.webContents.send('persona-changed', persona);
            },
          })),
          { type: 'separator' as const },
          {
            label: 'Import Persona...',
            click: async () => {
              const result = await dialog.showOpenDialog(win, {
                properties: ['openFile'],
                filters: [
                  { name: 'Character Cards', extensions: ['json'] },
                  { name: 'All Files', extensions: ['*'] }
                ]
              });
              
              if (!result.canceled && result.filePaths.length > 0) {
                try {
                  const data = fs.readFileSync(result.filePaths[0], 'utf8');
                  const persona = JSON.parse(data) as CharacterPersona;
                  
                  if (persona.name && persona.description) {
                    currentPersonas.push(persona);
                    savePersonas(currentPersonas);
                    
                    // Refresh menu to show new persona
                    setupMenu(win);
                    
                    dialog.showMessageBox(win, {
                      type: 'info',
                      title: 'Persona Imported',
                      message: `Successfully imported persona: ${persona.name}`
                    });
                  } else {
                    throw new Error('Invalid persona format');
                  }
                } catch (error) {
                  dialog.showErrorBox('Import Error', 'Failed to import persona. Please ensure the file is a valid character card.');
                }
              }
            }
          },
          {
            label: 'Export Current Persona...',
            click: async () => {
              const currentPersonaIndex = currentPersonas.findIndex((_, i) => 
                Menu.getApplicationMenu()?.items.find(item => item.label === 'Personas')
                  ?.submenu?.items[i]?.checked
              );
              
              if (currentPersonaIndex >= 0) {
                const result = await dialog.showSaveDialog(win, {
                  title: 'Export Persona',
                  defaultPath: `${currentPersonas[currentPersonaIndex].name.replace(/\s+/g, '-')}.json`,
                  filters: [
                    { name: 'JSON Files', extensions: ['json'] }
                  ]
                });
                
                if (!result.canceled && result.filePath) {
                  try {
                    fs.writeFileSync(result.filePath, JSON.stringify(currentPersonas[currentPersonaIndex], null, 2));
                    
                    dialog.showMessageBox(win, {
                      type: 'info',
                      title: 'Persona Exported',
                      message: 'Successfully exported persona!'
                    });
                  } catch (error) {
                    dialog.showErrorBox('Export Error', 'Failed to export persona.');
                  }
                }
              }
            }
          },
          { type: 'separator' as const },
          {
            label: 'Create New Persona...',
            click: () => {
              createPersonaWindow(win);
            }
          },
          {
            label: 'Manage Personas...',
            click: () => {
              createPersonaManagerWindow(win);
            }
          }
        ]
      } as MenuItemConstructorOptions
    ]),
  );
}

// Create a window for adding new personas
function createPersonaWindow(parentWindow: BrowserWindow) {
  const personaWindow = new BrowserWindow({
    width: 500,
    height: 600,
    parent: parentWindow,
    modal: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  personaWindow.loadFile(path.join(__dirname, '../../client/personas/create.html'));
  personaWindow.once('ready-to-show', () => {
    personaWindow.show();
  });
  
  // Handle new persona creation
  ipcMain.once('create-persona', (event, persona: CharacterPersona) => {
    currentPersonas.push(persona);
    savePersonas(currentPersonas);
    setupMenu(parentWindow);
    personaWindow.close();
  });
}

// Create a window for managing personas
function createPersonaManagerWindow(parentWindow: BrowserWindow) {
  const managerWindow = new BrowserWindow({
    width: 700,
    height: 500,
    parent: parentWindow,
    modal: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  managerWindow.loadFile(path.join(__dirname, '../../client/personas/manage.html'));
  managerWindow.once('ready-to-show', () => {
    managerWindow.show();
    managerWindow.webContents.send('load-personas', currentPersonas);
  });
  
  // Handle persona updates
  ipcMain.once('update-personas', (event, personas: CharacterPersona[]) => {
    currentPersonas = personas;
    savePersonas(currentPersonas);
    setupMenu(parentWindow);
    managerWindow.close();
  });
}
