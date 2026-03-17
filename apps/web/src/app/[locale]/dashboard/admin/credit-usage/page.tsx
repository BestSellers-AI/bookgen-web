"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingDown,
  TrendingUp,
  Hash,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useTranslations } from "next-intl";
import { adminApi } from "@/lib/api/admin";
import { PageHeader } from "@/components/ui/page-header";

const TRANSACTION_TYPES = [
  "CREDIT_PURCHASE",
  "BOOK_GENERATION",
  "ADDON_PURCHASE",
  "REFUND",
  "BONUS",
  "ADJUSTMENT",
  "SUBSCRIPTION_CREDIT",
] as const;

const TYPE_COLORS: Record<string, string> = {
  CREDIT_PURCHASE: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  BOOK_GENERATION: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  ADDON_PURCHASE: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  REFUND: "bg-green-500/15 text-green-400 border-green-500/30",
  BONUS: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  ADJUSTMENT: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  SUBSCRIPTION_CREDIT: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string | null;
  bookId: string | null;
  bookTitle: string | null;
  addonId: string | null;
  userId: string;
  userEmail: string;
  userName: string | null;
  createdAt: string;
}

interface CreditUsageResponse {
  data: Transaction[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  summary: {
    totalCreditsSpent: number;
    totalCreditsAdded: number;
    transactionCount: number;
  };
}

export default function CreditUsagePage() {
  const t = useTranslations("admin");

  const [response, setResponse] = useState<CreditUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params: Record<string, string | number> = { page, perPage: 50 };
      if (search) params.search = search;
      if (type) params.type = type;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const data = await adminApi.getCreditUsage(params);
      setResponse(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, search, type, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, type, dateFrom, dateTo]);

  if (error && !response) {
    return (
      <div className="max-w-6xl mx-auto">
        <ErrorState onRetry={fetchData} />
      </div>
    );
  }

  const summary = response?.summary;
  const meta = response?.meta;
  const transactions = response?.data ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader
        title={t("creditUsage")}
        subtitle={t("creditUsageSubtitle")}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-[2rem] p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-red-500/10 border-red-500/20">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-black">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                summary?.totalCreditsSpent ?? 0
              )}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {t("totalSpent")}
            </p>
          </div>
        </div>

        <div className="glass rounded-[2rem] p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-emerald-500/10 border-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-black">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                summary?.totalCreditsAdded ?? 0
              )}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {t("totalAdded")}
            </p>
          </div>
        </div>

        <div className="glass rounded-[2rem] p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-blue-500/10 border-blue-500/20">
            <Hash className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-black">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                summary?.transactionCount ?? 0
              )}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {t("totalTransactions")}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-[2rem] p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchUsers")}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Type filter */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 px-4 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">{t("allTypes")}</option>
            {TRANSACTION_TYPES.map((tt) => (
              <option key={tt} value={tt}>
                {t(`type_${tt}`)}
              </option>
            ))}
          </select>

          {/* Date from */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {t("dateFrom")}
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Date to */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {t("dateTo")}
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-[2rem] p-6 overflow-x-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {t("noTransactions")}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="py-3 px-3">{t("date")}</th>
                <th className="py-3 px-3">{t("user")}</th>
                <th className="py-3 px-3">{t("transactionType")}</th>
                <th className="py-3 px-3 text-right">{t("amount")}</th>
                <th className="py-3 px-3 text-right">{t("balanceAfter")}</th>
                <th className="py-3 px-3">{t("description")}</th>
                <th className="py-3 px-3">{t("bookTitle")}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                >
                  <td className="py-3 px-3 whitespace-nowrap text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium">{tx.userEmail}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${TYPE_COLORS[tx.type] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}
                    >
                      {t(`type_${tx.type}`)}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-bold tabular-nums ${
                      tx.amount < 0 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </td>
                  <td className="py-3 px-3 text-right text-muted-foreground tabular-nums">
                    {tx.balance}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground max-w-[200px] truncate">
                    {tx.description ?? "-"}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground max-w-[150px] truncate">
                    {tx.bookTitle ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {meta.total} {t("credits")}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium px-3">
                {meta.page} / {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
