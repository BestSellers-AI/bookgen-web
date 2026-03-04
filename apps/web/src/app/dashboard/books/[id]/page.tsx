"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Book as BookIcon, Download, Loader2, Calendar, User, FileText, BadgeCheck, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { getBookById, deleteBook, generateFullBook, type Book } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

export default function BookViewPage() {
    const { id } = useParams();
    const router = useRouter();
    const { refreshWallet } = useAuth();
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchBook() {
            if (!id) return;
            try {
                const data = await getBookById(id as string);
                setBook(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load book version.");
            } finally {
                setLoading(false);
            }
        }
        fetchBook();
    }, [id]);

    const handleGenerateFullBook = async () => {
        if (!id) return;
        setGenerating(true);
        setError(null);
        try {
            const data = await generateFullBook(id as string);
            if (data.result === 'generating') {
                // Recarrega os dados do book para refletir o novo status
                const updatedBook = await getBookById(id as string);
                setBook(updatedBook);
                // Trigger wallet refresh
                refreshWallet();
            } else if (data.result === 'not_enough_credits') {
                setError('Insufficient credits. Please add more credits to generate the full book.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to generate full book. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        try {
            await deleteBook(id as string);
            router.push('/dashboard');
        } catch (err) {
            console.error(err);
            setError("Failed to delete book.");
            setDeleting(false);
        }
    };

    if (loading || generating) {
        return (
            <div className="flex flex-col h-screen items-center justify-center -mt-24 gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                {generating && (
                    <p className="text-muted-foreground text-lg font-medium animate-pulse">
                        Generating your full book...
                    </p>
                )}
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="flex flex-col items-center justify-center h-screen -mt-24 gap-6">
                <p className="text-xl font-medium text-muted-foreground">{error || "Book not found"}</p>
                <Button onClick={() => router.push('/dashboard')} variant="outline">
                    Back to Library
                </Button>
            </div>
        );
    }

    const parseContent = (content: any) => {
        if (typeof content !== 'string') return content;
        try {
            return JSON.parse(content);
        } catch (e) {
            return null;
        }
    };

    const structuredContent = book.content ? parseContent(book.content) : null;
    const glossaryData = structuredContent?.glossary || structuredContent?.planning?.glossary || book.glossary;
    const isGlossaryArray = Array.isArray(glossaryData);
    const hasGlossary = glossaryData && (isGlossaryArray ? glossaryData.length > 0 : true);

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-12">
            {/* Navigation */}
            <div className="flex items-center">
                <Button
                    variant="ghost"
                    className="group text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => router.push('/dashboard')}
                >
                    <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Library
                </Button>
            </div>

            {/* Book Header */}
            <header className="space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={`text-[10px] font-black uppercase tracking-widest h-6 px-3 rounded-full ${book.book_status === 'draft'
                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                            : book.book_status === 'generating'
                                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                            {book.book_status === 'draft' ? 'Preview' : book.book_status}
                        </Badge>
                        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest">
                            <Calendar size={14} className="text-primary" />
                            {new Date(book.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tight leading-tight text-foreground">
                        {structuredContent?.title || book.title}
                    </h1>
                    <p className="text-2xl text-muted-foreground font-medium italic">
                        {structuredContent?.subtitle || book.subtitle}
                    </p>
                </div>

                <div className="flex flex-wrap gap-8 py-8 border-y border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <User size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Author</span>
                            <span className="font-bold text-foreground">{structuredContent?.author || book.author}</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    {/* PDF Actions Logic */}
                    {(() => {
                        const isReady = book.book_status === 'ready';
                        const pdfUrl = isReady ? book.pdf_url : book.preview_pdf_url;
                        const hasPdf = !!pdfUrl;

                        if (!hasPdf && !book.url) return null;

                        return (
                            <>
                                {hasPdf && (
                                    <>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View PDF
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-background border-border flex flex-col">
                                                <DialogHeader className="p-4 border-b border-border shrink-0">
                                                    <DialogTitle className="text-foreground flex items-center gap-2">
                                                        <FileText className="h-5 w-5 text-primary" />
                                                        {book.title} - {isReady ? 'Final PDF' : 'Preview'}
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="flex-1 w-full bg-slate-900 overflow-hidden">
                                                    <iframe
                                                        src={`${pdfUrl}#toolbar=0`}
                                                        className="w-full h-full border-none"
                                                        title="PDF Viewer"
                                                    />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                        <Button variant="outline" className="rounded-xl border-border" asChild>
                                            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                                <FileText className="mr-2 h-4 w-4" />
                                                PDF Link
                                            </a>
                                        </Button>
                                    </>
                                )}

                                {/* DOCX Download - Only for Ready status */}
                                {isReady && book.url && (
                                    <Button variant="outline" className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10" asChild>
                                        <a href={book.url} target="_blank" rel="noopener noreferrer">
                                            <Download className="mr-2 h-4 w-4" />
                                            Download .docx
                                        </a>
                                    </Button>
                                )}
                            </>
                        );
                    })()}

                    {book.book_status === 'draft' && (
                        <Button
                            onClick={handleGenerateFullBook}
                            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 border-none"
                        >
                            <BookIcon className="mr-2 h-4 w-4" />
                            Create Full Book - 200 pages - $19
                        </Button>
                    )}

                    {book.book_status === 'draft' && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="rounded-xl border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md bg-[#0a0a0b] border-white/10 text-white">
                                <DialogHeader>
                                    <div className="flex items-center gap-3 text-red-400 mb-2">
                                        <AlertTriangle size={24} />
                                        <DialogTitle>Delete Book</DialogTitle>
                                    </div>
                                    <p className="text-muted-foreground py-4">
                                        Are you sure you want to delete <span className="text-white font-bold">&quot;{book.title}&quot;</span>? This action cannot be undone.
                                    </p>
                                </DialogHeader>
                                <div className="flex justify-end gap-3 mt-4">
                                    <Button variant="ghost" className="hover:bg-white/5" disabled={deleting}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="bg-red-500 hover:bg-red-600 font-bold"
                                    >
                                        {deleting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : 'Yes, Delete'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </header>

            {/* Table of Contents Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border" />
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary/60">Table of Contents</h2>
                    <div className="h-px flex-1 bg-border" />
                </div>

                {structuredContent && (
                    <div className="glass rounded-[2rem] p-8 border-border bg-accent/10">
                        <nav className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            {structuredContent.planning?.chapters?.map((chapter: any, i: number) => (
                                <a
                                    key={i}
                                    href={`#chapter-${chapter.number}`}
                                    className="group flex items-center gap-4 transition-all hover:translate-x-1"
                                >
                                    <span className="text-xs font-black text-primary/40 group-hover:text-primary transition-colors w-6">
                                        {chapter.number.toString().padStart(2, '0')}
                                    </span>
                                    <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                        {chapter.title}
                                    </span>
                                </a>
                            ))}
                            {structuredContent.planning?.conclusion && (
                                <a
                                    href="#conclusion"
                                    className="group flex items-center gap-4 transition-all hover:translate-x-1 md:border-t md:border-border md:pt-4"
                                >
                                    <span className="text-xs font-black text-primary/40 group-hover:text-primary transition-colors w-6">
                                        ---
                                    </span>
                                    <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                        Conclusion
                                    </span>
                                </a>
                            )}
                            {hasGlossary && (
                                <a
                                    href="#glossary"
                                    className="group flex items-center gap-4 transition-all hover:translate-x-1 md:border-t md:border-border md:pt-4"
                                >
                                    <span className="text-xs font-black text-primary/40 group-hover:text-primary transition-colors w-6">
                                        ---
                                    </span>
                                    <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                        Glossary
                                    </span>
                                </a>
                            )}
                        </nav>
                    </div>
                )}
            </div>

            {/* Book Content */}
            {structuredContent ? (
                <div className="space-y-12">
                    {/* Chapters */}
                    <div className="space-y-8">
                        {structuredContent.planning?.chapters?.map((chapter: any, i: number) => (
                            <motion.div
                                key={i}
                                id={`chapter-${chapter.number}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass rounded-[2.5rem] p-10 space-y-6 break-words whitespace-normal scroll-mt-12"
                            >
                                <div className="flex items-start gap-6 w-full">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center font-heading font-black text-xl text-primary shrink-0 mt-1">
                                        {chapter.number}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-4 w-full">
                                        <h3 className="text-3xl font-heading font-bold text-foreground leading-tight break-words whitespace-normal">{chapter.title}</h3>
                                        <ul className="space-y-4 w-full">
                                            {chapter.topics?.map((topic: string, j: number) => (
                                                <li key={j} className="flex items-start gap-4 text-muted-foreground text-lg leading-relaxed w-full">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-3 shrink-0" />
                                                    <div className="flex-1 min-w-0 break-words whitespace-normal">
                                                        {topic}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Conclusion Section */}
                    {structuredContent.planning?.conclusion && (
                        <div id="conclusion" className="glass rounded-[2.5rem] p-10 space-y-4 break-words whitespace-normal min-w-0 scroll-mt-12">
                            <h3 className="text-2xl font-heading font-bold text-foreground">Conclusion</h3>
                            <p className="text-muted-foreground text-lg leading-relaxed italic break-words whitespace-normal w-full">
                                {structuredContent.planning.conclusion}
                            </p>
                        </div>
                    )}

                    {/* Glossary of Terms Section */}
                    {hasGlossary && (
                        <div id="glossary" className="glass rounded-[2.5rem] p-12 space-y-10 break-words whitespace-normal min-w-0 scroll-mt-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <FileText size={24} />
                                </div>
                                <h3 className="text-3xl font-heading font-bold text-foreground">Glossary of Terms</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                {isGlossaryArray ? (
                                    (glossaryData as string[]).map((item: string, i: number) => (
                                        <div key={i} className="group p-6 rounded-2xl bg-accent/30 border border-border hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-300">
                                            <p className="text-base text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                                                {item}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 group p-6 rounded-2xl bg-accent/30 border border-border hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-300">
                                        <p className="text-base text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                                            {glossaryData as string}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-[3rem] p-8 md:p-12 prose prose-invert max-w-none"
                    >
                        {book.content ? (
                            <div
                                className="space-y-6 text-lg leading-relaxed text-muted-foreground"
                                dangerouslySetInnerHTML={{
                                    __html: typeof book.content === 'string'
                                        ? book.content.replace(/\n/g, '<br/>')
                                        : JSON.stringify(book.content, null, 2)
                                }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <BookIcon size={48} className="text-primary/20" />
                                <p className="text-muted-foreground">This book content is still being generated or is unavailable.</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Additional Sections Fallsback (Introduction/Conclusion from Root) */}
                    {(book.introduction || book.conclusion) && (
                        <div className="grid md:grid-cols-2 gap-8">
                            {book.introduction && (
                                <div className="glass rounded-[2rem] p-8 space-y-4">
                                    <h3 className="text-xl font-bold text-foreground">Introduction</h3>
                                    <p className="text-muted-foreground leading-relaxed">{book.introduction}</p>
                                </div>
                            )}
                            {book.conclusion && (
                                <div className="glass rounded-[2rem] p-8 space-y-4">
                                    <h3 className="text-xl font-bold text-foreground">Conclusion</h3>
                                    <p className="text-muted-foreground leading-relaxed">{book.conclusion}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
