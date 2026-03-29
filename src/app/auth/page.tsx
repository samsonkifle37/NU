"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail, Lock, Loader2, LogIn, Sparkles, X, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

import { Suspense } from "react";

function AuthPageContent() {
    const { login, register } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const [mode, setMode] = useState<"login" | "register">("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result =
            mode === "login"
                ? await login(email, password)
                : await register(name, email, password);

        setLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            router.push(callbackUrl);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF8] flex flex-col pt-10 px-4">
            <div className="w-full max-w-md mx-auto">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm mb-6 mt-4"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>

                <div className="bg-white rounded-[2rem] p-6 pb-10 shadow-xl border border-gray-100">
                    <div className="text-center mb-6">
                        <Logo className="w-16 h-16 mx-auto mb-3" />
                        <h2 className="text-xl font-black tracking-tight text-gray-900">
                            {mode === "login" ? "Welcome Back" : "Create Account"}
                        </h2>
                        <p className="text-gray-400 text-xs mt-1 font-medium">
                            {mode === "login"
                                ? "Sign in to access your saved places"
                                : "Join NU to save your favorites"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {mode === "register" && (
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <input
                                    type="text"
                                    placeholder="Full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/30 text-sm font-medium"
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/30 text-sm font-medium text-black"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/30 text-sm font-medium text-black"
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-xs font-bold bg-red-50 px-4 py-2.5 rounded-xl">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1A1A2E] text-[#D4AF37] py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 mt-4"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : mode === "login" ? (
                                <>
                                    <LogIn className="w-4 h-4 text-[#D4AF37]" /> Sign In
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Create Account
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <button
                            onClick={() => {
                                setMode(mode === "login" ? "register" : "login");
                                setError("");
                            }}
                            className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>}>
            <AuthPageContent />
        </Suspense>
    );
}
