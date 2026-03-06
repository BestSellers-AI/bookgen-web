"use client";

import { useState } from "react";
import { RotateCw, Loader2 } from "lucide-react";
import { booksApi } from "@/lib/api/books";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { ChapterDetail } from "@/lib/api/types";


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
    <div className="space-y-6 break-words whitespace-normal">
      {chapter.topics && chapter.topics.length > 0 ? (
        <ul className="space-y-3">
          {chapter.topics.map((topic, j) => (
            <li key={j} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2.5 shrink-0" />
              <div className="space-y-1">
                <span className="font-semibold text-foreground">{topic.title}</span>
                <p className="text-muted-foreground text-sm leading-relaxed">{topic.content}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground italic">
          {t("contentUnavailable")}
        </p>
      )}

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
