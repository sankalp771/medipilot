import { Mistral } from "@mistralai/mistralai";

// HARDCODED FOR HACKATHON SPEED
const apiKey = "c11voEL5iTtUbbuWOKfd5TWYyPmYgVIa";

if (!apiKey) {
    console.warn("Warning: MISTRAL_API_KEY is missing.");
}

export const mistral = new Mistral({
    apiKey: apiKey,
});

export const MISTRAL_MODEL = "pixtral-12b-2409"; // Vision capable model
