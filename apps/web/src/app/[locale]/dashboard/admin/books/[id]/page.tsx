"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Loader2,
  User,
  Mail,
  Globe,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import type { BookDetail, BookTranslationSummary } from "@/lib/api/types";
import { useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PreviewViewer } from "@/components/book/preview-viewer";
import { BookViewer } from "@/components/book/book-viewer";
import { GenerationProgress } from "@/components/book/generation-progress";
import { useTranslations } from "next-intl";
import { getStatusBadgeClass } from "@/lib/book-utils";
import { SUPPORTED_LANGUAGES } from "@bestsellers/shared";

function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

function getTranslationStatusIcon(status: string) {
  if (status === "TRANSLATED" || status === "COMPLETED") {
    return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  }
  if (status === "TRANSLATING") {
    return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
  }
  if (status === "ERROR") {
    return (
      <span className="text-xs text-red-400 font-black">!</span>
    );
  }
  return <Clock className="w-4 h-4 text-muted-foreground" />;
}

function getTranslationStatusBadgeClass(status: string) {
  if (status === "TRANSLATED" || status === "COMPLETED")
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (status === "TRANSLATING")
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (status === "ERROR")
    return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-muted text-muted-foreground";
}

export default function AdminBookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [bookUser, setBookUser] = useState<{
    email: string;
    name: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("book");
  const tAdmin = useTranslations("admin");
  const tStatus = useTranslations("statusLabels");
  const tErr = useTranslations("errors");
  const tTranslations = useTranslations("translations");

  const fetchBook = useCallback(async () => {
    if (!id) return;
    try {
      const data = await adminApi.getBook(id as string);
      const { user, ...bookData } = data;
      setBook(bookData);
      setBookUser(user);
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
        <Button
          onClick={() => router.push("/dashboard/admin/books")}
          variant="outline"
        >
          {tAdmin("booksTitle")}
        </Button>
      </div>
    );
  }

  const status = book.status;
  const translations = book.translations ?? [];

  const backButton = (
    <div className="flex items-center justify-between mb-8">
      <Button
        variant="ghost"
        className="group text-muted-foreground hover:text-primary transition-colors"
        onClick={() => router.push("/dashboard/admin/books")}
      >
        <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        {tAdmin("booksTitle")}
      </Button>
      {bookUser && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {bookUser.name && (
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {bookUser.name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {bookUser.email}
          </span>
          <Badge
            variant="secondary"
            className={`text-[9px] font-black uppercase ${getStatusBadgeClass(status)}`}
          >
            {tStatus.has(status) ? tStatus(status) : status}
          </Badge>
        </div>
      )}
    </div>
  );

  const translationsSection =
    translations.length > 0 ? (
      <div className="mt-10">
        <div className="flex items-center gap-2.5 mb-4">
          <Globe className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold">
            {tTranslations("title")}
          </h2>
          <Badge
            variant="secondary"
            className="text-[9px] font-bold bg-blue-500/10 text-blue-400 border-blue-500/20"
          >
            {translations.length}
          </Badge>
        </div>
        <div className="glass rounded-[2rem] overflow-hidden">
          <div className="divide-y divide-border">
            {translations.map((tr: BookTranslationSummary) => (
              <Link
                key={tr.id}
                href={`/dashboard/admin/books/${id}/translations/${tr.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getTranslationStatusIcon(tr.status)}
                  <div className="min-w-0">
                    <span className="font-semibold text-sm">
                      {getLanguageName(tr.targetLanguage)}
                    </span>
                    {tr.translatedTitle && (
                      <p className="text-xs text-muted-foreground truncate">
                        {tr.translatedTitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {tr.totalChapters > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {tr.completedChapters}/{tr.totalChapters}
                    </span>
                  )}
                  <Badge
                    variant="secondary"
                    className={`text-[9px] font-black uppercase ${getTranslationStatusBadgeClass(tr.status)}`}
                  >
                    {tStatus.has(tr.status) ? tStatus(tr.status) : tr.status}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    ) : null;

  // Preview states
  if (
    status === "PREVIEW" ||
    status === "PREVIEW_COMPLETED" ||
    status === "PREVIEW_APPROVED"
  ) {
    return (
      <div className="pb-20">
        {backButton}
        <PreviewViewer
          book={book}
          onRefetch={fetchBook}
          onApproveGenerate={() => {}}
        />
        {translationsSection}
      </div>
    );
  }

  // Generating states
  if (status === "QUEUED" || status === "GENERATING") {
    return (
      <div className="pb-20">
        {backButton}
        <GenerationProgress book={book} onComplete={fetchBook} />
        {translationsSection}
      </div>
    );
  }

  // Generated — full book viewer
  if (status === "GENERATED") {
    return (
      <div className="pb-20">
        {backButton}
        <BookViewer book={book} onRefetch={fetchBook} />
        {translationsSection}
      </div>
    );
  }

  // Fallback for other statuses (DRAFT, ERROR, CANCELLED, etc.)
  return (
    <div className="pb-20">
      {backButton}
      <div className="flex flex-col items-center justify-center h-[40vh] gap-4">
        <p className="text-muted-foreground">{t("contentUnavailable")}</p>
      </div>
      {translationsSection}
    </div>
  );
}
