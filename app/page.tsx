"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { CarePlanViewer } from "@/components/care-plan-viewer";
import { CarePlan } from "@/types";
import { Activity, History, ChevronLeft, Upload, FileText, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatInterface, ChatRef, Message } from "@/components/chat-interface";
import { ModeToggle } from "@/components/mode-toggle";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ... previous imports

function HomeContent() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");

  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const chatRef = useRef<ChatRef>(null);

  // Load report if ID exists
  useEffect(() => {
    if (!reportId) return;

    const fetchReport = async () => {
      setIsUploading(true);
      try {
        // We need an endpoint to get a single report by ID. 
        // Assuming api/reports/[id] exists or we reuse the list one.
        // Let's assume we can fetch it. If not, we might need to build it.
        // Based on history page delete logic: /api/reports/${id} EXITS.

        const res = await fetch(`/api/reports/${reportId}`);
        if (!res.ok) throw new Error("Failed to load report");

        const report = await res.json();

        // Normalize DB report to CarePlan
        // The DB has 'carePlan' as a JSON field. We should check strictly.
        const plan = report.carePlan || report;

        // If the report object IS the plan (legacy) or contains it.
        // Let's assume the API returns the full DB object which has carePlan inside.
        setCarePlan(plan);

        // Fetch previous messages for this report
        const msgRes = await fetch(`/api/chat/history?reportId=${reportId}`);
        if (msgRes.ok) {
          const msgs = await msgRes.json();
          setInitialMessages(msgs);
        } else {
          setInitialMessages([{ role: "assistant", content: `loaded report: ${report.summary}` }]);
        }

      } catch (e) {
        console.error(e);
      } finally {
        setIsUploading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handleFileSelect = async (base64: string) => {
    // ... existing logic ...
    setIsUploading(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to process");
      }

      const data = await res.json();
      setCarePlan(data);
      setIsSidebarOpen(true);
      if (chatRef.current) {
        chatRef.current.addMessage(`I've analyzed your report. Summary: ${data.summary.slice(0, 50)}...`);
      }
      setInitialMessages([{ role: "assistant", content: `Analysis complete. Summary: ${data.summary}` }]);

    } catch (e: any) {
      console.error(e);
      alert(e.message || "Analysis failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b shrink-0 flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span>MediPilot</span>
          </Link>

          {/* Context Toggle */}
          {carePlan && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="ml-2 text-muted-foreground hover:text-foreground"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <span className="mr-2">👤</span> Profile
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <History className="w-4 h-4 mr-2" /> History
            </Button>
          </Link>
          <ModeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left Sidebar (Care Plan / Context) */}
        <AnimatePresence>
          {isSidebarOpen && carePlan && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="border-r bg-card/30 backdrop-blur-sm shadow-inner h-full z-20 flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between shrink-0">
                <h2 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Report Context
                </h2>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsSidebarOpen(false)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>

              {/* Reusable UI Component for Plan */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <CarePlanViewer plan={carePlan} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Center - Chat Interface */}
        <main className="flex-1 flex flex-col relative min-w-0 bg-background/50">
          {/* Empty State / Upload Prompt if no plan */}
          {!carePlan && !isUploading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-background/80 backdrop-blur-[2px]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full text-center space-y-6"
              >
                <div className="inline-flex items-center justify-center p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full mb-4">
                  <Activity className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">How are you feeling today?</h1>
                <p className="text-muted-foreground">
                  Upload a medical report, prescription, or lab result to start a personalized care conversation.
                </p>

                <div className="bg-card border border-dashed border-border rounded-xl p-6 shadow-sm">
                  <FileUpload onFileSelect={handleFileSelect} isProcessing={false} />
                </div>
              </motion.div>
            </div>
          )}

          {/* Loading State */}
          {isUploading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-lg font-medium animate-pulse">Analyzing your report...</p>
                <p className="text-sm text-muted-foreground">Extracting vitals, medications, and insights.</p>
              </div>
            </div>
          )}

          {/* Always rendered Chat Interface (Full Screen) */}
          <div className={`flex-1 h-full ${!carePlan ? "opacity-20 pointer-events-none blur-sm" : ""}`}>
            <ChatInterface
              ref={chatRef}
              plan={carePlan}
              initialMessages={initialMessages}
              mode="embedded"
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
