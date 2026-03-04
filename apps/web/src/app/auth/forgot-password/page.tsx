"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState, useEffect } from 'react';
import { authService } from '@/lib/auth-service';
import { Loader2, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading || isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await authService.requestPasswordReset(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to request password reset. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 text-center"
            >
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 size={48} />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-heading font-bold text-white">Check your email</h1>
                    <p className="text-muted-foreground font-medium">
                        We've sent a password reset link to <span className="text-white">{email}</span>
                    </p>
                </div>
                <Button asChild className="h-12 w-full text-md font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all">
                    <Link href="/auth/login">Return to login</Link>
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-heading font-bold text-gradient">Reset password</h1>
                <p className="text-muted-foreground font-medium">Enter your email to receive a reset link</p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 p-1 rounded-2xl">
                {error && (
                    <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                        {error}
                    </div>
                )}
                <div className="grid gap-2">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 bg-card/60 border-white/5 focus:border-primary/50 transition-all rounded-xl"
                        required
                    />
                </div>
                <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full text-md font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send reset link'}
                </Button>
            </form>

            <div className="text-center">
                <Link href="/auth/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors group">
                    <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Back to login
                </Link>
            </div>
        </motion.div>
    );
}
