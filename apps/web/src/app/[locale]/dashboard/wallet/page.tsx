"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Gift,
  CreditCard,
  ArrowUpDown,
  Undo2,
  Star,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { walletApi } from "@/lib/api/wallet";
import { useWalletStore } from "@/stores/wallet-store";
import type {
  WalletInfo,
  WalletTransactionItem,
  PaginationMeta,
} from "@/lib/api/types";
import { WalletTransactionType } from "@bestsellers/shared";
import { PageHeader } from "@/components/ui/page-header";

const TRANSACTION_TYPE_ICONS: Record<string, typeof Wallet> = {
  [WalletTransactionType.CREDIT_PURCHASE]: ShoppingCart,
  [WalletTransactionType.BOOK_GENERATION]: TrendingDown,
  [WalletTransactionType.ADDON_PURCHASE]: CreditCard,
  [WalletTransactionType.REFUND]: Undo2,
  [WalletTransactionType.BONUS]: Gift,
  [WalletTransactionType.ADJUSTMENT]: Wrench,
  [WalletTransactionType.SUBSCRIPTION_CREDIT]: Star,
};

export default function WalletPage() {
  const t = useTranslations("wallet");
  const tCommon = useTranslations("common");
  const setWalletStore = useWalletStore((s) => s.setWallet);

  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchWallet = useCallback(async () => {
    try {
      const data = await walletApi.get();
      setWallet(data);
      setWalletStore(data);
    } catch {
      setError(true);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const params: Record<string, unknown> = { page, perPage: 10, sortOrder: "desc" as const };
      if (typeFilter !== "all") {
        params.type = typeFilter;
      }
      const res = await walletApi.getTransactions(params as Parameters<typeof walletApi.getTransactions>[0]);
      setTransactions(res.data);
      setMeta(res.meta);
    } catch {
      // silently fail transactions
    } finally {
      setTxLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    Promise.all([fetchWallet(), fetchTransactions()]).finally(() =>
      setLoading(false)
    );
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-[2rem]" />
        <Skeleton className="h-96 rounded-[2rem]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorState onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;
  const breakdown = wallet?.breakdown ?? { subscription: 0, purchased: 0, bonus: 0 };
  const total = breakdown.subscription + breakdown.purchased + breakdown.bonus;
  const expiring = wallet?.expiringCredits;
  const regens = wallet?.freeRegens;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Wallet Overview */}
      <div className="glass rounded-[2rem] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">
              {t("totalBalance")}
            </p>
            <p className="text-5xl font-black text-foreground">
              {balance}{" "}
              <span className="text-lg font-bold text-muted-foreground">
                {tCommon("credits")}
              </span>
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Wallet className="w-7 h-7 text-primary" />
          </div>
        </div>

        {/* Breakdown Bars */}
        {total > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-muted-foreground flex-1">
                {t("subscription")}
              </span>
              <span className="text-sm font-bold">{breakdown.subscription}</span>
            </div>
            <Progress
              value={total > 0 ? (breakdown.subscription / total) * 100 : 0}
              className="h-2 [&>div]:bg-blue-500"
            />

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-muted-foreground flex-1">
                {t("purchased")}
              </span>
              <span className="text-sm font-bold">{breakdown.purchased}</span>
            </div>
            <Progress
              value={total > 0 ? (breakdown.purchased / total) * 100 : 0}
              className="h-2 [&>div]:bg-emerald-500"
            />

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground flex-1">
                {t("bonus")}
              </span>
              <span className="text-sm font-bold">{breakdown.bonus}</span>
            </div>
            <Progress
              value={total > 0 ? (breakdown.bonus / total) * 100 : 0}
              className="h-2 [&>div]:bg-primary"
            />
          </div>
        )}

        {/* Expiring Credits Warning */}
        {expiring && expiring.amount > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-500 font-medium">
              {t("expiringWarning", {
                amount: expiring.amount,
                date: new Date(expiring.expiresAt).toLocaleDateString(),
              })}
            </p>
          </div>
        )}

        {/* Free Regens */}
        {regens && regens.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                {t("freeRegens")}
              </span>
              <span className="font-bold">
                {regens.total - regens.remaining}/{regens.total}{" "}
                {t("used")}
              </span>
            </div>
            <Progress
              value={((regens.total - regens.remaining) / regens.total) * 100}
              className="h-2"
            />
          </div>
        )}

        {/* Buy Credits CTA */}
        <Button asChild className="w-full h-12 rounded-xl font-bold gap-2">
          <Link href="/dashboard/upgrade?tab=credits">
            <ShoppingCart className="w-4 h-4" />
            {t("buyCredits")}
          </Link>
        </Button>
      </div>

      {/* Transaction History */}
      <div className="glass rounded-[2rem] p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-xl font-bold font-heading">{t("transactionHistory")}</h2>
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-48 rounded-xl">
              <SelectValue placeholder={t("filterAll")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterAll")}</SelectItem>
              <SelectItem value={WalletTransactionType.SUBSCRIPTION_CREDIT}>
                {t("typeSubscription")}
              </SelectItem>
              <SelectItem value={WalletTransactionType.CREDIT_PURCHASE}>
                {t("typePurchase")}
              </SelectItem>
              <SelectItem value={WalletTransactionType.BOOK_GENERATION}>
                {t("typeGeneration")}
              </SelectItem>
              <SelectItem value={WalletTransactionType.ADDON_PURCHASE}>
                {t("typeAddon")}
              </SelectItem>
              <SelectItem value={WalletTransactionType.REFUND}>
                {t("typeRefund")}
              </SelectItem>
              <SelectItem value={WalletTransactionType.BONUS}>
                {t("typeBonus")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {txLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ArrowUpDown}
            title={t("noTransactions")}
            description={t("noTransactionsDesc")}
          />
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isPositive = tx.amount > 0;
              const Icon =
                TRANSACTION_TYPE_ICONS[tx.type] ?? ArrowUpDown;

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-accent/30 border border-border hover:bg-accent/50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isPositive
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isPositive ? "text-emerald-500" : "text-red-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {t(`type_${tx.type}`)}
                    </p>
                    {tx.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {tx.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-black ${
                        isPositive ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {tx.amount}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
