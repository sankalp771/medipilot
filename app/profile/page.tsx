"use client";

import { useEffect, useState } from "react";
import { Activity, Pill, AlertOctagon, Brain, Ruler, Weight, Droplet, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";

interface PatientProfile {
    conditions: string[];
    medications: string[];
    allergies: string[];
    bloodType?: string;
    height?: string;
    weight?: string;
    additionalNotes?: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [loading, setLoading] = useState(true);

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

    const hasData = profile && (profile.conditions?.length > 0 || profile.medications?.length > 0);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Brain className="w-8 h-8 text-emerald-600" />
                    Medical Profile
                </h1>
            </div>

            <p className="text-muted-foreground text-lg">
                This context is automatically built from your uploaded reports and is used to personalize your care plans.
            </p>

            {loading && (
                <div className="grid gap-6 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-48 bg-muted/30 animate-pulse rounded-xl border border-dashed" />
                    ))}
                </div>
            )}

            {!loading && !hasData && (
                <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed">
                    <p className="text-lg text-muted-foreground mb-4">No medical history found yet.</p>
                    <Link href="/">
                        <Button>Upload a Report to Build Profile</Button>
                    </Link>
                </div>
            )}

            {!loading && profile && hasData && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid gap-6 md:grid-cols-2"
                >
                    {/* Conditions */}
                    <Card className="p-6 border bg-card shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-red-500" />
                            Active Conditions
                        </h3>
                        {profile.conditions?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.conditions.map((c, i) => (
                                    <Badge key={i} variant="outline" className="text-base py-1 px-3 bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900">
                                        {c}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">None detected</p>
                        )}
                    </Card>

                    {/* Allergies */}
                    <Card className="p-6 border bg-card shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <AlertOctagon className="w-5 h-5 text-amber-500" />
                            Allergies
                        </h3>
                        {profile.allergies?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.allergies.map((a, i) => (
                                    <Badge key={i} variant="secondary" className="text-base py-1 px-3 bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900">
                                        {a}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">None detected</p>
                        )}
                    </Card>

                    {/* Medications */}
                    <Card className="p-6 border bg-card shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Pill className="w-5 h-5 text-blue-500" />
                            Role of Medications
                        </h3>
                        {profile.medications?.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {profile.medications.map((m, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                                            <Pill className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium text-blue-900 dark:text-blue-100">{m}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">None active</p>
                        )}
                    </Card>

                    {/* Vitals */}
                    {(profile.bloodType || profile.height || profile.weight) && (
                        <Card className="p-6 border bg-card shadow-sm md:col-span-2">
                            <h3 className="text-lg font-semibold mb-6">Vital Statistics</h3>
                            <div className="grid grid-cols-3 gap-8">
                                {profile.bloodType && (
                                    <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl dark:bg-slate-900/50">
                                        <Droplet className="w-6 h-6 text-red-500 mb-2" />
                                        <span className="text-sm text-muted-foreground">Blood Type</span>
                                        <span className="text-xl font-bold mt-1">{profile.bloodType}</span>
                                    </div>
                                )}
                                {profile.weight && (
                                    <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl dark:bg-slate-900/50">
                                        <Weight className="w-6 h-6 text-emerald-500 mb-2" />
                                        <span className="text-sm text-muted-foreground">Weight</span>
                                        <span className="text-xl font-bold mt-1">{profile.weight}</span>
                                    </div>
                                )}
                                {profile.height && (
                                    <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl dark:bg-slate-900/50">
                                        <Ruler className="w-6 h-6 text-blue-500 mb-2" />
                                        <span className="text-sm text-muted-foreground">Height</span>
                                        <span className="text-xl font-bold mt-1">{profile.height}</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </motion.div>
            )}
        </div>
    );
}
