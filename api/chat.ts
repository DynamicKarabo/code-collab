import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
    runtime: 'edge', // Use Edge runtime for better streaming performance
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { prompt, context, useThinkingMode } = await req.json();
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server configuration error: API Key missing' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = useThinkingMode ? 'gemini-pro-latest' : 'gemini-flash-latest';

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

        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstruction,
            generationConfig: {
                responseMimeType: "text/plain",
            }
        });

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const chat = model.startChat({
                        history: [],
                        generationConfig: {
                            maxOutputTokens: 8192,
                            temperature: 0.7,
                        },
                    });

                    const result = await chat.sendMessageStream(prompt);
                    const encoder = new TextEncoder();

                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        if (chunkText) {
                            controller.enqueue(encoder.encode(chunkText));
                        }
                    }
                    controller.close();
                } catch (error: any) {
                    controller.error(error);
                }
            },
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
