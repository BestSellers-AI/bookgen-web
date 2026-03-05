"use client";

import { Book, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { getStatusBadgeClass } from "@/lib/book-utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { BookListItem } from "@/lib/api/types";

interface RecentBooksListProps {
  books: BookListItem[];
}

export function RecentBooksList({ books }: RecentBooksListProps) {
  const t = useTranslations("dashboard");

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
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Book className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                {book.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={`text-[9px] font-black uppercase tracking-widest px-2 rounded-md ${getStatusBadgeClass(book.status)}`}
                >
                  {book.status.replace(/_/g, " ")}
                </Badge>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock size={10} />
                  {new Date(book.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
