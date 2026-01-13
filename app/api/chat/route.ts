import { NextRequest, NextResponse } from "next/server";
import { mistral } from "@/lib/mistral";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
    try {
        const { messages, context } = await req.json();
        const reportId = context?.id;
        const { userId } = await auth();

        // Fetch User's Persistent Medical Profile
        let patientProfileText = "No previous medical history available.";
        let trendsText = "No recent trends available.";

        if (userId) {
            const profile = await prisma.patientProfile.findUnique({
                where: { userId }
            });
            if (profile) {
                patientProfileText = `
                - Known Conditions: ${profile.conditions.join(", ") || "None"}
                - Medications: ${profile.medications.join(", ") || "None"}
                - Allergies: ${profile.allergies.join(", ") || "None"}
                - Notes: ${profile.additionalNotes || "None"}
                `;
            }

            // Fetch Recent Metrics (Last 20)
            const metrics = await prisma.healthMetric.findMany({
                where: { userId },
                orderBy: { measuredAt: 'desc' },
                take: 20
            });

            if (metrics.length > 0) {
                trendsText = metrics.map(m =>
                    `- ${m.name}: ${m.value} ${m.unit} (${m.measuredAt.toISOString().split('T')[0]})`
                ).join("\n");
            }
        }

        const systemMessage = {
            role: "system",
            content: `You are MediPilot, an expert medical AI assistant.
      
      CONTEXT (Patient's Uploaded Report):
      ${JSON.stringify(context, null, 2)}

      PATIENT HISTORY (Persistent Memory):
      ${patientProfileText}

      RECENT TRENDS (Last 20 Vitals/Labs):
      ${trendsText}

      INSTRUCTIONS:
      1. **Answer based on BOTH the current report context AND the patient's history.**
      2. **Connect the Dots**: If the current report shows a value related to a known condition in history, mention it.
      3. **Analyze Trends**: Compare current values with the 'RECENT TRENDS' list. explicitly mention if a value has improved or worsened (e.g. "Your Hemoglobin has risen from 12.0 to 13.5 since last month").
      4. **Lab Reports**: If the user asks about their health/values, check the "redFlags" and "summary" fields. Explain what the abnormalities mean in simple terms.
      5. **Safety**: Always advise consulting a doctor for official diagnosis.
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
