"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Pencil,
  Plus,
  XCircle,
  Save,
  Loader2,
  Info,
  DollarSign,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  adminApi,
  type AdminProduct,
  type AdminProductPrice,
  type AdminAppConfig,
} from "@/lib/api/admin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function kindLabel(kind: string): string {
  return kind
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Hint box component
// ---------------------------------------------------------------------------
function HintBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-sm text-muted-foreground">
      <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product-kind grouping
// ---------------------------------------------------------------------------
const PAID_USD_KINDS = new Set(["SUBSCRIPTION_PLAN", "CREDIT_PACK", "ONE_TIME_BOOK"]);
const CREDIT_BASED_KINDS = new Set([
  "BOOK_GENERATION",
  "ADDON_COVER",
  "ADDON_TRANSLATION",
  "ADDON_COVER_TRANSLATION",
  "ADDON_AMAZON_STANDARD",
  "ADDON_AMAZON_PREMIUM",
  "ADDON_IMAGES",
  "ADDON_AUDIOBOOK",
]);

// ---------------------------------------------------------------------------
// Credit cost labels for the dedicated form
// ---------------------------------------------------------------------------
const CREDIT_COST_KEYS = [
  { key: "BOOK_GENERATION", icon: "📖" },
  { key: "CHAPTER_REGENERATION", icon: "🔄" },
  { key: "ADDON_COVER", icon: "🎨" },
  { key: "ADDON_TRANSLATION", icon: "🌍" },
  { key: "ADDON_COVER_TRANSLATION", icon: "🖼️" },
  { key: "ADDON_AMAZON_STANDARD", icon: "📦" },
  { key: "ADDON_AMAZON_PREMIUM", icon: "⭐" },
  { key: "ADDON_IMAGES", icon: "🖼️" },
  { key: "ADDON_AUDIOBOOK", icon: "🎧" },
] as const;

// ---------------------------------------------------------------------------
// Subscription metadata fields definition
// ---------------------------------------------------------------------------
const PLAN_METADATA_FIELDS = [
  { key: "monthlyCredits", type: "number" as const },
  { key: "booksPerMonth", type: "number" as const },
  { key: "freeRegensPerMonth", type: "number" as const },
  { key: "creditAccumulationMonths", type: "number" as const },
  { key: "amazonDiscount", type: "number" as const },
  { key: "historyRetentionDays", type: "number_nullable" as const },
  { key: "commercialLicense", type: "boolean" as const },
  { key: "fullEditor", type: "boolean" as const },
  { key: "prioritySupport", type: "boolean" as const },
  { key: "queuePriority", type: "select" as const, options: ["standard", "priority", "express"] },
] as const;

