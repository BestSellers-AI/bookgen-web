"use client";

import { Book, ChevronRight, Clock, Palette, ImageIcon, Globe, Headphones, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { getStatusBadgeClass } from "@/lib/book-utils";

import { EmptyState } from "@/components/ui/empty-state";
import type { BookListItem } from "@/lib/api/types";

const ADDON_ICONS: Record<string, { icon: typeof Palette; color: string }> = {
  ADDON_COVER: { icon: Palette, color: "text-pink-400" },
  ADDON_IMAGES: { icon: ImageIcon, color: "text-indigo-400" },
  ADDON_TRANSLATION: { icon: Globe, color: "text-blue-400" },
  ADDON_COVER_TRANSLATION: { icon: Globe, color: "text-cyan-400" },
  ADDON_AUDIOBOOK: { icon: Headphones, color: "text-emerald-400" },
  ADDON_AMAZON_STANDARD: { icon: Package, color: "text-orange-400" },
  ADDON_AMAZON_PREMIUM: { icon: Package, color: "text-amber-400" },
};

interface RecentBooksListProps {
  books: BookListItem[];
}

export function RecentBooksList({ books }: RecentBooksListProps) {
  const t = useTranslations("dashboard");
  const tStatus = useTranslations("statusLabels");

  if (books.length === 0) {
    return (
      <EmptyState
        icon={Book}
        title={t("noBooks")}
        className="rounded-[2rem]"
      />
    );
  }

  return (
    <div className="glass rounded-[2rem] overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          {t("recentBooks")}
        </h3>
      </div>
      <div className="divide-y divide-border">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/dashboard/books/${book.id}`}
            className="flex items-center gap-4 px-6 py-4 hover:bg-accent/50 transition-colors group"
          >
            {book.coverUrl ? (
              <div className="w-10 h-14 rounded-lg overflow-hidden border border-border shrink-0">
                <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Book className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                {book.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={`text-[9px] font-black uppercase tracking-widest px-2 rounded-md ${getStatusBadgeClass(book.status)}`}
                >
                  {tStatus.has(book.status) ? tStatus(book.status) : book.status}
                </Badge>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock size={10} />
                  {new Date(book.createdAt).toLocaleDateString()}
                </span>
              </div>
              {book.addonKinds?.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {book.addonKinds.map((kind) => {
                    const config = ADDON_ICONS[kind];
                    if (!config) return null;
                    const Icon = config.icon;
                    return <Icon key={kind} className={`w-3 h-3 ${config.color}`} />;
                  })}
                </div>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
