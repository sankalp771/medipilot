import { Mistral } from "@mistralai/mistralai";

const apiKey = "c11voEL5iTtUbbuWOKfd5TWYyPmYgVIa";

if (!apiKey) {
    console.error("Error: MISTRAL_API_KEY is not set.");
    process.exit(1);
}

const client = new Mistral({ apiKey });

async function runTest() {
    console.log("Testing Mistral Connection...");
    try {
        const result = await client.chat.complete({
            model: "mistral-tiny",
            messages: [{ role: "user", content: "Hello! specific reply: 'Mistral Connected'" }],
        });

        console.log("Response:", result.choices?.[0]?.message?.content);
    } catch (error) {
        console.error("Mistral Test Failed:", error);
    }
}

runTest();
