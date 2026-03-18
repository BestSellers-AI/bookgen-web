"use client";

import { Crown, Zap, BookOpen, Star, ArrowRight, Sparkles, RefreshCw, Percent, Rocket, BookCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PlanBadge } from "./plan-badge";
import { useWalletStore } from "@/stores/wallet-store";
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
  const balance = useWalletStore((s) => s.wallet?.balance ?? 0);

  const plan = user?.planInfo?.plan ?? null;
  const hasSubscription = user?.planInfo?.hasSubscription ?? false;
  const nextPlan = getNextPlan(plan);
  const isMaxPlan = !nextPlan;
  const isFree = !plan || !hasSubscription;
  const hasCredits = balance > 0;

  // ─── State 1: Free user WITHOUT credits → offer credits ────────────
  if (isFree && !hasCredits) {
    return (
      <div className="glass rounded-[2rem] p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground">{t("planCard.freeTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("planCard.freeSubtitle")}</p>
              </div>
            </div>
            <ul className="flex flex-col sm:flex-row gap-2 sm:gap-5">
              {[
                { icon: Zap, text: t("planCard.freePerk1") },
                { icon: BookOpen, text: t("planCard.freePerk2") },
                { icon: Star, text: t("planCard.freePerk3") },
              ].map((perk, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <perk.icon className="w-4 h-4 text-primary shrink-0" />
                  <span>{perk.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <AnimatedCta href="/dashboard/upgrade?tab=credits" label={t("planCard.freeCtaCredits")} />
        </div>
      </div>
    );
  }

  // ─── State 2: Free user WITH credits → offer plans (dica esperta style) ─
  if (isFree && hasCredits) {
    return (
      <div className="rounded-[2rem] border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-500">{t("planCard.proTip")}</p>
                <p className="text-sm text-muted-foreground">{t("planCard.proTipSubtitle")}</p>
              </div>
            </div>
            <ul className="flex flex-col sm:flex-row gap-2 sm:gap-5">
              {[
                { icon: RefreshCw, text: t("planCard.proTipPerk1") },
                { icon: Percent, text: t("planCard.proTipPerk2") },
                { icon: Rocket, text: t("planCard.proTipPerk3") },
              ].map((perk, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <perk.icon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{perk.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <AnimatedCta href="/dashboard/upgrade" label={t("planCard.proTipCta")} />
        </div>
      </div>
    );
  }

  // ─── State 3: Max plan (BESTSELLER) → offer publishing ─────────────
  if (isMaxPlan) {
    return (
      <div className="glass rounded-[2rem] p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-black text-foreground">{plan ? tPlan(plan) : tPlan("FREE")}</p>
              <p className="text-xs text-muted-foreground">{t("planCard.maxPlanSubtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-xl h-10 gap-2 shrink-0">
              <Link href="/dashboard/books">
                <BookCheck className="w-4 h-4" />
                {t("planCard.maxPlanCta")}
              </Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-xl h-10 shrink-0">
              <Link href="/dashboard/settings">{t("manage")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── State 4: Has plan, upgrade available → offer next plan ────────
  return (
    <div className="glass rounded-[2rem] p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-black text-foreground">{plan ? tPlan(plan) : tPlan("FREE")}</p>
              <p className="text-sm font-semibold text-primary">
                {t("planCard.upgradeHook", { plan: tPlan(nextPlan!) })}
              </p>
            </div>
          </div>
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

        <AnimatedCta
          href={hasSubscription ? "/dashboard/settings" : "/dashboard/upgrade"}
          label={t("planCard.upgradeCta", { plan: tPlan(nextPlan!) })}
        />
      </div>
    </div>
  );
}

function AnimatedCta({ href, label }: { href: string; label: string }) {
  return (
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
        <Link href={href}>
          {label}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}
