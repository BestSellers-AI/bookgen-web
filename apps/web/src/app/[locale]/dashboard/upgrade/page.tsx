"use client";

import { useState } from "react";
import {
  Zap,
  Star,
  Crown,
  Check,
  X,
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

// ─── Static feature lists per plan (same as landing page) ─────────────────────

interface PlanFeature {
  textKey: string;
  included: boolean;
}

const PLAN_FEATURES: Record<string, PlanFeature[]> = {
  [SubscriptionPlan.ASPIRANTE]: [
    { textKey: "planFeature300Credits", included: true },
    { textKey: "planFeaturePersonalLicense", included: true },
    { textKey: "planFeature30Languages", included: true },
    { textKey: "planFeatureDocxPdf", included: true },
    { textKey: "planFeatureEditor", included: true },
    { textKey: "planFeatureImages", included: true },
    { textKey: "planFeatureAudiobook", included: true },
    { textKey: "planFeatureShare", included: true },
    { textKey: "planFeatureSupport247", included: true },
    { textKey: "planFeature1Regen", included: true },
    { textKey: "planFeatureHistory30", included: true },
    { textKey: "planFeatureStandardQueue", included: true },
    { textKey: "planFeatureCreditsExpire", included: false },
  ],
  [SubscriptionPlan.PROFISSIONAL]: [
    { textKey: "planFeature750Credits", included: true },
    { textKey: "planFeatureCommercialLicense", included: true },
    { textKey: "planFeature30Languages", included: true },
    { textKey: "planFeatureDocxPdf", included: true },
    { textKey: "planFeatureFullEditor", included: true },
    { textKey: "planFeatureImages", included: true },
    { textKey: "planFeatureAudiobook", included: true },
    { textKey: "planFeatureShare", included: true },
    { textKey: "planFeatureSupport247", included: true },
    { textKey: "planFeature2Regens", included: true },
    { textKey: "planFeatureHistory6m", included: true },
    { textKey: "planFeaturePriorityQueue", included: true },
    { textKey: "planFeature10Discount", included: true },
    { textKey: "planFeatureCreditsAccum1m", included: true },
  ],
  [SubscriptionPlan.BESTSELLER]: [
    { textKey: "planFeature2000Credits", included: true },
    { textKey: "planFeatureCommercialLicense", included: true },
    { textKey: "planFeature30Languages", included: true },
    { textKey: "planFeatureDocxPdf", included: true },
    { textKey: "planFeatureFullEditor", included: true },
    { textKey: "planFeatureImages", included: true },
    { textKey: "planFeatureAudiobook", included: true },
    { textKey: "planFeatureShare", included: true },
    { textKey: "planFeaturePriorityHuman", included: true },
    { textKey: "planFeature5Regens", included: true },
    { textKey: "planFeatureHistoryUnlimited", included: true },
    { textKey: "planFeatureExpressQueue", included: true },
    { textKey: "planFeature15Discount", included: true },
    { textKey: "planFeatureCreditsAccum3m", included: true },
  ],
};

// ─── Plan display config ──────────────────────────────────────────────────────

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
  const tFeatures = useTranslations("landingV2.pricing");
  const { user } = useAuth();
  const [annual, setAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const getPlanConfig = useConfigStore((s) => s.getPlanConfig);

  const currentPlan = user?.planInfo?.plan ?? null;
  const hasSubscription = user?.planInfo?.hasSubscription ?? false;

  const handleSubscribe = async (planKey: SubscriptionPlan) => {
    setLoadingPlan(planKey);
    try {
      const slug = `plan-${planKey.toLowerCase()}`;
      const interval = annual ? "annual" : "monthly";

      if (!hasSubscription) {
        const res = await checkoutApi.createSession({
          productSlug: slug,
          billingInterval: interval,
        });
        window.location.href = res.url;
      } else {
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
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

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
          const features = PLAN_FEATURES[planKey];
          const isPopular = planKey === SubscriptionPlan.PROFISSIONAL;
          const savingsPercent = annual
            ? Math.round(
                (1 - config.annualPriceCents / (config.monthlyPriceCents * 12)) *
                  100
              )
            : 0;

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

                {/* Price */}
                <div>
                  {annual && (
                    <div className="text-sm text-muted-foreground line-through mb-1">
                      ${(config.monthlyPriceCents / 100).toFixed(0)}/{t("month")}
                    </div>
                  )}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black text-foreground">
                      ${(price / 100).toFixed(0)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{t("month")}
                    </span>
                  </div>
                </div>

                {annual && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      ${(config.annualPriceCents / 100).toFixed(0)}{" "}
                      {t("billedAnnually")}
                    </p>
                    {savingsPercent > 0 && (
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        -{savingsPercent}%
                      </span>
                    )}
                  </div>
                )}

                {/* Highlight */}
                <p className="text-xs text-muted-foreground italic leading-snug min-h-[2.5rem]">
                  {tFeatures(
                    planKey === SubscriptionPlan.ASPIRANTE
                      ? "planAutorHighlight"
                      : planKey === SubscriptionPlan.PROFISSIONAL
                        ? "planProfissionalHighlight"
                        : "planBestsellerHighlight"
                  )}
                </p>

                {/* Full feature list */}
                <ul className="space-y-2 text-sm text-left w-full">
                  {features.map((feature) => (
                    <li
                      key={feature.textKey}
                      className={`flex items-start gap-2 ${
                        !feature.included ? "text-muted-foreground/50" : ""
                      }`}
                    >
                      {feature.included ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          !feature.included ? "line-through" : ""
                        }
                      >
                        {tFeatures(feature.textKey)}
                      </span>
                    </li>
                  ))}
                </ul>

                {planKey !== SubscriptionPlan.ASPIRANTE && !isCurrent ? (
                  <div className="relative rounded-xl p-[2px] overflow-hidden w-full">
                    <div
                      className="absolute top-1/2 left-1/2 w-[200%] aspect-square animate-border-spin"
                      style={{
                        background:
                          "conic-gradient(from 0deg, transparent 0%, transparent 60%, #f4eee6 75%, #ffffff 85%, #f4eee6 95%, transparent 100%)",
                      }}
                    />
                    <Button
                      className="relative w-full h-12 rounded-[calc(0.75rem-2px)] font-bold gap-2 glow-primary"
                      disabled={loadingPlan !== null}
                      onClick={() => handleSubscribe(planKey)}
                    >
                      {loadingPlan === planKey ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {getButtonLabel(planKey)}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
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
                )}
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
