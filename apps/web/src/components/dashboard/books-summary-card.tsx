"use client";

import { Sparkles, Zap, CheckCircle2, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BookListItem } from "@/lib/api/types";
import { DASHBOARD_TAB_STATUSES } from "@/lib/book-utils";

interface BooksSummaryCardProps {
  books: BookListItem[];
}

export function BooksSummaryCard({ books }: BooksSummaryCardProps) {
  const t = useTranslations("dashboard");

  const counts = {
    total: books.length,
    preview: books.filter((b) =>
      DASHBOARD_TAB_STATUSES.preview.includes(b.status)
    ).length,
    generating: books.filter((b) =>
      DASHBOARD_TAB_STATUSES.generating.includes(b.status)
    ).length,
    ready: books.filter((b) =>
      DASHBOARD_TAB_STATUSES.ready.includes(b.status)
    ).length,
  };

  const stats = [
    {
      label: t("totalBooks"),
      value: counts.total,
      icon: BookOpen,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      filter: "ALL",
    },
    {
      label: t("draftsAndPreviews"),
      value: counts.preview,
      icon: Sparkles,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      filter: "DRAFTS_AND_PREVIEWS",
    },
    {
      label: t("generating"),
      value: counts.generating,
      icon: Zap,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      filter: "GENERATING",
    },
    {
      label: t("ready"),
      value: counts.ready,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      filter: "GENERATED",
    },
  ];

  const cardContent = (stat: typeof stats[number]) => (
    <>
      <div
        className={`w-10 h-10 rounded-xl ${stat.bg} border flex items-center justify-center`}
      >
        <stat.icon className={`w-5 h-5 ${stat.color}`} />
      </div>
      <div>
        <div className="text-2xl font-black text-foreground">
          {stat.value}
        </div>
        <div className="text-xs font-medium text-muted-foreground">
          {stat.label}
        </div>
      </div>
    </>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const href = `/dashboard/books${stat.filter !== "ALL" ? `?filter=${stat.filter}` : ""}`;
        const isPreview = stat === stats[1];
        const isGenerating = stat === stats[2] && stat.value > 0;

        if (isPreview) {
          return (
            <Link key={stat.label} href={href} className="relative rounded-[1.5rem] p-[2px] overflow-hidden hover:opacity-90 transition-opacity">
              <div
                className="absolute top-1/2 left-1/2 w-[200%] aspect-square animate-border-spin"
                style={{
                  background: "conic-gradient(from 0deg, transparent 0%, transparent 60%, #f59e0b 75%, #fbbf24 85%, #f59e0b 95%, transparent 100%)",
                }}
              />
              <div className="relative glass rounded-[calc(1.5rem-2px)] p-5 flex flex-col gap-3" style={{ background: "color-mix(in srgb, var(--card), transparent 5%)" }}>
                {cardContent(stat)}
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={stat.label}
            href={href}
            className={`glass rounded-[1.5rem] p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors ${isGenerating ? "animate-pulse" : ""}`}
          >
            {cardContent(stat)}
          </Link>
        );
      })}
    </div>
  );
}
