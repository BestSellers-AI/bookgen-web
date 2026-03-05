"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Loader2,
  CheckCircle2,
  Circle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { booksApi } from "@/lib/api/books";
import { useBookEvents } from "@/hooks/use-book-events";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { BookDetail } from "@/lib/api/types";

type ChapterState = "pending" | "generating" | "generated" | "error";

interface GenerationProgressProps {
  book: BookDetail;
  onComplete: () => void;
}

export function GenerationProgress({ book, onComplete }: GenerationProgressProps) {
  const t = useTranslations("book");

  // Initialize chapter statuses from book data
  const [chapterStatuses, setChapterStatuses] = useState<Record<number, ChapterState>>(() => {
    const statuses: Record<number, ChapterState> = {};
    for (const ch of book.chapters) {
      statuses[ch.sequence] =
        ch.status === "GENERATED"
          ? "generated"
          : ch.status === "ERROR"
            ? "error"
            : ch.status === "GENERATING"
              ? "generating"
              : "pending";
    }
    return statuses;
  });

  const totalCount = book.chaptersCount || book.chapters.length;
  const completedCount = Object.values(chapterStatuses).filter(
    (s) => s === "generated",
  ).length;

  // Fallback poll timer
  const lastEventRef = useRef(Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleEvent = useCallback(
    (type: string, data: Record<string, unknown>) => {
      lastEventRef.current = Date.now();

      if (type === "generation_progress") {
        const status = data.status as string;
        const chapterSeq = data.chapterSequence as number | undefined;
        const currentChapter = data.currentChapter as number | undefined;

        if (status === "success" && chapterSeq) {
          setChapterStatuses((prev) => ({ ...prev, [chapterSeq]: "generated" }));
        } else if (status === "error" && chapterSeq) {
          setChapterStatuses((prev) => ({ ...prev, [chapterSeq]: "error" }));
        } else if (status === "generating" && currentChapter) {
          setChapterStatuses((prev) => ({ ...prev, [currentChapter]: "generating" }));
        } else if (status === "complete") {
          toast.success(t("generationComplete"));
          onComplete();
        }
      }
    },
    [onComplete, t],
  );

  useBookEvents(book.id, handleEvent);

  // Fallback polling: if no SSE event in 15s, poll book status
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      if (Date.now() - lastEventRef.current > 15000) {
        try {
          const updated = await booksApi.getById(book.id);
          if (updated.status === "GENERATED") {
            onComplete();
          } else {
            // Sync chapter statuses
            const statuses: Record<number, ChapterState> = {};
            for (const ch of updated.chapters) {
              statuses[ch.sequence] =
                ch.status === "GENERATED"
                  ? "generated"
                  : ch.status === "ERROR"
                    ? "error"
                    : ch.status === "GENERATING"
                      ? "generating"
                      : "pending";
            }
            setChapterStatuses(statuses);
          }
          lastEventRef.current = Date.now();
        } catch {
          // ignore
        }
      }
    }, 15000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [book.id, onComplete]);

  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-foreground">
            {book.title}
          </h1>
          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse text-xs font-bold uppercase tracking-widest">
            {t("generationInProgress")}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-3">
        <Progress value={progressPercent} className="h-3" />
        <p className="text-sm font-medium text-muted-foreground">
          {t("chaptersOf", { completed: completedCount, total: totalCount })}
        </p>
      </div>

      {/* Chapter list */}
      <div className="space-y-2">
        {book.chapters
          .sort((a, b) => a.sequence - b.sequence)
          .map((ch) => {
            const state = chapterStatuses[ch.sequence] || "pending";
            const isActive = state === "generating";

            return (
              <div
                key={ch.sequence}
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                  isActive ? "bg-orange-500/5 border border-orange-500/20" : "bg-accent/30 border border-transparent"
                }`}
              >
                {state === "pending" && (
                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                )}
                {state === "generating" && (
                  <Loader2 className="h-5 w-5 text-orange-400 animate-spin shrink-0" />
                )}
                {state === "generated" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                )}
                {state === "error" && (
                  <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                )}

                <span
                  className={`text-sm font-medium flex-1 ${
                    state === "generated"
                      ? "text-foreground"
                      : state === "generating"
                        ? "text-orange-400"
                        : state === "error"
                          ? "text-red-400"
                          : "text-muted-foreground"
                  }`}
                >
                  <span className="text-xs text-muted-foreground/60 mr-2">
                    {ch.sequence}.
                  </span>
                  {ch.title}
                </span>

                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {state === "pending" && t("chapterPending")}
                  {state === "generating" && t("chapterGenerating")}
                  {state === "generated" && t("chapterCompleted")}
                  {state === "error" && t("chapterFailed")}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
