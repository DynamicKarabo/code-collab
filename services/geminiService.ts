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
  
  YOUR ROLE:
  - Analyze the provided code context.
  - Answer the user's questions specifically about this code or general programming concepts.
  - If asked to write code, provide clean, production-ready TypeScript/React code.
  - Keep responses concise and actionable.
  `;

  try {
    // Select model based on mode
    // Fast mode: gemini-flash-latest (Stable channel)
    // Thinking mode: gemini-pro-latest (High intelligence channel)
    // NOTE: Using generic aliases to avoid version-specific quota limits (limit: 0) on newer preview models.
    const modelName = useThinkingMode ? 'gemini-pro-latest' : 'gemini-flash-latest';

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction,
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