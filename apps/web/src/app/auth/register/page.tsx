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

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signup, isAuthenticated, isLoading } = useAuth();
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
            await signup({ name, email, phone, password });
        } catch (err: any) {
            setError(err.message || 'Signup failed. Please try again.');
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
                <h1 className="text-3xl font-heading font-bold text-gradient">Create account</h1>
                <p className="text-muted-foreground font-medium">Start your creative journey today</p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
                {error && (
                    <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                        {error}
                    </div>
                )}
                <div className="grid gap-2">
                    <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
                    <Input
                        id="name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 bg-card/60 border-white/5 focus:border-primary/50 transition-all rounded-xl"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 bg-card/60 border-white/5 focus:border-primary/50 transition-all rounded-xl"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Phone Number</Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="+55 (11) 98765-4321"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-11 bg-card/60 border-white/5 focus:border-primary/50 transition-all rounded-xl"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 bg-card/60 border-white/5 focus:border-primary/50 transition-all rounded-xl"
                        required
                    />
                </div>
                <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full mt-2 text-md font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Started Free'}
                </Button>
            </form>

            <div className="text-center text-sm font-medium text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline">
                    Sign in
                </Link>
            </div>
        </motion.div>
    );
}
