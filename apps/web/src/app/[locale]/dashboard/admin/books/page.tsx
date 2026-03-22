"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Globe, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { adminApi, type AdminBookSummary } from "@/lib/api/admin";
import { useDebounce } from "@/hooks/use-debounce";
import type { PaginationMeta } from "@/lib/api/types";
import { PageHeader } from "@/components/ui/page-header";
import { getStatusBadgeClass } from "@/lib/book-utils";

export default function AdminBooksPage() {
  const t = useTranslations("admin");
  const tStatus = useTranslations("statusLabels");
  const [books, setBooks] = useState<AdminBookSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listBooks({
        page,
        perPage: 20,
        search: debouncedSearch || undefined,
      });
      setBooks(res.data);
      setMeta(res.meta);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader title={t("booksTitle")} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchBooks")}
          className="pl-10 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="glass rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("bookTitle")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("author")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("status")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    <Globe className="w-4 h-4 inline" />
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    <Mail className="w-4 h-4 inline" />
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("user")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("created")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr
                    key={book.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">
                      <Link
                        href={`/dashboard/admin/books/${book.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {book.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {book.author}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] font-black uppercase ${getStatusBadgeClass(book.status)}`}
                      >
                        {tStatus.has(book.status) ? tStatus(book.status) : book.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground text-xs">
                      {book.translationsCount > 0 ? (
                        <Badge variant="secondary" className="text-[9px] font-bold bg-blue-500/10 text-blue-400 border-blue-500/20">
                          {book.translationsCount}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-xs">
                      {book.recoveryEmailsSent > 0 ? (
                        <Badge variant="secondary" className={`text-[9px] font-bold ${
                          book.recoveryEmailsSent >= 3
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {book.recoveryEmailsSent}/3
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {book.userEmail}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(book.createdAt).toLocaleDateString()}{" "}
                      {new Date(book.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}
