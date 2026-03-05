"use client";

import { useState } from "react";
import { ShoppingCart, Loader2, ArrowLeft, Zap, Star, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { checkoutApi } from "@/lib/api/checkout";
import { CREDIT_PACKS } from "@bestsellers/shared";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";

const PACK_ICONS = [Zap, Star, Crown];
const PACK_COLORS = [
  "border-blue-500/20 hover:border-blue-500/40",
  "border-violet-500/20 hover:border-violet-500/40",
  "border-amber-500/20 hover:border-amber-500/40",
];
const PACK_ICON_BG = [
  "bg-blue-500/10 text-blue-500",
  "bg-violet-500/10 text-violet-500",
  "bg-amber-500/10 text-amber-500",
];

export default function BuyCreditsPage() {
  const t = useTranslations("buyCredits");
  const tCommon = useTranslations("common");
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CREDIT_PACKS.map((pack, i) => {
          const Icon = PACK_ICONS[i];
          const pricePerCredit = (pack.priceCents / pack.credits / 100).toFixed(
            2
          );
          const isBest = i === CREDIT_PACKS.length - 1;

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

      <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 text-center">
        <p className="text-sm text-muted-foreground">{t("costInfo")}</p>
      </div>
    </div>
  );
}
