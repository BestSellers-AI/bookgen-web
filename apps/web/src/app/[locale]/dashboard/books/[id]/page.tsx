"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Book as BookIcon,
  Loader2,
  Sparkles,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { booksApi } from "@/lib/api/books";
import type { BookDetail } from "@/lib/api/types";
import { useRouter } from "@/i18n/navigation";
import { useBookEvents } from "@/hooks/use-book-events";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PreviewViewer } from "@/components/book/preview-viewer";
import { CreditCheckDialog } from "@/components/book/credit-check-dialog";
import { GenerationProgress } from "@/components/book/generation-progress";
import { BookViewer } from "@/components/book/book-viewer";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function BookViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const t = useTranslations("book");
  const tErr = useTranslations("errors");

  const fetchBook = useCallback(async () => {
    if (!id) return;
    try {
      const data = await booksApi.getById(id as string);
      setBook(data);
      setError(null);
    } catch {
      setError(tErr("loadBookFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, tErr]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  // SSE for PREVIEW_GENERATING status
  const isPreviewGenerating = book?.status === "PREVIEW_GENERATING";
  const handlePreviewEvent = useCallback(
    (type: string, data: Record<string, unknown>) => {
      if (type === "preview_progress") {
        if (data.status === "ready") {
          fetchBook();
        } else if (data.status === "error") {
          fetchBook();
        }
      }
    },
    [fetchBook],
  );
  useBookEvents(isPreviewGenerating ? (id as string) : null, handlePreviewEvent);

  const handleDelete = async () => {
    if (!book) return;
    try {
      await booksApi.delete(book.id);
      router.push("/dashboard");
    } catch {
      toast.error(tErr("deleteFailed"));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <p className="text-xl font-medium text-muted-foreground">
          {error || t("bookNotFound")}
        </p>
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          {t("backToLibrary")}
        </Button>
      </div>
    );
  }

  // Status router
  const status = book.status;

  // DRAFT — redirect to create
  if (status === "DRAFT") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-center">
        <BookIcon size={48} className="text-primary/30" />
        <p className="text-lg text-muted-foreground">{t("statusDraft")}</p>
        <Button onClick={() => router.push("/dashboard/create")} variant="outline">
          {t("backToLibrary")}
        </Button>
      </div>
    );
  }

  // PREVIEW_GENERATING — SSE wait
  if (status === "PREVIEW_GENERATING") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-lg text-muted-foreground font-medium">
          {t("statusPreviewGenerating")}
        </p>
      </div>
    );
  }

  // PREVIEW / PREVIEW_APPROVED — preview viewer
  if (status === "PREVIEW" || status === "PREVIEW_APPROVED") {
    return (
      <div className="pb-20">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            className="group text-muted-foreground hover:text-primary transition-colors"
            onClick={() => router.push("/dashboard")}
          >
            <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t("backToLibrary")}
          </Button>
        </div>
        <PreviewViewer
          book={book}
          onRefetch={fetchBook}
          onApproveGenerate={() => setCreditDialogOpen(true)}
        />
        <CreditCheckDialog
          open={creditDialogOpen}
          onOpenChange={setCreditDialogOpen}
          bookId={book.id}
          bookTitle={book.title}
          onSuccess={fetchBook}
        />
      </div>
    );
  }

  // QUEUED / GENERATING — generation progress
  if (status === "QUEUED" || status === "GENERATING") {
    return (
      <div className="pb-20">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            className="group text-muted-foreground hover:text-primary transition-colors"
            onClick={() => router.push("/dashboard")}
          >
            <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t("backToLibrary")}
          </Button>
        </div>
        <GenerationProgress book={book} onComplete={fetchBook} />
      </div>
    );
  }

  // GENERATED — full book viewer
  if (status === "GENERATED") {
    return (
      <div className="pb-20">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            className="group text-muted-foreground hover:text-primary transition-colors"
            onClick={() => router.push("/dashboard")}
          >
            <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t("backToLibrary")}
          </Button>
        </div>
        <BookViewer book={book} onRefetch={fetchBook} />
      </div>
    );
  }

  // ERROR
  if (status === "ERROR") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-bold text-foreground">
            {t("statusError")}
          </h2>
          <p className="text-muted-foreground max-w-md">
            {t("contentUnavailable")}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchBook}>
            {t("errorRetry")}
          </Button>
          <ConfirmDialog
            title={t("deleteTitle")}
            description={`${t("deleteConfirm")} "${book.title}"? ${t("deleteWarning")}`}
            confirmLabel={t("yesDelete")}
            onConfirm={handleDelete}
            destructive
            trigger={
              <Button variant="outline" className="text-red-400 border-red-500/20">
                <Trash2 className="mr-2 h-4 w-4" />
                {t("errorDelete")}
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  // CANCELLED — redirect
  if (status === "CANCELLED") {
    router.push("/dashboard");
    return null;
  }

  // Fallback
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <p className="text-muted-foreground">{t("contentUnavailable")}</p>
      <Button onClick={() => router.push("/dashboard")} variant="outline">
        {t("backToLibrary")}
      </Button>
    </div>
  );
}
