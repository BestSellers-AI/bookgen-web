"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { booksApi } from "@/lib/api/books";
import { walletApi } from "@/lib/api/wallet";
import type { BookListItem, WalletInfo } from "@/lib/api/types";
import { useAuth } from "@/hooks/use-auth";
import { useWalletStore } from "@/stores/wallet-store";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { BooksSummaryCard } from "@/components/dashboard/books-summary-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentBooksList } from "@/components/dashboard/recent-books-list";
import { CreditsCard } from "@/components/dashboard/credits-card";
import { PlanCard } from "@/components/dashboard/plan-card";


export default function DashboardPage() {
  const { user } = useAuth();
  const t = useTranslations("dashboard");
  const setWalletStore = useWalletStore((s) => s.setWallet);

  const [allBooks, setAllBooks] = useState<BookListItem[]>([]);
  const [recentBooks, setRecentBooks] = useState<BookListItem[]>([]);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(false);
    try {
      const [allBooksRes, recentBooksRes, walletRes] = await Promise.allSettled([
        booksApi.list({ sortBy: "createdAt", sortOrder: "desc", perPage: 100 }),
        booksApi.list({ sortBy: "createdAt", sortOrder: "desc", perPage: 5 }),
        walletApi.get(),
      ]);

      setAllBooks(allBooksRes.status === "fulfilled" ? allBooksRes.value.data : []);
      setRecentBooks(recentBooksRes.status === "fulfilled" ? recentBooksRes.value.data : []);
      const walletData = walletRes.status === "fulfilled" ? walletRes.value : null;
      setWallet(walletData);
      if (walletData) setWalletStore(walletData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-5 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[1.5rem]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-10 w-80 rounded-xl" />
            <Skeleton className="h-64 rounded-[2rem]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-[2rem]" />
            <Skeleton className="h-48 rounded-[2rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <ErrorState onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-gradient">
          {t("welcomeBack")}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground text-lg">{t("welcomeSubtitle")}</p>
      </div>

      {/* Summary Stats */}
      <BooksSummaryCard books={allBooks} />

      {/* Upgrade Banner */}
      <PlanCard user={user} />


      {/* Quick Actions */}
      <QuickActions />

      {/* Main Grid */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <RecentBooksList books={recentBooks} />
        </div>

        {/* Right Column */}
        {/* <div className="space-y-6">
          <CreditsCard wallet={wallet} user={user} />
        </div> */}
      </div>
    </div>
  );
}
