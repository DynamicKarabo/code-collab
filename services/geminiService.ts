import { GoogleGenAI } from "@google/genai";

// Initialize the API client
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

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
    // Fast mode: gemini-2.5-flash-lite for low latency
    // Thinking mode: gemini-3-pro-preview for complex reasoning
    const modelName = useThinkingMode ? 'gemini-3-pro-preview' : 'gemini-2.5-flash-lite';
    
    const config: any = {
      systemInstruction,
      temperature: 0.7,
    };

    // Apply Thinking Config if enabled (Required for Gemini 3 Pro reasoning)
    if (useThinkingMode) {
      config.thinkingConfig = { thinkingBudget: 32768 }; // Max budget for deep thought
    }

    const chat = ai.chats.create({
      model: modelName,
      config: config,
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