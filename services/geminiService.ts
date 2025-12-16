/// <reference types="vite/client" />
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API client
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

interface ChatContext {
  currentFile: string;
  fileContent: string;
}

export const streamCodeAssistant = async function* (
  prompt: string,
  context: ChatContext,
  useThinkingMode: boolean = false
) {
  if (!apiKey) {
    yield "Error: API Key is missing. Please check your environment configuration.";
    return;
  }

  const systemInstruction = `You are an expert Senior React Engineer and AI Pair Programmer named 'CodeCollab AI'.
  
  CONTEXT:
  The user is currently editing a file named "${context.currentFile}".
  
  CURRENT FILE CONTENT:
  \`\`\`
  ${context.fileContent}
  \`\`\`
  
  YOUR ABILITIES:
  1.  **Chat**: Answer questions about the code.
  2.  **Create File**: You can create new files if asked.
  3.  **Edit File**: You can rewrite the entire file content if asked to refactor or fix it.

  RESPONSE FORMAT:
  You must check if the user is asking for an action.
  
  IF ASKING TO CREATE A FILE:
  Output ONLY this JSON (no markdown, no extra text):
  { "action": { "type": "create_file", "fileName": "name.ts", "content": "FILE_CONTENT" } }

  IF ASKING TO EDIT/REFACTOR THE CURRENT FILE:
  Output ONLY this JSON (no markdown, no extra text):
  { "action": { "type": "edit_code", "fileName": "${context.currentFile}", "content": "NEW_FULL_FILE_CONTENT" } }

  IF JUST CHATTING:
  Just reply normally with text. Do NOT output formatted JSON for normal chat.
  `;

  try {
    const modelName = useThinkingMode ? 'gemini-pro-latest' : 'gemini-flash-latest';

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction,
      generationConfig: {
        responseMimeType: "text/plain", // Keep text/plain to allow mixed chat/JSON if needed, though we instruct strictness
      }
    });

    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessageStream(prompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    yield `Error: ${error.message || "Something went wrong with the AI service."}`;
  }
};