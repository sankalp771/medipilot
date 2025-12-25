"use client";

import { CarePlan, Medication } from "@/types";
import { MedicineCard } from "./medicine-card";
import { Sun, Sunset, Moon, Coffee } from "lucide-react";
import { motion } from "framer-motion";

interface CareTimelineProps {
    plan: CarePlan;
}

export function CareTimeline({ plan }: CareTimelineProps) {
    // Filter meds for each time slot
    const morningMeds = plan.medications.filter((m) => m.schedule.morning);
    const afternoonMeds = plan.medications.filter((m) => m.schedule.afternoon);
    const nightMeds = plan.medications.filter((m) => m.schedule.night);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-8 relative">
            {/* Vertical Line */}
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200 hidden md:block" />

            {/* Morning Section */}
            <TimelineSection
                title="Morning"
                icon={<Coffee className="w-5 h-5 text-orange-600" />}
                bgColor="bg-orange-50"
                lineColor="border-orange-200"
                meds={morningMeds}
                variants={container}
                itemVariants={item}
            />

            {/* Afternoon Section */}
            <TimelineSection
                title="Afternoon"
                icon={<Sun className="w-5 h-5 text-yellow-600" />}
                bgColor="bg-yellow-50"
                lineColor="border-yellow-200"
                meds={afternoonMeds}
                variants={container}
                itemVariants={item}
            />

            {/* Night Section */}
            <TimelineSection
                title="Night"
                icon={<Moon className="w-5 h-5 text-indigo-600" />}
                bgColor="bg-indigo-50"
                lineColor="border-indigo-200"
                meds={nightMeds}
                variants={container}
                itemVariants={item}
            />
        </div>
    );
}

function TimelineSection({ title, icon, bgColor, lineColor, meds, variants, itemVariants }: any) {
    if (meds.length === 0) return null;

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            animate="show"
            className="relative md:pl-16"
        >
            {/* Timeline Dot (Desktop) */}
            <div className={`absolute left-4 top-0 w-4 h-4 rounded-full border-4 border-white ${bgColor.replace("bg-", "bg-")} ring-1 ring-slate-200 hidden md:block z-10`} style={{ backgroundColor: 'currentColor' }} />

            {/* Header */}
            <div className={`flex items-center gap-2 mb-4 p-2 rounded-lg w-fit ${bgColor}`}>
                {icon}
                <h3 className="font-bold text-slate-800">{title}</h3>
            </div>

            {/* Grid of Meds */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meds.map((med: Medication, i: number) => (
                    <motion.div key={i} variants={itemVariants}>
                        <MedicineCard med={med} />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
