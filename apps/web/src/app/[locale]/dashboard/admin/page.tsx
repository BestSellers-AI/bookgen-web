"use client";

import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  DollarSign,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useTranslations } from "next-intl";
import { adminApi, type AdminDashboardStats } from "@/lib/api/admin";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[2rem]" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-[2rem]" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-6xl mx-auto">
        <ErrorState onRetry={fetchStats} />
      </div>
    );
  }

  const statCards = [
    {
      label: t("totalUsers"),
      value: stats.totalUsers,
      sub: `${stats.activeUsers} ${t("active")}`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: t("totalBooks"),
      value: stats.totalBooks,
      sub: `${stats.booksThisMonth} ${t("thisMonth")}`,
      icon: BookOpen,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      label: t("totalRevenue"),
      value: `$${(stats.totalRevenueCents / 100).toLocaleString()}`,
      sub: `$${(stats.revenueThisMonthCents / 100).toLocaleString()} ${t("thisMonth")}`,
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: t("subscriptions"),
      value: Object.values(stats.activeSubscriptions).reduce(
        (a, b) => a + b,
        0
      ),
      sub: t("activeSubs"),
      icon: CreditCard,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader title={t("dashboardTitle")} subtitle={t("dashboardSubtitle")} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="glass rounded-[2rem] p-6 space-y-3"
          >
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.bg}`}
            >
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-black">{card.value}</p>
              <p className="text-xs text-muted-foreground font-medium">
                {card.label}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Subscriptions by Plan */}
      <div className="glass rounded-[2rem] p-6 space-y-4">
        <h2 className="text-lg font-bold font-heading">
          {t("subsByPlan")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats.activeSubscriptions).map(([plan, count]) => (
            <div
              key={plan}
              className="p-4 rounded-2xl bg-accent/30 border border-border"
            >
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {plan}
              </p>
              <p className="text-3xl font-black mt-1">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Addons */}
      {stats.topAddons.length > 0 && (
        <div className="glass rounded-[2rem] p-6 space-y-4">
          <h2 className="text-lg font-bold font-heading">{t("topAddons")}</h2>
          <div className="space-y-2">
            {stats.topAddons.map((addon) => (
              <div
                key={addon.kind}
                className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-border"
              >
                <span className="text-sm font-medium">{addon.kind}</span>
                <span className="text-sm font-black">{addon.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
