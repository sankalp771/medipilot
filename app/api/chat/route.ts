import { NextRequest, NextResponse } from "next/server";
import { mistral } from "@/lib/mistral";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { messages, context } = await req.json();
        const reportId = context?.id;

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

        // 1. Save User Message (The last one in the array)
        if (reportId && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === "user") {
                try {
                    await prisma.message.create({
                        data: {
                            reportId,
                            role: "user",
                            content: lastMsg.content
                        }
                    });
                } catch (e) { console.error("Failed to save user message", e); }
            }
        }

        const chatResponse = await mistral.chat.complete({
            model: "mistral-small-latest",
            messages: [systemMessage, ...messages],
            temperature: 0.7,
        });

        const content = chatResponse.choices?.[0]?.message?.content;
        const reply = typeof content === 'string' ? content : "I'm sorry, I couldn't generate a response.";

        // 2. Save Assistant Response
        if (reportId) {
            try {
                await prisma.message.create({
                    data: {
                        reportId,
                        role: "assistant",
                        content: reply
                    }
                });
            } catch (e) { console.error("Failed to save assistant message", e); }
        }

        return NextResponse.json({ role: "assistant", content: reply });
    } catch (error: any) {
        console.error("Chat Error:", error);
        return NextResponse.json(
            { error: "Failed to chat." },
            { status: 500 }
        );
    }
}
