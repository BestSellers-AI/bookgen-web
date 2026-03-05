"use client";

import { useState } from "react";
import {
  Pencil,
  RotateCw,
  Sparkles,
  Trash2,
  Calendar,
  User,
  Loader2,
} from "lucide-react";
import { booksApi } from "@/lib/api/books";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PlanningEditor } from "./planning-editor";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { BookDetail } from "@/lib/api/types";

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
  const t = useTranslations("book");
  const tErr = useTranslations("errors");

  const planning = book.planning;
  const hasPlanning = planning && planning.chapters && planning.chapters.length > 0;

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await booksApi.generatePreview(book.id);
      router.push(`/dashboard/create?regenerate=${book.id}`);
    } catch {
      toast.error(tErr("generateFailed"));
    } finally {
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
          <Button
            variant="outline"
            className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {isEditing ? t("cancelEdit") : t("editStructure")}
          </Button>

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

          <Button
            onClick={onApproveGenerate}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 border-none"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {t("approveGenerate")}
          </Button>

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
      {isEditing && planning ? (
        <PlanningEditor
          planning={planning}
          bookId={book.id}
          onSave={handleSavePlanning}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          {/* Introduction */}
          {book.introduction && (
            <div className="glass rounded-[2.5rem] p-10 space-y-4 break-words whitespace-normal">
              <h3 className="text-2xl font-heading font-bold text-foreground">
                {t("introduction")}
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {book.introduction}
              </p>
            </div>
          )}

          {/* Chapters */}
          {hasPlanning && (
            <div className="space-y-6">
              {planning!.chapters.map((chapter, i) => (
                <div
                  key={i}
                  className="glass rounded-[2rem] p-8 space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-heading font-black text-lg text-primary shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <h3 className="text-2xl font-heading font-bold text-foreground leading-tight">
                        {chapter.title}
                      </h3>
                      <ul className="space-y-2">
                        {chapter.topics?.map((topic, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-3 text-muted-foreground text-base leading-relaxed"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2.5 shrink-0" />
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Conclusion */}
          {(book.conclusion || planning?.conclusion) && (
            <div className="glass rounded-[2.5rem] p-10 space-y-4">
              <h3 className="text-2xl font-heading font-bold text-foreground">
                {t("conclusion")}
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed italic">
                {book.conclusion || planning?.conclusion}
              </p>
            </div>
          )}

          {/* Glossary */}
          {planning?.glossary && planning.glossary.length > 0 && (
            <div className="glass rounded-[2.5rem] p-10 space-y-6">
              <h3 className="text-2xl font-heading font-bold text-foreground">
                {t("glossary")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {planning.glossary.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-accent/30 border border-border text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
