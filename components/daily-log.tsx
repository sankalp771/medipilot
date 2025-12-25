"use client";

import { CarePlan } from "@/types";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DailyLogProps {
    plan: CarePlan;
    day: number;
}

export function DailyLog({ plan, day }: DailyLogProps) {
    // Simulate logic: Missed Morning, Pending Afternoon/Night
    const date = new Date();
    date.setDate(date.getDate() + day);
    const dateStr = date.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Daily Check-in</h2>
                    <p className="text-muted-foreground">Tracking adherence for {dateStr}</p>
                </div>
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 dark:bg-orange-900/30 dark:text-orange-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Action Required</span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Morning Slot - SIMULATED MISSED */}
                <Card className="p-4 border-l-4 border-l-red-500 bg-card shadow-sm dark:bg-red-950/10">
                    <div className="flex justify-between mb-3">
                        <span className="font-semibold text-foreground flex items-center gap-2">
                            ☕ Morning
                        </span>
                        <span className="text-red-500 text-sm font-bold flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Missed
                        </span>
                    </div>
                    <div className="space-y-3">
                        {plan.medications.filter(m => m.schedule.morning).length > 0 ? (
                            plan.medications.filter(m => m.schedule.morning).map((m, i) => (
                                <div key={i} className="flex justify-between items-center text-sm p-2 rounded bg-slate-50 dark:bg-slate-900/50">
                                    <span className="font-medium text-foreground">{m.name}</span>
                                    <span className="text-muted-foreground text-xs">{m.dosage}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-muted-foreground italic">No meds scheduled</div>
                        )}
                    </div>
                </Card>

                {/* Afternoon Slot - PENDING */}
                <Card className="p-4 border-l-4 border-l-slate-300 bg-card shadow-sm opacity-75">
                    <div className="flex justify-between mb-3">
                        <span className="font-semibold text-foreground flex items-center gap-2">
                            ☀️ Afternoon
                        </span>
                        <span className="text-slate-500 text-sm font-bold flex items-center gap-1">
                            <Clock className="w-4 h-4" /> Upcoming
                        </span>
                    </div>
                    <div className="space-y-3">
                        {plan.medications.filter(m => m.schedule.afternoon).length > 0 ? (
                            plan.medications.filter(m => m.schedule.afternoon).map((m, i) => (
                                <div key={i} className="flex justify-between items-center text-sm p-2 rounded bg-slate-50 dark:bg-slate-900/50">
                                    <span className="font-medium text-foreground">{m.name}</span>
                                </div>
                            ))
                        ) : <div className="text-sm text-muted-foreground italic">No meds scheduled</div>}
                    </div>
                </Card>

                {/* Night Slot - PENDING */}
                <Card className="p-4 border-l-4 border-l-slate-300 bg-card shadow-sm opacity-75">
                    <div className="flex justify-between mb-3">
                        <span className="font-semibold text-foreground flex items-center gap-2">
                            🌙 Night
                        </span>
                        <span className="text-slate-500 text-sm font-bold flex items-center gap-1">
                            <Clock className="w-4 h-4" /> Upcoming
                        </span>
                    </div>
                    <div className="space-y-3">
                        {plan.medications.filter(m => m.schedule.night).length > 0 ? (
                            plan.medications.filter(m => m.schedule.night).map((m, i) => (
                                <div key={i} className="flex justify-between items-center text-sm p-2 rounded bg-slate-50 dark:bg-slate-900/50">
                                    <span className="font-medium text-foreground">{m.name}</span>
                                </div>
                            ))
                        ) : <div className="text-sm text-muted-foreground italic">No meds scheduled</div>}
                    </div>
                </Card>
            </div>

            {/* DOCTOR SUMMARY GENERATED BY AGENT */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
            >
                <Card className="p-6 bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/50">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                            <FileText className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <h3 className="font-bold text-lg text-indigo-950 dark:text-indigo-100">AI Doctor Summary (Draft)</h3>
                            <p className="text-sm text-indigo-800/80 dark:text-indigo-300">
                                Ready for your next visit. This tracks adherence and symptoms.
                            </p>

                            <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/30 text-sm leading-relaxed space-y-3 font-mono text-foreground">
                                <p><strong>Patient Status:</strong> Day 2 Overview</p>
                                <p><strong>Adherence:</strong> <span className="text-red-500">Incomplete</span> (Missed Morning Doses).</p>
                                <p><strong>Reported Vitals:</strong> Not recorded yet.</p>
                                <p><strong>Risk Factors:</strong> {plan.redFlags.join(", ")}.</p>
                                <div className="border-t border-dashed border-indigo-200 dark:border-indigo-800 pt-2 mt-2">
                                    <strong>Recommendation:</strong> Patient requires immediate reminder for morning medication compliance. Monitor for symptoms of {plan.redFlags[0] || 'condition'}.
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center dark:text-indigo-400">
                                    View Full History <ChevronRight className="w-3 h-3 ml-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}

// Helper icon
function Clock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
