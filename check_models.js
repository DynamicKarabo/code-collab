import { GoogleGenerativeAI } from "@google/generative-ai";

// Manually getting key
const apiKey = "AIzaSyBaqvIWb3aI26Mrky4Gf724TJM9tSIXGOE";

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to access structure if needed, but we use genAI directly usually?
        // Actually SDK doesn't expose listModels directly on the standardized universal client efficiently in all versions.
        // We might have to use the direct fetch if SDK doesn't have it handy or if the version installed differs.
        // Let's rely on standard fetch to the API endpoint which is universal.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
