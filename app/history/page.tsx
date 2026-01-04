import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Calendar, FileText, ChevronRight, ArrowLeft } from "lucide-react";

export default async function HistoryPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    const reports = await prisma.report.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen space-y-8 pb-32">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </Link>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Medical History</h1>
            </div>

            {reports.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No medical reports found.</p>
                    <Link href="/" className="text-emerald-600 font-medium hover:underline mt-2 inline-block">
                        Upload your first report
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report) => (
                        <Link key={report.id} href={`/?reportId=${report.id}`}>
                            <Card className="p-6 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-emerald-500 flex items-center justify-between group">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(report.createdAt).toLocaleDateString("en-US", {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                                        {report.summary || "Medical Report Analysis"}
                                    </h3>
                                    <div className="flex gap-2 mt-2">
                                        {report.redFlags.slice(0, 2).map((flag, i) => (
                                            <span key={i} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full border border-red-100 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
                                                {flag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
