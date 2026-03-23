"use client";

import { useState } from "react";
import { Crown, Zap, BookOpen, Star, ArrowRight, Sparkles, RefreshCw, Percent, Rocket, BookCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PlanBadge } from "./plan-badge";
import { PublishingInfoOverlay } from "@/components/book/publishing-info-overlay";
import { useWalletStore } from "@/stores/wallet-store";
import type { UserProfile } from "@/lib/api/types";

interface PlanCardProps {
  user: UserProfile | null;
  /** @internal debug only — override wallet balance */
  debugBalance?: number;
  /** Whether the user has at least 1 book/preview */
  hasBooks?: boolean;
}

const PLAN_HIERARCHY = [null, "ASPIRANTE", "PROFISSIONAL", "BESTSELLER"] as const;

function getNextPlan(current: string | null): string | null {
  const idx = PLAN_HIERARCHY.indexOf(current as typeof PLAN_HIERARCHY[number]);
  if (idx === -1 || idx >= PLAN_HIERARCHY.length - 1) return null;
  return PLAN_HIERARCHY[idx + 1];
}

export function PlanCard({ user, debugBalance, hasBooks }: PlanCardProps) {
  const t = useTranslations("dashboard");
  const tPlan = useTranslations("planNames");
  const router = useRouter();
  const storeBalance = useWalletStore((s) => s.wallet?.balance ?? 0);
  const balance = debugBalance !== undefined ? debugBalance : storeBalance;
  const [publishingOpen, setPublishingOpen] = useState(false);

  const plan = user?.planInfo?.plan ?? null;
  const hasSubscription = user?.planInfo?.hasSubscription ?? false;
  const nextPlan = getNextPlan(plan);
  const isMaxPlan = !nextPlan;
  const isFree = !plan || !hasSubscription;
  const hasCredits = balance > 0;

  // ─── State 1: Free user WITHOUT credits → card hidden ─────────────
  // TODO: revert — uncomment to restore State 1 card
  // Rules:
  // - Free user without credits → hide the entire plan card
  // - Card returns when user has credits or a subscription
  if (isFree && !hasCredits) {
    return null;
  }
  // if (isFree && !hasCredits) {
  //   return (
  //     <div className="relative overflow-hidden rounded-[2rem] border-2 dark:border-gold-500/40 border-gold-600/40 bg-gradient-to-r dark:from-gold-500/[0.08] dark:via-amber-500/[0.04] dark:to-gold-500/[0.08] from-gold-600/[0.08] via-amber-600/[0.04] to-gold-600/[0.08] p-6 shadow-gold-md">
  //       <div className="absolute -top-16 -right-16 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
  //       <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
  //       <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5">
  //         <div className="space-y-3">
  //           <div className="flex items-center gap-3">
  //             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-500/30 to-amber-500/20 border-2 dark:border-gold-500/40 border-gold-600/40 flex items-center justify-center shadow-lg dark:shadow-gold-500/10 shadow-gold-600/10 shrink-0">
  //               <Sparkles className="w-6 h-6 dark:text-gold-400 text-gold-700" />
  //             </div>
  //             <div>
  //               <p className="text-xl font-black dark:text-gold-400 text-gold-700 font-playfair">{t("planCard.freeTitle")}</p>
  //               <p className="text-sm dark:text-cream-400 text-navy-600">{t("planCard.freeSubtitle")}</p>
  //             </div>
  //           </div>
  //           <ul className="flex flex-col sm:flex-row gap-2 sm:gap-5">
  //             {[
  //               { icon: Zap, text: t("planCard.freePerk1") },
  //               { icon: BookOpen, text: t("planCard.freePerk2") },
  //               { icon: Star, text: t("planCard.freePerk3") },
  //             ].map((perk, i) => (
  //               <li key={i} className="flex items-center gap-2 text-sm dark:text-cream-400 text-navy-600">
  //                 <perk.icon className="w-4 h-4 dark:text-gold-400 text-gold-700 shrink-0" />
  //                 <span>{perk.text}</span>
  //               </li>
  //             ))}
  //           </ul>
  //         </div>
  //
  //         <GoldCta href="/dashboard/upgrade?tab=plans" label={t("planCard.freeCtaCredits")} />
  //       </div>
  //     </div>
  //   );
  // }

  // ─── State 2: Free user WITH credits → offer plans (dica esperta style) ─
  if (isFree && hasCredits) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border-2 dark:border-gold-500/40 border-gold-600/40 bg-gradient-to-r dark:from-gold-500/[0.08] dark:via-amber-500/[0.04] dark:to-gold-500/[0.08] from-gold-600/[0.08] via-amber-600/[0.04] to-gold-600/[0.08] p-6 shadow-gold-md">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-500/30 to-amber-500/20 border-2 dark:border-gold-500/40 border-gold-600/40 flex items-center justify-center shadow-lg dark:shadow-gold-500/10 shadow-gold-600/10 shrink-0">
                <Crown className="w-6 h-6 dark:text-gold-400 text-gold-700" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider dark:text-gold-400 text-gold-700">{t("planCard.proTip")}</p>
                <p className="text-sm dark:text-cream-400 text-navy-600">{t("planCard.proTipSubtitle")}</p>
              </div>
            </div>
            <ul className="flex flex-col sm:flex-row gap-2 sm:gap-5">
              {[
                { icon: RefreshCw, text: t("planCard.proTipPerk1") },
                { icon: Percent, text: t("planCard.proTipPerk2") },
                { icon: Rocket, text: t("planCard.proTipPerk3") },
              ].map((perk, i) => (
                <li key={i} className="flex items-center gap-2 text-sm dark:text-cream-400 text-navy-600">
                  <perk.icon className="w-4 h-4 dark:text-gold-400 text-gold-700 shrink-0" />
                  <span>{perk.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <GoldCta href="/dashboard/upgrade" label={t("planCard.proTipCta")} />
        </div>
      </div>
    );
  }

  // ─── State 3: Max plan (BESTSELLER) → offer publishing ─────────────
  if (isMaxPlan) {
    return (
      <>
        <div className="relative overflow-hidden rounded-[2rem] border-2 dark:border-gold-500/40 border-gold-600/40 bg-gradient-to-r dark:from-gold-500/[0.08] dark:via-amber-500/[0.04] dark:to-gold-500/[0.08] from-gold-600/[0.08] via-amber-600/[0.04] to-gold-600/[0.08] p-6 shadow-gold-md">
          {/* Glow accents */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-500/30 to-amber-500/20 border-2 dark:border-gold-500/40 border-gold-600/40 flex items-center justify-center shadow-lg dark:shadow-gold-500/10 shadow-gold-600/10">
                <Crown className="w-6 h-6 dark:text-gold-400 text-gold-700" />
              </div>
              <div>
                <p className="text-xl font-black dark:text-gold-400 text-gold-700 font-playfair">{plan ? tPlan(plan) : tPlan("FREE")}</p>
                <p className="text-sm dark:text-cream-400 text-navy-600">{t("planCard.maxPlanSubtitle")}</p>
              </div>
            </div>

            <div className="relative rounded-xl p-[2px] overflow-hidden w-full sm:w-auto shrink-0">
              <div
                className="absolute top-1/2 left-1/2 w-[200%] aspect-square animate-border-spin"
                style={{
                  background: "conic-gradient(from 0deg, transparent 0%, transparent 60%, #f4eee6 75%, #ffffff 85%, #f4eee6 95%, transparent 100%)",
                }}
              />
              <button
                className="relative w-full sm:w-auto rounded-[calc(0.75rem-2px)] px-6 py-2.5 font-bold text-sm transition-all duration-200 active:scale-[0.98] bg-gold-500 hover:bg-gold-600 text-navy-900 shadow-gold-sm hover:shadow-gold-md flex items-center justify-center gap-2"
                onClick={() => setPublishingOpen(true)}
              >
                <BookCheck className="w-4 h-4" />
                {t("planCard.maxPlanCta")}
              </button>
            </div>
          </div>
        </div>
        <PublishingInfoOverlay
          open={publishingOpen}
          onClose={() => {
            setPublishingOpen(false);
            router.push("/dashboard/books");
          }}
        />
      </>
    );
  }

  // ─── State 4: Has plan, upgrade available → offer next plan ────────
  return (
    <div className="relative overflow-hidden rounded-[2rem] border-2 dark:border-gold-500/40 border-gold-600/40 bg-gradient-to-r dark:from-gold-500/[0.08] dark:via-amber-500/[0.04] dark:to-gold-500/[0.08] from-gold-600/[0.08] via-amber-600/[0.04] to-gold-600/[0.08] p-6 shadow-gold-md">
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-500/30 to-amber-500/20 border-2 dark:border-gold-500/40 border-gold-600/40 flex items-center justify-center shadow-lg dark:shadow-gold-500/10 shadow-gold-600/10 shrink-0">
              <Crown className="w-6 h-6 dark:text-gold-400 text-gold-700" />
            </div>
            <div>
              <p className="text-xl font-black dark:text-gold-400 text-gold-700 font-playfair">{plan ? tPlan(plan) : tPlan("FREE")}</p>
              <p className="text-sm font-semibold dark:text-cream-400 text-navy-600">
                {t("planCard.upgradeHook", { plan: tPlan(nextPlan!) })}
              </p>
            </div>
          </div>
          <ul className="flex flex-col sm:flex-row gap-2 sm:gap-6">
            {(t.raw(`planCard.perks.${nextPlan}`) as string[]).map((perk, i) => {
              const icons = [Zap, BookOpen, Star];
              const Icon = icons[i % icons.length];
              return (
                <li key={i} className="flex items-start gap-2 text-sm dark:text-cream-400 text-navy-600">
                  <Icon className="w-4 h-4 dark:text-gold-400 text-gold-700 mt-0.5 shrink-0" />
                  <span>{perk}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <GoldCta
          href={hasSubscription ? "/dashboard/settings" : "/dashboard/upgrade"}
          label={t("planCard.upgradeCta", { plan: tPlan(nextPlan!) })}
        />
      </div>
    </div>
  );
}

function GoldCta({ href, label }: { href: string; label: string }) {
  return (
    <div className="relative rounded-xl p-[2px] overflow-hidden w-full sm:w-auto shrink-0">
      <div
        className="absolute top-1/2 left-1/2 w-[200%] aspect-square animate-border-spin"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, transparent 60%, #f4eee6 75%, #ffffff 85%, #f4eee6 95%, transparent 100%)",
        }}
      />
      <Button
        asChild
        className="relative w-full sm:w-auto rounded-[calc(0.75rem-2px)] h-10 font-bold gap-2 bg-gold-500 hover:bg-gold-600 text-navy-900 shadow-gold-sm hover:shadow-gold-md"
      >
        <Link href={href}>
          {label}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}
