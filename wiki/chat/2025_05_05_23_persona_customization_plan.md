# Bolt Persona Customization Plan

## Overview
The goal is to add a menu interface to customize the Bolt persona using character v2 img/json cards. This feature will allow users to select different personas for their Bolt assistant.

## Technical Design

### Menu Integration
1. Modify `electron/main/ui/menu.ts` to add a new menu item for Persona selection
2. Add submenu items for each available persona
3. Implement click handlers to trigger persona changes

### Persona Storage
1. Use `electron-store` to persist persona selection
2. Create a schema for persona data storage
3. Implement loading/saving of persona preferences

### Persona Definition
Each persona will be defined by a JSON file with:
- Name
- Description
- Avatar image (path or base64)
- System prompt template
- Personality traits
- UI theme colors

### UI Components
1. Create a new React component for persona selection
2. Design card-based UI for persona options
3. Implement preview functionality
4. Add persona management (import/export)

## Implementation Plan

### Phase 1: Basic Menu Integration
```javascript
// Example addition to menu.ts
{
  label: 'Persona',
  submenu: [
    {
      label: 'Default',
      type: 'radio',
      checked: true,
      click: () => {
        win?.webContents.send('change-persona', 'default');
      }
    },
    {
      label: 'Developer',
      type: 'radio',
      click: () => {
        win?.webContents.send('change-persona', 'developer');
      }
    },
    {
      label: 'Creative',
      type: 'radio',
      click: () => {
        win?.webContents.send('change-persona', 'creative');
      }
    },
    { type: 'separator' },
    {
      label: 'Import Custom Persona...',
      click: () => {
        win?.webContents.send('import-persona');
      }
    }
  ]
}
```

### Phase 2: Persona Storage
```typescript
// persona-store.ts
import { store } from './store';

interface Persona {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  systemPrompt: string;
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const DEFAULT_PERSONAS: Record<string, Persona> = {
  default: {
    id: 'default',
    name: 'Default Assistant',
    description: 'The standard Bolt assistant',
    systemPrompt: 'You are Bolt, a helpful AI assistant...',
    theme: {
      primary: '#141414',
      secondary: '#2b2b2b',
      accent: '#6d28d9'
    }
  },
  // More predefined personas...
};

export function getCurrentPersona(): Persona {
  const currentId = store.get('currentPersona', 'default');
  const personas = store.get('personas', DEFAULT_PERSONAS);
  return personas[currentId] || DEFAULT_PERSONAS.default;
}

export function setCurrentPersona(id: string): void {
  store.set('currentPersona', id);
}

export function getAllPersonas(): Record<string, Persona> {
  return store.get('personas', DEFAULT_PERSONAS);
}

export function addPersona(persona: Persona): void {
  const personas = getAllPersonas();
  store.set('personas', {
    ...personas,
    [persona.id]: persona
  });
}
```

### Phase 3: UI Integration
The UI for persona selection will be implemented last, after the Electron build issues are resolved.

## Next Steps
1. Resolve Electron build issues for Windows
2. Implement basic menu integration for persona selection
3. Create persona storage mechanism
4. Design and implement UI components
5. Add import/export functionality for custom personas 