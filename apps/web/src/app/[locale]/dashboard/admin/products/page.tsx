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
// Main page
// ---------------------------------------------------------------------------
export default function AdminProductsPage() {
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
        title="Products & Pricing"
        subtitle="Manage subscription plans, credit packs, and app configuration"
      />

      <Tabs defaultValue="subscriptions" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="subscriptions" className="rounded-lg">
            Subscription Plans
          </TabsTrigger>
          <TabsTrigger value="credit-packs" className="rounded-lg">
            Credit Packs
          </TabsTrigger>
          <TabsTrigger value="addons" className="rounded-lg">
            Addons & One-Time
          </TabsTrigger>
          <TabsTrigger value="config" className="rounded-lg">
            App Config
          </TabsTrigger>
        </TabsList>

        {/* ── Subscription Plans ────────────────────────────────────────── */}
        <TabsContent value="subscriptions" className="space-y-4">
          <HintBox>
            <p className="font-semibold text-foreground">How subscription pricing works</p>
            <p>Each plan has <strong>two prices</strong>: Monthly and Annual. Users pay via Stripe Checkout and receive <strong>monthly credits</strong> on each billing cycle.</p>
            <p>Plan features (credits/month, books/month, regens, commercial license, etc.) are stored in the product <strong>Metadata</strong> field. Click the pencil icon to edit.</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li><strong>Aspirante</strong> — Entry tier: 300 cr/mo, 3 books, no commercial license</li>
              <li><strong>BestSeller</strong> — Mid tier: 750 cr/mo, 7 books, commercial license, credit rollover 1 month</li>
              <li><strong>Elite</strong> — Top tier: 2000 cr/mo, 20 books, express queue, credit rollover 3 months</li>
            </ul>
            <p className="text-xs text-amber-400">Stripe prices are immutable. To change a price, add a new one and deactivate the old one.</p>
          </HintBox>
          <ProductTable
            products={subscriptionProducts}
            showBilling
            onRefresh={fetchAll}
          />
        </TabsContent>

        {/* ── Credit Packs ─────────────────────────────────────────────── */}
        <TabsContent value="credit-packs" className="space-y-4">
          <HintBox>
            <p className="font-semibold text-foreground">How credit packs work</p>
            <p>One-time purchases via Stripe. User pays, gets credits added to wallet. <strong>Credits never expire.</strong></p>
            <p>The <strong>Credits</strong> column shows how many credits the user receives. The price is what they pay in dollars.</p>
            <p className="text-xs">Example: "300 Credits" pack costs $24.90 and grants 300 credits ($0.083/credit).</p>
          </HintBox>
          <ProductTable
            products={creditPacks}
            onRefresh={fetchAll}
          />
        </TabsContent>

        {/* ── Addons & One-Time ────────────────────────────────────────── */}
        <TabsContent value="addons" className="space-y-4">
          <HintBox>
            <p className="font-semibold text-foreground">How addons and one-time purchases work</p>
            <p><strong>Addons</strong> are paid with credits (not money). The credit cost for each addon is configured in the <strong>App Config</strong> tab under <code className="bg-accent/50 px-1 rounded">CREDITS_COST</code>.</p>
            <p><strong>One-Time Book</strong> ("Obra Aspirante") is a Stripe payment that grants credits equal to 1 book generation (100 credits for $19).</p>
            <p><strong>Book Generation</strong> is an internal product — no Stripe price. It just defines the credit cost for generating a book.</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Book generation = 100 credits</li>
              <li>Chapter regen = 10 credits (free regens depend on plan)</li>
              <li>Cover = 30 cr · Translation = 50 cr · Amazon Premium = 80 cr · Images = 20 cr · Audiobook = 60 cr</li>
            </ul>
          </HintBox>
          <ProductTable
            products={otherProducts}
            onRefresh={fetchAll}
          />
        </TabsContent>

        {/* ── App Config ───────────────────────────────────────────────── */}
        <TabsContent value="config" className="space-y-4">
          <HintBox>
            <p className="font-semibold text-foreground">App Configuration — JSON key-value store</p>
            <p>These settings control the app behavior globally. Changes apply immediately after saving (cache refreshes in up to 5 minutes).</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><code className="bg-accent/50 px-1 rounded">CREDITS_COST</code> — How many credits each action costs (book generation, chapter regen, each addon). This is the <strong>source of truth</strong> for all credit deductions in the system.</li>
              <li><code className="bg-accent/50 px-1 rounded">FREE_TIER</code> — Limits for users without a subscription (previews/month, etc.).</li>
              <li><code className="bg-accent/50 px-1 rounded">BUNDLES</code> — Addon bundles with discounts. Each bundle has a list of addon <code>kinds</code>, original cost, discounted cost, and discount percentage. Bundles are shown in the Author Journey UI.</li>
            </ul>
            <p className="text-xs text-amber-400">Be careful editing JSON — invalid JSON will be rejected. Changes affect all users immediately.</p>
          </HintBox>
          <AppConfigSection configs={configs} onRefresh={fetchAll} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===========================================================================
// ProductTable — reusable table for any product kind
// ===========================================================================
function ProductTable({
  products,
  showBilling,
  onRefresh,
}: {
  products: AdminProduct[];
  showBilling?: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [priceProduct, setPriceProduct] = useState<AdminProduct | null>(null);

  if (products.length === 0) {
    return (
      <div className="glass rounded-[2rem] p-10 text-center text-muted-foreground">
        No products in this category.
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
                <th className="px-6 py-4 font-bold text-muted-foreground">Name</th>
                <th className="px-6 py-4 font-bold text-muted-foreground">Kind</th>
                <th className="px-6 py-4 font-bold text-muted-foreground">Credits</th>
                <th className="px-6 py-4 font-bold text-muted-foreground">Prices</th>
                <th className="px-6 py-4 font-bold text-muted-foreground">Status</th>
                <th className="px-6 py-4 font-bold text-muted-foreground">Order</th>
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
                      {product.creditsAmount ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {activePrices.length === 0 && (
                          <span className="text-muted-foreground text-xs">No prices</span>
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
                        {product.isActive ? "Active" : "Inactive"}
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
}: {
  product: AdminProduct;
  onClose: () => void;
  onSaved: () => Promise<void>;
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
      toast.error("Invalid JSON in metadata field");
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
      toast.success("Product updated");
      await onSaved();
    } catch {
      toast.error("Failed to update product");
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
      toast.success("Price deactivated");
      await onSaved();
    } catch {
      toast.error("Failed to deactivate price");
    } finally {
      setDeactivating(null);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-20"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Metadata (JSON)</Label>
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
              <Label>Prices</Label>
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
                          {price.creditsCost} credits
                        </span>
                      )}
                      {!price.isActive && (
                        <Badge variant="secondary" className="text-[8px] bg-red-500/10 text-red-400">
                          Inactive
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
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Save
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
}: {
  product: AdminProduct;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [billingInterval, setBillingInterval] = useState<"MONTHLY" | "ANNUAL" | "">("");
  const [creditsCost, setCreditsCost] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const amountCents = Math.round(Number(amount) * 100);
    if (isNaN(amountCents) || amountCents < 0) {
      toast.error("Enter a valid amount");
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
      toast.success("Price created");
      await onSaved();
    } catch {
      toast.error("Failed to create price");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Price to {product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Amount (dollars)</Label>
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
            <Label>Currency</Label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="usd"
            />
          </div>
          <div className="space-y-2">
            <Label>Billing Interval (optional)</Label>
            <select
              value={billingInterval}
              onChange={(e) =>
                setBillingInterval(e.target.value as "MONTHLY" | "ANNUAL" | "")
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">None (one-time)</option>
              <option value="MONTHLY">Monthly</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Credits Cost (optional)</Label>
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
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Price
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
}: {
  configs: AdminAppConfig[];
  onRefresh: () => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      {configs.length === 0 && (
        <div className="glass rounded-[2rem] p-10 text-center text-muted-foreground">
          No app configurations found.
        </div>
      )}
      {configs.map((config) => (
        <ConfigCard key={config.id} config={config} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

const CONFIG_DESCRIPTIONS: Record<string, string> = {
  CREDITS_COST:
    "Credit cost for each operation. Keys: BOOK_GENERATION (full book), CHAPTER_REGENERATION (single chapter redo), ADDON_COVER, ADDON_TRANSLATION, ADDON_COVER_TRANSLATION, ADDON_AMAZON_STANDARD, ADDON_AMAZON_PREMIUM, ADDON_IMAGES, ADDON_AUDIOBOOK. Values are integers (number of credits deducted).",
  FREE_TIER:
    "Limits for users without a paid subscription. previewsPerMonth = how many book previews they can create. credits/booksPerMonth/freeRegensPerMonth = always 0 for free tier. commercialLicense and fullEditor = false.",
  BUNDLES:
    'Addon bundles with discounts shown in the Author Journey UI. Each bundle has: "id" (unique key), "kinds" (array of addon ProductKind values), "originalCost" (sum of individual addon costs), "cost" (discounted total), "discountPercent". The frontend calculates savings from originalCost - cost.',
};

function ConfigCard({
  config,
  onRefresh,
}: {
  config: AdminAppConfig;
  onRefresh: () => Promise<void>;
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
      toast.error("Invalid JSON");
      return;
    }

    setSaving(true);
    try {
      await adminApi.updateAppConfig(config.key, parsed);
      toast.success(`Config "${config.key}" updated`);
      setDirty(false);
      await onRefresh();
    } catch {
      toast.error(`Failed to update "${config.key}"`);
    } finally {
      setSaving(false);
    }
  };

  const description = CONFIG_DESCRIPTIONS[config.key];

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
              Last updated by {config.updatedBy} on{" "}
              {new Date(config.updatedAt).toLocaleString()}
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
          Save
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
