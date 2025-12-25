import { Medication } from "@/types";
import { cn } from "@/lib/utils";
import { Pill, Syringe, GlassWater, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MedicineCardProps {
    med: Medication;
    className?: string; // Optional className prop
}

const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case "syrup":
            return <GlassWater className="w-5 h-5 text-blue-500" />;
        case "injection":
            return <Syringe className="w-5 h-5 text-red-500" />;
        default:
            return <Pill className="w-5 h-5 text-emerald-500" />;
    }
};

export function MedicineCard({ med, className }: MedicineCardProps) {
    return (
        <div className={cn(
            "relative flex items-start p-4 rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md border-border",
            className
        )}>
            {/* Icon Box */}
            <div className="flex-shrink-0 mr-4 mt-1 p-2 bg-muted rounded-lg dark:bg-slate-800">
                {getIcon(med.type)}
            </div>

            {/* Content */}
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-foreground text-lg">{med.name}</h4>
                        <p className="text-muted-foreground text-sm font-medium">{med.dosage}</p>
                    </div>
                    {/* Tag for Type */}
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded dark:bg-slate-800">
                        {med.type}
                    </span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm text-secondary-foreground bg-secondary/50 p-2 rounded-md dark:bg-slate-800">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{med.instruction}</span>
                </div>

                {med.purpose && (
                    <p className="mt-2 text-xs text-muted-foreground italic">
                        For: {med.purpose}
                    </p>
                )}
            </div>

            {/* Decorative colored bar */}
            <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r-full opacity-50" />
        </div>
    );
}
