import { NextRequest, NextResponse } from "next/server";
import { mistral, MISTRAL_MODEL } from "@/lib/mistral";
import { INTAKE_PROMPT } from "@/lib/prompts";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { updateMedicalMemory } from "@/lib/memory";

export async function POST(req: NextRequest) {
    console.log("Intake Request Received (Mistral)");

    try {
        const { userId } = await auth();
        const { images } = await req.json();

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json({ error: "No images provided" }, { status: 400 });
        }

        // Construct Mistral Payload with multiple images
        const userContent: any[] = [
            { type: "text", text: INTAKE_PROMPT + "\n\nIMPORTANT: Return ONLY valid JSON." }
        ];

        images.forEach((img: string) => {
            userContent.push({ type: "image_url", imageUrl: img });
        });

        const chatResponse = await mistral.chat.complete({
            model: MISTRAL_MODEL,
            messages: [
                {
                    role: "user",
                    content: userContent
                }
            ],

            responseFormat: { type: "json_object" }, // Enforce JSON mode
            temperature: 0.1,
        });

        const rawContent = chatResponse.choices?.[0]?.message?.content;
        console.log("Mistral Raw Output:", rawContent);

        if (!rawContent) {
            throw new Error("Empty response from Mistral");
        }

        if (typeof rawContent !== "string") {
            throw new Error("Mistral response format invalid (not a string)");
        }

        // Parse JSON
        let data;
        try {
            data = JSON.parse(rawContent);
        } catch (e) {
            // Cleanup if it wrapped in markdown
            const clean = rawContent.replace(/```json/g, "").replace(/```/g, "");
            data = JSON.parse(clean);
        }

        let reportId = null;

        // Save to Database if User is Logged In
        if (userId) {
            try {
                const report = await prisma.report.create({
                    data: {
                        userId: userId,
                        summary: data.summary || "No summary provided",
                        redFlags: data.redFlags || [],
                        dietaryTips: data.dietaryTips || [],
                        carePlan: data, // Save full JSON
                    }
                });
                reportId = report.id;
                console.log("Report Saved to DB:", reportId);

                // --- NEW: Update Persistent Medical Memory ---
                // We do this asynchronously (fire and forget for the API response) 
                // but since Vercel serverless might kill it, we'll await it for safety in this version.
                await updateMedicalMemory(userId, data);
            } catch (dbError) {
                console.error("Failed to save report to DB:", dbError);
                // Don't fail the request, just log it.
            }
        }

        return NextResponse.json({ ...data, id: reportId });

    } catch (error: any) {
        console.error("Mistral Intake Error:", error);
        return NextResponse.json(
            { error: "AI Processing Failed. The model might be overloaded or the image was unclear. Please try again." },
            { status: 500 }
        );
    }
}
