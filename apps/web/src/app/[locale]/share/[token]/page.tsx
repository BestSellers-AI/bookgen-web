"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BookOpen,
  User,
  Calendar,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/logo";
import { shareApi } from "@/lib/api/share";
import type { SharedBookPublicView } from "@/lib/api/types";


export default function SharedBookPage() {
  const params = useParams<{ token: string }>();
  const t = useTranslations("sharePage");

  const [book, setBook] = useState<SharedBookPublicView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);

  useEffect(() => {
    if (!params.token) return;
    shareApi
      .getPublic(params.token)
      .then((data) => {
        setBook(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border px-6 py-4">
          <Skeleton className="h-8 w-40" />
        </header>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">{t("notFound")}</h1>
          <p className="text-muted-foreground">{t("notFoundDesc")}</p>
          <Button asChild>
            <Link href="/">{t("goHome")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sortedChapters = [...book.chapters].sort(
    (a, b) => a.sequence - b.sequence
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <Button asChild size="sm" className="rounded-lg">
            <Link href="/auth/register">{t("createYourOwn")}</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Book Header */}
        <div className="space-y-4">
          {book.coverUrl && (
            <div className="w-48 h-64 rounded-2xl overflow-hidden shadow-2xl mx-auto mb-6">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-center">
            {book.title}
          </h1>
          {book.subtitle && (
            <p className="text-xl text-muted-foreground text-center italic">
              {book.subtitle}
            </p>
          )}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {book.author}
            </span>
            <span>
              {book.chapters.length} {t("chapters")}
            </span>
            {book.wordCount > 0 && (
              <span>
                {book.wordCount.toLocaleString()} {t("words")}
              </span>
            )}
            {book.pageCount > 0 && (
              <span>
                {book.pageCount} {t("pages")}
              </span>
            )}
          </div>
        </div>

        {/* Table of Contents */}
        <div className="glass rounded-[2rem] p-6 space-y-3">
          <h2 className="text-lg font-heading font-bold">{t("toc")}</h2>
          <nav className="space-y-1">
            {book.introduction && (
              <button
                onClick={() => {
                  setActiveChapter(-1);
                  document
                    .getElementById("section-introduction")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4 shrink-0" />
                {t("introduction")}
              </button>
            )}
            {sortedChapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  setActiveChapter(ch.sequence);
                  document
                    .getElementById(`section-chapter-${ch.sequence}`)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span className="font-mono text-xs text-primary mr-1">
                  {ch.sequence}.
                </span>
                {ch.title}
              </button>
            ))}
            {book.conclusion && (
              <button
                onClick={() =>
                  document
                    .getElementById("section-conclusion")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4 shrink-0" />
                {t("conclusion")}
              </button>
            )}
            {book.finalConsiderations && (
              <button
                onClick={() =>
                  document
                    .getElementById("section-final-considerations")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4 shrink-0" />
                {t("finalConsiderations")}
              </button>
            )}
            {book.glossary && (
              <button
                onClick={() =>
                  document
                    .getElementById("section-glossary")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4 shrink-0" />
                {t("glossary")}
              </button>
            )}
            {book.appendix && (
              <button
                onClick={() =>
                  document
                    .getElementById("section-appendix")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4 shrink-0" />
                {t("appendix")}
              </button>
            )}
            {book.closure && (
              <button
                onClick={() =>
                  document
                    .getElementById("section-closure")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4 shrink-0" />
                {t("closure")}
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <Accordion type="multiple" defaultValue={["section-introduction"]} className="space-y-4">
          {/* Introduction */}
          {book.introduction && (
            <AccordionItem value="section-introduction" id="section-introduction" className="glass rounded-[2rem] border-none scroll-mt-24 overflow-hidden">
              <AccordionTrigger className="px-8 py-6 hover:no-underline">
                <h3 className="text-2xl font-heading font-bold">
                  {t("introduction")}
                </h3>
              </AccordionTrigger>
              <AccordionContent className="px-8 pb-8">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {book.introduction}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Chapters */}
          {sortedChapters.map((chapter) => (
            <AccordionItem
              key={chapter.id}
              value={`section-chapter-${chapter.sequence}`}
              id={`section-chapter-${chapter.sequence}`}
              className="glass rounded-[2rem] border-none scroll-mt-24 overflow-hidden"
            >
              <AccordionTrigger className="px-8 py-6 hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-primary font-bold">
                    {t("chapterNum", { num: chapter.sequence })}
                  </span>
                  <h3 className="text-2xl font-heading font-bold text-left">
                    {chapter.title}
                  </h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-8 pb-8">
                {chapter.topics && chapter.topics.length > 0 && (
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
                )}
              </AccordionContent>
            </AccordionItem>
          ))}

          {/* Conclusion */}
          {book.conclusion && (
            <AccordionItem value="section-conclusion" id="section-conclusion" className="glass rounded-[2rem] border-none scroll-mt-24 overflow-hidden">
              <AccordionTrigger className="px-8 py-6 hover:no-underline">
                <h3 className="text-2xl font-heading font-bold">
                  {t("conclusion")}
                </h3>
              </AccordionTrigger>
              <AccordionContent className="px-8 pb-8">
                <div className="text-muted-foreground leading-relaxed italic whitespace-pre-line">
                  {book.conclusion}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Final Considerations */}
          {book.finalConsiderations && (
            <AccordionItem value="section-final-considerations" id="section-final-considerations" className="glass rounded-[2rem] border-none scroll-mt-24 overflow-hidden">
              <AccordionTrigger className="px-8 py-6 hover:no-underline">
                <h3 className="text-2xl font-heading font-bold">
                  {t("finalConsiderations")}
                </h3>
              </AccordionTrigger>
              <AccordionContent className="px-8 pb-8">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {book.finalConsiderations}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Glossary */}
          {book.glossary && (
            <AccordionItem value="section-glossary" id="section-glossary" className="glass rounded-[2rem] border-none scroll-mt-24 overflow-hidden">
              <AccordionTrigger className="px-8 py-6 hover:no-underline">
                <h3 className="text-2xl font-heading font-bold">
                  {t("glossary")}
                </h3>
              </AccordionTrigger>
              <AccordionContent className="px-8 pb-8">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {book.glossary}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Appendix */}
          {book.appendix && (
            <AccordionItem value="section-appendix" id="section-appendix" className="glass rounded-[2rem] border-none scroll-mt-24 overflow-hidden">
              <AccordionTrigger className="px-8 py-6 hover:no-underline">
                <h3 className="text-2xl font-heading font-bold">
                  {t("appendix")}
                </h3>
              </AccordionTrigger>
              <AccordionContent className="px-8 pb-8">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {book.appendix}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Closure */}
          {book.closure && (
            <AccordionItem value="section-closure" id="section-closure" className="glass rounded-[2rem] border-none scroll-mt-24 overflow-hidden">
              <AccordionTrigger className="px-8 py-6 hover:no-underline">
                <h3 className="text-2xl font-heading font-bold">
                  {t("closure")}
                </h3>
              </AccordionTrigger>
              <AccordionContent className="px-8 pb-8">
                <div className="text-muted-foreground leading-relaxed italic whitespace-pre-line">
                  {book.closure}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </main>

      {/* CTA Footer */}
      <footer className="border-t border-border bg-primary/5 py-12 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
          <div className="flex justify-center mb-4">
            <Logo size="sm" />
          </div>
          <h2 className="text-2xl font-heading font-bold">
            {t("ctaTitle")}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t("ctaDescription")}
          </p>
          <Button asChild size="lg" className="rounded-xl font-bold">
            <Link href="/auth/register">{t("ctaButton")}</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
