"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileUpload } from "@/components/file-upload";
import { CareTimeline } from "@/components/care-timeline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CarePlan } from "@/types";
import { Activity, Pill, AlertTriangle, CalendarCheck, CheckCircle2, History } from "lucide-react";
import { motion } from "framer-motion";
import { ChatInterface, ChatRef, Message } from "@/components/chat-interface";
import { ModeToggle } from "@/components/mode-toggle";


// ... imports
import { Suspense } from "react";

function HomeContent() {
  const [step, setStep] = useState<"upload" | "processing" | "plan">("upload");
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const chatRef = useRef<ChatRef>(null);

  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");

  useEffect(() => {
    if (reportId) {
      setStep("processing");
      fetch(`/api/reports?id=${reportId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            alert(data.error);
            setStep("upload");
            return;
          }
          const plan: CarePlan = { ...data.carePlan, id: data.id };
          setCarePlan(plan);

          // Load messages
          if (data.messages && Array.isArray(data.messages)) {
            setInitialMessages(data.messages.map((m: any) => ({
              role: m.role as "user" | "assistant",
              content: m.content
            })));
          }

          setStep("plan");
        })
        .catch(err => {
          console.error(err);
          setStep("upload");
        });
    }
  }, [reportId]);


  const handleFileSelect = async (base64: string) => {
    setStep("processing");
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
      setStep("plan");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Something went wrong with the AI extraction.");
      setStep("upload");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar removed as per verification */}

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 pb-32 relative">
        {/* Mode Toggle moved to Layout Header */}

        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-medium"
          >
            <Activity className="w-4 h-4" />
            <span>GenAI Care Navigator</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-foreground"
          >
            MediPilot
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-lg mx-auto"
          >
            Upload your prescription or lab report. We'll turn it into a clear, day-wise care plan.
          </motion.p>
        </div>

        {/* Main Interaction Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          {step === "upload" || step === "processing" ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 dark:bg-card dark:border-border">
              <div className="flex justify-end gap-2 mb-4">
                <Link href="/profile">
                  <Button variant="outline" className="text-slate-600">
                    <span className="mr-2">👤</span>
                    Medical Profile
                  </Button>
                </Link>
                <Link href="/history">
                  <Button variant="outline" className="text-slate-600">
                    <History className="w-4 h-4 mr-2" />
                    My History
                  </Button>
                </Link>
              </div>
              <FileUpload
                onFileSelect={handleFileSelect}
                isProcessing={step === "processing"}
              />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Header Actions */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-semibold text-foreground">
                  Your Care Plan
                </h2>
                <div className="flex gap-2">
                  <Link href="/profile">
                    <Button variant="outline">
                      <span className="mr-2">👤</span> Profile
                    </Button>
                  </Link>
                  <Link href="/history">
                    <Button variant="outline">
                      <History className="w-4 h-4 mr-2" />
                      History
                    </Button>
                  </Link>

                  <Button variant="outline" onClick={() => {
                    setStep("upload");
                    setCarePlan(null);
                    setInitialMessages([]);
                  }}>
                    Upload New
                  </Button>
                </div>
              </div>

              {carePlan && (
                <div className="grid gap-6">
                  {/* Summary Card */}
                  <Card className="p-6 border bg-card shadow-sm dark:bg-card">
                    <h3 className="flex items-center space-x-2 font-bold text-lg mb-4">
                      <Activity className="w-5 h-5 text-emerald-600" />
                      <span className="text-foreground">Summary</span>
                    </h3>
                    <p className="text-foreground/90 leading-relaxed">
                      {carePlan.summary}
                    </p>
                  </Card>

                  {/* Medications Timeline (Only if meds exist) */}
                  {carePlan.medications.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Pill className="w-5 h-5 text-blue-500" />
                        Daily Schedule
                      </h3>
                      <CareTimeline plan={carePlan} />
                    </div>
                  )}

                  {/* Insights Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Red Flags */}
                    {carePlan.redFlags && carePlan.redFlags.length > 0 && (
                      <Card className="p-6 border bg-card shadow-sm dark:bg-card">
                        <h3 className="flex items-center space-x-2 font-bold text-lg mb-4">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          <span className="text-foreground">Watch Out For</span>
                        </h3>
                        <ul className="space-y-3">
                          {carePlan.redFlags.map((flag, i) => (
                            <li key={i} className="flex items-start gap-2 text-foreground/90 leading-relaxed">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                              <span>{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {/* Dietary & Lifestyle Tips */}
                    {carePlan.dietaryTips && carePlan.dietaryTips.length > 0 && (
                      <Card className="p-6 border bg-card shadow-sm dark:bg-card">
                        <h3 className="flex items-center space-x-2 font-bold text-lg mb-4">
                          <span className="text-xl">🍎</span>
                          <span className="text-foreground">Wellness Tips</span>
                        </h3>
                        <ul className="space-y-3">
                          {carePlan.dietaryTips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-foreground/90 leading-relaxed">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}
                  </div>

                  {/* Follow Up */}
                  <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
                    <CalendarCheck className="w-6 h-6 text-blue-500" />
                    <div>
                      <div className="font-medium text-foreground">Next Follow-up</div>
                      <div className="text-muted-foreground">{carePlan.followUp}</div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Chat Agent with Ref */}
              {carePlan && (
                <ChatInterface
                  ref={chatRef}
                  plan={carePlan}
                  initialMessages={initialMessages}
                  key={carePlan.id || 'new'} // Force remount if ID changes 
                />
              )}

            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
