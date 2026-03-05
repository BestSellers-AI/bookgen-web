"use client";

import { Sparkles, Zap, CheckCircle2, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
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
    },
    {
      label: t("inPreview"),
      value: counts.preview,
      icon: Sparkles,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: t("generating"),
      value: counts.generating,
      icon: Zap,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
    },
    {
      label: t("ready"),
      value: counts.ready,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass rounded-[1.5rem] p-5 flex flex-col gap-3"
        >
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
        </div>
      ))}
    </div>
  );
}
