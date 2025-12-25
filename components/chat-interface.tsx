"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, X } from "lucide-react";
import { CarePlan } from "@/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInterfaceProps {
    plan: CarePlan;
}

export interface ChatRef {
    addMessage: (msg: string) => void;
    openChat: () => void;
}

interface Message {
    role: "user" | "assistant";
    content: string;
}

export const ChatInterface = forwardRef<ChatRef, ChatInterfaceProps>(({ plan }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! I've analyzed your report. Any questions?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        addMessage: (msg: string) => {
            setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
            setIsOpen(true);
        },
        openChat: () => setIsOpen(true)
    }));

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

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
                    context: plan
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        } catch (e) {
            setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't connect. Try again." }]);
        } finally {
            setLoading(false);
        }
    };

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
                        className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5" />
                                <h3 className="font-semibold">MediPilot Chat</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-emerald-700 rounded p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex w-full",
                                        m.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[80%] p-3 rounded-2xl text-sm",
                                            m.role === "user"
                                                ? "bg-emerald-600 text-white rounded-tr-sm"
                                                : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                                        )}
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-sm shadow-sm">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                            <Input
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Ask about your request..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            />
                            <Button size="icon" onClick={() => sendMessage()} className="rounded-full h-10 w-10 bg-emerald-600 hover:bg-emerald-700">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
});

ChatInterface.displayName = "ChatInterface";
