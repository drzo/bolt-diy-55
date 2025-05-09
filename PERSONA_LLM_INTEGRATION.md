# Testing Persona Integration with LLM System

This guide explains how to test the integration between the Bolt DIY persona customization system and the LLM (Large Language Model) components.

## Overview

The Bolt DIY app now features a persona system that allows customizing the AI assistant's behavior through:

1. Selecting different predefined personas
2. Creating custom personas with specific system prompts
3. Importing/exporting personas via JSON files

This document explains how to verify that the persona system properly affects the LLM behavior in the application.

## Prerequisites

- A working Bolt DIY Electron app build
- At least one API key for an LLM provider (OpenAI, Anthropic, etc.)
- Basic understanding of system prompts and LLM behavior

## Testing Steps

### 1. Basic Persona Selection Test

1. Launch the Bolt DIY Electron app
2. Go to the menu bar and select a persona from the "Personas" dropdown
3. Start a new chat and ask a question like: "What kind of assistant are you?"
4. Verify that the LLM's response matches the selected persona's description and system prompt
5. Repeat with different personas to confirm behavior changes

### 2. Custom Persona Creation Test

1. From the menu bar, select "Personas" > "Create New Persona..."
2. Create a persona with the following details:
   - Name: "Technical Documentation Expert"
   - Description: "Specialized in creating technical documentation and explanations"
   - System Prompt: 
     ```
     You are a Technical Documentation Expert.
     Always format your responses with clear headings, bullet points, and code examples when relevant.
     Use technical terminology precisely and provide detailed explanations.
     When asked about code, include comments explaining key parts.
     Keep explanations thorough but concise.
     Focus on best practices and standards in technical documentation.
     ```

3. Click "Create Persona"
4. Select your new persona from the "Personas" menu
5. Start a new chat and ask: "Explain how promises work in JavaScript"
6. Verify that the response:
   - Uses clear headings and bullet points
   - Includes code examples with comments
   - Uses technical terminology precisely
   - Follows documentation best practices

### 3. System Prompt Influence Test

1. Create another persona with a distinctive system prompt that should produce clearly different behavior, for example:
   - Name: "ELI5 Teacher"
   - Description: "Explains complex topics in simple terms as if talking to a 5-year-old"
   - System Prompt:
     ```
     You are an "Explain Like I'm 5" teacher.
     Always use extremely simple language appropriate for a 5-year-old child.
     Use analogies relating to toys, food, or everyday experiences a child would understand.
     Avoid technical terms completely.
     Keep explanations under 3 short paragraphs.
     Use a warm, friendly tone.
     ```

2. Select this persona and ask the same question as before: "Explain how promises work in JavaScript"
3. Verify that the response is dramatically different:
   - Uses simple language
   - Includes child-friendly analogies
   - Avoids technical terminology
   - Is much shorter and more basic

### 4. Persona Export/Import Test

1. Select one of your custom personas
2. Go to "Personas" > "Export Current Persona..."
3. Save the JSON file
4. Create a new persona via "Create New Persona..." with different settings
5. Go to "Personas" > "Import Persona..."
6. Select the previously exported JSON file
7. Verify that the persona is correctly imported with all its original settings
8. Select the imported persona and verify the LLM behavior matches the expected behavior

### 5. Persona Persistence Test

1. Select a specific persona
2. Close the Bolt DIY app completely
3. Relaunch the app
4. Start a new chat and verify that:
   - The same persona is still selected
   - The LLM behavior matches the expected persona behavior

## Troubleshooting

### Common Issues

1. **Persona changes don't affect LLM behavior:**
   - Check if the active persona is correctly saved
   - Verify the system prompt is being passed to the LLM API
   - Ensure there are no overriding system prompts elsewhere in the code

2. **Imported personas don't work correctly:**
   - Check the JSON file format
   - Verify all required fields are present (name, description)
   - Check for any special characters or formatting issues in the system prompt

3. **Persona settings don't persist:**
   - Check if the app has write permissions to the userData directory
   - Verify the storage mechanism is working correctly

## Integration Architecture

The persona system integrates with the LLM through:

1. The Electron main process manages persona selection and persistence
2. The main process communicates the active persona to the renderer process via IPC
3. The renderer process includes the persona's system prompt in LLM API calls
4. The LLM uses the system prompt to adjust its behavior accordingly

## Next Steps

After verifying that the persona system correctly integrates with the LLM components, consider these improvements:

1. Add the ability to include persona-specific memories or context
2. Create domain-specific personas for different types of tasks
3. Add temperature and other LLM parameter controls to personas
4. Implement A/B testing to compare different personas for the same task 