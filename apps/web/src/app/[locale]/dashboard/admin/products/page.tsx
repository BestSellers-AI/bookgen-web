"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Pencil,
  Plus,
  XCircle,
  Save,
  Loader2,
  Info,
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
const SUBSCRIPTION_KINDS = new Set(["SUBSCRIPTION_PLAN"]);
const CREDIT_PACK_KINDS = new Set(["CREDIT_PACK"]);

function isSubscription(p: AdminProduct) {
  return SUBSCRIPTION_KINDS.has(p.kind);
}

function isCreditPack(p: AdminProduct) {
  return CREDIT_PACK_KINDS.has(p.kind);
}

// ---------------------------------------------------------------------------
// Config descriptions helper
// ---------------------------------------------------------------------------
function getConfigDescriptions(
  t: ReturnType<typeof useTranslations>,
): Record<string, string> {
  return {
    CREDITS_COST: t("creditsCostDesc"),
    FREE_TIER: t("freeTierDesc"),
    BUNDLES: t("bundlesDesc"),
  };
}

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

  const subscriptionProducts = products.filter(isSubscription);
  const creditPacks = products.filter(isCreditPack);
  const otherProducts = products.filter(
    (p) => !isSubscription(p) && !isCreditPack(p),
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <Tabs defaultValue="subscriptions" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="subscriptions" className="rounded-lg">
            {t("tabSubscriptionPlans")}
          </TabsTrigger>
          <TabsTrigger value="credit-packs" className="rounded-lg">
            {t("tabCreditPacks")}
          </TabsTrigger>
          <TabsTrigger value="addons" className="rounded-lg">
            {t("tabAddons")}
          </TabsTrigger>
          <TabsTrigger value="config" className="rounded-lg">
            {t("tabAppConfig")}
          </TabsTrigger>
        </TabsList>

        {/* ── Subscription Plans ────────────────────────────────────────── */}
        <TabsContent value="subscriptions" className="space-y-4">
          <HintBox>
            <p className="font-semibold text-foreground">{t("hintTitle")}</p>
            <p>{t("hintDesc")}</p>
            <p>{t("hintMetadata")}</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>{t("hintAspiranteDesc")}</li>
              <li>{t("hintBestsellerDesc")}</li>
              <li>{t("hintEliteDesc")}</li>
            </ul>
            <p className="text-xs text-amber-400">{t("hintPriceWarning")}</p>
          </HintBox>
          <ProductTable
            products={subscriptionProducts}
            showBilling
            onRefresh={fetchAll}
            t={t}
          />
        </TabsContent>

        {/* ── Credit Packs ─────────────────────────────────────────────── */}
        <TabsContent value="credit-packs" className="space-y-4">
          <HintBox>
            <p className="font-semibold text-foreground">{t("creditPacksHintTitle")}</p>
            <p>{t("creditPacksHintDesc")}</p>
            <p>{t("creditPacksHintCreditsCol")}</p>
            <p className="text-xs">{t("creditPacksHintExample")}</p>
          </HintBox>
          <ProductTable
            products={creditPacks}
            onRefresh={fetchAll}
            t={t}
          />
        </TabsContent>

        {/* ── Addons & One-Time ────────────────────────────────────────── */}
        <TabsContent value="addons" className="space-y-4">
          <HintBox>
            <p className="font-semibold text-foreground">{t("addonsHintTitle")}</p>
            <p>{t("addonsHintDesc")}</p>
            <p>{t("addonsHintOneTime")}</p>
            <p>{t("addonsHintBookGen")}</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>{t("addonsHintCosts")}</li>
            </ul>
          </HintBox>
          <ProductTable
            products={otherProducts}
            onRefresh={fetchAll}
            t={t}
          />
        </TabsContent>

        {/* ── App Config ───────────────────────────────────────────────── */}
        <TabsContent value="config" className="space-y-4">
          <HintBox>
            <p className="font-semibold text-foreground">{t("configHintTitle")}</p>
            <p>{t("configHintDesc")}</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>{t("configHintCreditsCost")}</li>
              <li>{t("configHintFreeTier")}</li>
              <li>{t("configHintBundles")}</li>
            </ul>
            <p className="text-xs text-amber-400">{t("configHintWarning")}</p>
          </HintBox>
          <AppConfigSection configs={configs} onRefresh={fetchAll} t={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===========================================================================
// Translations type alias
// ===========================================================================
type T = ReturnType<typeof useTranslations>;

// ===========================================================================
// ProductTable — reusable table for any product kind
// ===========================================================================
function ProductTable({
  products,
  showBilling,
  onRefresh,
  t,
}: {
  products: AdminProduct[];
  showBilling?: boolean;
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
                <th className="px-6 py-4 font-bold text-muted-foreground">{t("thKind")}</th>
                <th className="px-6 py-4 font-bold text-muted-foreground">{t("thCredits")}</th>
                <th className="px-6 py-4 font-bold text-muted-foreground">{t("thPrices")}</th>
                <th className="px-6 py-4 font-bold text-muted-foreground">{t("thStatus")}</th>
                <th className="px-6 py-4 font-bold text-muted-foreground">{t("thOrder")}</th>
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
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="text-[9px] font-black uppercase">
                        {kindLabel(product.kind)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {product.creditsAmount ?? "\u2014"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {activePrices.length === 0 && (
                          <span className="text-muted-foreground text-xs">{t("noPrices")}</span>
                        )}
                        {activePrices.map((price) => (
                          <div key={price.id} className="flex items-center gap-2 text-xs">
                            <span className="font-mono font-bold">
                              {formatCents(price.amount)}
                            </span>
                            {showBilling && price.billingInterval && (
                              <Badge variant="outline" className="text-[8px]">
                                {price.billingInterval}
                              </Badge>
                            )}
                            {price.creditsCost != null && (
                              <span className="text-muted-foreground">
                                ({price.creditsCost} cr)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
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
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {product.sortOrder}
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

      {/* Edit Product Dialog */}
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

      {/* Add Price Dialog */}
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
  const [metadataStr, setMetadataStr] = useState(
    product.metadata ? JSON.stringify(product.metadata, null, 2) : "{}",
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    let metadata: Record<string, any> | undefined;
    try {
      metadata = JSON.parse(metadataStr);
    } catch {
      toast.error(t("invalidJson"));
      return;
    }

    setSaving(true);
    try {
      await adminApi.updateProduct(product.id, {
        name,
        description: description || undefined,
        isActive,
        sortOrder,
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

  // Manage prices within the edit dialog
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
          <div className="space-y-2">
            <Label>{t("thName")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
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
          <div className="space-y-2">
            <Label>{t("metadataJson")}</Label>
            <textarea
              value={metadataStr}
              onChange={(e) => setMetadataStr(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Existing prices */}
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
                          {price.billingInterval}
                        </Badge>
                      )}
                      {price.creditsCost != null && (
                        <span className="text-muted-foreground">
                          {price.creditsCost} {t("credits")}
                        </span>
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
  const [creditsCost, setCreditsCost] = useState("");
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
        creditsCost: creditsCost ? Number(creditsCost) : undefined,
      });
      toast.success(t("priceCreated"));
      await onSaved();
    } catch {
      toast.error(t("priceCreateFailed"));
    } finally {
      setSaving(false);
    }
  };

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
          </div>
          <div className="space-y-2">
            <Label>{t("currency")}</Label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="usd"
            />
          </div>
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
          <div className="space-y-2">
            <Label>{t("creditsCostLabel")}</Label>
            <Input
              type="number"
              value={creditsCost}
              onChange={(e) => setCreditsCost(e.target.value)}
              placeholder="e.g. 100"
            />
          </div>
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
// AppConfigSection
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
  return (
    <div className="space-y-6">
      {configs.length === 0 && (
        <div className="glass rounded-[2rem] p-10 text-center text-muted-foreground">
          {t("noConfigs")}
        </div>
      )}
      {configs.map((config) => (
        <ConfigCard key={config.id} config={config} onRefresh={onRefresh} t={t} />
      ))}
    </div>
  );
}

function ConfigCard({
  config,
  onRefresh,
  t,
}: {
  config: AdminAppConfig;
  onRefresh: () => Promise<void>;
  t: T;
}) {
  const configDescriptions = getConfigDescriptions(t);
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

  const description = configDescriptions[config.key];

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
