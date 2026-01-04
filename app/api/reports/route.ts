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
        const reportId = searchParams.get("id");

        if (!reportId) {
            return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
        }

        const report = await prisma.report.findUnique({
            where: {
                id: reportId,
                userId: userId // Security check: Ensure it belongs to the user
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        return NextResponse.json(report);

    } catch (error) {
        console.error("Fetch Report Error:", error);
        return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
    }
}
