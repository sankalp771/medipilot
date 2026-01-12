"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface FileUploadProps {
    onFileSelect: (images: string[], text?: string) => void;
    isProcessing: boolean;
}

export function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 1200; // Increased slightly for better quality

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL("image/jpeg", 0.7));
                };
            };
        });
    };

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
            alert("Please upload an Image (JPG, PNG) or PDF.");
            return;
        }

        let images: string[] = [];
        let extractedText = "";

        if (file.type === "application/pdf") {
            try {
                const pdfJS = await import("pdfjs-dist");
                pdfJS.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfJS.version}/build/pdf.worker.min.mjs`;

                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfJS.getDocument({ data: arrayBuffer }).promise;

                // 1. Capture Page 1 (and maybe Page 2) as Image for Vision Context
                // Limiting to 2 images to avoid Vercel 4.5MB limit
                const imagePages = Math.min(pdf.numPages, 2);
                const scale = 2.0;

                for (let i = 1; i <= imagePages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale });

                    const canvas = document.createElement("canvas");
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const ctx = canvas.getContext("2d");

                    if (ctx) {
                        await page.render({ canvasContext: ctx, viewport } as any).promise;
                        images.push(canvas.toDataURL("image/jpeg", 0.6));
                    }
                }

                // 2. Extract Text from ALL pages (up to 10)
                const textPages = Math.min(pdf.numPages, 10);
                for (let i = 1; i <= textPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(" ");
                    extractedText += `\n--- PAGE ${i} ---\n${pageText}`;
                }

                console.log("Extracted Text Length:", extractedText.length);

            } catch (e) {
                console.error("PDF Error", e);
                alert("Failed to read PDF.");
                return;
            }
        } else {
            const base64 = await resizeImage(file);
            images.push(base64);
        }

        setPreview(images[0]); // Preview first page
        onFileSelect(images, extractedText);
    };

    const clearFile = () => {
        setPreview(null);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <AnimatePresence>
                {!preview ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            "relative group w-full h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer overflow-hidden border-muted-foreground/25 bg-background hover:bg-accent/50 hover:border-primary/50",
                            dragActive
                                ? "border-primary bg-primary/5 scale-[1.02]"
                                : ""
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            className="hidden"
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleChange}
                        />

                        <div className="flex flex-col items-center space-y-4 text-center p-6 z-10 transition-transform duration-200 group-hover:-translate-y-1">
                            <div className="p-4 rounded-full bg-primary/10 text-primary mb-2 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-semibold text-foreground">
                                    Upload Prescription or PDF
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Drag & drop or Click (Supports Multi-Page PDF)
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full overflow-hidden rounded-xl border bg-card shadow-sm dark:border-slate-800"
                    >
                        <div className="p-2">
                            {/* Preview first page */}
                            <div className="w-full h-64 overflow-y-auto rounded-lg bg-black/5 custom-scrollbar">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full object-contain"
                                />
                            </div>
                        </div>

                        {!isProcessing && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearFile();
                                }}
                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}

                        {isProcessing && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                <p className="text-sm font-medium animate-pulse text-muted-foreground">
                                    Analysing Document...
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
