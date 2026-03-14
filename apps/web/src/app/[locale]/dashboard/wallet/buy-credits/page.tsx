"use client";

import { useState } from "react";
import { ShoppingCart, Loader2, ArrowLeft, Zap, Star, Crown, ArrowRight, Sparkles, RefreshCw, RotateCcw, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { checkoutApi } from "@/lib/api/checkout";
import { useConfigStore } from "@/stores/config-store";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import clsx from "clsx";

const PACK_ICONS = [Zap, Star, Crown];
const PACK_COLORS = [
  "border-blue-500/20 hover:border-blue-500/40",
  "border-primary/20 hover:border-primary/40",
  "border-amber-500/20 hover:border-amber-500/40",
];
const PACK_ICON_BG = [
  "bg-blue-500/10 text-blue-500",
  "bg-primary/10 text-primary",
  "bg-amber-500/10 text-amber-500",
];

const PREMIUM_SLUGS = ['aspiring-work', 'complete-work', 'bestseller-mundial'];
const CREDITS_SLUGS = ['pack-100', 'pack-300', 'pack-500'];

type ActiveTab = 'premium' | 'credits';

export default function BuyCreditsPage() {
  const t = useTranslations("buyCredits");
  const tCommon = useTranslations("common");
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('premium');
  const allCreditPacks = useConfigStore((s) => s.getCreditPacks)();
  const plans = useConfigStore((s) => s.getSubscriptionPlans)();
  const { user } = useAuth();

  const currentPlan = user?.planInfo?.plan ?? null;
  const hasMaxPlan = currentPlan === "BESTSELLER";
  const entryPlan = plans.length > 0
    ? plans.reduce((a, b) => a.monthlyPriceCents < b.monthlyPriceCents ? a : b)
    : null;

  const filteredPacks = allCreditPacks.filter((p) =>
    activeTab === 'premium'
      ? PREMIUM_SLUGS.includes(p.slug)
      : CREDITS_SLUGS.includes(p.slug),
  );

  const handleBuy = async (slug: string) => {
    setLoadingSlug(slug);
    try {
      const res = await checkoutApi.createSession({ productSlug: slug });
      window.location.href = res.url;
    } catch {
      toast.error(t("purchaseError"));
      setLoadingSlug(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href="/dashboard/wallet">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
      </div>

      {/* Tab toggle */}
      <div className="flex justify-center">
        <div className="flex bg-muted rounded-xl p-1 gap-1">
          {(['premium', 'credits'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab === 'premium' ? t('tabPremiumPackages') : t('tabCreditsOnly')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredPacks.map((pack, i) => {
          const Icon = PACK_ICONS[i];
          const pricePerCredit = (pack.priceCents / pack.credits / 100).toFixed(
            2
          );
          const isBest = i === filteredPacks.length - 1;

          return (
            <div
              key={pack.slug}
              className={`glass rounded-[2rem] p-6 border transition-all duration-300 relative ${PACK_COLORS[i]}`}
            >
              {isBest && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  {t("bestValue")}
                </div>
              )}

              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${PACK_ICON_BG[i]}`}
                >
                  <Icon className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-2xl font-black">{pack.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pack.credits} {tCommon("credits")}
                  </p>
                </div>

                <div className="text-4xl font-black text-foreground">
                  ${(pack.priceCents / 100).toFixed(2)}
                </div>

                <p className="text-xs text-muted-foreground">
                  ${pricePerCredit} {t("perCredit")}
                </p>

                <Button
                  className="w-full h-12 rounded-xl font-bold gap-2"
                  disabled={loadingSlug !== null}
                  onClick={() => handleBuy(pack.slug)}
                >
                  {loadingSlug === pack.slug ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      {t("buyNow")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade CTA card */}
      {!hasMaxPlan && entryPlan && (
        <div className="glass rounded-[2rem] border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left — persuasive copy */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-sm font-black uppercase tracking-wider text-amber-500">
                  {t("proTip")}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-foreground leading-tight">
                  {t("upgradeHeadline")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("upgradeDescription", {
                    credits: entryPlan.monthlyCredits,
                    price: (entryPlan.monthlyPriceCents / 100).toFixed(0),
                  })}
                </p>
              </div>

              <ul className="flex flex-col sm:flex-row gap-2 sm:gap-5">
                {([
                  { icon: RefreshCw, text: t("upgradePerk1", { credits: entryPlan.monthlyCredits }) },
                  { icon: RotateCcw, text: t("upgradePerk2", { regens: entryPlan.freeRegensPerMonth }) },
                  { icon: Rocket, text: t("upgradePerk3") },
                ]).map((perk, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <perk.icon className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{perk.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — CTA with rotating border (same as plan-card) */}
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
                <Link href="/dashboard/upgrade">
                  {t("upgradeCta")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
