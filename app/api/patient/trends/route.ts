import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// Helper to determine trend direction
function getTrend(current: number, previous: number, name: string): "up" | "down" | "stable" {
    const diff = current - previous;
    if (Math.abs(diff) < 0.1) return "stable"; // Small noise
    return diff > 0 ? "up" : "down";
}

// Helper to interpret if a trend is "good" or "bad"
// This is simplistic; context matters (e.g. rising Hb is good if low, bad if high).
// For specific markers like CRP, lower is always better.
function getTrendLabel(name: string, trend: "up" | "down" | "stable", status: string): "improving" | "worsening" | "stable" | "fluctuating" {
    if (trend === "stable") return "stable";

    const nameLower = name.toLowerCase();
    const badIfHigh = ["crp", "glucose", "cholesterol", "ldl", "triglycerides", "wbc", "blood_pressure", "bp"];
    const goodIfHigh = ["hdl", "hemoglobin", "rbc"]; // Generally

    const isBadIfHigh = badIfHigh.some(k => nameLower.includes(k));
    const isGoodIfHigh = goodIfHigh.some(k => nameLower.includes(k));

    if (isBadIfHigh) {
        return trend === "down" ? "improving" : "worsening";
    }
    if (isGoodIfHigh) {
        return trend === "up" ? "improving" : "worsening";
    }

    return "fluctuating"; // Unknown context
}

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch recent metrics
        const metrics = await prisma.healthMetric.findMany({
            where: { userId },
            orderBy: { measuredAt: 'asc' }, // Oldest to Newest for trend calc
        });

        if (metrics.length === 0) {
            return NextResponse.json([]);
        }

        const groups: Record<string, typeof metrics> = {};

        // Group by canonical name
        metrics.forEach(m => {
            const key = m.canonicalName || m.name.toLowerCase();
            if (!groups[key]) groups[key] = [];
            groups[key].push(m);
        });

        const insights: any[] = [];

        for (const key in groups) {
            const history = groups[key];
            const current = history[history.length - 1];
            const previous = history.length > 1 ? history[history.length - 2] : null;

            let trendLabel = "stable";
            let visualTrend = "stable"; // up, down, stable

            if (previous) {
                const direction = getTrend(current.value, previous.value, key);
                trendLabel = getTrendLabel(key, direction, current.status || "Normal");
                visualTrend = direction;
            }

            // Priority Score (for sorting what to show)
            // Show Abnormal (High/Low) first.
            // Then show significant changes.
            let priority = 0;
            if (current.status === "High" || current.status === "Low") priority += 2;
            if (trendLabel !== "stable") priority += 1;

            insights.push({
                canonicalName: key,
                displayName: current.name,
                value: current.value,
                unit: current.unit,
                status: current.status || "Normal",
                trend: trendLabel, // improving, worsening, stable, fluctuating
                priority
            });
        }

        // Sort by priority desc
        insights.sort((a, b) => b.priority - a.priority);

        // Take top 4
        const topInsights = insights.slice(0, 4);

        return NextResponse.json(topInsights);

    } catch (error) {
        console.error("Trends API Error:", error);
        return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
    }
}
