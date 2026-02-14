"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenTool, Sparkles, Check, Loader2, RotateCcw, ChevronLeft, ArrowRight } from 'lucide-react';
import { generatePreview, createBook } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

type WizardState = {
    mode: 'manual' | 'ai' | null;
    title: string;
    subtitle: string;
    author: string;
    briefing: string;
};

export default function CreateBookPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

    const [state, setState] = useState<WizardState>({
        mode: null,
        title: '',
        subtitle: '',
        author: '',
        briefing: ''
    });

    const handleModeSelect = (mode: 'manual' | 'ai') => {
        setState(prev => ({ ...prev, mode }));
        setStep(1);
    };

    const handleGenerate = async () => {
        if (!state.briefing) return;

        setLoading(true);
        try {
            const data = await generatePreview(
                state.briefing,
                state.mode!,
                state.title,
                state.subtitle,
                state.author,
                user?.id
            );

            // console.log('Generate Preview Response:', JSON.stringify(data, null, 2));

            // If the response contains a book_id, redirect immediately
            if (data && data.book_id) {
                router.push(`/dashboard/books/${data.book_id}`);
                return;
            }

            setPreviewData(data);
            setStep(2);
        } catch (error) {
            console.error("Failed to generate", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setLoading(true);
        try {
            const result = await createBook(previewData, user?.id);
            if (result.success && result.bookId) {
                router.push(`/dashboard/books/${result.bookId}`);
            } else {
                router.push('/dashboard');
            }
        } catch (error) {
            console.error("Failed to create book", error);
            setLoading(false);
        }
        // Note: we don't setLoading(false) here if redirecting to avoid flickering before navigation
    };

    return (
        <div className="max-w-5xl mx-auto py-6 md:py-12 px-4">

            <AnimatePresence mode="wait">
                {/* Full Screen Loader */}
                {loading && (
                    <motion.div
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0b]/80 backdrop-blur-xl"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                            <div className="relative space-y-8 text-center px-6">
                                <div className="flex justify-center">
                                    <div className="relative w-24 h-24">
                                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-white">
                                        Crafting your <span className="text-gradient">masterpiece...</span>
                                    </h2>
                                    <p className="text-xl text-muted-foreground font-medium max-w-md mx-auto">
                                        Our AI is weaving your ideas into a unique literary structure. This may take a moment.
                                    </p>
                                </div>
                                <div className="flex justify-center gap-2">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{
                                                scale: [1, 1.5, 1],
                                                opacity: [0.3, 1, 0.3]
                                            }}
                                            transition={{
                                                duration: 1,
                                                repeat: Infinity,
                                                delay: i * 0.2
                                            }}
                                            className="w-2 h-2 rounded-full bg-primary"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8 md:space-y-12 text-center"
                    >
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tight text-white">
                                How shall we <span className="text-gradient">begin?</span>
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                                Choose your preferred method of creation. Whether you have a clear vision or just a spark of an idea.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
                            <button
                                onClick={() => handleModeSelect('ai')}
                                className="group relative p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-primary/50 transition-all text-left overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
                                <div className="relative space-y-4 md:space-y-6">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">AI Guided</h3>
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                            Tell us your idea and our AI will help you structure the entire book, from chapters to key topics.
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleModeSelect('manual')}
                                className="group relative p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-primary/50 transition-all text-left overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors" />
                                <div className="relative space-y-4 md:space-y-6">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <PenTool className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Manual Setup</h3>
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                            You provide the title, subtitle, and author. We'll help you flesh out the content based on your briefing.
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="max-w-3xl mx-auto"
                    >
                        <div className="glass rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 space-y-6 md:space-y-10 border border-white/10">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-white h-8 px-2"
                                    onClick={() => setStep(0)}
                                >
                                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                                </Button>
                                <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest">
                                    {state.mode === 'ai' ? 'AI Guided Mode' : 'Manual Mode'}
                                </div>
                            </div>

                            <div className="space-y-6 md:space-y-8">
                                {state.mode === 'manual' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        <div className="space-y-1.5 md:space-y-2">
                                            <Label className="text-xs md:text-sm font-bold text-muted-foreground ml-1">Book Title</Label>
                                            <Input
                                                placeholder="The Art of Innovation"
                                                value={state.title}
                                                onChange={e => setState(s => ({ ...s, title: e.target.value }))}
                                                className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 transition-all text-base md:text-lg"
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:space-y-2">
                                            <Label className="text-xs md:text-sm font-bold text-muted-foreground ml-1">Author Name</Label>
                                            <Input
                                                placeholder="Jane Doe"
                                                value={state.author}
                                                onChange={e => setState(s => ({ ...s, author: e.target.value }))}
                                                className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 transition-all text-base md:text-lg"
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:space-y-2 md:col-span-2">
                                            <Label className="text-xs md:text-sm font-bold text-muted-foreground ml-1">Subtitle (Optional)</Label>
                                            <Input
                                                placeholder="A comprehensive guide to modern creativity"
                                                value={state.subtitle}
                                                onChange={e => setState(s => ({ ...s, subtitle: e.target.value }))}
                                                className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 transition-all text-base md:text-lg"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 md:gap-6">
                                        <div className="space-y-1.5 md:space-y-2">
                                            <Label className="text-xs md:text-sm font-bold text-muted-foreground ml-1">Author Name</Label>
                                            <Input
                                                placeholder="Jane Doe"
                                                value={state.author}
                                                onChange={e => setState(s => ({ ...s, author: e.target.value }))}
                                                className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 transition-all text-base md:text-lg"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 md:space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <Label className="text-base md:text-lg font-bold text-white">
                                            {state.mode === 'ai' ? 'What is your book about?' : 'Detailed Briefing'}
                                        </Label>
                                        <span className="text-[10px] md:text-xs text-muted-foreground font-medium">Min. 50 characters</span>
                                    </div>
                                    <Textarea
                                        placeholder={state.mode === 'ai'
                                            ? "Describe your idea, target audience, and the main message you want to convey..."
                                            : "Provide a detailed outline or specific instructions for the AI to follow..."
                                        }
                                        value={state.briefing}
                                        onChange={e => setState(s => ({ ...s, briefing: e.target.value }))}
                                        className="min-h-[180px] md:min-h-[250px] rounded-2xl md:rounded-[2rem] bg-white/5 border-white/10 focus:border-primary/50 transition-all text-base md:text-lg p-4 md:p-8 leading-relaxed resize-none"
                                    />
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full h-16 md:h-20 rounded-2xl md:rounded-[2rem] bg-primary hover:bg-primary/90 text-lg md:text-xl font-black shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                onClick={handleGenerate}
                                disabled={state.briefing.length < 50 || loading}
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 animate-spin" /> Processing...</>
                                ) : (
                                    <><Sparkles className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" /> Initialize Creation</>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 2 && previewData && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="glass rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                            <div className="bg-primary/10 p-16 border-b border-white/5 relative">
                                <div className="absolute top-0 right-0 p-8">
                                    <span className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-sm">
                                        <Check className="w-5 h-5" /> Structure Ready</span>
                                </div>
                                <h2 className="text-6xl font-heading font-black mb-4 leading-tight">{previewData.title}</h2>
                                <p className="text-3xl text-muted-foreground font-medium leading-tight">{previewData.subtitle}</p>
                                <div className="mt-8 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/50 border border-white/20" />
                                    <span className="text-lg font-semibold text-white/80">Drafted by {previewData.author}</span>
                                </div>
                            </div>

                            <div className="p-16 space-y-12">
                                <h3 className="text-2xl font-black uppercase tracking-widest text-primary font-heading">Complete Roadmap</h3>
                                <div className="grid gap-10">
                                    {previewData.planning?.chapters?.map((chapter: any, i: number) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            key={i}
                                            className="flex gap-8 group"
                                        >
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-primary transition-colors flex items-center justify-center font-bold font-heading text-lg">
                                                    {chapter.number}
                                                </div>
                                                <div className="w-0.5 flex-1 bg-white/5 rounded-full" />
                                            </div>
                                            <div className="pb-10 group-last:pb-0">
                                                <div className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{chapter.title}</div>
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {chapter.topics?.map((topic: string, j: number) => (
                                                        <li key={j} className="flex items-center gap-3 text-muted-foreground font-medium group-hover:text-white/80 transition-colors">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                                            {topic}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-12 glass border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="h-16 px-8 rounded-2xl font-bold text-muted-foreground hover:text-white transition-all"
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                >
                                    <RotateCcw className="mr-3 h-5 w-5" /> Back to briefing
                                </Button>
                                <Button
                                    size="lg"
                                    className="h-20 px-12 rounded-[2rem] bg-white text-black hover:bg-white/90 text-xl font-black shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all active:scale-[0.98]"
                                    onClick={handleApprove}
                                    disabled={loading}
                                >
                                    {loading ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Initializing...</> : <><Check className="mr-3 h-8 w-8 stroke-[3]" /> Generate Full Book</>}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
