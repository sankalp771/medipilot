"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface FileUploadProps {
    onFileSelect: (base64: string) => void;
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

    // Quick utility to resize image to max 1024px width/height
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
                    const MAX_SIZE = 1000;

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
                    // Compress to JPEG 0.7 quality
                    resolve(canvas.toDataURL("image/jpeg", 0.7));
                };
            };
        });
    };

    // New handleFile with PDF Stitching Logic (Up to 4 Pages)
    const handleFile = async (file: File) => {
        // Accept Image OR PDF
        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
            alert("Please upload an Image (JPG, PNG) or PDF.");
            return;
        }

        let base64 = "";

        if (file.type === "application/pdf") {
            try {
                const pdfJS = await import("pdfjs-dist/build/pdf");
                pdfJS.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfJS.version}/build/pdf.worker.min.mjs`;

                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfJS.getDocument({ data: arrayBuffer }).promise;

                // Smart Limit: Render up to 4 pages to capture graphs/tables
                const maxPages = Math.min(pdf.numPages, 4);
                const pages = [];
                let totalHeight = 0;
                let maxWidth = 0;

                // First pass: Load pages and calculate dimensions
                // Use scale 1.5 for decent clarity, but not huge 4k
                const scale = 1.5;

                for (let i = 1; i <= maxPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale });
                    pages.push({ page, viewport });
                    totalHeight += viewport.height;
                    if (viewport.width > maxWidth) maxWidth = viewport.width;
                }

                // Create a tall canvas to stitch them
                const canvas = document.createElement("canvas");
                canvas.width = maxWidth;
                canvas.height = totalHeight;
                const context = canvas.getContext("2d");

                if (!context) throw new Error("Canvas context failed");

                // Second pass: Render to canvas
                let currentY = 0;
                for (const { page, viewport } of pages) {
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = viewport.width;
                    tempCanvas.height = viewport.height;
                    const tempCtx = tempCanvas.getContext("2d");

                    if (tempCtx) {
                        await page.render({ canvasContext: tempCtx, viewport }).promise;
                        // Draw stitched
                        context.drawImage(tempCanvas, 0, currentY);
                    }
                    currentY += viewport.height;
                }

                // Compress final long image (0.6 quality to keep payload manageable)
                base64 = canvas.toDataURL("image/jpeg", 0.6);

            } catch (e) {
                console.error("PDF Error", e);
                alert("Failed to read PDF. Please try an image (screenshot works best!).");
                return;
            }
        } else {
            // Regular Image Resize
            base64 = await resizeImage(file);
        }

        setPreview(base64);
        onFileSelect(base64);
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
                            "relative group w-full h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer overflow-hidden border-muted-foreground/25 bg-card hover:border-primary/50 hover:bg-muted/30 dark:hover:bg-slate-800/50",
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
                            <div className="p-4 rounded-full bg-primary/10 text-primary mb-2 group-hover:scale-110 transition-transform dark:bg-primary/20">
                                <Upload className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-semibold text-foreground">
                                    Upload Prescription or PDF
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Drag & drop or Click (Supports PDF Stitched)
                                </p>
                            </div>
                        </div>

                        {/* Ambient Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full overflow-hidden rounded-xl border bg-card shadow-sm dark:border-slate-800"
                    >
                        <div className="p-2">
                            {/* Preview now scrolls if tall */}
                            <div className="w-full h-64 overflow-y-auto rounded-lg bg-black/5 custom-scrollbar">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full object-contain"
                                />
                            </div>
                        </div>

                        {/* Overlay controls */}
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
                                    Analysing Pages 1-4...
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
