"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, X } from "lucide-react";
import { CarePlan } from "@/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatInterfaceProps {
    plan?: CarePlan | null; // Made optional
    initialMessages?: Message[];
    mode?: "floating" | "embedded";
}

export interface ChatRef {
    addMessage: (msg: string) => void;
    openChat: () => void;
}

export interface Message {
    role: "user" | "assistant";
    content: string;
}

export const ChatInterface = forwardRef<ChatRef, ChatInterfaceProps>(({ plan, initialMessages = [], mode = "floating" }, ref) => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(mode === "embedded"); // Always open if embedded
    const [messages, setMessages] = useState<Message[]>([]);

    // Track active report ID immediately to prevent race conditions during session creation
    const activeReportId = useRef(plan?.id);

    // Sync with parent prop updates
    useEffect(() => {
        if (plan?.id) activeReportId.current = plan.id;
    }, [plan?.id]);

    useEffect(() => {
        if (initialMessages.length > 0) {
            setMessages(initialMessages);
        } else if (mode === "floating" && messages.length === 0) {
            // Only add default greeting if completely empty and in floating mode
            setMessages([{ role: "assistant", content: "Hi! I'm MediPilot. Upload a report to get started, or ask me anything about your health." }]);
        }
    }, [initialMessages, mode]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        addMessage: (msg: string) => {
            setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
            if (mode === "floating") setIsOpen(true);
        },
        openChat: () => setIsOpen(true)
    }));

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, loading]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMsg: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, newMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, newMsg].map(m => ({ role: m.role, content: m.content })),
                    context: plan || {},
                    reportId: activeReportId.current // Use ref for immediate consistency
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Handle Session Creation (URL Update)
            if (data.reportId) {
                // Lock onto new ID immediately
                activeReportId.current = data.reportId;

                if (!plan?.id || data.reportId !== plan.id) {
                    router.replace(`/?reportId=${data.reportId}`, { scroll: false });
                }
            }

            setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        } catch (e) {
            setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't connect. Try again." }]);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER LOGIC ---

    const ChatContent = (
        <div className={cn("flex flex-col h-full bg-background", mode === "embedded" ? "w-full rounded-xl border border-border shadow-sm overflow-hidden" : "")}>
            {/* Header - Only show if floating (embedded usually has page header) OR if we want a chat header */}
            {mode === "floating" && (
                <div className="p-4 bg-emerald-600 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        <h3 className="font-semibold">MediPilot Chat</h3>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="hover:bg-emerald-700 rounded p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/30" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                            m.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        <div className={cn("flex max-w-[85%] md:max-w-[75%] gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                            {/* Avatar */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                                m.role === "user" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                            )}>
                                {m.role === "user" ? <div className="text-xs font-bold">You</div> : <Bot className="w-5 h-5" />}
                            </div>

                            {/* Bubble */}
                            <div
                                className={cn(
                                    "p-4 text-sm leading-relaxed shadow-sm overflow-hidden",
                                    m.role === "user"
                                        ? "bg-emerald-600 text-white rounded-2xl rounded-tr-sm"
                                        : "bg-card border border-border text-foreground rounded-2xl rounded-tl-sm"
                                )}
                            >
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        ul: ({ ...props }) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                                        ol: ({ ...props }) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                                        li: ({ ...props }) => <li className="pl-1" {...props} />,
                                        strong: ({ ...props }) => <span className="font-bold text-emerald-700 dark:text-emerald-400" {...props} />,
                                        p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                    }}
                                >
                                    {m.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start animate-in fade-in">
                        <div className="flex max-w-[85%] gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="bg-card border border-border p-4 rounded-2xl rounded-tl-sm shadow-sm">
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-1.5 items-center h-full">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-100" />
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-200" />
                                    </div>
                                    <span className="text-xs text-muted-foreground animate-pulse">Analyzing medical history & trends...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-card border-t border-border flex gap-3 shrink-0">
                <Input
                    className="flex-1 bg-muted/50 border-input rounded-full px-5 py-6 text-base focus-visible:ring-emerald-500 placeholder:text-muted-foreground shadow-sm"
                    placeholder={plan ? "Ask follow-up questions..." : "Ask about symptoms, or say 'Hello'..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button size="icon" onClick={() => sendMessage()} className="rounded-full h-12 w-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shrink-0">
                    <Send className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );

    if (mode === "embedded") {
        return ChatContent;
    }

    return (
        <>
            {/* Floating Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="fixed bottom-6 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors z-50 flex items-center gap-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bot className="w-6 h-6" />
                {!isOpen && <span className="font-semibold pr-1">Ask MediPilot</span>}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] z-50 shadow-2xl rounded-2xl overflow-hidden"
                    >
                        {ChatContent}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
});

ChatInterface.displayName = "ChatInterface";
