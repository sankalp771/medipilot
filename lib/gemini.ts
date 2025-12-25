import { GoogleGenerativeAI } from "@google/generative-ai";

// HARDCODED FOR HACKATHON SPEED - Environment variables were flaking
const apiKey = "AIzaSyBy_pyrDcX7dS4pdr96qk-iPsw711GhZ2g";

if (!apiKey) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY is missing.");
} else {
    console.log("Gemini API Key loaded directly.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// We use the 'gemini-1.5-flash' model for speed and cost-efficiency in this MVP, 
// or 'gemini-1.5-pro' if we need higher reasoning.
// For the 8-hour sprint, Flash is perfectly fast and capable for extraction.
export const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        temperature: 0.1, // Near deterministic
        responseMimeType: "application/json",
    }
});

export const chatModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});
