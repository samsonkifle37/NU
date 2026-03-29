"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, CheckCircle, Clock, AlertCircle, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";

interface UploadedPhoto {
    url: string;
    id: string;
}

interface Props {
    placeId: string;
    placeName: string;
    authToken: string;
}

interface PreviewFile {
    file: File;
    preview: string;
    status: "ready" | "uploading" | "done" | "error";
    error?: string;
}

export function OwnerPhotoUpload({ placeId, placeName, authToken }: Props) {
    const [previews, setPreviews] = useState<PreviewFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<{ uploaded: UploadedPhoto[]; errors: string[]; message: string } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((files: FileList | File[]) => {
        const newFiles = Array.from(files).slice(0, 10);
        const newPreviews = newFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            status: "ready" as const
        }));
        setPreviews(prev => [...prev, ...newPreviews].slice(0, 10));
        setResult(null);
    }, []);

    const removeFile = (index: number) => {
        setPreviews(prev => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(e.dataTransfer.files);
    }, [addFiles]);

    const handleSubmit = async () => {
        if (previews.length === 0 || isUploading) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("placeId", placeId);
        previews.forEach(p => formData.append("photos", p.file));

        try {
            const res = await fetch("/api/owner/photos", {
                method: "POST",
                headers: { Authorization: `Bearer ${authToken}` },
                body: formData
            });
            const data = await res.json();

            if (!res.ok) {
                setResult({ uploaded: [], errors: [data.error || "Upload failed"], message: "" });
            } else {
                setResult(data);
                // Clear ready previews on success
                setPreviews([]);
            }
        } catch {
            setResult({ uploaded: [], errors: ["Network error — please try again"], message: "" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Upload Photos</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Add real photos of <span className="font-bold text-gray-700">{placeName}</span>.
                    They&apos;ll be reviewed by our team within 24 hours.
                </p>
            </div>

            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                    isDragging
                        ? "border-amber-400 bg-amber-50 scale-[1.02]"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    className="hidden"
                    onChange={e => e.target.files && addFiles(e.target.files)}
                />
                <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-700">Drop photos here or click to select</p>
                        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP or AVIF · max 8 MB each · up to 10 at a time</p>
                    </div>
                </div>
            </div>

            {/* Preview Grid */}
            {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {previews.map((p, i) => (
                        <div key={i} className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100 shadow-sm">
                            <Image
                                src={p.preview}
                                alt={`Preview ${i + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, 33vw"
                            />
                            {/* Status overlay */}
                            {p.status === "uploading" && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            )}
                            {p.status === "done" && (
                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                            )}
                            {p.status === "error" && (
                                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                            )}
                            {/* Remove button */}
                            {p.status === "ready" && (
                                <button
                                    onClick={e => { e.stopPropagation(); removeFile(i); }}
                                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3.5 h-3.5 text-white" />
                                </button>
                            )}
                            {/* File name */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                <p className="text-[10px] text-white font-medium truncate">{p.file.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Submit Button */}
            {previews.length > 0 && (
                <button
                    onClick={handleSubmit}
                    disabled={isUploading}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading {previews.length} photo{previews.length > 1 ? "s" : ""}...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            Submit {previews.length} Photo{previews.length > 1 ? "s" : ""} for Review
                        </>
                    )}
                </button>
            )}

            {/* Result Banner */}
            {result && (
                <div className="space-y-3">
                    {result.uploaded.length > 0 && (
                        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-bold text-green-800 text-sm">{result.message}</p>
                                <p className="text-xs text-green-600 mt-0.5">
                                    Photos will appear on your listing once approved by our moderation team.
                                </p>
                            </div>
                        </div>
                    )}
                    {result.errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-700 font-medium">{err}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Pending Review Notice */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Review Process</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                        All submitted photos are reviewed by our team for quality and authenticity before going live.
                        Typical review time: <strong>under 24 hours</strong>.
                    </p>
                </div>
            </div>

            {/* Guidelines */}
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">Photo Guidelines</span>
                </div>
                <ul className="space-y-1.5">
                    {[
                        "Show the actual location — exterior, interior, food, or atmosphere",
                        "Use natural lighting — avoid heavy filters or text overlays",
                        "Minimum 600×400px, ideally landscape orientation",
                        "No watermarks, logos, or promotional text",
                        "Only photos you own or have permission to use"
                    ].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                            <span className="text-amber-500 font-black mt-0.5">·</span>
                            {tip}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
