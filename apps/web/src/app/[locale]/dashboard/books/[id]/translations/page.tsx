"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Globe,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  Image as ImageIcon,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { translationsApi } from "@/lib/api/translations";
import { booksApi } from "@/lib/api/books";
import { SUPPORTED_LANGUAGES } from "@bestsellers/shared";
import type { BookTranslationSummary, BookDetail, BookFileSummary } from "@/lib/api/types";

function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

function getCoverLanguageCode(fileName: string): string {
  const match = fileName.match(/cover-translated-([^.]+)\./);
  return match ? match[1] : "unknown";
}

export default function TranslationsPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("translations");

  const [translations, setTranslations] = useState<BookTranslationSummary[]>([]);
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"translations" | "covers">(
    searchParams.get("tab") === "covers" ? "covers" : "translations"
  );
  const [expandedCover, setExpandedCover] = useState<BookFileSummary | null>(null);

  useEffect(() => {
    if (!id) return;
    const bookId = id as string;
    Promise.all([
      translationsApi.list(bookId),
      booksApi.getById(bookId),
    ])
      .then(([trans, bookData]) => {
        setTranslations(trans);
        setBook(bookData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Book not found</p>
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  // Cover translations from book files
  const coverTranslations = book.files.filter(
    (f) => f.fileType === "COVER_TRANSLATED"
  );

  // Find matching book translation for a cover's language
  const getMatchingTranslation = (langCode: string): BookTranslationSummary | undefined => {
    return translations.find(
      (tr) => tr.targetLanguage === langCode && tr.status === "TRANSLATED"
    );
  };

  return (
    <div className="pb-20">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          className="group text-muted-foreground hover:text-primary transition-colors"
          asChild
        >
          <Link href={`/dashboard/books/${book.id}`}>
            <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t("backToBook")}
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-heading font-bold mb-2">{t("title")}</h1>
      <p className="text-muted-foreground mb-8">
        {book.title}
      </p>

      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "translations" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => { setActiveTab("translations"); setExpandedCover(null); }}
        >
          <Globe className="w-4 h-4 mr-2" />
          {t("bookTranslations")}
        </Button>
        <Button
          variant={activeTab === "covers" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => { setActiveTab("covers"); setExpandedCover(null); }}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          {t("translatedCovers")}
        </Button>
      </div>

      {/* Book Translations Tab */}
      {activeTab === "translations" && (
        <div className="space-y-4">
          {translations.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center border border-border">
              <Globe className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{t("noTranslations")}</p>
            </div>
          ) : (
            translations.map((trans) => (
              <div
                key={trans.id}
                className="glass rounded-2xl p-5 border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">
                      {getLanguageName(trans.targetLanguage)}
                    </h3>
                    {trans.translatedTitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {trans.translatedTitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] font-black uppercase tracking-widest ${
                          trans.status === "TRANSLATED"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : trans.status === "ERROR"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {trans.status === "TRANSLATED" ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {trans.status === "TRANSLATED"
                          ? t("completed")
                          : trans.status === "TRANSLATING"
                            ? t("translating")
                            : trans.status}
                      </Badge>
                      {trans.status === "TRANSLATING" && (
                        <span className="text-[10px] text-muted-foreground">
                          {t("chapterProgress", {
                            completed: trans.completedChapters,
                            total: trans.totalChapters,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {trans.status === "TRANSLATED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs gap-1"
                    asChild
                  >
                    <Link href={`/dashboard/books/${book.id}/translations/${trans.id}`}>
                      <Eye className="w-3 h-3" />
                      {t("viewTranslatedBook")}
                    </Link>
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Translated Covers Tab */}
      {activeTab === "covers" && (
        <div className="space-y-4">
          {coverTranslations.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center border border-border">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{t("noCoverTranslations")}</p>
            </div>
          ) : expandedCover ? (
            /* ─── Expanded Cover Detail ─── */
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setExpandedCover(null)}
                className="text-xs font-bold text-primary flex items-center gap-1"
              >
                <ArrowRight className="w-3 h-3 rotate-180" />
                {t("backToGallery")}
              </button>

              <div className="flex justify-center">
                <img
                  src={expandedCover.fileUrl}
                  alt={expandedCover.fileName}
                  className="max-h-[50vh] w-auto rounded-xl border-2 border-border shadow-xl object-contain"
                />
              </div>

              <div className="flex flex-col items-center gap-3">
                <Badge
                  variant="secondary"
                  className="bg-cyan-500/10 text-cyan-400 text-xs font-bold"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  {getLanguageName(getCoverLanguageCode(expandedCover.fileName))}
                </Badge>

                {(() => {
                  const langCode = getCoverLanguageCode(expandedCover.fileName);
                  const matchingTrans = getMatchingTranslation(langCode);
                  if (matchingTrans) {
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs gap-2"
                        asChild
                      >
                        <Link href={`/dashboard/books/${book.id}/translations/${matchingTrans.id}`}>
                          <Eye className="w-3 h-3" />
                          {t("viewTranslatedBook")}
                        </Link>
                      </Button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ) : (
            /* ─── Cover Grid ─── */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {coverTranslations.map((file) => {
                const langCode = getCoverLanguageCode(file.fileName);

                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setExpandedCover(file)}
                    className="relative group rounded-2xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all aspect-[3/4] bg-muted text-left"
                  >
                    <img
                      src={file.fileUrl}
                      alt={file.fileName}
                      className="w-full h-full object-cover"
                    />

                    {/* Language badge */}
                    <div className="absolute top-2 left-2">
                      <Badge
                        variant="secondary"
                        className="bg-black/60 text-white text-[9px] font-bold backdrop-blur-sm border-none"
                      >
                        <Globe className="w-2.5 h-2.5 mr-1" />
                        {getLanguageName(langCode)}
                      </Badge>
                    </div>

                    {/* Tap hint overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                      <span className="text-white text-[10px] font-bold bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                        {t("tapToExpand")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
