"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { translationsApi } from "@/lib/api/translations";
import { booksApi } from "@/lib/api/books";
import { BookViewer } from "@/components/book/book-viewer";
import { SUPPORTED_LANGUAGES } from "@bestsellers/shared";
import type { TranslationDetail, BookDetail, ChapterDetail } from "@/lib/api/types";

function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

/**
 * Build a virtual BookDetail from translation + original book.
 * Replaces text content with translations, keeps images from original,
 * uses translated cover if available for the same language.
 */
function buildTranslatedBookDetail(
  book: BookDetail,
  translation: TranslationDetail,
): BookDetail {
  // Find translated cover for same language
  const translatedCoverFile = book.files.find(
    (f) =>
      f.fileType === ("COVER_TRANSLATED" as string) &&
      f.fileName.includes(translation.targetLanguage),
  );

  // Map translated chapters onto original chapters (preserving images, etc.)
  const translatedChapterMap = new Map(
    translation.chapters.map((tc) => [tc.chapterId, tc]),
  );

  const chapters: ChapterDetail[] = book.chapters
    .sort((a, b) => a.sequence - b.sequence)
    .map((ch) => {
      const tc = translatedChapterMap.get(ch.id);
      if (!tc || !tc.translatedContent) return ch; // fallback to original
      return {
        ...ch,
        title: tc.translatedTitle || ch.title,
        content: tc.translatedContent,
        editedContent: null,
        topics: [], // content is flat translated text
      };
    });

  return {
    ...book,
    title: translation.translatedTitle || book.title,
    subtitle: translation.translatedSubtitle || book.subtitle,
    introduction: translation.translatedIntroduction || book.introduction,
    conclusion: translation.translatedConclusion || book.conclusion,
    finalConsiderations:
      translation.translatedFinalConsiderations || book.finalConsiderations,
    glossary: translation.translatedGlossary || book.glossary,
    appendix: translation.translatedAppendix || book.appendix,
    closure: translation.translatedClosure || book.closure,
    chapters,
    // Use translated cover as selected cover if available
    coverUrl: translatedCoverFile?.fileUrl ?? book.coverUrl ?? null,
    selectedCoverFileId: translatedCoverFile?.id ?? book.selectedCoverFileId,
    // Override settings language for PDF labels
    settings: book.settings
      ? { ...book.settings, language: translation.targetLanguage }
      : { tone: "professional", targetAudience: "", language: translation.targetLanguage, pageTarget: 150, chapterCount: chapters.length, includeExamples: false, includeCaseStudies: false },
  };
}

export default function TranslatedBookViewerPage() {
  const { id, translationId } = useParams();
  const router = useRouter();
  const t = useTranslations("translations");

  const [translation, setTranslation] = useState<TranslationDetail | null>(
    null,
  );
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id || !translationId) return;
    try {
      const [trans, bookData] = await Promise.all([
        translationsApi.getById(id as string, translationId as string),
        booksApi.getById(id as string),
      ]);
      setTranslation(trans);
      setBook(bookData);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id, translationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!translation || !book) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Translation not found</p>
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const virtualBook = buildTranslatedBookDetail(book, translation);

  return (
    <div className="pb-20">
      {/* Back + language badge */}
      <div className="flex items-center justify-between mb-8">
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
        <Badge
          variant="secondary"
          className="bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest"
        >
          <Globe className="w-3 h-3 mr-1" />
          {t("translatedTo", {
            language: getLanguageName(translation.targetLanguage),
          })}
        </Badge>
      </div>

      <BookViewer
        book={virtualBook}
        onRefetch={fetchData}
        isTranslation
      />
    </div>
  );
}
