import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reportList = await prisma.report.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                summary: true,
                createdAt: true,
                redFlags: true,
                carePlan: true
            }
        });

        // Check for Global Chat history
        const lastGlobalMessage = await prisma.message.findFirst({
            where: { userId, reportId: null },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true }
        });

        const reports = [...reportList];

        if (lastGlobalMessage) {
            reports.unshift({
                id: "global",
                summary: "Global Health Chat",
                createdAt: lastGlobalMessage.createdAt,
                redFlags: [] as string[]
            } as any);
        }

        return NextResponse.json(reports);

    } catch (error) {
        console.error("List Reports Error:", error);
        return NextResponse.json({ error: "Failed to list reports" }, { status: 500 });
    }
}
