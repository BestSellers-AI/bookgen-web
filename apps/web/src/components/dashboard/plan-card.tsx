"use client";

import { Crown, Zap, BookOpen, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PlanBadge } from "./plan-badge";
import type { UserProfile } from "@/lib/api/types";

interface PlanCardProps {
  user: UserProfile | null;
}

const PLAN_HIERARCHY = [null, "ASPIRANTE", "PROFISSIONAL", "BESTSELLER"] as const;

function getNextPlan(current: string | null): string | null {
  const idx = PLAN_HIERARCHY.indexOf(current as typeof PLAN_HIERARCHY[number]);
  if (idx === -1 || idx >= PLAN_HIERARCHY.length - 1) return null;
  return PLAN_HIERARCHY[idx + 1];
}

export function PlanCard({ user }: PlanCardProps) {
  const t = useTranslations("dashboard");
  const tPlan = useTranslations("planNames");

  const plan = user?.planInfo?.plan ?? null;
  const hasSubscription = user?.planInfo?.hasSubscription ?? false;
  const nextPlan = getNextPlan(plan);
  const isMaxPlan = !nextPlan;

  if (isMaxPlan) {
    return (
      <div className="glass rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-xl font-black text-foreground">{plan ? tPlan(plan) : tPlan("FREE")}</span>
          <PlanBadge plan={plan} />
        </div>
        <Button asChild variant="outline" className="rounded-xl h-10 shrink-0">
          <Link href="/dashboard/settings">{t("manage")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="glass rounded-[2rem] p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        {/* Left — plan info + perks */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              {t("currentPlan")}
            </span>
            <span className="text-lg font-black text-foreground">
              {plan ? tPlan(plan) : tPlan("FREE")}
            </span>
            <PlanBadge plan={plan} />
          </div>

          {nextPlan && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-primary">
                {t("planCard.upgradeHook", { plan: tPlan(nextPlan) })}
              </p>
              <ul className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                {(t.raw(`planCard.perks.${nextPlan}`) as string[]).map((perk, i) => {
                  const icons = [Zap, BookOpen, Star];
                  const Icon = icons[i % icons.length];
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{perk}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Right — CTA */}
        <div className="relative rounded-xl p-[2px] overflow-hidden w-full md:w-auto shrink-0">
          <div
            className="absolute top-1/2 left-1/2 w-[200%] aspect-square animate-border-spin"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, transparent 60%, #f4eee6 75%, #ffffff 85%, #f4eee6 95%, transparent 100%)",
            }}
          />
          <Button
            asChild
            className="relative w-full md:w-auto rounded-[calc(0.75rem-2px)] h-10 font-bold gap-2 glow-primary"
          >
            <Link href={hasSubscription ? "/dashboard/settings" : "/dashboard/upgrade"}>
              {t("planCard.upgradeCta", { plan: tPlan(nextPlan) })}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
