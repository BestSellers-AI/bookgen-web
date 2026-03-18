"use client";

import { useState } from "react";
import {
  Download,
  Share2,
  Calendar,
  User,
  BookOpen,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareDialog } from "./share-dialog";
import { AuthorJourney } from "./author-journey";
import { BookPdfViewerDynamic } from "./book-pdf-viewer-dynamic";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
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
  isTranslation?: boolean;
  translationId?: string;
}

export function BookViewer({ book, onRefetch, isTranslation, translationId }: BookViewerProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const t = useTranslations("book");
  const tErr = useTranslations("errors");
  const locale = useLocale();

  const [viewMode, setViewMode] = useState<"kdp" | "original">("kdp");
  const pdfFile = getFileByType(book.files, "FULL_PDF");
  const docxFile = getFileByType(book.files, "DOCX");
  const epubFile = getFileByType(book.files, "EPUB");

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const { downloadBookPdf } = await import("@/lib/book-template/download");
      await downloadBookPdf(book, locale);
    } catch {
      toast.error(tErr("downloadFailed"));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    try {
      const { downloadBookDocx } = await import("@/lib/book-template/download");
      await downloadBookDocx(book, locale);
    } catch {
      toast.error(tErr("downloadFailed"));
    } finally {
      setDownloadingDocx(false);
    }
  };

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
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight leading-tight text-foreground truncate md:whitespace-normal md:overflow-visible">
            {book.title}
          </h1>
          {book.subtitle && (
            <p className="text-xl text-muted-foreground font-medium italic line-clamp-3 md:line-clamp-none">
              {book.subtitle}
            </p>
          )}
        </div>

      </header>

      {/* Author Journey — publishing track + extras */}
      <AuthorJourney book={book} onRefetch={onRefetch} translationId={isTranslation ? translationId : undefined} />

      {/* PDF Viewer — KDP template (client-generated) or original (n8n) */}
      <div className="space-y-4">
        {pdfFile && (
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "kdp" ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
              onClick={() => setViewMode("kdp")}
            >
              <FileText className="mr-2 h-4 w-4" />
              {t("viewKdp")}
            </Button>
            <Button
              variant={viewMode === "original" ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
              onClick={() => setViewMode("original")}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              {t("viewOriginal")}
            </Button>
          </div>
        )}

        {viewMode === "kdp" ? (
          <div className="glass rounded-[2.5rem] border-none overflow-hidden p-2">
            <BookPdfViewerDynamic
              book={book}
              className="w-full rounded-[2rem]"
              style={{ height: "80vh", minHeight: "600px" }}
            />
          </div>
        ) : pdfFile ? (
          <div className="glass rounded-[2.5rem] border-none overflow-hidden p-2">
            <iframe
              src={pdfFile.fileUrl}
              title={book.title}
              className="w-full rounded-[2rem]"
              style={{ height: "80vh", minHeight: "600px" }}
            />
          </div>
        ) : null}
      </div>

      {/* Author + Stats + Downloads + Share */}
      <div className="space-y-5">
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
              {book.chapters.length} {t("chaptersCount")} · ~{book.wordCount.toLocaleString()} {t("words")} · ~{book.pageCount} {t("pages")}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Client-side PDF download (always available) */}
          <Button
            variant="outline"
            className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {downloadingPdf ? t("generatingFile") : t("downloadPdf")}
          </Button>

          {/* Client-side DOCX download (always available) */}
          <Button
            variant="outline"
            className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
            onClick={handleDownloadDocx}
            disabled={downloadingDocx}
          >
            {downloadingDocx ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {downloadingDocx ? t("generatingFile") : t("downloadEditable")}
          </Button>

          {/* Server-hosted files (from n8n legacy, if available) */}
          {epubFile && (
            <Button variant="outline" className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10" asChild>
              <a href={epubFile.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                {t("downloadEpub")}
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
      </div>

      {/* --- TOC + Content blocks (hidden — kept for future use) ---
      <div className="flex gap-8">
        <div className="hidden lg:block w-64 shrink-0">
          <BookToc book={book} activeSection={activeSection} />
        </div>

        <div ref={contentRef} className="flex-1 min-w-0">
          <div className="lg:hidden mb-8">
            <BookToc book={book} activeSection={activeSection} mobile />
          </div>

          <Accordion type="multiple" defaultValue={["section-introduction"]} className="space-y-4">
            {book.introduction && (
              <AccordionItem value="section-introduction" id="section-introduction" className="glass rounded-[2.5rem] border-none scroll-mt-12 overflow-hidden">
                <AccordionTrigger className="px-8 md:px-10 py-6 hover:no-underline">
                  <h3 className="text-2xl font-heading font-bold text-foreground">
                    {t("introduction")}
                  </h3>
                </AccordionTrigger>
                <AccordionContent className="px-8 md:px-10 pb-8">
                  <p className="text-muted-foreground text-lg leading-relaxed break-words whitespace-pre-line">
                    {book.introduction}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            {book.chapters
              .sort((a, b) => a.sequence - b.sequence)
              .map((chapter) => (
                <AccordionItem
                  key={chapter.id}
                  value={`section-chapter-${chapter.sequence}`}
                  id={`section-chapter-${chapter.sequence}`}
                  className="glass rounded-[2.5rem] border-none scroll-mt-12 overflow-hidden"
                >
                  <AccordionTrigger className="px-8 md:px-10 py-6 hover:no-underline">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-heading font-black text-lg text-primary shrink-0">
                        {chapter.sequence}
                      </div>
                      <h3 className="text-2xl font-heading font-bold text-foreground text-left">
                        {chapter.title}
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-8 md:px-10 pb-2">
                    <ChapterContent
                      chapter={chapter}
                      bookId={book.id}
                      freeRegensRemaining={freeRegensRemaining}
                      onRegenerate={onRefetch}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}

            {book.conclusion && (
              <AccordionItem value="section-conclusion" id="section-conclusion" className="glass rounded-[2.5rem] border-none scroll-mt-12 overflow-hidden">
                <AccordionTrigger className="px-8 md:px-10 py-6 hover:no-underline">
                  <h3 className="text-2xl font-heading font-bold text-foreground">
                    {t("conclusion")}
                  </h3>
                </AccordionTrigger>
                <AccordionContent className="px-8 md:px-10 pb-8">
                  <p className="text-muted-foreground text-lg leading-relaxed italic break-words whitespace-pre-line">
                    {book.conclusion}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            {book.finalConsiderations && (
              <AccordionItem value="section-final-considerations" id="section-final-considerations" className="glass rounded-[2.5rem] border-none scroll-mt-12 overflow-hidden">
                <AccordionTrigger className="px-8 md:px-10 py-6 hover:no-underline">
                  <h3 className="text-2xl font-heading font-bold text-foreground">
                    {t("finalConsiderations")}
                  </h3>
                </AccordionTrigger>
                <AccordionContent className="px-8 md:px-10 pb-8">
                  <p className="text-muted-foreground text-lg leading-relaxed break-words whitespace-pre-line">
                    {book.finalConsiderations}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            {book.glossary && (
              <AccordionItem value="section-glossary" id="section-glossary" className="glass rounded-[2.5rem] border-none scroll-mt-12 overflow-hidden">
                <AccordionTrigger className="px-8 md:px-10 py-6 hover:no-underline">
                  <h3 className="text-2xl font-heading font-bold text-foreground">
                    {t("glossary")}
                  </h3>
                </AccordionTrigger>
                <AccordionContent className="px-8 md:px-10 pb-8">
                  <div className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">
                    {book.glossary}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {book.appendix && (
              <AccordionItem value="section-appendix" id="section-appendix" className="glass rounded-[2.5rem] border-none scroll-mt-12 overflow-hidden">
                <AccordionTrigger className="px-8 md:px-10 py-6 hover:no-underline">
                  <h3 className="text-2xl font-heading font-bold text-foreground">
                    {t("appendix")}
                  </h3>
                </AccordionTrigger>
                <AccordionContent className="px-8 md:px-10 pb-8">
                  <p className="text-muted-foreground text-lg leading-relaxed break-words whitespace-pre-line">
                    {book.appendix}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            {book.closure && (
              <AccordionItem value="section-closure" id="section-closure" className="glass rounded-[2.5rem] border-none scroll-mt-12 overflow-hidden">
                <AccordionTrigger className="px-8 md:px-10 py-6 hover:no-underline">
                  <h3 className="text-2xl font-heading font-bold text-foreground">
                    {t("closure")}
                  </h3>
                </AccordionTrigger>
                <AccordionContent className="px-8 md:px-10 pb-8">
                  <p className="text-muted-foreground text-lg leading-relaxed italic break-words whitespace-pre-line">
                    {book.closure}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </div>
      --- end hidden TOC + Content blocks --- */}

      <ShareDialog book={book} open={shareOpen} onOpenChange={setShareOpen} onRefetch={onRefetch} translationId={translationId} />
    </div>
  );
}
