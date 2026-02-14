"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Library, PlusCircle, LogOut, Wallet as WalletIcon, Menu, User, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getWallet, Wallet } from '@/lib/api';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [wallet, setWallet] = useState<Wallet | null>(null);

    const fetchWallet = React.useCallback(async () => {
        if (user?.id) {
            try {
                const data = await getWallet(user.id);
                setWallet(data);
            } catch (error) {
                console.error('Error fetching wallet:', error);
            }
        }
    }, [user?.id]);

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    // Listen for wallet refresh events
    useEffect(() => {
        const handleRefresh = () => fetchWallet();
        window.addEventListener('refresh-wallet', handleRefresh);
        return () => window.removeEventListener('refresh-wallet', handleRefresh);
    }, [fetchWallet]);

    const navItems = [
        { label: 'My Books', icon: Library, href: '/dashboard' },
        { label: 'Create New', icon: PlusCircle, href: '/dashboard/create' },
        { label: 'Buy Credits', icon: WalletIcon, href: '/dashboard/credits' },
    ];

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-background font-inter">
                {/* Desktop Sidebar */}
                <aside className="fixed left-6 top-6 bottom-6 w-64 hidden xl:flex flex-col glass rounded-[2rem] p-6 shadow-2xl z-50">
                    <div className="flex items-center gap-3 px-4 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold font-heading text-gradient">BookGen</span>
                        <ThemeToggle />
                    </div>

                    <nav className="flex flex-col gap-2 flex-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Button
                                    key={item.href}
                                    variant="ghost"
                                    className={`group justify-start gap-3 h-12 px-4 rounded-2xl transition-all duration-300 ${isActive
                                        ? 'bg-primary/20 text-primary hover:bg-primary/30'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                        }`}
                                    asChild
                                >
                                    <Link href={item.href}>
                                        <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : ''}`} />
                                        <span className="font-medium">{item.label}</span>
                                        {isActive && <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>

                    <div className="mt-6 flex flex-col gap-4">
                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <WalletIcon className="w-3 h-3 text-primary" />
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Wallet Balance</span>
                                </div>
                            </div>
                            <div className="text-lg font-black text-foreground">
                                {wallet ? `U$ ${Number(wallet.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'U$ 0.00'}
                            </div>
                        </div>

                        <Link
                            href="/dashboard/profile"
                            className="flex items-center gap-3 p-3 rounded-2xl bg-accent/50 border border-border group transition-colors hover:bg-accent w-full"
                        >
                            <Avatar className="w-10 h-10 border-2 border-primary/20">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                    {user?.name ? getInitials(user.name) : '??'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col max-w-[100px]">
                                <span className="text-sm font-bold truncate">{user?.name || 'User'}</span>
                                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Author</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    logout();
                                }}
                                className="ml-auto text-muted-foreground hover:text-primary transition-colors cursor-pointer relative z-10"
                            >
                                <LogOut size={16} />
                            </button>
                        </Link>
                    </div>
                </aside>

                {/* Mobile Header */}
                <header className="xl:hidden fixed top-0 left-0 right-0 h-16 glass z-40 flex items-center justify-between px-6 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-gradient">BookGen</span>
                        <ThemeToggle />
                    </div>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="glass border-l border-border text-foreground">
                            <SheetHeader className="mb-8">
                                <SheetTitle className="text-left text-foreground">Menu</SheetTitle>
                            </SheetHeader>
                            
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-accent/50 border border-border">
                                    <Avatar className="w-12 h-12 border-2 border-primary/20">
                                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                            {user?.name ? getInitials(user.name) : '??'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-bold">{user?.name || 'User'}</span>
                                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <WalletIcon className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Wallet Balance</span>
                                    </div>
                                    <div className="text-xl font-black">
                                        {wallet ? `U$ ${Number(wallet.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'U$ 0.00'}
                                    </div>
                                </div>

                                <nav className="flex flex-col gap-2">
                                    <Button variant="ghost" className="justify-start gap-3 h-12 rounded-xl" asChild>
                                        <Link href="/dashboard/credits">
                                            <WalletIcon className="w-5 h-5" />
                                            <span>Buy Credits</span>
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" className="justify-start gap-3 h-12 rounded-xl" asChild>
                                        <Link href="/dashboard/profile">
                                            <User className="w-5 h-5" />
                                            <span>Profile Settings</span>
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="justify-start gap-3 h-12 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                        onClick={() => logout()}
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span>Logout</span>
                                    </Button>
                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>
                </header>

                {/* Mobile Bottom Nav */}
                <nav className="xl:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/95 backdrop-blur-xl z-40 flex items-center justify-around px-4 border-t border-border pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    <Link href="/dashboard" className={`flex flex-col items-center gap-1 transition-colors ${pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Library className="w-6 h-6" />
                        <span className="text-[10px] font-medium">My Books</span>
                    </Link>

                    <div className="flex items-center gap-8 relative -top-6">
                        <Link href="/dashboard/credits">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 rotate-45 ${pathname === '/dashboard/credits' ? 'bg-emerald-500 shadow-emerald-500/40 shadow-lg' : 'bg-emerald-500/20 border border-emerald-500/30'}`}>
                                <DollarSign className={`w-8 h-8 -rotate-45 ${pathname === '/dashboard/credits' ? 'text-white' : 'text-emerald-500'}`} />
                            </div>
                        </Link>

                        <Link href="/dashboard/create">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 rotate-45 ${pathname === '/dashboard/create' ? 'bg-primary glow-primary shadow-primary/40' : 'bg-primary/20 border border-primary/30'}`}>
                                <PlusCircle className={`w-8 h-8 -rotate-45 ${pathname === '/dashboard/create' ? 'text-white' : 'text-primary'}`} />
                            </div>
                        </Link>
                    </div>

                    <Link href="/dashboard/profile" className={`flex flex-col items-center gap-1 transition-colors ${pathname === '/dashboard/profile' ? 'text-primary' : 'text-muted-foreground'}`}>
                        <User className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Profile</span>
                    </Link>
                </nav>

                {/* Main Content Area */}
                <main className="flex-1 xl:pl-[19rem] pt-24 pb-28 xl:py-12 px-6 xl:px-12 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
