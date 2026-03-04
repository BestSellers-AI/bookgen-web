"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Book, Loader2, Clock, ChevronRight, BarChart3, Star, FileText, Download, Sparkles, Zap, CheckCircle2 } from 'lucide-react';
import { getBooks, type Book as BookType } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [books, setBooks] = useState<BookType[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'preview' | 'generating' | 'ready'>('preview');

    const fetchData = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const data = await getBooks(user.id);
            setBooks(data ?? []);
        } catch (e) {
            console.error(e);
            setBooks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, [user?.id]);

    const sortedBooks = useMemo(() => {
        return [...books].sort((a, b) => b.created_at - a.created_at);
    }, [books]);

    const filteredBooks = useMemo(() => {
        return sortedBooks.filter(book => {
            if (activeTab === 'preview') return book.book_status === 'draft';
            return book.book_status === activeTab;
        });
    }, [sortedBooks, activeTab]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center -mt-24">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    const tabs = [
        { id: 'preview', label: 'Preview', icon: Sparkles, color: 'text-violet-400' },
        { id: 'generating', label: 'Generating', icon: Zap, color: 'text-orange-400' },
        { id: 'ready', label: 'Ready', icon: CheckCircle2, color: 'text-emerald-400' },
    ] as const;

    return (
        <div className="max-w-7xl mx-auto space-y-12">
            {/* Header section with stats */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                    <h1 className="text-5xl font-heading font-black tracking-tight text-gradient">Your Library</h1>
                    <p className="text-muted-foreground text-lg font-medium">Manage and generate your AI-powered literary works.</p>
                </div>
                <Button size="lg" className="h-14 px-8 rounded-2xl bg-primary text-md font-bold glow-primary shadow-2xl transition-all active:scale-[0.98]" asChild>
                    <Link href="/dashboard/create">
                        <Plus className="mr-2 h-5 w-5 stroke-[3]" />
                        New Creation
                    </Link>
                </Button>
            </header>

            {/* Tabs Navigation */}
            <div className="relative p-1.5 glass rounded-[2rem] w-full md:w-fit flex items-center gap-1 overflow-hidden">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const count = sortedBooks.filter(b => (tab.id === 'preview' ? b.book_status === 'draft' : b.book_status === tab.id)).length;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex-1 md:flex-none flex items-center justify-center gap-2 px-2 md:px-8 py-3.5 rounded-[1.5rem] font-bold text-xs md:text-sm transition-all duration-500 z-10 whitespace-nowrap ${isActive
                                    ? 'text-white'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary shadow-xl shadow-primary/20 rounded-[1.5rem] -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon size={14} className={`shrink-0 ${isActive ? 'text-white' : tab.color}`} />
                            <span>{tab.label}</span>
                            <Badge
                                variant="secondary"
                                className={`shrink-0 h-4 min-w-[18px] px-1 flex items-center justify-center text-[9px] font-black rounded-md transition-colors duration-500 ${
                                    isActive
                                    ? 'bg-white/20 text-white border-transparent'
                                    : 'bg-accent text-muted-foreground'
                                }`}
                            >
                                {count}
                            </Badge>
                        </button>
                    );
                })}
            </div>

            {filteredBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 glass rounded-[3rem] text-center min-h-[400px] gap-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary blur-3xl opacity-20 -m-4 rounded-full" />
                        <div className="w-24 h-24 rounded-[2rem] bg-card border border-border flex items-center justify-center relative z-10">
                            <Book size={48} className="text-primary" />
                        </div>
                    </div>
                    <div className="space-y-4 max-w-sm">
                        <h3 className="text-3xl font-heading font-bold text-gradient">The blank page awaits</h3>
                        <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                            Start your creative journey by generating your first AI-assisted masterpiece in seconds.
                        </p>
                    </div>
                    <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl border-border hover:bg-accent active:scale-95" asChild>
                        <Link href="/dashboard/create">
                            Generate First Book
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredBooks.map((book, idx) => (
                            <motion.div
                                key={book.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2, delay: idx * 0.05 }}
                            >
                            <div
                                onClick={() => router.push(`/dashboard/books/${book.id}`)}
                                className="block group cursor-pointer"
                            >
                                <div className="glass glass-hover rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden h-full">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />

                                    <div className="flex flex-row items-start justify-between">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transition-transform duration-500 group-hover:rotate-12">
                                            <Book size={28} />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {(() => {
                                                const isReady = book.book_status === 'ready';
                                                const pdfUrl = book.pdf_url || (book.book_status === 'draft' ? book.url : null);
                                                
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        {pdfUrl && (
                                                            <a
                                                                href={pdfUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                                                                title={isReady ? "Open PDF" : "Open PDF Preview"}
                                                            >
                                                                <FileText size={16} />
                                                            </a>
                                                        )}
                                                        {isReady && book.url && (
                                                            <a
                                                                href={book.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-colors"
                                                                title="Download DOCX"
                                                            >
                                                                <Download size={16} />
                                                            </a>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                            <Badge variant="secondary" className={`text-[10px] font-black uppercase tracking-widest h-6 px-3 rounded-full ${book.book_status === 'draft'
                                                ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                                : book.book_status === 'generating'
                                                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>
                                                {book.book_status === 'draft' ? 'Preview' : book.book_status}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-heading font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">{book.title}</h3>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-muted-foreground font-medium line-clamp-2 leading-relaxed">{book.subtitle}</p>
                                            <span className="text-[10px] uppercase font-black text-primary/60 tracking-tighter">by {book.author}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-border">
                                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            <Clock size={14} className="text-primary" />
                                            {new Date(book.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="p-2 rounded-xl bg-accent group-hover:bg-primary transition-colors">
                                            <ChevronRight size={18} className="text-foreground group-hover:text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
