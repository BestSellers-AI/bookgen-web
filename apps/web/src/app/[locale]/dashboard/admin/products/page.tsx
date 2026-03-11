"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Pencil,
  Plus,
  XCircle,
  Save,
  Loader2,
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
// Product-kind grouping
// ---------------------------------------------------------------------------
const SUBSCRIPTION_KINDS = new Set(["BOOK_GENERATION"]);
const CREDIT_PACK_KINDS = new Set(["CREDIT_PACK"]);
// Everything else is "addon / one-time"

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
        <TabsContent value="subscriptions">
          <ProductTable
            products={subscriptionProducts}
            showBilling
            onRefresh={fetchAll}
          />
        </TabsContent>

        {/* ── Credit Packs ─────────────────────────────────────────────── */}
        <TabsContent value="credit-packs">
          <ProductTable
            products={creditPacks}
            onRefresh={fetchAll}
          />
        </TabsContent>

        {/* ── Addons & One-Time ────────────────────────────────────────── */}
        <TabsContent value="addons">
          <ProductTable
            products={otherProducts}
            onRefresh={fetchAll}
          />
        </TabsContent>

        {/* ── App Config ───────────────────────────────────────────────── */}
        <TabsContent value="config">
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

  return (
    <div className="glass rounded-[2rem] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold font-heading">{config.key}</h3>
          {config.updatedBy && (
            <p className="text-xs text-muted-foreground">
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
