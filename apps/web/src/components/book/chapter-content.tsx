"use client";

import { useState } from "react";
import { RotateCw, Loader2 } from "lucide-react";
import { booksApi } from "@/lib/api/books";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { ChapterDetail } from "@/lib/api/types";
import { sanitizeHtml } from "@/lib/sanitize";

interface ChapterContentProps {
  chapter: ChapterDetail;
  bookId: string;
  freeRegensRemaining: number;
  onRegenerate: () => void;
}

export function ChapterContent({
  chapter,
  bookId,
  freeRegensRemaining,
  onRegenerate,
}: ChapterContentProps) {
  const [regenerating, setRegenerating] = useState(false);
  const t = useTranslations("book");
  const tErr = useTranslations("errors");

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await booksApi.regenerateChapter(bookId, chapter.sequence);
      toast.success(t("regenerating"));
      onRegenerate();
    } catch (err: any) {
      if (err?.response?.status === 402) {
        toast.error(tErr("insufficientCredits"));
      } else {
        toast.error(tErr("generateFailed"));
      }
    } finally {
      setRegenerating(false);
    }
  };

  const regenLabel =
    freeRegensRemaining > 0
      ? t("freeRegenLeft", { count: freeRegensRemaining })
      : t("useCreditsRegen");

  return (
    <div className="glass rounded-[2.5rem] p-8 md:p-10 space-y-6 break-words whitespace-normal">
      <div className="flex items-start gap-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center font-heading font-black text-xl text-primary shrink-0 mt-1">
          {chapter.sequence}
        </div>
        <div className="flex-1 min-w-0 space-y-4">
          <h3 className="text-3xl font-heading font-bold text-foreground leading-tight break-words">
            {chapter.title}
          </h3>
          {chapter.content ? (
            <div
              className="prose prose-lg max-w-none text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(chapter.content.replace(/\n/g, "<br/>")),
              }}
            />
          ) : (
            <p className="text-muted-foreground italic">
              {t("contentUnavailable")}
            </p>
          )}
        </div>
      </div>

      {/* Regenerate */}
      <div className="flex justify-end pt-4 border-t border-border">
        <ConfirmDialog
          title={t("regenerateConfirmChapter")}
          description={regenLabel}
          confirmLabel={t("regenerateChapter")}
          onConfirm={handleRegenerate}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary text-xs"
              disabled={regenerating}
            >
              {regenerating ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <RotateCw className="mr-1.5 h-3 w-3" />
              )}
              {t("regenerateChapter")}
            </Button>
          }
        />
      </div>
    </div>
  );
}
