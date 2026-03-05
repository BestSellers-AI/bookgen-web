"use client";

import { useTranslations } from "next-intl";
import type { BookDetail } from "@/lib/api/types";

interface BookTocProps {
  book: BookDetail;
  activeSection: string;
  mobile?: boolean;
}

export function BookToc({ book, activeSection, mobile }: BookTocProps) {
  const t = useTranslations("book");

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const items: Array<{ id: string; label: string }> = [];

  if (book.introduction) {
    items.push({ id: "section-introduction", label: t("introduction") });
  }

  for (const ch of book.chapters.sort((a, b) => a.sequence - b.sequence)) {
    items.push({
      id: `section-chapter-${ch.sequence}`,
      label: `${ch.sequence}. ${ch.title}`,
    });
  }

  if (book.conclusion) {
    items.push({ id: "section-conclusion", label: t("conclusion") });
  }

  if (book.glossary) {
    items.push({ id: "section-glossary", label: t("glossary") });
  }

  if (mobile) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/50 border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors whitespace-nowrap"
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <nav className="sticky top-6 space-y-1">
      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 px-3">
        {t("tableOfContents")}
      </h4>
      {items.map((item) => {
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors truncate ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
