"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login, isAuthenticated, isLoading } = useAuth();
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
            await login({ email, password });
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-heading font-bold text-gradient">Welcome back</h1>
                <p className="text-muted-foreground font-medium">Enter your details to sign in</p>
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
                <div className="grid gap-2">
                    <div className="flex items-center justify-between ml-1">
                        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                        <Link href="/auth/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Forgot?</Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 bg-card/60 border-white/5 focus:border-primary/50 transition-all rounded-xl"
                        required
                    />
                </div>
                <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full text-md font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
                </Button>
            </form>

            <div className="text-center text-sm font-medium text-muted-foreground">
                New here?{' '}
                <Link href="/auth/register" className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline">
                    Create an account
                </Link>
            </div>
        </motion.div>
    );
}