// ---------------------------------------------------------------------------
// Translations type alias
// ---------------------------------------------------------------------------
type T = ReturnType<typeof useTranslations>;

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AdminProductsPage() {
  const t = useTranslations("adminProducts");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [configs, setConfigs] = useState<AdminAppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [prods, cfgs] = await Promise.all([
        adminApi.listProducts(),
        adminApi.getAppConfigs(),
      ]);
      setProducts(prods);
      setConfigs(cfgs);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-10 w-96" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <ErrorState onRetry={fetchAll} />
      </div>
    );
  }

  // Group products
  const subscriptions = products.filter((p) => p.kind === "SUBSCRIPTION_PLAN");
  const creditPacks = products.filter(
    (p) => p.kind === "CREDIT_PACK" || p.kind === "ONE_TIME_BOOK",
  );
  const creditBasedProducts = products.filter((p) => CREDIT_BASED_KINDS.has(p.kind));

  // Find CREDITS_COST config
  const creditsCostConfig = configs.find((c) => c.key === "CREDITS_COST");
  const otherConfigs = configs.filter((c) => c.key !== "CREDITS_COST");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {/* Pricing model summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
          <DollarSign className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-foreground">{t("paidUsdTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("paidUsdDesc")}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
          <Coins className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-foreground">{t("paidCreditsTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("paidCreditsDesc")}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="subscriptions" className="rounded-lg">
            {t("tabSubscriptions")}
          </TabsTrigger>
          <TabsTrigger value="credit-packs" className="rounded-lg">
            {t("tabCreditPacks")}
          </TabsTrigger>
          <TabsTrigger value="credit-costs" className="rounded-lg">
            {t("tabCreditCosts")}
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg">
            {t("tabSettings")}
          </TabsTrigger>
        </TabsList>

        {/* ── Subscriptions (USD) ───────────────────────────────────────── */}
        <TabsContent value="subscriptions" className="space-y-4">
          <HintBox>
            <p className="font-semibold text-foreground">{t("subsHintTitle")}</p>
            <p>{t("subsHintDesc")}</p>
            <p>{t("subsHintMetadata")}</p>
            <p className="text-xs text-amber-400">{t("subsHintPriceWarning")}</p>
          </HintBox>
          <ProductTable
            products={subscriptions}
            showBilling
            showUsdPrice
            onRefresh={fetchAll}
            t={t}
          />
        </TabsContent>

        {/* ── Credit Packs (USD) ────────────────────────────────────────── */}
        <TabsContent value="credit-packs" className="space-y-4">
          <HintBox>
            <p className="font-semibold text-foreground">{t("packsHintTitle")}</p>
            <p>{t("packsHintDesc")}</p>
          </HintBox>
          <ProductTable
            products={creditPacks}
            showUsdPrice
            onRefresh={fetchAll}
            t={t}
          />
        </TabsContent>

        {/* ── Credit Costs (dedicated form) ─────────────────────────────── */}
        <TabsContent value="credit-costs" className="space-y-4">
          <HintBox>
            <p className="font-semibold text-foreground">{t("costsHintTitle")}</p>
            <p>{t("costsHintDesc")}</p>
          </HintBox>
          {creditsCostConfig ? (
            <CreditCostsForm config={creditsCostConfig} onRefresh={fetchAll} t={t} />
          ) : (
            <div className="glass rounded-[2rem] p-10 text-center text-muted-foreground">
              {t("noCreditsCostConfig")}
            </div>
          )}
        </TabsContent>

        {/* ── Settings (Free Tier + Bundles) ────────────────────────────── */}
        <TabsContent value="settings" className="space-y-4">
          <HintBox>
            <p className="font-semibold text-foreground">{t("settingsHintTitle")}</p>
            <p>{t("settingsHintDesc")}</p>
            <p className="text-xs text-amber-400">{t("settingsHintWarning")}</p>
          </HintBox>
          <AppConfigSection configs={otherConfigs} onRefresh={fetchAll} t={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===========================================================================
// CreditCostsForm — dedicated form for CREDITS_COST (not raw JSON)
// ===========================================================================
function CreditCostsForm({
  config,
  onRefresh,
  t,
}: {
  config: AdminAppConfig;
  onRefresh: () => Promise<void>;
  t: T;
}) {
  const initialValues = config.value as Record<string, number>;
  const [values, setValues] = useState<Record<string, number>>({ ...initialValues });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleChange = (key: string, val: string) => {
    const num = parseInt(val, 10);
    setValues((prev) => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateAppConfig("CREDITS_COST", values);
      toast.success(t("creditsCostSaved"));
      setDirty(false);
      await onRefresh();
    } catch {
      toast.error(t("creditsCostSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass rounded-[2rem] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold font-heading">{t("creditsCostFormTitle")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t("creditsCostFormDesc")}</p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="rounded-xl"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-1" />
          {t("save")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CREDIT_COST_KEYS.map(({ key, icon }) => (
          <div key={key} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-accent/10">
            <span className="text-lg">{icon}</span>
            <div className="flex-1 min-w-0">
              <Label className="text-xs font-mono text-muted-foreground block truncate">
                {t(`cost_${key}` as any, { defaultValue: kindLabel(key) })}
              </Label>
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="number"
                  min="0"
                  value={values[key] ?? 0}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="h-8 w-24 font-mono text-sm"
                />
                <span className="text-xs text-muted-foreground">{t("creditsUnit")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// ProductTable — reusable table for USD-priced products
// ===========================================================================
function ProductTable({
  products,
  showBilling,
  showUsdPrice,
  onRefresh,
  t,
}: {
  products: AdminProduct[];
  showBilling?: boolean;
  showUsdPrice?: boolean;
  onRefresh: () => Promise<void>;
  t: T;
}) {
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [priceProduct, setPriceProduct] = useState<AdminProduct | null>(null);

  if (products.length === 0) {
    return (
      <div className="glass rounded-[2rem] p-10 text-center text-muted-foreground">
        {t("noProducts")}
      </div>
    );
  }

  return (
    <>
      <div className="glass rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-4 font-bold text-muted-foreground">{t("thName")}</th>
                <th className="px-6 py-4 font-bold text-muted-foreground">{t("thCreditsGranted")}</th>
                {showUsdPrice && (
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("thPrice")}</th>
                )}
                <th className="px-6 py-4 font-bold text-muted-foreground">{t("thStatus")}</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const activePrices = product.prices.filter((p) => p.isActive);
                return (
                  <tr
                    key={product.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                          {product.description}
                        </div>
                      )}
                      <Badge variant="secondary" className="text-[8px] font-black uppercase mt-1">
                        {kindLabel(product.kind)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {product.creditsAmount != null ? (
                        <span className="text-purple-400 font-bold">{product.creditsAmount} cr</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {showUsdPrice && (
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {activePrices.length === 0 && (
                            <span className="text-muted-foreground text-xs">{t("noPrices")}</span>
                          )}
                          {activePrices.map((price) => (
                            <div key={price.id} className="flex items-center gap-2 text-xs">
                              <span className="font-mono font-bold text-emerald-400">
                                {formatCents(price.amount)}
                              </span>
                              {showBilling && price.billingInterval && (
                                <Badge variant="outline" className="text-[8px]">
                                  {price.billingInterval === "MONTHLY" ? t("monthly") : t("annual")}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] font-black uppercase ${
                          product.isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {product.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditProduct(product)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPriceProduct(product)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editProduct && (
        <EditProductDialog
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSaved={async () => {
            setEditProduct(null);
            await onRefresh();
          }}
          t={t}
        />
      )}

      {priceProduct && (
        <AddPriceDialog
          product={priceProduct}
          onClose={() => setPriceProduct(null)}
          onSaved={async () => {
            setPriceProduct(null);
            await onRefresh();
          }}
          t={t}
        />
      )}
    </>
  );
}

// ===========================================================================
// EditProductDialog
// ===========================================================================
function EditProductDialog({
  product,
  onClose,
  onSaved,
  t,
}: {
  product: AdminProduct;
  onClose: () => void;
  onSaved: () => Promise<void>;
  t: T;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [isActive, setIsActive] = useState(product.isActive);
  const [sortOrder, setSortOrder] = useState(product.sortOrder);
  const [creditsAmount, setCreditsAmount] = useState(product.creditsAmount ?? 0);
  const isSub = product.kind === "SUBSCRIPTION_PLAN";

  // Structured metadata for subscriptions
  const initialMeta = (product.metadata ?? {}) as Record<string, any>;
  const [meta, setMeta] = useState<Record<string, any>>({ ...initialMeta });

  const updateMeta = (key: string, value: any) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const metadata = isSub ? { ...meta, plan: initialMeta.plan } : initialMeta;

    setSaving(true);
    try {
      await adminApi.updateProduct(product.id, {
        name,
        description: description || undefined,
        isActive,
        sortOrder,
        creditsAmount: creditsAmount || undefined,
        metadata,
      });
      toast.success(t("productUpdated"));
      await onSaved();
    } catch {
      toast.error(t("productUpdateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const [deactivating, setDeactivating] = useState<string | null>(null);
  const handleDeactivatePrice = async (priceId: string) => {
    setDeactivating(priceId);
    try {
      await adminApi.deactivatePrice(product.id, priceId);
      toast.success(t("priceDeactivated"));
      await onSaved();
    } catch {
      toast.error(t("priceDeactivateFailed"));
    } finally {
      setDeactivating(null);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editProduct")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Basic fields */}
          <div className="space-y-2">
            <Label>{t("thName")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              readOnly={isSub}
              className={isSub ? "opacity-60 cursor-not-allowed" : ""}
            />
            {isSub && (
              <p className="text-[10px] text-muted-foreground">{t("nameReadOnlyHint")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("description")}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>{t("active")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label>{t("sortOrder")}</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-20"
              />
            </div>
          </div>

          {/* Credits granted */}
          <div className="space-y-2">
            <Label>{t("thCreditsGranted")}</Label>
            <p className="text-xs text-muted-foreground">{t("creditsGrantedHint")}</p>
            <Input
              type="number"
              min="0"
              value={creditsAmount}
              onChange={(e) => setCreditsAmount(Number(e.target.value))}
              className="w-32"
            />
          </div>

          {/* Subscription plan features (structured form) */}
          {isSub && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-bold">{t("planFeaturesTitle")}</Label>
                <Badge variant="outline" className="text-[9px] font-mono">
                  {initialMeta.plan ?? "—"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{t("planFeaturesDesc")}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLAN_METADATA_FIELDS.map((field) => {
                  const val = meta[field.key];

                  if (field.type === "boolean") {
                    return (
                      <div key={field.key} className="flex items-center justify-between p-3 rounded-xl border border-border bg-accent/10">
                        <Label className="text-xs">
                          {t(`meta_${field.key}` as any)}
                        </Label>
                        <Switch
                          checked={!!val}
                          onCheckedChange={(v) => updateMeta(field.key, v)}
                        />
                      </div>
                    );
                  }

                  if (field.type === "select") {
                    return (
                      <div key={field.key} className="p-3 rounded-xl border border-border bg-accent/10 space-y-1">
                        <Label className="text-xs">
                          {t(`meta_${field.key}` as any)}
                        </Label>
                        <select
                          value={val ?? "standard"}
                          onChange={(e) => updateMeta(field.key, e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {t(`queuePriority_${opt}` as any)}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  // number or number_nullable
                  return (
                    <div key={field.key} className="p-3 rounded-xl border border-border bg-accent/10 space-y-1">
                      <Label className="text-xs">
                        {t(`meta_${field.key}` as any)}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={field.type === "number_nullable" ? -1 : 0}
                          value={val ?? (field.type === "number_nullable" ? "" : 0)}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (field.type === "number_nullable" && raw === "") {
                              updateMeta(field.key, null);
                            } else {
                              updateMeta(field.key, Number(raw));
                            }
                          }}
                          placeholder={field.type === "number_nullable" ? t("nullMeansUnlimited") : undefined}
                          className="h-8 w-full font-mono text-sm"
                        />
                        {field.key === "amazonDiscount" && (
                          <span className="text-xs text-muted-foreground">%</span>
                        )}
                      </div>
                      {field.type === "number_nullable" && (
                        <p className="text-[10px] text-muted-foreground">{t("nullMeansUnlimited")}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prices */}
          {product.prices.length > 0 && (
            <div className="space-y-2">
              <Label>{t("prices")}</Label>
              <div className="space-y-2">
                {product.prices.map((price) => (
                  <div
                    key={price.id}
                    className={`flex items-center justify-between p-3 rounded-xl border border-border ${
                      price.isActive ? "bg-accent/30" : "bg-muted/30 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-mono font-bold">
                        {formatCents(price.amount)}
                      </span>
                      {price.billingInterval && (
                        <Badge variant="outline" className="text-[8px]">
                          {price.billingInterval === "MONTHLY" ? t("monthly") : t("annual")}
                        </Badge>
                      )}
                      {!price.isActive && (
                        <Badge variant="secondary" className="text-[8px] bg-red-500/10 text-red-400">
                          {t("inactive")}
                        </Badge>
                      )}
                    </div>
                    {price.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-500"
                        onClick={() => handleDeactivatePrice(price.id)}
                        disabled={deactivating === price.id}
                      >
                        {deactivating === price.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================================================================
// AddPriceDialog
// ===========================================================================
function AddPriceDialog({
  product,
  onClose,
  onSaved,
  t,
}: {
  product: AdminProduct;
  onClose: () => void;
  onSaved: () => Promise<void>;
  t: T;
}) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [billingInterval, setBillingInterval] = useState<"MONTHLY" | "ANNUAL" | "">("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const amountCents = Math.round(Number(amount) * 100);
    if (isNaN(amountCents) || amountCents < 0) {
      toast.error(t("invalidAmount"));
      return;
    }

    setSaving(true);
    try {
      await adminApi.addProductPrice(product.id, {
        amount: amountCents,
        currency: currency || undefined,
        billingInterval: billingInterval || undefined,
      });
      toast.success(t("priceCreated"));
      await onSaved();
    } catch {
      toast.error(t("priceCreateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const isSubscription = product.kind === "SUBSCRIPTION_PLAN";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addPriceTo", { name: product.name })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("amountDollars")}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="29.00"
            />
            <p className="text-xs text-muted-foreground">{t("amountHint")}</p>
          </div>
          <div className="space-y-2">
            <Label>{t("currency")}</Label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="usd"
            />
          </div>
          {isSubscription && (
            <div className="space-y-2">
              <Label>{t("billingInterval")}</Label>
              <select
                value={billingInterval}
                onChange={(e) =>
                  setBillingInterval(e.target.value as "MONTHLY" | "ANNUAL" | "")
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t("noneOneTime")}</option>
                <option value="MONTHLY">{t("monthly")}</option>
                <option value="ANNUAL">{t("annual")}</option>
              </select>
            </div>
          )}
          <p className="text-xs text-amber-400">{t("subsHintPriceWarning")}</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("createPrice")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================================================================
// AppConfigSection — for FREE_TIER, BUNDLES (not CREDITS_COST)
// ===========================================================================
function AppConfigSection({
  configs,
  onRefresh,
  t,
}: {
  configs: AdminAppConfig[];
  onRefresh: () => Promise<void>;
  t: T;
}) {
  const configDescriptions: Record<string, string> = {
    FREE_TIER: t("freeTierDesc"),
    BUNDLES: t("bundlesDesc"),
  };

  return (
    <div className="space-y-6">
      {configs.length === 0 && (
        <div className="glass rounded-[2rem] p-10 text-center text-muted-foreground">
          {t("noConfigs")}
        </div>
      )}
      {configs.map((config) => (
        <ConfigCard
          key={config.id}
          config={config}
          description={configDescriptions[config.key]}
          onRefresh={onRefresh}
          t={t}
        />
      ))}
    </div>
  );
}

function ConfigCard({
  config,
  description,
  onRefresh,
  t,
}: {
  config: AdminAppConfig;
  description?: string;
  onRefresh: () => Promise<void>;
  t: T;
}) {
  const [valueStr, setValueStr] = useState(
    JSON.stringify(config.value, null, 2),
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleChange = (val: string) => {
    setValueStr(val);
    setDirty(true);
  };

  const handleSave = async () => {
    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(valueStr);
    } catch {
      toast.error(t("invalidJson"));
      return;
    }

    setSaving(true);
    try {
      await adminApi.updateAppConfig(config.key, parsed);
      toast.success(t("configUpdated", { key: config.key }));
      setDirty(false);
      await onRefresh();
    } catch {
      toast.error(t("configUpdateFailed", { key: config.key }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass rounded-[2rem] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold font-heading">{config.key}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              {description}
            </p>
          )}
          {config.updatedBy && (
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              {t("lastUpdatedBy", {
                user: config.updatedBy,
                date: new Date(config.updatedAt).toLocaleString(),
              })}
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="rounded-xl"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-1" />
          {t("save")}
        </Button>
      </div>
      <textarea
        value={valueStr}
        onChange={(e) => handleChange(e.target.value)}
        rows={Math.min(Math.max(valueStr.split("\n").length + 1, 4), 20)}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
