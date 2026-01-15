import { NextRequest, NextResponse } from "next/server";
import { mistral } from "@/lib/mistral";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
    try {
        let { messages, context, reportId } = await req.json(); // reportId is optional
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // AUTO-CREATE SESSION: If no reportId, create a new "Chat Session" container
        let createdNewSession = false;
        if (!reportId) {
            const newSession = await prisma.report.create({
                data: {
                    userId,
                    summary: "New Conversation",
                    redFlags: [],
                    dietaryTips: [],
                    carePlan: {
                        isChatSession: true,
                        patientName: "User",
                        summary: "New Conversation",
                        medications: [],
                        redFlags: [],
                        dietaryTips: [],
                        followUp: ""
                    },
                    createdAt: new Date()
                }
            });
            reportId = newSession.id;
            createdNewSession = true;
        }

        // Fetch User's Persistent Medical Profile
        let patientProfileText = "No previous medical history available.";
        let trendsText = "No recent trends available.";

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

        // Fetch Recent Metrics
        const metrics = await prisma.healthMetric.findMany({
            where: { userId },
            orderBy: { measuredAt: 'desc' },
            take: 50
        });

        if (metrics.length > 0) {
            trendsText = analyzeTrends(metrics);
        }

        const systemMessage = {
            role: "system",
            content: `You are MediPilot, an expert medical AI assistant.
      
      CONTEXT MODE: ${reportId ? "REPORT SPECIFIC" : "GLOBAL HEALTH CHAT"}
      
      CURRENT REPORT CONTEXT:
      ${reportId ? JSON.stringify(context, null, 2) : "No specific report selected. User is asking about general health or history."}

      PATIENT HISTORY (Persistent Memory):
      ${patientProfileText}

      TREND ANALYSIS (Computed Data):
      ${trendsText}

      INSTRUCTIONS:
      1. **Answer based on BOTH the current report context (if any) AND the patient's history.**
      2. **Access to History**: You have access to the user's historical medical data that has been explicitly provided to you in this request (labeled as TREND ANALYSIS and RECENT HISTORY). When the user asks if you can remember past reports or chats, answer YES, and clarify that you are using their stored medical history to help them.
      3. **Connect the Dots**: If the current report shows a value related to a known condition in history, mention it.
      4. **Use Trend Analysis**: Use the pre-computed 'TREND ANALYSIS' section. It contains safe, unit-checked comparisons. Quote them if relevant (e.g. "Values rose by 10%"). DO NOT calculate your own trends from raw numbers if a trend is provided here.
      5. **Safety**: Always advise consulting a doctor for official diagnosis.
      `
        };

        // 1. Save User Message
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === "user") {
                try {
                    await prisma.message.create({
                        data: {
                            userId,
                            reportId: reportId || null,
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
        try {
            await prisma.message.create({
                data: {
                    userId,
                    reportId: reportId || null,
                    role: "assistant",
                    content: reply
                }
            });
        } catch (e) { console.error("Failed to save assistant message", e); }

        return NextResponse.json({ role: "assistant", content: reply, reportId });
    } catch (error: any) {
        console.error("Chat Error:", error);
        return NextResponse.json(
            { error: "Failed to chat." },
            { status: 500 }
        );
    }
}

// ------------------------------------------------------------------
// HELPER: Clinical Trend Analyzer
// ------------------------------------------------------------------
function analyzeTrends(metrics: any[]): string {
    const groups: Record<string, any[]> = {};

    // 1. Group by Canonical Name
    metrics.forEach(m => {
        const key = m.canonicalName || m.name.toLowerCase();
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
    });

    const insights: string[] = [];

    // 2. Analyze each metric
    Object.keys(groups).forEach(key => {
        const history = groups[key].sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()); // Newest first

        const latest = history[0];
        const display = latest.name;
        const unit = latest.unitNormalized || latest.unit;

        if (history.length < 2) {
            // Not enough data
            insights.push(`- ${display}: ${latest.value} ${unit} (Baseline established, insufficient data for trend)`);
            return;
        }

        const previous = history[1]; // Compare with immediate previous

        // Data Sufficiency & Unit Check
        if (latest.unit !== previous.unit && latest.unitNormalized !== previous.unitNormalized) {
            insights.push(`- ${display}: Unit mismatch between recent visits (${previous.unit} vs ${latest.unit}). Cannot compare.`);
            return;
        }

        // Calculate Direction & Magnitude
        const delta = latest.value - previous.value;
        const percentChange = previous.value !== 0 ? (delta / previous.value) * 100 : 0;
        const direction = delta > 0 ? "Increased" : delta < 0 ? "Decreased" : "Stable";
        const significance = Math.abs(percentChange) > 10 ? "Significant" : "Stable/Minor";

        insights.push(`- ${display}: ${direction} from ${previous.value} to ${latest.value} ${unit} (${significance} ${Math.abs(percentChange).toFixed(1)}% change).`);
    });

    return insights.length > 0 ? insights.join("\n") : "No significant trends detected.";
}
