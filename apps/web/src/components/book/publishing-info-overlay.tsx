"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ShieldCheck,
  Zap,
  TrendingUp,
  Globe,
  Star,
  Ban,
  CheckCircle2,
  Crown,
  Rocket,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PublishingInfoOverlayProps {
  open: boolean;
  onClose: () => void;
}

const FAQ_COUNT = 8;
const TESTIMONIAL_COUNT = 3;

export function PublishingInfoOverlay({
  open,
  onClose,
}: PublishingInfoOverlayProps) {
  const t = useTranslations("publishing");

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-2xl overflow-y-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-muted/80 hover:bg-muted transition-colors backdrop-blur-sm border border-border/50"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-20">
        {/* Hero — big, bold, urgent */}
        <section className="text-center space-y-6 pt-8 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent rounded-3xl -mx-8" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-widest mb-4">
              <Rocket className="w-3.5 h-3.5" />
              {t("hero.badge")}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black tracking-tight leading-tight">
              {t("hero.title")}
              <br />
              <span className="text-amber-500">{t("hero.titleHighlight")}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-4 leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <p className="text-sm font-bold text-amber-500 mt-3">
              {t("hero.urgency")}
            </p>
          </div>
        </section>

        {/* Stats bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(
            [
              { value: "2,500+", labelKey: "statsBar.authors" },
              { value: "190+", labelKey: "statsBar.countries" },
              { value: "98%", labelKey: "statsBar.approval" },
              { value: "10", labelKey: "statsBar.days" },
            ] as const
          ).map(({ value, labelKey }) => (
            <div
              key={labelKey}
              className="text-center p-4 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent border border-border/50"
            >
              <p className="text-2xl md:text-3xl font-black text-primary">
                {value}
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {t(labelKey)}
              </p>
            </div>
          ))}
        </section>

        {/* Plan Comparison — Premium highlighted aggressively */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-black">
              {t("plans.title")}
            </h2>
            <p className="text-muted-foreground">{t("plans.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Standard */}
            <div className="glass rounded-3xl p-7 border border-border space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-black">
                  {t("plans.standard.name")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("plans.standard.tagline")}
                </p>
              </div>
              <ul className="space-y-3">
                {(
                  [
                    "formatting",
                    "kdp",
                    "pricing",
                    "isbn",
                    "support",
                    "timeline",
                  ] as const
                ).map((key) => (
                  <li key={key} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{t(`plans.standard.features.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium — pulsing border, crown, glow */}
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-500 via-orange-500 to-amber-500 rounded-3xl opacity-60 blur-[1px]" />
              <div className="relative glass rounded-3xl p-7 space-y-5 bg-background">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-black px-5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/30">
                  <Crown className="w-3.5 h-3.5" />
                  {t("plans.popular")}
                </div>
                <div className="space-y-1 pt-2">
                  <h3 className="text-xl font-black">
                    {t("plans.premium.name")}
                  </h3>
                  <p className="text-xs text-amber-500 font-medium">
                    {t("plans.premium.tagline")}
                  </p>
                </div>
                <ul className="space-y-3">
                  {(
                    [
                      "everything",
                      "multiPlatform",
                      "premiumFormatting",
                      "seo",
                      "marketing",
                      "prioritySupport",
                      "directGuidance",
                    ] as const
                  ).map((key) => (
                    <li
                      key={key}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 mt-0.5 shrink-0" />
                      <span className="font-medium">
                        {t(`plans.premium.features.${key}`)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2 px-1">
                  <div className="flex items-center gap-2 text-xs text-amber-500/80 bg-amber-500/5 rounded-xl p-3 border border-amber-500/10">
                    <Zap className="w-4 h-4 shrink-0" />
                    <span className="font-bold">
                      {t("plans.premium.highlight")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits — bigger cards with glowing stats */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-black">
              {t("benefits.title")}
            </h2>
            <p className="text-muted-foreground">{t("benefits.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {(
              [
                {
                  key: "noRejections",
                  icon: Ban,
                  color: "text-red-400",
                  iconBg: "bg-red-500/10 border-red-500/20",
                  statColor: "text-red-400",
                },
                {
                  key: "fastLaunch",
                  icon: Zap,
                  color: "text-amber-400",
                  iconBg: "bg-amber-500/10 border-amber-500/20",
                  statColor: "text-amber-400",
                },
                {
                  key: "higherSales",
                  icon: TrendingUp,
                  color: "text-emerald-400",
                  iconBg: "bg-emerald-500/10 border-emerald-500/20",
                  statColor: "text-emerald-400",
                },
                {
                  key: "globalReach",
                  icon: Globe,
                  color: "text-blue-400",
                  iconBg: "bg-blue-500/10 border-blue-500/20",
                  statColor: "text-blue-400",
                },
              ] as const
            ).map(({ key, icon: Icon, color, iconBg, statColor }) => (
              <div
                key={key}
                className="glass rounded-3xl p-6 border border-border space-y-3 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${iconBg}`}
                  >
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div>
                    <h3 className="font-black text-base">
                      {t(`benefits.${key}.title`)}
                    </h3>
                    <p className={`text-sm font-black ${statColor}`}>
                      {t(`benefits.${key}.stat`)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`benefits.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials — with quote marks and glow */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-black">
              {t("testimonials.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("testimonials.subtitle")}
            </p>
          </div>

          {/* Customer Photos */}
          <div className="max-w-4xl mx-auto glass rounded-3xl p-4 sm:p-6 border border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {['/lp/amazon/1.jpeg', '/lp/amazon/2.jpeg', '/lp/amazon/3.jpeg', '/lp/amazon/4.jpeg'].map((src, i) => (
                <div
                  key={src}
                  className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border/50"
                >
                  <Image
                    src={src}
                    alt={`Amazon KDP ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Array.from({ length: TESTIMONIAL_COUNT }, (_, i) => (
              <div
                key={i}
                className="glass rounded-3xl p-6 border border-border space-y-4 relative overflow-hidden"
              >
                <div className="absolute top-3 right-4 text-6xl font-serif text-primary/10 leading-none select-none">
                  &ldquo;
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 text-amber-500 fill-amber-500"
                    />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed relative z-10">
                  &ldquo;{t(`testimonials.items.${i}.quote`)}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-black text-sm">
                    {t(`testimonials.items.${i}.author`).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black">
                      {t(`testimonials.items.${i}.author`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(`testimonials.items.${i}.role`)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-black">
              {t("faq.title")}
            </h2>
            <p className="text-muted-foreground">{t("faq.subtitle")}</p>
          </div>
          <Accordion
            type="single"
            collapsible
            className="max-w-3xl mx-auto space-y-2"
          >
            {Array.from({ length: FAQ_COUNT }, (_, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="glass rounded-2xl border border-border px-5 overflow-hidden"
              >
                <AccordionTrigger className="text-left text-sm font-bold hover:no-underline py-4">
                  {t(`faq.items.${i}.question`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  {t(`faq.items.${i}.answer`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Guarantee — big, green, confident */}
        <section className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent" />
            <div className="relative glass rounded-3xl p-8 border-2 border-emerald-500/30 space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black">{t("guarantee.title")}</h3>
              <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
                {t("guarantee.description")}
              </p>
              <p className="text-sm font-bold text-emerald-500">
                {t("guarantee.badge")}
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center space-y-4 pb-8">
          <p className="text-lg font-bold text-muted-foreground">
            {t("cta.text")}
          </p>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-sm uppercase tracking-wider hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300"
          >
            {t("cta.button")}
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </div>
    </div>,
    document.body
  );
}
