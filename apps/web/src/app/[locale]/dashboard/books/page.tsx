"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  Palette,
  ImageIcon,
  Globe,
  Headphones,
  Package,
  ChevronDown,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@bestsellers/shared";
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
  DRAFTS_AND_PREVIEWS: "filterDraftsAndPreviews",
  DRAFT: "filterDraft",
  PREVIEW_GENERATING: "filterPreviewGenerating",
  PREVIEW: "filterPreview",
  PREVIEW_COMPLETING: "filterPreviewCompleting",
  PREVIEW_COMPLETED: "filterPreviewCompleted",
  PREVIEW_APPROVED: "filterPreviewApproved",
  QUEUED: "filterQueued",
  GENERATING: "filterGenerating",
  GENERATED: "filterReady",
  ERROR: "filterError",
  CANCELLED: "filterCancelled",
};

const STATUS_FILTER_VALUES: Record<string, string | undefined> = {
  ALL: undefined,
  DRAFTS_AND_PREVIEWS: "DRAFT,PREVIEW_GENERATING,PREVIEW,PREVIEW_COMPLETING,PREVIEW_COMPLETED,PREVIEW_APPROVED",
  DRAFT: "DRAFT",
  PREVIEW_GENERATING: "PREVIEW_GENERATING",
  PREVIEW: "PREVIEW",
  PREVIEW_COMPLETING: "PREVIEW_COMPLETING",
  PREVIEW_COMPLETED: "PREVIEW_COMPLETED",
  PREVIEW_APPROVED: "PREVIEW_APPROVED",
  QUEUED: "QUEUED",
  GENERATING: "GENERATING",
  GENERATED: "GENERATED",
  ERROR: "ERROR",
  CANCELLED: "CANCELLED",
};

export default function BooksListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") ?? "ALL";
  const [books, setBooks] = useState<BookListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    Object.keys(STATUS_FILTER_VALUES).includes(initialFilter) ? initialFilter : "ALL"
  );
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
        if (STATUS_FILTER_VALUES[statusFilter]) params.status = STATUS_FILTER_VALUES[statusFilter] as any;

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
                  {book.isPublished && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest h-6 px-3 rounded-full">
                      {t("published")}
                    </Badge>
                  )}

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

                <div className="flex items-start gap-3">
                  {book.coverUrl && (
                    <div className="w-12 h-16 rounded-lg overflow-hidden border border-border shrink-0">
                      <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                    {book.subtitle && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {book.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">{book.author}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(book.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {book.addonKinds?.length > 0 && (() => {
                  const ADDON_ICON_ORDER: { kind: string; icon: typeof Palette; color: string }[] = [
                    { kind: "ADDON_COVER", icon: Palette, color: "text-pink-400" },
                    { kind: "ADDON_IMAGES", icon: ImageIcon, color: "text-indigo-400" },
                    { kind: "ADDON_TRANSLATION", icon: Globe, color: "text-blue-400" },
                    { kind: "ADDON_COVER_TRANSLATION", icon: Globe, color: "text-cyan-400" },
                    { kind: "ADDON_AMAZON_STANDARD", icon: Package, color: "text-orange-400" },
                    { kind: "ADDON_AMAZON_PREMIUM", icon: Package, color: "text-amber-400" },
                    { kind: "ADDON_AUDIOBOOK", icon: Headphones, color: "text-emerald-400" },
                  ];
                  const items = ADDON_ICON_ORDER.filter((a) => book.addonKinds.includes(a.kind));
                  if (items.length === 0) return null;
                  return (
                    <div className="flex items-center gap-1.5">
                      {items.map((a) => {
                        const Icon = a.icon;
                        return <Icon key={a.kind} className={`w-3.5 h-3.5 ${a.color}`} />;
                      })}
                    </div>
                  );
                })()}
                {book.translations?.length > 0 && (
                  <TranslationsCollapsible bookId={book.id} translations={book.translations} t={t} tStatus={tStatus} />
                )}
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

const TRANSLATION_ADDON_ICONS: { kind: string; icon: typeof Palette; color: string }[] = [
  { kind: "ADDON_COVER_TRANSLATION", icon: Palette, color: "text-cyan-400" },
  { kind: "ADDON_AUDIOBOOK", icon: Headphones, color: "text-emerald-400" },
  { kind: "ADDON_AMAZON_STANDARD", icon: Package, color: "text-orange-400" },
  { kind: "ADDON_AMAZON_PREMIUM", icon: Package, color: "text-amber-400" },
];

function TranslationsCollapsible({
  bookId,
  translations,
  t,
  tStatus,
}: {
  bookId: string;
  translations: { id: string; targetLanguage: string; translatedTitle: string | null; status: string; addonKinds: string[]; isPublished: boolean }[];
  t: ReturnType<typeof useTranslations>;
  tStatus: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const getLangName = (code: string) =>
    SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name ?? code;

  return (
    <div className="border-t border-border pt-2 mt-1">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Globe className="w-3 h-3" />
        {t("viewTranslations", { count: translations.length })}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-1">
          {translations.map((tr) => (
            <button
              key={tr.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/books/${bookId}/translations/${tr.id}`);
              }}
              className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold">{getLangName(tr.targetLanguage)}</span>
                {tr.translatedTitle && (
                  <span className="text-[11px] text-muted-foreground truncate">{tr.translatedTitle}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {TRANSLATION_ADDON_ICONS.filter((a) => tr.addonKinds.includes(a.kind)).map((a) => {
                  const Icon = a.icon;
                  return <Icon key={a.kind} className={`w-3 h-3 ${a.color}`} />;
                })}
                {tr.isPublished && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] font-black px-1.5 rounded-md">
                    ✓
                  </Badge>
                )}
                {tr.status === "TRANSLATED" || tr.status === "COMPLETED" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : tr.status === "TRANSLATING" ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                ) : tr.status === "ERROR" ? (
                  <span className="text-[9px] text-red-400 font-bold">!</span>
                ) : (
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
