"use client";

import { useState } from "react";
import {
  CheckCircle,
  Pencil,
  RotateCw,
  Sparkles,
  Trash2,
  Calendar,
  User,
  Loader2,
  FileDown,
  FileText,
  BookOpen,
} from "lucide-react";
import { booksApi } from "@/lib/api/books";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PlanningEditor } from "./planning-editor";
import { BookPdfViewerDynamic } from "./book-pdf-viewer-dynamic";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { BookDetail, BookFileSummary } from "@/lib/api/types";

interface PreviewViewerProps {
  book: BookDetail;
  onRefetch: () => void;
  onApproveGenerate: () => void;
}

export function PreviewViewer({ book, onRefetch, onApproveGenerate }: PreviewViewerProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [approvingStructure, setApprovingStructure] = useState(false);
  const [viewMode, setViewMode] = useState<"kdp" | "original">("kdp");
  const t = useTranslations("book");
  const tErr = useTranslations("errors");

  const isStructureOnly = book.status === "PREVIEW";
  const isCompletePreview = book.status === "PREVIEW_COMPLETED" || book.status === "PREVIEW_APPROVED";

  const planning = book.planning;
  const previewPdf = book.files.find((f: BookFileSummary) => f.fileType === "PREVIEW_PDF");
  const previewDocx = book.files.find((f: BookFileSummary) => f.fileType === "DOCX");
  const previewEpub = book.files.find((f: BookFileSummary) => f.fileType === "EPUB");
  const hasPlanning = planning && planning.chapters && planning.chapters.length > 0;

  const handleApproveStructure = async () => {
    setApprovingStructure(true);
    try {
      await booksApi.approve(book.id);
      toast.success(t("structureApproved"));
      onRefetch();
    } catch {
      toast.error(tErr("approveStructureFailed"));
    } finally {
      setApprovingStructure(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await booksApi.generatePreview(book.id);
      onRefetch();
    } catch {
      toast.error(tErr("generateFailed"));
      setRegenerating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await booksApi.delete(book.id);
      router.push("/dashboard");
    } catch {
      toast.error(tErr("deleteFailed"));
      setDeleting(false);
    }
  };

  const handleSavePlanning = () => {
    setIsEditing(false);
    onRefetch();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <header className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="text-[10px] font-black uppercase tracking-widest h-6 px-3 rounded-full bg-amber-500/10 text-amber-400 border-amber-500/20"
            >
              {t("preview")}
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

        <div className="flex items-center gap-3 py-4 border-y border-border">
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

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {/* Downloads — only for complete preview */}
          {isCompletePreview && previewPdf && (
            <Button
              variant="outline"
              className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
              asChild
            >
              <a href={previewPdf.fileUrl} target="_blank" rel="noopener noreferrer">
                <FileDown className="mr-2 h-4 w-4" />
                {t("downloadPreviewPdf")}
              </a>
            </Button>
          )}

          {isCompletePreview && previewDocx && (
            <Button
              variant="outline"
              className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
              asChild
            >
              <a href={previewDocx.fileUrl} target="_blank" rel="noopener noreferrer">
                <FileDown className="mr-2 h-4 w-4" />
                {t("downloadDocx")}
              </a>
            </Button>
          )}

          {isCompletePreview && previewEpub && (
            <Button
              variant="outline"
              className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
              asChild
            >
              <a href={previewEpub.fileUrl} target="_blank" rel="noopener noreferrer">
                <FileDown className="mr-2 h-4 w-4" />
                {t("downloadEpub")}
              </a>
            </Button>
          )}

          {/* Edit Structure — only for structure-only preview */}
          {isStructureOnly && (
            <Button
              variant="outline"
              className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {isEditing ? t("cancelEdit") : t("editStructure")}
            </Button>
          )}

          {/* Regenerate preview — hidden for now, uncomment to re-enable
          <ConfirmDialog
            title={t("regeneratePreview")}
            description={t("regenerateConfirmDesc")}
            confirmLabel={t("regeneratePreview")}
            onConfirm={handleRegenerate}
            trigger={
              <Button
                variant="outline"
                className="rounded-xl border-border"
                disabled={regenerating}
              >
                {regenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCw className="mr-2 h-4 w-4" />
                )}
                {t("regeneratePreview")}
              </Button>
            }
          />
          */}

          {/* Approve Structure — only for structure-only preview */}
          {isStructureOnly && (
            <Button
              onClick={handleApproveStructure}
              disabled={approvingStructure}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 border-none"
            >
              {approvingStructure ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {t("approveStructure")}
            </Button>
          )}

          {/* Approve & Generate — only for complete preview */}
          {isCompletePreview && (
            <Button
              onClick={onApproveGenerate}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 border-none"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {t("approveGenerate")}
            </Button>
          )}

          <ConfirmDialog
            title={t("deleteTitle")}
            description={`${t("deleteConfirm")} "${book.title}"? ${t("deleteWarning")}`}
            confirmLabel={t("yesDelete")}
            onConfirm={handleDelete}
            destructive
            trigger={
              <Button
                variant="outline"
                className="rounded-xl border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {t("discardBook")}
              </Button>
            }
          />
        </div>
      </header>

      {/* Planning Editor or Viewer */}
      {isEditing && planning && isStructureOnly ? (
        <PlanningEditor
          planning={planning}
          bookId={book.id}
          bookTitle={book.title}
          bookSubtitle={book.subtitle ?? ''}
          bookAuthor={book.author ?? ''}
          onSave={handleSavePlanning}
          onCancel={() => setIsEditing(false)}
        />
      ) : isCompletePreview ? (
        /* PDF viewer for complete preview — KDP or original */
        <div className="space-y-4">
          {previewPdf && (
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
          ) : previewPdf ? (
            <div className="glass rounded-[2.5rem] border-none overflow-hidden p-2">
              <iframe
                src={previewPdf.fileUrl}
                title={book.title}
                className="w-full rounded-[2rem]"
                style={{ height: "80vh", minHeight: "600px" }}
              />
            </div>
          ) : (
            <div className="glass rounded-[2.5rem] border-none overflow-hidden p-2">
              <BookPdfViewerDynamic
                book={book}
                className="w-full rounded-[2rem]"
                style={{ height: "80vh", minHeight: "600px" }}
              />
            </div>
          )}
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={isCompletePreview && book.introduction ? ["section-introduction"] : []} className="space-y-4">
          {/* Introduction — only for complete preview */}
          {isCompletePreview && book.introduction && (
            <AccordionItem value="section-introduction" className="glass rounded-[2.5rem] border-none overflow-hidden">
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

          {/* Chapters — always shown */}
          {hasPlanning && planning!.chapters.map((chapter, i) => (
            <AccordionItem key={i} value={`section-chapter-${i + 1}`} className="glass rounded-[2rem] border-none overflow-hidden">
              <AccordionTrigger className="px-8 py-6 hover:no-underline">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-heading font-black text-lg text-primary shrink-0">
                    {i + 1}
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-foreground text-left leading-tight">
                    {chapter.title}
                  </h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-8 pb-8">
                <ul className="space-y-3">
                  {chapter.topics?.map((topic, j) => (
                    <li key={j} className="flex items-start gap-3 text-base leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2.5 shrink-0" />
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground">{topic.title}</span>
                        <p className="text-muted-foreground text-sm leading-relaxed">{topic.content}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}

          {/* Conclusion — only for complete preview */}
          {isCompletePreview && (book.conclusion || planning?.conclusion) && (
            <AccordionItem value="section-conclusion" className="glass rounded-[2.5rem] border-none overflow-hidden">
              <AccordionTrigger className="px-8 md:px-10 py-6 hover:no-underline">
                <h3 className="text-2xl font-heading font-bold text-foreground">
                  {t("conclusion")}
                </h3>
              </AccordionTrigger>
              <AccordionContent className="px-8 md:px-10 pb-8">
                <p className="text-muted-foreground text-lg leading-relaxed italic break-words whitespace-pre-line">
                  {book.conclusion || planning?.conclusion}
                </p>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Glossary — only for complete preview */}
          {isCompletePreview && (book.glossary || (planning?.glossary && planning.glossary.length > 0)) && (
            <AccordionItem value="section-glossary" className="glass rounded-[2.5rem] border-none overflow-hidden">
              <AccordionTrigger className="px-8 md:px-10 py-6 hover:no-underline">
                <h3 className="text-2xl font-heading font-bold text-foreground">
                  {t("glossary")}
                </h3>
              </AccordionTrigger>
              <AccordionContent className="px-8 md:px-10 pb-8">
                {book.glossary ? (
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {book.glossary}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(planning?.glossary ?? []).map((item, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-accent/30 border border-border text-muted-foreground"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Final Considerations — only for complete preview */}
          {isCompletePreview && book.finalConsiderations && (
            <AccordionItem value="section-final-considerations" className="glass rounded-[2.5rem] border-none overflow-hidden">
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

          {/* Appendix — only for complete preview */}
          {isCompletePreview && book.appendix && (
            <AccordionItem value="section-appendix" className="glass rounded-[2.5rem] border-none overflow-hidden">
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

          {/* Closure — only for complete preview */}
          {isCompletePreview && book.closure && (
            <AccordionItem value="section-closure" className="glass rounded-[2.5rem] border-none overflow-hidden">
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
      )}
    </div>
  );
}
