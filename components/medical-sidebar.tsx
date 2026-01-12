"use client";

import { useEffect, useState } from "react";
import { Activity, Pill, AlertOctagon, Brain, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface PatientProfile {
    conditions: string[];
    medications: string[];
    allergies: string[];
    bloodType?: string;
    height?: string;
    weight?: string;
    additionalNotes?: string;
}

export function MedicalSidebar({ className }: { className?: string }) {
    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        fetch("/api/patient/profile")
            .then((res) => res.json())
            .then((data) => {
                if (!data.error) setProfile(data);
                setLoading(false);
            })
            .catch((e) => {
                console.error(e);
                setLoading(false);
            });
    }, []);

    // If empty profile, maybe don't show much
    const hasData = profile && (profile.conditions?.length > 0 || profile.medications?.length > 0);

    return (
        <div className={cn("flex", className)}>
            {/* Toggle Button (Visible when closed) */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed left-4 top-24 z-20 md:hidden"
                    >
                        <Button size="icon" variant="outline" onClick={() => setIsOpen(true)}>
                            <Brain className="w-4 h-4 text-emerald-600" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.aside
                initial={{ width: 300, opacity: 1 }}
                animate={{
                    width: isOpen ? 300 : 0,
                    opacity: isOpen ? 1 : 0
                }}
                className="h-[calc(100vh-4rem)] border-r bg-card/50 backdrop-blur-sm overflow-hidden sticky top-16 hidden md:block" // Sticky on desktop
            >
                <div className="p-6 h-full overflow-y-auto space-y-6 w-[300px]">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-lg flex items-center gap-2 text-foreground">
                            <Brain className="w-5 h-5 text-emerald-600" />
                            Medical Context
                        </h2>
                        {/* Desktop Collapse currently handled by parent or hidden, keeping it simple for now */}
                    </div>

                    {!loading && !hasData && (
                        <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg border border-dashed text-center">
                            No medical history found. Upload a report to build your profile.
                        </div>
                    )}

                    {loading && (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 bg-muted/30 animate-pulse rounded-lg" />
                            ))}
                        </div>
                    )}

                    {profile && (
                        <div className="space-y-6">
                            {/* Conditions */}
                            {profile.conditions?.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Activity className="w-3 h-3" /> Conditions
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.conditions.map((c, i) => (
                                            <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900">
                                                {c}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Meds */}
                            {profile.medications?.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Pill className="w-3 h-3" /> Medications
                                    </h3>
                                    <div className="space-y-2">
                                        {profile.medications.map((m, i) => (
                                            <div key={i} className="text-sm bg-blue-50/50 p-2 rounded-md border border-blue-100 text-blue-900 dark:bg-blue-950/20 dark:text-blue-100 dark:border-blue-900">
                                                {m}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Allergies */}
                            {profile.allergies?.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <AlertOctagon className="w-3 h-3" /> Allergies
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.allergies.map((a, i) => (
                                            <Badge key={i} variant="secondary">
                                                {a}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Vitals */}
                            {(profile.bloodType || profile.height || profile.weight) && (
                                <div className="grid grid-cols-3 gap-2 py-4 border-t border-b">
                                    {profile.bloodType && (
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground">Blood</div>
                                            <div className="font-bold">{profile.bloodType}</div>
                                        </div>
                                    )}
                                    {profile.weight && (
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground">Weight</div>
                                            <div className="font-bold">{profile.weight}</div>
                                        </div>
                                    )}
                                    {profile.height && (
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground">Height</div>
                                            <div className="font-bold">{profile.height}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.aside>
        </div>
    );
}
