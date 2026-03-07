"use client";

import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { adminApi, type AdminPurchaseSummary } from "@/lib/api/admin";
import type { PaginationMeta } from "@/lib/api/types";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminPurchasesPage() {
  const t = useTranslations("admin");
  const tStatus = useTranslations("statusLabels");
  const [purchases, setPurchases] = useState<AdminPurchaseSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listPurchases({ page, perPage: 20 });
      setPurchases(res.data);
      setMeta(res.meta);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader title={t("purchasesTitle")} />

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
                    {t("amount")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("status")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("gateway")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("user")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-bold">
                      ${(purchase.totalAmount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] font-black uppercase ${
                          purchase.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : purchase.status === "REFUNDED"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {tStatus.has(purchase.status) ? tStatus(purchase.status) : purchase.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground capitalize">
                      {purchase.gateway.toLowerCase()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-muted-foreground">
                        {purchase.userEmail}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(purchase.createdAt).toLocaleDateString()}
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
