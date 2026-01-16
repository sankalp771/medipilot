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

            {/* Clinical Vitals (Extracted Metrics) */}
            {plan.metrics && plan.metrics.length > 0 && (
                <Card className="p-5 border bg-card shadow-sm">
                    <h3 className="flex items-center space-x-2 font-bold text-base mb-4">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <span className="text-foreground">Clinical Vitals</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {plan.metrics.map((metric, i) => {
                            const isAbnormal = metric.status === "High" || metric.status === "Low";
                            return (
                                <div key={i} className={`p-3 rounded-lg border flex flex-col ${isAbnormal ? "bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900/50" : "bg-muted/30 border-muted"}`}>
                                    <span className="text-xs font-medium text-muted-foreground truncate" title={metric.name}>{metric.name}</span>
                                    <div className="flex flex-col items-start mt-1">
                                        <span className={`text-lg font-bold leading-none ${isAbnormal ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                                            {metric.value}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 break-all">{metric.unit}</span>
                                    </div>
                                    {metric.status && (
                                        <span className={`text-[10px] uppercase font-bold mt-1 ${isAbnormal ? "text-red-500" : "text-emerald-600"}`}>
                                            {metric.status}
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </Card>
            )}

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
            {plan.medications && plan.medications.length > 0 && (
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
