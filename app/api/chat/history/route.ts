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

        // Verify report ownership
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            select: { userId: true }
        });

        if (!report || report.userId !== userId) {
            return NextResponse.json({ error: "Report not found or forbidden" }, { status: 404 });
        }

        const messages = await prisma.message.findMany({
            where: { reportId },
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
