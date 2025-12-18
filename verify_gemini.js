import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY not found in .env file");
    process.exit(1);
}

console.log(`Checking API Key: ${apiKey.substring(0, 5)}...`);

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`\nTesting model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        console.log(`✅ Success! Response: ${result.response.text()}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed with ${modelName}:`);
        console.error(`   Error Message: ${error.message}`);
        if (error.message.includes("404")) {
            console.error("   -> This usually means the model doesn't exist or the 'Generative Language API' is not enabled in Google Cloud Console.");
        }
        return false;
    }
}

async function run() {
    const models = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.5-flash-latest'];

    for (const m of models) {
        await testModel(m);
    }
}

run();
