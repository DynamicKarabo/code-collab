
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, context, useThinkingMode } = req.body;
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error: API Key missing' });
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

        const chat = model.startChat({
            history: [],
            generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.7,
            },
        });

        const result = await chat.sendMessageStream(prompt);

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                res.write(chunkText);
            }
        }
        res.end();

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
