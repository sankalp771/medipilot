"use client";

import { CarePlan } from "@/types";
import { Card } from "@/components/ui/card";
import { Activity, Pill, AlertTriangle, CalendarCheck } from "lucide-react";
import { CareTimeline } from "@/components/care-timeline";

export function CarePlanViewer({ plan }: { plan: CarePlan }) {
    return (
        <div className="space-y-6 h-full overflow-y-auto p-4 md:p-6 custom-scrollbar">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Report Insights</h2>
            </div>

            {/* Summary Card */}
            <Card className="p-5 border bg-card shadow-sm">
                <h3 className="flex items-center space-x-2 font-bold text-base mb-3">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span className="text-foreground">Summary</span>
                </h3>
                <p className="text-sm text-foreground/90 leading-relaxed">
                    {plan.summary}
                </p>
            </Card>

            {/* Red Flags */}
            {plan.redFlags && plan.redFlags.length > 0 && (
                <Card className="p-5 border bg-card shadow-sm">
                    <h3 className="flex items-center space-x-2 font-bold text-base mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-foreground">Watch Out For</span>
                    </h3>
                    <ul className="space-y-2">
                        {plan.redFlags.map((flag, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                <span>{flag}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {/* Medications Timeline */}
            {plan.medications.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                        <Pill className="w-4 h-4 text-blue-500" />
                        Daily Schedule
                    </h3>
                    <CareTimeline plan={plan} />
                </div>
            )}

            {/* Wellness Tips */}
            {plan.dietaryTips && plan.dietaryTips.length > 0 && (
                <Card className="p-5 border bg-card shadow-sm">
                    <h3 className="flex items-center space-x-2 font-bold text-base mb-3">
                        <span className="text-lg">🍎</span>
                        <span className="text-foreground">Wellness Tips</span>
                    </h3>
                    <ul className="space-y-2">
                        {plan.dietaryTips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {/* Follow Up */}
            <Card className="p-4 flex items-center gap-3 border-l-4 border-l-blue-500">
                <CalendarCheck className="w-5 h-5 text-blue-500" />
                <div>
                    <div className="font-medium text-sm text-foreground">Next Follow-up</div>
                    <div className="text-xs text-muted-foreground">{plan.followUp}</div>
                </div>
            </Card>
        </div>
    );
}
