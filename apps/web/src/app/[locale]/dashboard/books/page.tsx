"use client";

import { useEffect, useState } from "react";
import {
  Search,
  PlusCircle,
  Book,
  MoreVertical,
  ArrowUpDown,
  Calendar,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react";
import { booksApi, type BookQueryParams } from "@/lib/api/books";
import type { BookListItem, PaginationMeta } from "@/lib/api/types";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { getStatusBadgeClass } from "@/lib/book-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { BookStatus } from "@bestsellers/shared";

const STATUS_LABEL_MAP: Record<string, string> = {
  ALL: "filterAll",
  PREVIEW: "filterPreview",
  GENERATING: "filterGenerating",
  GENERATED: "filterReady",
  ERROR: "filterError",
};

const STATUS_FILTER_MAP: Record<string, BookStatus | undefined> = {
  ALL: undefined,
  PREVIEW: "PREVIEW" as BookStatus,
  GENERATING: "GENERATING" as BookStatus,
  GENERATED: "GENERATED" as BookStatus,
  ERROR: "ERROR" as BookStatus,
};

export default function BooksListPage() {
  const router = useRouter();
  const [books, setBooks] = useState<BookListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"createdAt" | "title" | "updatedAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const t = useTranslations("books");
  const tErr = useTranslations("errors");
  const tCommon = useTranslations("common");

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const params: BookQueryParams = {
          page,
          perPage: 12,
          sortBy,
          sortOrder,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (STATUS_FILTER_MAP[statusFilter]) params.status = STATUS_FILTER_MAP[statusFilter];

        const res = await booksApi.list(params);
        setBooks(res.data);
        setMeta(res.meta);
      } catch {
        toast.error(tErr("generic"));
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [page, debouncedSearch, statusFilter, sortBy, sortOrder, tErr]);

  const handleDelete = async (id: string) => {
    try {
      await booksApi.delete(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(tErr("deleteFailed"));
    }
    setDeleteId(null);
  };

  const tStatus = useTranslations("statusLabels");

  const getStatusLabel = (status: string) => {
    return tStatus.has(status) ? tStatus(status) : status;
  };

  const canDelete = (status: string) =>
    ["DRAFT", "PREVIEW", "PREVIEW_APPROVED", "ERROR"].includes(status);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="relative rounded-xl p-[2px] overflow-hidden w-full sm:w-auto">
          <div
            className="absolute top-1/2 left-1/2 w-[200%] aspect-square animate-border-spin"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, transparent 60%, #f4eee6 75%, #ffffff 85%, #f4eee6 95%, transparent 100%)",
            }}
          />
          <Button asChild className="relative w-full sm:w-auto rounded-[calc(0.75rem-2px)] font-bold gap-2 glow-primary">
            <Link href="/dashboard/create">
              <PlusCircle className="w-4 h-4" />
              {t("createBook")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-accent/50 border-border"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-11 rounded-xl bg-accent/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(STATUS_LABEL_MAP).map((key) => (
              <SelectItem key={key} value={key}>
                {t(STATUS_LABEL_MAP[key] as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[150px] h-11 rounded-xl bg-accent/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">{t("sortCreated")}</SelectItem>
            <SelectItem value="title">{t("sortTitle")}</SelectItem>
            <SelectItem value="updatedAt">{t("sortUpdated")}</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-xl border-border"
          onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-[2rem] p-6 space-y-4">
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          icon={Book}
          title={debouncedSearch || statusFilter !== "ALL" ? t("noResults") : t("title")}
          description={
            debouncedSearch || statusFilter !== "ALL"
              ? t("noResultsDesc")
              : undefined
          }
          action={
            !debouncedSearch && statusFilter === "ALL" ? (
              <Button asChild className="rounded-xl font-bold gap-2">
                <Link href="/dashboard/create">
                  <PlusCircle className="w-4 h-4" />
                  {t("createBook")}
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="group glass rounded-[2rem] p-6 space-y-4 border border-border hover:border-primary/30 transition-all cursor-pointer relative"
                onClick={() => router.push(`/dashboard/books/${book.id}`)}
              >
                <div className="flex items-start justify-between">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-black uppercase tracking-widest h-6 px-3 rounded-full ${getStatusBadgeClass(book.status)}`}
                  >
                    {getStatusLabel(book.status)}
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/books/${book.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t("view")}
                      </DropdownMenuItem>
                      {canDelete(book.status) && (
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400"
                          onClick={() => setDeleteId(book.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("deleteBook")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>
                  {book.subtitle && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {book.subtitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">{book.author}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(book.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteConfirm")}
        description={t("deleteConfirmDesc")}
        confirmLabel={tCommon("delete")}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        destructive
      />
    </div>
  );
}
