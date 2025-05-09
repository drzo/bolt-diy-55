import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Define interface for character persona
export interface CharacterPersona {
  name: string;
  description: string;
  imageUrl?: string;
  systemPrompt?: string;
}

// Default personas
const defaultPersonas: CharacterPersona[] = [
  {
    name: 'Default Bolt',
    description: 'The standard Bolt AI assistant with coding expertise.',
    imageUrl: 'default.png'
  },
  {
    name: 'Developer Bolt',
    description: 'Focused on programming and development tasks.',
    systemPrompt: `You are Bolt, an AI coding assistant specializing in software development.
Your responses should be concise, technical, and focused on providing accurate code solutions.
Prioritize best practices, maintainable code, and modern development patterns.
For complex problems, walk through your thought process step by step.
Always suggest testing strategies and performance considerations.`
  },
  {
    name: 'UI/UX Designer Bolt',
    description: 'Specialized in UI/UX design and frontend development.',
    systemPrompt: `You are Bolt, an AI assistant specializing in UI/UX design and frontend development.
Focus on creating visually appealing, user-friendly interfaces with clean, semantic markup.
Prioritize accessibility, responsive design, and modern design patterns.
Consider user experience in all your suggestions and provide design rationales.
Include CSS best practices and modern styling approaches in your responses.`
  }
];

// Path for storing persona customizations
const getPersonasFilePath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'personas.json');
};

// Path for storing active persona
const getActivePersonaFilePath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'active-persona.json');
};

// Save personas to file
export const savePersonas = (personas: CharacterPersona[]) => {
  try {
    fs.writeFileSync(getPersonasFilePath(), JSON.stringify(personas, null, 2));
  } catch (error) {
    console.error('Error saving personas:', error);
  }
};

// Load personas from file
export const loadPersonas = (): CharacterPersona[] => {
  try {
    if (fs.existsSync(getPersonasFilePath())) {
      const data = fs.readFileSync(getPersonasFilePath(), 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading personas:', error);
  }
  
  // Initialize with default personas if file doesn't exist
  savePersonas(defaultPersonas);
  return defaultPersonas;
};

// Save active persona
export const setActivePersona = (persona: CharacterPersona) => {
  try {
    fs.writeFileSync(getActivePersonaFilePath(), JSON.stringify(persona, null, 2));
  } catch (error) {
    console.error('Error saving active persona:', error);
  }
};

// Get active persona
export const getActivePersona = (): CharacterPersona => {
  try {
    if (fs.existsSync(getActivePersonaFilePath())) {
      const data = fs.readFileSync(getActivePersonaFilePath(), 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading active persona:', error);
  }
  
  // Default to first persona if no active persona is set
  const personas = loadPersonas();
  return personas[0];
}; 