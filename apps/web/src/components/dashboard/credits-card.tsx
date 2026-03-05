"use client";

import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { WalletInfo, UserProfile } from "@/lib/api/types";

interface CreditsCardProps {
  wallet: WalletInfo | null;
  user: UserProfile | null;
}

export function CreditsCard({ wallet, user }: CreditsCardProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  const balance = wallet?.balance ?? 0;
  const monthlyCredits = user?.planInfo?.limits?.monthlyCredits ?? 0;
  const hasSubscription = user?.planInfo?.hasSubscription ?? false;

  return (
    <div className="glass rounded-[2rem] p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-emerald-500" />
        </div>
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          {tCommon("credits")}
        </span>
      </div>

      <div className="text-4xl font-black text-foreground">{balance}</div>

      {hasSubscription && monthlyCredits > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {wallet?.breakdown.subscription ?? 0} / {monthlyCredits}
            </span>
          </div>
          <Progress
            value={((wallet?.breakdown.subscription ?? 0) / monthlyCredits) * 100}
            className="h-2"
          />
        </div>
      )}

      <Button
        asChild
        variant="outline"
        className="w-full rounded-xl h-10"
      >
        <Link href="/dashboard/wallet">{t("buyCredits")}</Link>
      </Button>
    </div>
  );
}
