import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const reportId = searchParams.get("reportId");

        if (!reportId) {
            return NextResponse.json({ error: "Report ID required" }, { status: 400 });
        }

        // Determine DB filter
        const isGlobal = reportId === "global";
        const dbReportId = isGlobal ? null : reportId;

        const messages = await prisma.message.findMany({
            where: {
                userId,
                reportId: dbReportId
            },
            orderBy: { createdAt: 'asc' },
            select: {
                role: true,
                content: true
            }
        });

        return NextResponse.json(messages);

    } catch (error) {
        console.error("Chat History Error:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
