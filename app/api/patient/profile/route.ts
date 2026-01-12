import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profile = await prisma.patientProfile.findUnique({
            where: { userId },
        });

        return NextResponse.json(profile || {}); // Return empty obj if no profile yet
    } catch (error) {
        console.error("Failed to fetch patient profile", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
