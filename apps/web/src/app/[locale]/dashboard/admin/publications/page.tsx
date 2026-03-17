"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, BookCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { publishingApi } from "@/lib/api/publishing";
import { useDebounce } from "@/hooks/use-debounce";
import type { PaginationMeta, AdminPublishingDetail } from "@/lib/api/types";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StatusFilter = "all" | "requested" | "in_progress" | "completed";

const STATUS_FILTER_MAP: Record<StatusFilter, string | undefined> = {
  all: undefined,
  requested: "PREPARING,READY",
  in_progress: "REVIEW,SUBMITTED",
  completed: "PUBLISHED",
};

export default function AdminPublicationsPage() {
  const t = useTranslations("admin");
  const tStatus = useTranslations("publishingStatus");
  const [publications, setPublications] = useState<AdminPublishingDetail[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const debouncedSearch = useDebounce(search, 300);

  const fetchPublications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await publishingApi.list({
        page,
        perPage: 20,
        search: debouncedSearch || undefined,
        status: STATUS_FILTER_MAP[statusFilter],
      });
      setPublications(res.data);
      setMeta(res.meta);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-500/10 text-emerald-400";
      case "REVIEW":
      case "SUBMITTED":
        return "bg-amber-500/10 text-amber-400";
      case "REJECTED":
      case "CANCELLED":
        return "bg-red-500/10 text-red-400";
      default:
        return "bg-blue-500/10 text-blue-400";
    }
  };

  const getAddonTypeLabel = (kind: string) => {
    if (kind === "ADDON_AMAZON_PREMIUM") return t("typePremium");
    return t("typeStandard");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader title={t("publications")} subtitle={t("publicationsSubtitle")} />

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">{t("filterAll")}</TabsTrigger>
          <TabsTrigger value="requested">{t("filterRequested")}</TabsTrigger>
          <TabsTrigger value="in_progress">{t("filterInProgress")}</TabsTrigger>
          <TabsTrigger value="completed">{t("filterCompleted")}</TabsTrigger>
        </TabsList>
      </Tabs>

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
      ) : publications.length === 0 ? (
        <div className="glass rounded-[2rem] p-12 text-center">
          <BookCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{t("noPublications")}</p>
        </div>
      ) : (
        <div className="glass rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("bookTitle")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("author")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("user")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("addonType")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("status")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("date")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {publications.map((pub) => (
                  <tr
                    key={pub.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium max-w-[200px] truncate">
                      {pub.book.title}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {pub.book.author}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {pub.user.email}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="text-[9px] font-black uppercase">
                        {getAddonTypeLabel(pub.addon.kind)}
                      </Badge>
                      {pub.translation && (
                        <Badge variant="secondary" className="ml-1 text-[9px] bg-blue-500/10 text-blue-400">
                          {pub.translation.targetLanguage}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] font-black uppercase ${getStatusColor(pub.status)}`}
                      >
                        {tStatus.has(pub.status as "PREPARING") ? tStatus(pub.status as "PREPARING") : pub.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(pub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm" className="rounded-xl text-xs" asChild>
                        <Link href={`/dashboard/admin/publications/${pub.id}`}>
                          {t("view")}
                        </Link>
                      </Button>
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
