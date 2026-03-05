"use client";

import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PlanBadge } from "./plan-badge";
import type { UserProfile } from "@/lib/api/types";

interface PlanCardProps {
  user: UserProfile | null;
}

export function PlanCard({ user }: PlanCardProps) {
  const t = useTranslations("dashboard");

  const plan = user?.planInfo?.plan ?? null;
  const hasSubscription = user?.planInfo?.hasSubscription ?? false;

  return (
    <div className="glass rounded-[2rem] p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Crown className="w-5 h-5 text-amber-500" />
        </div>
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          {t("currentPlan")}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-2xl font-black text-foreground">
          {plan ?? t("freePlan")}
        </span>
        <PlanBadge plan={plan} />
      </div>

      <Button
        asChild
        variant="outline"
        className="w-full rounded-xl h-10"
      >
        <Link href={hasSubscription ? "/dashboard/settings" : "/dashboard/upgrade"}>
          {hasSubscription ? t("manage") : t("upgrade")}
        </Link>
      </Button>
    </div>
  );
}
