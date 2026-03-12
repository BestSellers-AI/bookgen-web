"use client";

import { useState } from "react";
import {
  Zap,
  Star,
  Crown,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { checkoutApi } from "@/lib/api/checkout";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import { SubscriptionPlan } from "@bestsellers/shared";
import { useConfigStore } from "@/stores/config-store";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";

const PLAN_ORDER = [
  SubscriptionPlan.ASPIRANTE,
  SubscriptionPlan.PROFISSIONAL,
  SubscriptionPlan.BESTSELLER,
];

const PLAN_ICONS = {
  [SubscriptionPlan.ASPIRANTE]: Zap,
  [SubscriptionPlan.PROFISSIONAL]: Star,
  [SubscriptionPlan.BESTSELLER]: Crown,
};

const PLAN_COLORS = {
  [SubscriptionPlan.ASPIRANTE]:
    "border-blue-500/20 hover:border-blue-500/40",
  [SubscriptionPlan.PROFISSIONAL]:
    "border-primary/20 hover:border-primary/40",
  [SubscriptionPlan.BESTSELLER]:
    "border-amber-500/20 hover:border-amber-500/40",
};

const PLAN_ICON_BG = {
  [SubscriptionPlan.ASPIRANTE]: "bg-blue-500/10 text-blue-500",
  [SubscriptionPlan.PROFISSIONAL]: "bg-primary/10 text-primary",
  [SubscriptionPlan.BESTSELLER]: "bg-amber-500/10 text-amber-500",
};

export default function UpgradePage() {
  const t = useTranslations("upgrade");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const getPlanConfig = useConfigStore((s) => s.getPlanConfig);

  const currentPlan = user?.planInfo?.plan ?? null;
  const hasSubscription = user?.planInfo?.hasSubscription ?? false;

  const getFeatures = (plan: SubscriptionPlan) => {
    const config = getPlanConfig(plan);
    if (!config) return [];
    return [
      t("featureCredits", { count: config.monthlyCredits }),
      t("featureBooks", { count: config.booksPerMonth }),
      t("featureRegens", { count: config.freeRegensPerMonth }),
      config.commercialLicense ? t("featureCommercial") : null,
      config.fullEditor ? t("featureEditor") : null,
      config.prioritySupport ? t("featurePriority") : null,
    ].filter(Boolean) as string[];
  };

  const handleSubscribe = async (planKey: SubscriptionPlan) => {
    setLoadingPlan(planKey);
    try {
      const slug = `plan-${planKey.toLowerCase()}`;
      const interval = annual ? "annual" : "monthly";

      if (!hasSubscription) {
        // New subscription
        const res = await checkoutApi.createSession({
          productSlug: slug,
          billingInterval: interval,
        });
        window.location.href = res.url;
      } else {
        // Change plan
        await subscriptionsApi.changePlan({
          planSlug: slug,
          billingInterval: interval,
        });
        toast.success(t("planChanged"));
        window.location.reload();
      }
    } catch {
      toast.error(t("subscribeError"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const getButtonLabel = (planKey: SubscriptionPlan) => {
    if (!hasSubscription) return t("subscribe");
    if (currentPlan === planKey) return t("currentPlan");
    const currentIndex = currentPlan
      ? PLAN_ORDER.indexOf(currentPlan as SubscriptionPlan)
      : -1;
    const targetIndex = PLAN_ORDER.indexOf(planKey);
    return targetIndex > currentIndex ? t("upgradeTo") : t("downgradeTo");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setAnnual(false)}
          className={`text-sm font-bold transition-colors ${
            !annual ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {t("monthly")}
        </button>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            annual ? "bg-primary" : "bg-muted"
          }`}
        >
          <div
            className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
              annual ? "translate-x-8" : "translate-x-1"
            }`}
          />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnnual(true)}
            className={`text-sm font-bold transition-colors ${
              annual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {t("annual")}
          </button>
          {annual && (
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {t("savePercent")}
            </span>
          )}
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLAN_ORDER.map((planKey) => {
          const config = getPlanConfig(planKey);
          if (!config) return null;
          const Icon = PLAN_ICONS[planKey];
          const isCurrent = currentPlan === planKey;
          const price = annual
            ? config.annualMonthlyEquivalentCents
            : config.monthlyPriceCents;
          const features = getFeatures(planKey);
          const isPopular = planKey === SubscriptionPlan.PROFISSIONAL;

          return (
            <div
              key={planKey}
              className={`glass rounded-[2rem] p-6 border transition-all duration-300 relative ${
                isCurrent
                  ? "border-primary/40 ring-2 ring-primary/20"
                  : PLAN_COLORS[planKey]
              }`}
            >
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  {t("popular")}
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  {t("currentPlan")}
                </div>
              )}

              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${PLAN_ICON_BG[planKey]}`}
                >
                  <Icon className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-xl font-black">{config.name}</h3>
                </div>

                <div>
                  <span className="text-4xl font-black text-foreground">
                    ${(price / 100).toFixed(0)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /{t("month")}
                  </span>
                </div>

                {annual && (
                  <p className="text-xs text-muted-foreground">
                    ${(config.annualPriceCents / 100).toFixed(0)}{" "}
                    {t("billedAnnually")}
                  </p>
                )}

                <ul className="space-y-2 text-sm text-left w-full">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full h-12 rounded-xl font-bold gap-2"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || loadingPlan !== null}
                  onClick={() => handleSubscribe(planKey)}
                >
                  {loadingPlan === planKey ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {getButtonLabel(planKey)}
                      {!isCurrent && <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* One-time purchase for free users */}
      {!hasSubscription && (
        <div className="glass rounded-[2rem] p-6 border border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">{t("oneTimeTitle")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("oneTimeDesc")}
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-xl h-12 px-8 font-bold gap-2 shrink-0"
            >
              <Link href="/dashboard/wallet/buy-credits">
                {t("buyCreditsInstead")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
