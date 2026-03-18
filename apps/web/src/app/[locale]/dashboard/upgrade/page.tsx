"use client";

import { useState } from "react";
import {
  Loader2,
  ArrowRight,
  Check,
  X,
  Sparkles,
  RefreshCw,
  RotateCcw,
  Rocket,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { checkoutApi } from "@/lib/api/checkout";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import { SubscriptionPlan } from "@bestsellers/shared";
import { useConfigStore } from "@/stores/config-store";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { useSearchParams } from "next/navigation";
import CreditCard from "@/components/landing/pricing/CreditCard";
import PlanCalculator from "@/components/landing/pricing/PlanCalculator";
import { buildCreditPacks, buildServices } from "@/lib/landing-pricing-data";
import clsx from "clsx";

// ─── Types ───────────────────────────────────────────────────────────────────

type PricingTab = "plans" | "credits";

// ─── Static feature lists per plan ───────────────────────────────────────────

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

const CheckIcon = () => (
  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4 dark:text-white/20 text-navy-900/20 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function UpgradePage() {
  const t = useTranslations("upgrade");
  const tFeatures = useTranslations("landingV2.pricing");
  const tPlan = useTranslations("planNames");
  const tBuy = useTranslations("buyCredits");
  const { user } = useAuth();

  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "credits" ? "credits" : "plans";

  const [activeTab, setActiveTab] = useState<PricingTab>(initialTab as PricingTab);
  const [annual, setAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [highlightedPlan, setHighlightedPlan] = useState<string | null>(null);

  const getPlanConfig = useConfigStore((s) => s.getPlanConfig);
  const getSubscriptionPlans = useConfigStore((s) => s.getSubscriptionPlans);
  const configPacks = useConfigStore((s) => s.config?.creditPacks);
  const configCreditsCost = useConfigStore((s) => s.config?.creditsCost);

  const currentPlan = user?.planInfo?.plan ?? null;
  const hasSubscription = user?.planInfo?.hasSubscription ?? false;

  const creditPacks = buildCreditPacks(configPacks);
  const services = buildServices(configCreditsCost);
  const allPlans = getSubscriptionPlans();
  const hasMaxPlan = currentPlan === "BESTSELLER";
  const entryPlan = allPlans.length > 0
    ? allPlans.reduce((a, b) => a.monthlyPriceCents < b.monthlyPriceCents ? a : b)
    : null;

  // ─── Plans handlers ──────────────────────────────────────────────────────

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

  // ─── Credits handler ─────────────────────────────────────────────────────

  const handleBuyCredits = async (slug: string) => {
    setLoadingSlug(slug);
    try {
      const res = await checkoutApi.createSession({ productSlug: slug });
      window.location.href = res.url;
    } catch {
      toast.error(t("purchaseError"));
      setLoadingSlug(null);
    }
  };

  // ─── Comparison table rows ───────────────────────────────────────────────

  const comparisonRows = [
    { label: tFeatures("whySubRow1Label"), price: tFeatures("whySubRow1Price"), savings: tFeatures("whySubRow1Savings"), highlight: false },
    { label: tFeatures("whySubRow2Label"), price: tFeatures("whySubRow2Price"), savings: tFeatures("whySubRow2Savings"), highlight: false },
    { label: tFeatures("whySubRow3Label"), price: tFeatures("whySubRow3Price"), savings: tFeatures("whySubRow3Savings"), highlight: true },
    { label: tFeatures("whySubRow4Label"), price: tFeatures("whySubRow4Price"), savings: tFeatures("whySubRow4Savings"), highlight: false },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Tab Toggle */}
      <div className="flex justify-center">
        <div className="flex dark:bg-navy-800/80 bg-cream-200/80 backdrop-blur-sm rounded-2xl p-1.5 border dark:border-white/[0.08] border-navy-900/[0.08]">
          {(["plans", "credits"] as PricingTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-7 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                activeTab === tab
                  ? "bg-gold-500 text-navy-900 shadow-gold-sm"
                  : "dark:text-cream-400 text-navy-700 dark:hover:text-cream-200 hover:text-navy-900",
              )}
            >
              {tab === "plans" ? t("tabPlans") : t("tabCredits")}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "plans" ? (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {/* Billing Toggle */}
            <div className="flex justify-center items-center gap-4">
              <span
                className={clsx(
                  "text-sm transition-colors cursor-pointer",
                  !annual
                    ? "dark:text-cream-200 text-navy-900 font-medium"
                    : "dark:text-cream-500 text-navy-600"
                )}
                onClick={() => setAnnual(false)}
              >
                {t("monthly")}
              </span>

              <button
                onClick={() => setAnnual(!annual)}
                className="relative w-14 h-7 dark:bg-navy-700 bg-cream-300 rounded-full border dark:border-white/10 border-navy-900/10 transition-colors dark:hover:border-white/20 hover:border-navy-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                aria-label="Toggle billing period"
              >
                <motion.div
                  animate={{ x: annual ? 28 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 w-6 h-6 bg-gold-500 rounded-full shadow-gold-sm"
                />
              </button>

              <span
                className={clsx(
                  "text-sm transition-colors flex items-center gap-2 cursor-pointer",
                  annual
                    ? "dark:text-cream-200 text-navy-900 font-medium"
                    : "dark:text-cream-500 text-navy-600"
                )}
                onClick={() => setAnnual(true)}
              >
                {t("annual")}
                {annual && (
                  <span className="dark:bg-gold-500/15 bg-gold-600/15 border dark:border-gold-500/25 border-gold-600/25 dark:text-gold-400 text-gold-700 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                    {t("savePercent")}
                  </span>
                )}
              </span>
            </div>

            <div className="dark:bg-white/[0.025] bg-navy-900/[0.025] border dark:border-white/[0.07] border-navy-900/[0.07] rounded-2xl">
              <PlanCalculator onRecommend={setHighlightedPlan} />
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {PLAN_ORDER.map((planKey, i) => {
                const config = getPlanConfig(planKey);
                if (!config) return null;
                const isCurrent = currentPlan === planKey;
                // Map calculator recommendation IDs to plan enums
                const calcIdMap: Record<string, string> = { autor: SubscriptionPlan.ASPIRANTE, profissional: SubscriptionPlan.PROFISSIONAL, bestseller: SubscriptionPlan.BESTSELLER };
                const reversCalcIdMap: Record<string, string> = { [SubscriptionPlan.ASPIRANTE]: "autor", [SubscriptionPlan.PROFISSIONAL]: "profissional", [SubscriptionPlan.BESTSELLER]: "bestseller" };
                const isHighlighted = highlightedPlan ? calcIdMap[highlightedPlan] === planKey : false;
                const planDomId = `plan-${reversCalcIdMap[planKey] ?? planKey.toLowerCase()}`;
                const isPopular = isHighlighted || planKey === SubscriptionPlan.PROFISSIONAL;
                const price = annual
                  ? config.annualMonthlyEquivalentCents
                  : config.monthlyPriceCents;
                const strikePrice = annual ? config.monthlyPriceCents : null;
                const features = PLAN_FEATURES[planKey];
                const savingsPercent = annual
                  ? Math.round(
                      (1 -
                        config.annualPriceCents /
                          (config.monthlyPriceCents * 12)) *
                        100
                    )
                  : 0;

                return (
                  <motion.div
                    key={planKey}
                    id={planDomId}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className={clsx(
                      "relative flex flex-col rounded-2xl transition-all duration-300 overflow-hidden",
                      isCurrent
                        ? "dark:border-gold-500/40 border-gold-600/40 border-2 shadow-gold-md"
                        : isPopular
                          ? "bg-card-popular dark:border-gold-500/28 border-gold-600/28 border shadow-gold-md"
                          : "dark:bg-white/[0.025] bg-navy-900/[0.025] border dark:border-white/[0.07] border-navy-900/[0.07] dark:hover:border-white/[0.12] hover:border-navy-900/[0.12]",
                      "hover:shadow-card-hover"
                    )}
                  >
                    {/* Badges */}
                    {(isPopular || isCurrent) && (
                      <div className="flex flex-col items-center gap-1.5 pt-4 pb-0">
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1.5 bg-gold-500 text-navy-900 text-xs font-bold px-4 py-1 rounded-full tracking-wide">
                            {t("currentPlan")}
                          </span>
                        )}
                        {isPopular && !isCurrent && (
                          <span className="inline-flex items-center gap-1.5 bg-gold-500 text-navy-900 text-xs font-bold px-4 py-1 rounded-full tracking-wide">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {tFeatures("planBadgeMostPopular")}
                          </span>
                        )}
                        {annual && savingsPercent > 0 && (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full tracking-wide">
                            -{savingsPercent}%
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col flex-1 p-6 pt-5">
                      {/* Plan name */}
                      <div className="mb-5">
                        <h3
                          className={clsx(
                            "font-playfair font-bold text-2xl mb-1.5",
                            isPopular || isCurrent
                              ? "dark:text-gold-400 text-gold-700"
                              : "dark:text-cream-200 text-navy-900"
                          )}
                        >
                          {tPlan(planKey)}
                        </h3>
                        <p className="dark:text-cream-400 text-navy-700 text-sm font-medium">
                          {tFeatures("upToBooksPerMonth", {
                            count: config.booksPerMonth,
                            credits: config.monthlyCredits.toLocaleString(),
                          })}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="mb-2">
                        {strikePrice !== null && (
                          <p className="dark:text-cream-400 text-navy-500 text-sm line-through mb-0.5">
                            ${(strikePrice / 100).toFixed(0)}
                            {tFeatures("perMonth")}
                          </p>
                        )}
                        <div className="flex items-end gap-1.5">
                          <span
                            className={clsx(
                              "font-playfair font-bold leading-none",
                              isPopular || isCurrent
                                ? "dark:text-gold-400 text-gold-700 text-5xl"
                                : "dark:text-cream-200 text-navy-900 text-4xl"
                            )}
                          >
                            ${(price / 100).toFixed(0)}
                          </span>
                          <span className="dark:text-cream-500 text-navy-600 text-sm mb-1">
                            {tFeatures("perMonth")}
                          </span>
                        </div>
                        {annual && (
                          <p className="dark:text-cream-400 text-navy-600 text-sm mt-1">
                            {tFeatures("annualBilling", {
                              total: (config.annualPriceCents / 100).toFixed(0),
                            })}
                          </p>
                        )}
                      </div>

                      {/* Highlight */}
                      {planKey !== SubscriptionPlan.ASPIRANTE && (
                        <p className="text-xs dark:text-cream-400 text-navy-600 italic leading-snug min-h-[2.5rem] mt-1">
                          {tFeatures(
                            planKey === SubscriptionPlan.PROFISSIONAL
                              ? "planProfissionalHighlight"
                              : "planBestsellerHighlight"
                          )}
                        </p>
                      )}

                      <div
                        className={clsx(
                          "my-5 h-px",
                          isPopular || isCurrent
                            ? "dark:bg-gold-500/15 bg-gold-600/15"
                            : "dark:bg-white/[0.06] bg-navy-900/[0.06]"
                        )}
                      />

                      {/* Features */}
                      <ul className="flex flex-col gap-2.5 flex-1">
                        {features.map((feature) => (
                          <li
                            key={feature.textKey}
                            className="flex items-start gap-2.5 text-sm"
                          >
                            {feature.included ? <CheckIcon /> : <XIcon />}
                            <span
                              className={clsx(
                                "flex-1 leading-snug",
                                feature.included
                                  ? "dark:text-cream-300 text-navy-800"
                                  : "dark:text-cream-500/50 text-navy-500/50 line-through"
                              )}
                            >
                              {tFeatures(feature.textKey)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <div className="mt-6">
                        {isCurrent ? (
                          <Button
                            variant="outline"
                            className="w-full py-3 rounded-xl font-semibold text-sm dark:bg-white/[0.07] bg-navy-900/[0.07] dark:text-cream-200 text-navy-900 border dark:border-white/10 border-navy-900/10"
                            disabled
                          >
                            {t("currentPlan")}
                          </Button>
                        ) : isPopular ? (
                          <div className="relative rounded-xl p-[2px] overflow-hidden w-full">
                            <div
                              className="absolute top-1/2 left-1/2 w-[200%] aspect-square animate-border-spin"
                              style={{
                                background:
                                  "conic-gradient(from 0deg, transparent 0%, transparent 60%, #f4eee6 75%, #ffffff 85%, #f4eee6 95%, transparent 100%)",
                              }}
                            />
                            <button
                              className="relative w-full py-3 rounded-[calc(0.75rem-2px)] font-semibold text-sm transition-all duration-200 active:scale-[0.98] bg-gold-500 hover:bg-gold-600 text-navy-900 shadow-gold-sm hover:shadow-gold-md disabled:opacity-50"
                              disabled={loadingPlan !== null}
                              onClick={() => handleSubscribe(planKey)}
                            >
                              {loadingPlan === planKey ? (
                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                              ) : (
                                <span className="inline-flex items-center gap-2">
                                  {getButtonLabel(planKey)}
                                  <ArrowRight className="w-4 h-4" />
                                </span>
                              )}
                            </button>
                          </div>
                        ) : (
                          <button
                            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] dark:bg-white/[0.07] bg-navy-900/[0.07] dark:hover:bg-white/[0.12] hover:bg-navy-900/[0.12] dark:text-cream-200 text-navy-900 border dark:border-white/10 border-navy-900/10 dark:hover:border-white/20 hover:border-navy-900/20 disabled:opacity-50"
                            disabled={loadingPlan !== null}
                            onClick={() => handleSubscribe(planKey)}
                          >
                            {loadingPlan === planKey ? (
                              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              <span className="inline-flex items-center gap-2">
                                {getButtonLabel(planKey)}
                                <ArrowRight className="w-4 h-4" />
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Comparison Table — Why Subscribe */}
            <div className="pt-8">
              <div className="text-center mb-8">
                <h3 className="font-playfair font-bold text-2xl md:text-3xl dark:text-cream-200 text-navy-900">
                  {tFeatures("whySubscribeTitle")}
                </h3>
                <p className="dark:text-cream-500 text-navy-600 text-sm mt-2">{tFeatures("whySubscribeSubtitle")}</p>
              </div>

              <div className="dark:bg-white/[0.025] bg-navy-900/[0.025] border dark:border-white/[0.07] border-navy-900/[0.07] rounded-2xl overflow-hidden max-w-2xl mx-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-white/[0.06] border-navy-900/[0.06] dark:bg-white/[0.02] bg-navy-900/[0.02]">
                      <th className="text-left py-3 px-5 dark:text-cream-500 text-navy-600 font-medium text-xs uppercase tracking-wider">{tFeatures("whySubColPlan")}</th>
                      <th className="text-right py-3 px-5 dark:text-cream-500 text-navy-600 font-medium text-xs uppercase tracking-wider">{tFeatures("whySubColPerBook")}</th>
                      <th className="text-right py-3 px-5 dark:text-cream-500 text-navy-600 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">{tFeatures("whySubColSavings")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr
                        key={row.label}
                        className={clsx(
                          "border-b dark:border-white/[0.04] border-navy-900/[0.04] last:border-0",
                          row.highlight ? "dark:bg-gold-500/[0.06] bg-gold-600/[0.06]" : "dark:hover:bg-white/[0.02] hover:bg-navy-900/[0.02]",
                        )}
                      >
                        <td className={clsx(
                          "py-3.5 px-5",
                          row.highlight ? "dark:text-gold-400 text-gold-700 font-semibold" : "dark:text-cream-300 text-navy-800",
                        )}>
                          {row.label}
                          {row.highlight && (
                            <svg className="w-3.5 h-3.5 inline-block ml-1.5 mb-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )}
                        </td>
                        <td className={clsx(
                          "py-3.5 px-5 text-right font-mono font-bold",
                          row.highlight ? "dark:text-gold-400 text-gold-700 text-base" : "dark:text-cream-200 text-navy-900",
                        )}>
                          {row.price}
                        </td>
                        <td className={clsx(
                          "py-3.5 px-5 text-right text-xs hidden sm:table-cell",
                          row.highlight ? "dark:text-gold-400 text-gold-700 font-semibold" : "dark:text-cream-500 text-navy-600",
                        )}>
                          {row.savings}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Buy credits one-off CTA */}
            <div className="dark:bg-white/[0.025] bg-navy-900/[0.025] border dark:border-white/[0.07] border-navy-900/[0.07] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold dark:text-cream-200 text-navy-900">
                  {t("oneTimeTitle")}
                </p>
                <p className="text-xs dark:text-cream-500 text-navy-600 mt-0.5">
                  {t("oneTimeDesc")}
                </p>
              </div>
              <button
                className="text-sm font-bold dark:text-cream-200 text-navy-900 dark:hover:text-gold-400 hover:text-gold-700 transition-colors flex items-center gap-1.5 shrink-0 border dark:border-white/10 border-navy-900/10 dark:hover:border-gold-500/30 hover:border-gold-600/30 rounded-xl px-5 py-2.5"
                onClick={() => setActiveTab("credits")}
              >
                {t("buyCreditsInstead")}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="credits"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {/* Credits header banner */}
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2.5 dark:bg-gold-500/[0.08] bg-gold-600/[0.08] border dark:border-gold-500/20 border-gold-600/20 rounded-xl px-5 py-3 text-sm">
                <span className="dark:text-gold-400 text-gold-600 text-base">💡</span>
                <span className="dark:text-cream-300 text-navy-800">
                  {tFeatures("creditsBanner")}{" "}
                  <strong className="dark:text-gold-400 text-gold-700">{tFeatures("creditsBannerBold")}</strong>
                </span>
              </div>
            </div>

            {/* Credit Pack Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {creditPacks.map((pack, i) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                >
                  <CreditCard
                    pack={pack}
                    onBuy={() => handleBuyCredits(pack.slug)}
                    loading={loadingSlug === pack.slug}
                  />
                </motion.div>
              ))}
            </div>

            {/* Services Table */}
            <div className="pt-8">
              <div className="text-center mb-8">
                <h3 className="font-playfair font-bold text-2xl md:text-3xl dark:text-cream-200 text-navy-900">
                  {tFeatures("servicesTitle")}
                </h3>
                <p className="dark:text-cream-500 text-navy-600 text-sm mt-2">{tFeatures("servicesSubtitle")}</p>
              </div>

              <div className="dark:bg-white/[0.025] bg-navy-900/[0.025] border dark:border-white/[0.07] border-navy-900/[0.07] rounded-2xl overflow-hidden max-w-lg mx-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-white/[0.06] border-navy-900/[0.06] dark:bg-white/[0.02] bg-navy-900/[0.02]">
                      <th className="text-left py-3 px-6 dark:text-cream-500 text-navy-600 font-medium text-xs uppercase tracking-wider">{tFeatures("servicesColName")}</th>
                      <th className="text-right py-3 px-6 dark:text-cream-500 text-navy-600 font-medium text-xs uppercase tracking-wider">{tFeatures("servicesColCredits")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr
                        key={service.nameKey}
                        className="border-b dark:border-white/[0.04] border-navy-900/[0.04] last:border-0 dark:hover:bg-white/[0.02] hover:bg-navy-900/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-6 dark:text-cream-300 text-navy-800">{tFeatures(service.nameKey)}</td>
                        <td className="py-3.5 px-6 text-right font-mono dark:text-gold-400 text-gold-700 font-bold">{service.credits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pro Tip — upgrade CTA */}
            {!hasMaxPlan && entryPlan && (
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </div>
                      <p className="text-sm font-black uppercase tracking-wider text-amber-500">
                        {tBuy("proTip")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-black dark:text-cream-200 text-navy-900 leading-tight">
                        {tBuy("upgradeHeadline")}
                      </h3>
                      <p className="text-sm dark:text-cream-400 text-navy-600 leading-relaxed">
                        {tBuy("upgradeDescription", {
                          credits: entryPlan.monthlyCredits,
                          price: (entryPlan.monthlyPriceCents / 100).toFixed(0),
                        })}
                      </p>
                    </div>

                    <ul className="flex flex-col sm:flex-row gap-2 sm:gap-5">
                      {([
                        { icon: RefreshCw, text: tBuy("upgradePerk1", { credits: entryPlan.monthlyCredits }) },
                        { icon: RotateCcw, text: tBuy("upgradePerk2", { regens: entryPlan.freeRegensPerMonth }) },
                        { icon: Rocket, text: tBuy("upgradePerk3") },
                      ] as const).map((perk, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm dark:text-cream-400 text-navy-600">
                          <perk.icon className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>{perk.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="relative rounded-xl p-[2px] overflow-hidden w-full md:w-auto shrink-0">
                    <div
                      className="absolute top-1/2 left-1/2 w-[200%] aspect-square animate-border-spin"
                      style={{
                        background: "conic-gradient(from 0deg, transparent 0%, transparent 60%, #f4eee6 75%, #ffffff 85%, #f4eee6 95%, transparent 100%)",
                      }}
                    />
                    <button
                      className="relative w-full md:w-auto rounded-[calc(0.75rem-2px)] px-8 py-3 font-bold text-sm transition-all duration-200 active:scale-[0.98] bg-gold-500 hover:bg-gold-600 text-navy-900 shadow-gold-sm hover:shadow-gold-md flex items-center justify-center gap-2"
                      onClick={() => setActiveTab("plans")}
                    >
                      {tBuy("upgradeCta")}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Switch to Plans CTA */}
            {!hasSubscription && hasMaxPlan && (
              <div className="dark:bg-white/[0.025] bg-navy-900/[0.025] border dark:border-white/[0.07] border-navy-900/[0.07] rounded-2xl p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold dark:text-cream-200 text-navy-900">
                      {t("oneTimeTitle")}
                    </h3>
                    <p className="text-sm dark:text-cream-400 text-navy-600">
                      {t("oneTimeDesc")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-xl h-12 px-8 font-bold gap-2 shrink-0"
                    onClick={() => setActiveTab("plans")}
                  >
                    {t("viewPlans")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
