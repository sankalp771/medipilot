"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Calendar, FileText, ChevronRight, ArrowLeft, MoreVertical, Trash2, Edit2, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface ReportSummary {
    id: string;
    summary: string;
    createdAt: string;
    redFlags: string[];
}

export default function HistoryPage() {
    const { userId, isLoaded } = useAuth();
    const router = useRouter();
    const [reports, setReports] = useState<ReportSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ReportSummary | null>(null);
    const [newName, setNewName] = useState("");

    // Fetch reports on load
    useEffect(() => {
        if (!isLoaded) return;
        if (!userId) {
            router.push("/");
            return;
        }

        fetch("/api/reports/list") // New endpoint needed or use existing with query? 
        // Actually, let's just make a simple client fetcher that calls your existing pattern or a new list endpoint
        // For simplicity, let's create a specific list endpoint or reuse. 
        // We'll assume we can hit the server component logic via API or just fetch from a new endpoint.
        // Let's create `api/reports/list` quickly or just use `api/reports` with a flag.
        // Actually, user had server component before. I'll stick to client fetching for interactivity.

        fetch("/api/reports/all")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setReports(data);
                } else {
                    console.error("API returned non-array:", data);
                    setReports([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

    }, [isLoaded, userId, router]);


    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent Link navigation
        if (!confirm("Are you sure you want to delete this history? Values cannot be recovered.")) return;

        setReports(prev => prev.filter(r => r.id !== id)); // Optimistic update
        await fetch(`/api/reports/${id}`, { method: "DELETE" });
    };

    const openRename = (report: ReportSummary, e: React.MouseEvent) => {
        e.preventDefault();
        setSelectedReport(report);
        setNewName(report.summary);
        setIsRenameOpen(true);
    };

    const handleRenameSubmit = async () => {
        if (!selectedReport) return;

        const updatedName = newName;
        // Optimistic
        setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, summary: updatedName } : r));
        setIsRenameOpen(false);

        await fetch(`/api/reports/${selectedReport.id}`, {
            method: "PATCH",
            body: JSON.stringify({ summary: updatedName })
        });
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen space-y-8 pb-32">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/" className="p-2 hover:bg-accent rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-muted-foreground" />
                </Link>
                <h1 className="text-3xl font-bold text-foreground">Medical History</h1>
            </div>

            {reports.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center justify-center opacity-80">
                    <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-xl font-medium text-muted-foreground">No medical reports found.</p>
                    <Link href="/" className="text-emerald-600 font-medium hover:underline mt-2 inline-block">
                        Upload your first report
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report) => (
                        <Link key={report.id} href={`/?reportId=${report.id}`} className="block group">
                            <div className="rounded-xl p-6 transition-all cursor-pointer bg-card text-card-foreground border border-border shadow-sm hover:shadow-md flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(report.createdAt).toLocaleDateString("en-US", {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <h3 className="font-semibold text-lg text-foreground leading-tight group-hover:text-emerald-600 transition-colors">
                                        {report.summary || "Medical Report Analysis"}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.preventDefault()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e: React.MouseEvent) => openRename(report, e)}>
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e: React.MouseEvent) => handleDelete(report.id, e)}>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Chat</DialogTitle>
                    </DialogHeader>
                    <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter new name..."
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
                        <Button onClick={handleRenameSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
