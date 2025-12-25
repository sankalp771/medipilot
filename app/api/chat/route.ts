import { NextRequest, NextResponse } from "next/server";
import { mistral } from "@/lib/mistral";

export async function POST(req: NextRequest) {
    try {
        const { messages, context } = await req.json();

        const systemMessage = {
            role: "system",
            content: `You are MediPilot, an expert medical AI assistant.
      
      CONTEXT (Patient's Uploaded Report):
      ${JSON.stringify(context, null, 2)}

      INSTRUCTIONS:
      1. **Answer based ONLY on the above context.** Do not invent values not present in the JSON.
      2. **Lab Reports**: If the user asks about their health/values, check the "redFlags" and "summary" fields. Explain what the abnormalities mean in simple terms.
      3. **Medications**: If asked about timing, refer to the "medications" array (Morning/Afternoon/Night).
      4. **Tones**: Be empathetic, professional, and clear.
      5. **Missing Info**: If the user asks something not in the report (e.g. "What is my Vitamin D?" but it's not in the JSON), say "I don't see that specific test in the summary of this report."
      6. **Safety**: Always advise consulting a doctor for official diagnosis.
      `
        };

        const chatResponse = await mistral.chat.complete({
            model: "mistral-small-latest",
            messages: [systemMessage, ...messages],
            temperature: 0.7,
        });

        const reply = chatResponse.choices?.[0]?.message?.content;

        return NextResponse.json({ role: "assistant", content: reply });
    } catch (error: any) {
        console.error("Chat Error:", error);
        return NextResponse.json(
            { error: "Failed to chat." },
            { status: 500 }
        );
    }
}
