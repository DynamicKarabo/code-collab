
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    /* Note: model listing is not directly available on the client instance usually, 
       Wait, currently the node SDK might default to a baseUrl that is wrong? 
       Actually, `Not Found` could be the endpoint URL being wrong if the SDK is old/new mismatch?
    */
    console.log("Testing model access...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Test");
        console.log("Result:", result.response.text());
    } catch (e) {
        console.error("Error with gemini-pro:", e);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Test");
        console.log("Result:", result.response.text());
    } catch (e) {
        console.error("Error with gemini-1.5-flash:", e);
    }
}

listModels();
