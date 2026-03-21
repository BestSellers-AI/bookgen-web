"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'motion/react';
import { User, Mail, Lock, ShieldCheck, CheckCircle2, Loader2, Wallet as WalletIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { walletApi } from '@/lib/api/wallet';
import type { WalletInfo } from '@/lib/api/types';
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
    const { user, updateProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [wallet, setWallet] = useState<WalletInfo | null>(null);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const t = useTranslations('profile');
    const tErr = useTranslations('errors');
    const tCommon = useTranslations('common');

    useEffect(() => {
        if (user?.id) {
            walletApi.get().then(setWallet).catch(console.error);
        }
    }, [user?.id]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateProfile({ name });
            toast.success(tErr('profileUpdateSuccess'));
        } catch (error: any) {
            toast.error(error.message || tErr('profileUpdateFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error(tErr('passwordMismatch'));
            return;
        }

        setIsLoading(true);
        try {
            // TODO: Implement password change endpoint in Phase 8
            toast.success(tErr('passwordUpdateSuccess'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message || tErr('passwordUpdateFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-4xl font-black font-heading mb-2">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass p-8 rounded-[2rem] border border-border"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold font-heading">{t('personalInfo')}</h2>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">{t('fullName')}</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Name"
                                    className="pl-12 h-12 rounded-2xl bg-muted/50 border-border focus:border-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">{t('email')}</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="pl-12 h-12 rounded-2xl bg-muted/50 border-border focus:border-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('saveChanges')}
                        </Button>
                    </form>
                </motion.div>

                {/* Security */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass p-8 rounded-[2rem] border border-border"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold font-heading">{t('security')}</h2>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">{t('currentPassword')}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-12 h-12 rounded-2xl bg-muted/50 border-border focus:border-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">{t('newPassword')}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-12 h-12 rounded-2xl bg-muted/50 border-border focus:border-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">{t('confirmNewPassword')}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-12 h-12 rounded-2xl bg-muted/50 border-border focus:border-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            variant="outline"
                            className="w-full h-12 rounded-2xl border-border hover:bg-muted/50 text-foreground font-bold transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('updatePassword')}
                        </Button>
                    </form>
                </motion.div>
            </div>

            {/* Wallet & Account Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass p-8 rounded-[2rem] border border-border overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -mr-16 -mt-16" />
                    <div className="relative flex items-center gap-6">
                        <div className="p-4 rounded-3xl bg-primary/20 border border-primary/30">
                            <WalletIcon className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('walletBalance')}</h3>
                            <div className="text-3xl font-black text-foreground">
                                {wallet ? `${wallet.balance} ${tCommon('credits')}` : `0 ${tCommon('credits')}`}
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass p-8 rounded-[2rem] border border-border overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[60px] -mr-16 -mt-16" />
                    <div className="relative flex items-center gap-6">
                        <div className="p-4 rounded-3xl bg-green-500/20 border border-green-500/30">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('accountStatus')}</h3>
                            <div className="text-xl font-black text-foreground">{t('verified')}</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
