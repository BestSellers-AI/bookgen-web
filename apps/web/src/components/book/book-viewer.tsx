"use client";

import { useState, useEffect, useRef } from "react";
import {
  Download,
  Eye,
  FileText,
  Share2,
  Calendar,
  User,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookToc } from "./book-toc";
import { ChapterContent } from "./chapter-content";
import { ShareDialog } from "./share-dialog";
import { AddonSection } from "./addon-section";
import { useTranslations } from "next-intl";
import type { BookDetail, BookFileSummary } from "@/lib/api/types";

function getFileByType(
  files: BookFileSummary[],
  type: string,
): BookFileSummary | undefined {
  return files.find((f) => f.fileType === type);
}

interface BookViewerProps {
  book: BookDetail;
  onRefetch: () => void;
}

export function BookViewer({ book, onRefetch }: BookViewerProps) {
  const [activeSection, setActiveSection] = useState("section-introduction");
  const [shareOpen, setShareOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("book");

  // Track active section via IntersectionObserver
  useEffect(() => {
    const sections = contentRef.current?.querySelectorAll("[id^='section-']");
    if (!sections?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [book]);

  const pdfFile = getFileByType(book.files, "FULL_PDF");
  const docxFile = getFileByType(book.files, "DOCX");

  // Free regens from wallet (fetched by parent or context)
  // For now default to 0, will be fetched
  const freeRegensRemaining = 0;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <header className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="text-[10px] font-black uppercase tracking-widest h-6 px-3 rounded-full bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            >
              {t("completed")}
            </Badge>
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest">
              <Calendar size={14} className="text-primary" />
              {new Date(book.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight leading-tight text-foreground">
            {book.title}
          </h1>
          {book.subtitle && (
            <p className="text-xl text-muted-foreground font-medium italic">
              {book.subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-8 py-6 border-y border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <User size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                {t("author")}
              </span>
              <span className="font-bold text-foreground">{book.author}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                {t("stats")}
              </span>
              <span className="font-bold text-foreground text-sm">
                {book.chaptersCount} {t("chaptersCount")} · {book.wordCount.toLocaleString()} {t("words")} · {book.pageCount} {t("pages")}
              </span>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-3">
          {pdfFile && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
                    <Eye className="mr-2 h-4 w-4" />
                    {t("viewPdfFull")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-background border-border flex flex-col">
                  <DialogHeader className="p-4 border-b border-border shrink-0">
                    <DialogTitle className="text-foreground flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {book.title} - {t("finalPdf")}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 w-full bg-slate-900 overflow-hidden">
                    <iframe
                      src={`${pdfFile.fileUrl}#toolbar=0`}
                      className="w-full h-full border-none"
                      title="PDF Viewer"
                    />
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="rounded-xl border-border" asChild>
                <a href={pdfFile.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  {t("downloadPdf")}
                </a>
              </Button>
            </>
          )}

          {docxFile && (
            <Button variant="outline" className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10" asChild>
              <a href={docxFile.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                {t("downloadDocx")}
              </a>
            </Button>
          )}

          <Button
            variant="outline"
            className="rounded-xl border-border"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {t("share")}
          </Button>
        </div>
      </header>

      {/* 2-column layout */}
      <div className="flex gap-8">
        {/* TOC sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <BookToc book={book} activeSection={activeSection} />
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 space-y-8 min-w-0">
          {/* Mobile TOC */}
          <div className="lg:hidden">
            <BookToc book={book} activeSection={activeSection} mobile />
          </div>

          {/* Introduction */}
          {book.introduction && (
            <div
              id="section-introduction"
              className="glass rounded-[2.5rem] p-8 md:p-10 space-y-4 break-words whitespace-normal scroll-mt-12"
            >
              <h3 className="text-2xl font-heading font-bold text-foreground">
                {t("introduction")}
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {book.introduction}
              </p>
            </div>
          )}

          {/* Chapters */}
          {book.chapters
            .sort((a, b) => a.sequence - b.sequence)
            .map((chapter) => (
              <div key={chapter.id} id={`section-chapter-${chapter.sequence}`} className="scroll-mt-12">
                <ChapterContent
                  chapter={chapter}
                  bookId={book.id}
                  freeRegensRemaining={freeRegensRemaining}
                  onRegenerate={onRefetch}
                />
              </div>
            ))}

          {/* Conclusion */}
          {book.conclusion && (
            <div
              id="section-conclusion"
              className="glass rounded-[2.5rem] p-8 md:p-10 space-y-4 break-words whitespace-normal scroll-mt-12"
            >
              <h3 className="text-2xl font-heading font-bold text-foreground">
                {t("conclusion")}
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed italic">
                {book.conclusion}
              </p>
            </div>
          )}

          {/* Glossary */}
          {book.glossary && (
            <div
              id="section-glossary"
              className="glass rounded-[2.5rem] p-8 md:p-10 space-y-6 break-words whitespace-normal scroll-mt-12"
            >
              <h3 className="text-2xl font-heading font-bold text-foreground">
                {t("glossary")}
              </h3>
              <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
                {book.glossary}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Addons */}
      <AddonSection book={book} onRefetch={onRefetch} />

      <ShareDialog book={book} open={shareOpen} onOpenChange={setShareOpen} onRefetch={onRefetch} />
    </div>
  );
}
