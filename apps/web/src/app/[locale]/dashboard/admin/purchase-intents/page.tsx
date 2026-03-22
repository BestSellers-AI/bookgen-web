"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ShoppingCart, CheckCircle2, XCircle, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { adminApi, type AdminPurchaseIntent, type AdminPurchaseIntentStats } from "@/lib/api/admin";
import { useDebounce } from "@/hooks/use-debounce";
import type { PaginationMeta } from "@/lib/api/types";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StatusFilter = "all" | "converted" | "abandoned";

export default function AdminPurchaseIntentsPage() {
  const t = useTranslations("admin");
  const [intents, setIntents] = useState<AdminPurchaseIntent[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<AdminPurchaseIntentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const debouncedSearch = useDebounce(search, 300);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const converted =
        statusFilter === "converted"
          ? "true"
          : statusFilter === "abandoned"
            ? "false"
            : undefined;

      const [res, statsRes] = await Promise.all([
        adminApi.listPurchaseIntents({
          page,
          perPage: 20,
          search: debouncedSearch || undefined,
          converted,
        }),
        adminApi.getPurchaseIntentStats(),
      ]);
      setIntents(res.data);
      setMeta(res.meta);
      setStats(statsRes);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title={t("piTitle")}
        subtitle={t("piSubtitle")}
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-black">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("piTotal")}</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-emerald-400">{stats.converted}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("piConverted")}</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-amber-400">{stats.abandoned}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("piAbandoned")}</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-blue-400">{stats.conversionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">{t("piConversionRate")}</p>
          </div>
        </div>
      )}

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">{t("filterAll")}</TabsTrigger>
          <TabsTrigger value="converted">{t("piConverted")}</TabsTrigger>
          <TabsTrigger value="abandoned">{t("piAbandoned")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("piSearchPlaceholder")}
          className="pl-10 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : intents.length === 0 ? (
        <div className="glass rounded-[2rem] p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{t("piEmpty")}</p>
        </div>
      ) : (
        <div className="glass rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("user")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("piType")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("piProduct")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("piSource")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("status")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("piRecovery")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("date")}</th>
                </tr>
              </thead>
              <tbody>
                {intents.map((intent) => (
                  <tr
                    key={intent.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <p className="font-medium">{intent.userName || t("piGuest")}</p>
                        <p className="text-muted-foreground">{intent.email || "—"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] font-black uppercase ${
                          intent.type === "subscription"
                            ? "bg-purple-500/10 text-purple-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {intent.type === "subscription" ? t("piPlan") : t("piCredits")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                      {intent.productSlug}
                      {intent.billingInterval && (
                        <span className="ml-1 text-muted-foreground/60">({intent.billingInterval})</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="text-[9px] font-bold">
                        {intent.source}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {intent.converted ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-emerald-400 font-bold">{t("piConverted")}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-amber-400 font-bold">{t("piAbandoned")}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {intent.recoveryEmailSentAt ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(intent.recoveryEmailSentAt).toLocaleDateString()}
                          </span>
                        </div>
                      ) : intent.converted ? (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      ) : (
                        <span className="text-[10px] text-amber-400">{t("piPending")}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(intent.createdAt).toLocaleDateString()}{" "}
                      {new Date(intent.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
