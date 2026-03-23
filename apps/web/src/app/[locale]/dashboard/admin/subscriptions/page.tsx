"use client";

import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { PlanBadge } from "@/components/dashboard/plan-badge";
import { useTranslations } from "next-intl";
import { adminApi, type AdminSubscriptionSummary } from "@/lib/api/admin";
import type { PaginationMeta } from "@/lib/api/types";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminSubscriptionsPage() {
  const t = useTranslations("admin");
  const tStatus = useTranslations("statusLabels");
  const [subs, setSubs] = useState<AdminSubscriptionSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listSubscriptions({ page, perPage: 20 });
      setSubs(res.data);
      setMeta(res.meta);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader title={t("subscriptionsTitle")} />

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
                    {t("user")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("plan")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("status")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("billing")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("periodEnd")}
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">
                    {t("created")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {subs.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/admin/users/${sub.userId}`} className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors">
                        {sub.userEmail}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <PlanBadge plan={sub.plan} />
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] font-black uppercase ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : sub.status === "CANCELLED"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {tStatus.has(sub.status) ? tStatus(sub.status) : sub.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 capitalize text-muted-foreground">
                      {sub.billingInterval.toLowerCase()}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(sub.createdAt).toLocaleDateString()}
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
