"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, Globe, Loader2, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { adminApi } from "@/lib/api/admin";
import { BookViewer } from "@/components/book/book-viewer";
import { SUPPORTED_LANGUAGES } from "@bestsellers/shared";
import type {
  TranslationDetail,
  BookDetail,
  ChapterDetail,
} from "@/lib/api/types";

function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

function buildTranslatedBookDetail(
  book: BookDetail,
  translation: TranslationDetail,
): BookDetail {
  const translatedCoverFile = book.files.find(
    (f) =>
      f.fileType === ("COVER_TRANSLATED" as string) &&
      f.fileName.includes(translation.targetLanguage),
  );

  const translatedChapterMap = new Map(
    translation.chapters.map((tc) => [tc.chapterId, tc]),
  );

  const chapters: ChapterDetail[] = book.chapters
    .sort((a, b) => a.sequence - b.sequence)
    .map((ch) => {
      const tc = translatedChapterMap.get(ch.id);
      if (!tc || !tc.translatedContent) return ch;
      return {
        ...ch,
        title: tc.translatedTitle || ch.title,
        content: tc.translatedContent,
        editedContent: null,
        topics: [],
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
    coverUrl: translatedCoverFile?.fileUrl ?? null,
    selectedCoverFileId: translatedCoverFile?.id ?? null,
    settings: book.settings
      ? { ...book.settings, language: translation.targetLanguage }
      : {
          tone: "professional",
          targetAudience: "",
          language: translation.targetLanguage,
          pageTarget: 150,
          chapterCount: chapters.length,
          includeExamples: false,
          includeCaseStudies: false,
        },
  };
}

export default function AdminTranslationViewerPage() {
  const { id, translationId } = useParams();
  const router = useRouter();
  const t = useTranslations("translations");
  const tAdmin = useTranslations("admin");

  const [translation, setTranslation] = useState<TranslationDetail | null>(
    null,
  );
  const [book, setBook] = useState<BookDetail | null>(null);
  const [bookUser, setBookUser] = useState<{
    email: string;
    name: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id || !translationId) return;
    try {
      const [trans, bookData] = await Promise.all([
        adminApi.getBookTranslation(id as string, translationId as string),
        adminApi.getBook(id as string),
      ]);
      setTranslation(trans);
      const { user, ...rest } = bookData;
      setBook(rest);
      setBookUser(user);
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
        <Button
          onClick={() => router.push(`/dashboard/admin/books/${id}`)}
          variant="outline"
        >
          {tAdmin("booksTitle")}
        </Button>
      </div>
    );
  }

  const virtualBook = buildTranslatedBookDetail(book, translation);

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          className="group text-muted-foreground hover:text-primary transition-colors"
          onClick={() => router.push(`/dashboard/admin/books/${id}`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {book.title}
        </Button>
        <div className="flex items-center gap-4">
          {bookUser && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
            </div>
          )}
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
      </div>

      <BookViewer
        book={virtualBook}
        onRefetch={fetchData}
        isTranslation
        translationId={translation.id}
      />
    </div>
  );
}
