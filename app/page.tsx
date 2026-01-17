"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { CarePlanViewer } from "@/components/care-plan-viewer";
import { CarePlan } from "@/types";
import { Activity, History, ChevronLeft, Upload, FileText, PanelLeftClose, PanelLeftOpen, Plus, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatInterface, ChatRef, Message } from "@/components/chat-interface";
import { ModeToggle } from "@/components/mode-toggle";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

// ... previous imports

function HomeContent() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");

  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // State Split
  const [isProcessing, setIsProcessing] = useState(false); // API Processing
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // Modal Visibility

  const chatRef = useRef<ChatRef>(null);

  // Load report if ID exists
  useEffect(() => {
    const fetchReport = async () => {
      setIsProcessing(true);
      try {
        if (!reportId || reportId === "global") {
          setCarePlan(null);

          // Fetch global history
          const msgRes = await fetch(`/api/chat/history?reportId=global`);
          if (msgRes.ok) {
            const msgs = await msgRes.json();
            setInitialMessages(msgs);
          }

          // Fetch Profile Summary
          fetch("/api/patient/profile").then(res => res.json()).then(data => {
            if (!data.error) setPatientProfile(data);
          });
        } else {
          // Fetch Specific Report
          const res = await fetch(`/api/reports/${reportId}`);
          if (!res.ok) throw new Error("Failed to load report");

          const report = await res.json();
          const plan = report.carePlan || report;
          setCarePlan(plan);

          // Fetch previous messages for this report
          const msgRes = await fetch(`/api/chat/history?reportId=${reportId}`);
          if (msgRes.ok) {
            const msgs = await msgRes.json();
            setInitialMessages(msgs);
          } else {
            setInitialMessages([{ role: "assistant", content: `loaded report: ${report.summary}` }]);
          }
        }

      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handleFileSelect = async (images: string[], text?: string) => {
    setIsProcessing(true);
    try {
      // Send to intake API (supports multiple pages + extracted text)
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, text }),
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

      setIsUploadModalOpen(false); // Close modal on success

    } catch (e: any) {
      console.error(e);
      alert(e.message || "Analysis failed.");
    } finally {
      setIsProcessing(false);
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

          {/* Context Badge / Toggle */}
          <div className="ml-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn("gap-2 text-xs h-8", !carePlan ? "bg-muted/50" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800")}
            >
              {carePlan ? (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Report Context</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Global Health</span>
                </>
              )}
              {isSidebarOpen ? <PanelLeftClose className="w-3 h-3 ml-1" /> : <PanelLeftOpen className="w-3 h-3 ml-1" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Upload Button - Secondary Action */}
          <Button size="sm" onClick={() => setIsUploadModalOpen(true)} variant="outline" className="border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30">
            <Plus className="w-4 h-4 mr-2" />
            Add Report
          </Button>

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
          {isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="border-r bg-card/30 backdrop-blur-sm shadow-inner h-full z-20 flex flex-col overflow-hidden"
            >
              {carePlan ? (
                <>
                  <div className="p-4 border-b flex items-center justify-between shrink-0">
                    <h2 className="font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Report Context
                    </h2>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsSidebarOpen(false)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <CarePlanViewer plan={carePlan} />
                  </div>
                </>
              ) : (
                <div className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">Global Health Mode</h3>
                    <p className="text-xs text-muted-foreground">Using your complete history to answer questions.</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-sm text-left space-y-3">
                    <p className="font-medium text-xs text-muted-foreground uppercase">Try asking:</p>
                    <ul className="space-y-2 text-muted-foreground cursor-pointer">
                      <li className="hover:text-foreground transition-colors" onClick={() => chatRef.current?.askQuestion("How is my health trending?")}>"How is my health trending? 📈"</li>
                      <li className="hover:text-foreground transition-colors" onClick={() => chatRef.current?.askQuestion("Do I have any allergies?")}>"Do I have any allergies? 🤧"</li>
                    </ul>
                  </div>

                  {/* Health Snapshot */}
                  {patientProfile && (
                    <Link href="/profile" className="block p-4 bg-card border rounded-xl hover:border-emerald-500 transition-all shadow-sm text-left group">
                      <div className="flex items-center gap-2 font-semibold mb-3 text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                        <Brain className="w-4 h-4 text-purple-500" />
                        Your Health Snapshot
                      </div>
                      <ul className="space-y-2 text-xs text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span className="font-medium text-foreground">{patientProfile.conditions?.length || 0}</span> active conditions
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="font-medium text-foreground">{patientProfile.allergies?.length || 0}</span> allergies detected
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="font-medium text-foreground">{patientProfile.medications?.length || 0}</span> ongoing meds
                        </li>
                      </ul>
                    </Link>
                  )}
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Center - Chat Interface */}
        <main className="flex-1 flex flex-col relative min-w-0 bg-background/50">

          {/* Upload Overlay (Active Modal) */}
          {isUploadModalOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-card border shadow-2xl rounded-xl p-6 relative"
              >
                {!isProcessing && (
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setIsUploadModalOpen(false)}>
                    <PanelLeftClose className="w-4 h-4" />
                  </Button>
                )}

                {isProcessing ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-lg font-medium animate-pulse">Analyzing your report...</p>
                    <p className="text-sm text-muted-foreground">This may take a moment.</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-emerald-600" />
                      Upload Medical Report
                    </h2>
                    <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
                  </>
                )}
              </motion.div>
            </div>
          )}

          {/* Processing Indicator (Global) */}
          {/* We need a separate state for 'isProcessing' vs 'showUploadModal' */}

          {/* Always rendered Chat Interface */}
          <div className="flex-1 h-full">
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
