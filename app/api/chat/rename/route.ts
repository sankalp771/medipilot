import { NextRequest, NextResponse } from "next/server";
import { mistral, MISTRAL_MODEL } from "@/lib/mistral";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
    try {
        const { reportId, messages } = await req.json();
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!reportId || !messages || messages.length === 0) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // Limit context
        const conversationSnippet = messages.slice(0, 5).map((m: any) => `${m.role}: ${m.content}`).join("\n");

        const response = await mistral.chat.complete({
            model: MISTRAL_MODEL,
            messages: [
                { role: "system", content: "You are a helpful assistant. Generate a short, concise description (3-6 words) for this health conversation to be used as a title. Do not output anything else. No quotes." },
                { role: "user", content: conversationSnippet }
            ]
        });

        const content = response.choices?.[0]?.message.content;
        const newTitle = (typeof content === 'string' ? content : "")?.trim();

        if (newTitle) {
            await prisma.report.update({
                where: { id: reportId, userId }, // Ensure ownership
                data: { summary: newTitle }
            });
            return NextResponse.json({ title: newTitle });
        }

        return NextResponse.json({ title: null });

    } catch (error) {
        console.error("Rename Error:", error);
        return NextResponse.json({ error: "Failed to rename" }, { status: 500 });
    }
}
