import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reports = await prisma.report.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                summary: true,
                createdAt: true,
                redFlags: true
            }
        });

        return NextResponse.json(reports);

    } catch (error) {
        console.error("List Reports Error:", error);
        return NextResponse.json({ error: "Failed to list reports" }, { status: 500 });
    }
}
