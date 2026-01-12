import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";


export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reportId = (await params).id;

        const report = await prisma.report.findUnique({
            where: { id: reportId },
        });

        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        if (report.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(report);

    } catch (error) {
        console.error("Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reportId = (await params).id;

        // Verify ownership before deleting
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            select: { userId: true }
        });

        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        if (report.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.report.delete({
            where: { id: reportId }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reportId = (await params).id;
        const { summary } = await req.json();

        // Verify ownership
        const report = await prisma.report.findFirst({
            where: { id: reportId, userId }
        });

        if (!report) {
            return NextResponse.json({ error: "Not found or Forbidden" }, { status: 404 });
        }

        const updated = await prisma.report.update({
            where: { id: reportId },
            data: { summary: summary }
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
    }
}
