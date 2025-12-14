import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from '../constants';

// Initialize the API client
const apiKey = process.env.API_KEY || ''; // Environment variable injection
const ai = new GoogleGenAI({ apiKey });

interface ChatContext {
  currentFile: string;
  fileContent: string;
  previousMessages?: { role: string; content: string }[];
}

export const streamCodeAssistant = async function* (
  prompt: string,
  context: ChatContext
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
  
  YOUR ROLE:
  - Analyze the provided code context.
  - Answer the user's questions specifically about this code or general programming concepts.
  - If asked to write code, provide clean, production-ready TypeScript/React code.
  - Keep responses concise and actionable.
  - If you spot bugs in the current file context, politely point them out if relevant to the user's query.
  `;

  try {
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessageStream({ message: prompt });

    for await (const chunk of result) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    yield `Error: ${error.message || "Something went wrong with the AI service."}`;
  }
};