"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ImageIcon,
  Globe,
  Headphones,
  Package,
  Palette,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";
import { addonsApi } from "@/lib/api/addons";
import { walletApi } from "@/lib/api/wallet";
import { useWalletStore } from "@/stores/wallet-store";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { ProductKind, AddonStatus, SUPPORTED_LANGUAGES } from "@bestsellers/shared";
import { useConfigStore } from "@/stores/config-store";
import type { BookAddonSummary, BookDetail } from "@/lib/api/types";

interface AddonConfig {
  kind: ProductKind;
  icon: typeof Palette;
  cost: number;
  hasLanguageParam: boolean;
  color: string;
  iconBg: string;
}

function buildAddonConfigs(getCost: (kind: string) => number): AddonConfig[] {
  return [
    {
      kind: ProductKind.ADDON_COVER,
      icon: Palette,
      cost: getCost(ProductKind.ADDON_COVER),
      hasLanguageParam: false,
      color: "text-pink-500",
      iconBg: "bg-pink-500/10 border-pink-500/20",
    },
    {
      kind: ProductKind.ADDON_TRANSLATION,
      icon: Globe,
      cost: getCost(ProductKind.ADDON_TRANSLATION),
      hasLanguageParam: true,
      color: "text-blue-500",
      iconBg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      kind: ProductKind.ADDON_COVER_TRANSLATION,
      icon: Globe,
      cost: getCost(ProductKind.ADDON_COVER_TRANSLATION),
      hasLanguageParam: true,
      color: "text-cyan-500",
      iconBg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      kind: ProductKind.ADDON_AMAZON_STANDARD,
      icon: Package,
      cost: getCost(ProductKind.ADDON_AMAZON_STANDARD),
      hasLanguageParam: false,
      color: "text-orange-500",
      iconBg: "bg-orange-500/10 border-orange-500/20",
    },
    {
      kind: ProductKind.ADDON_AMAZON_PREMIUM,
      icon: Package,
      cost: getCost(ProductKind.ADDON_AMAZON_PREMIUM),
      hasLanguageParam: false,
      color: "text-amber-500",
      iconBg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      kind: ProductKind.ADDON_IMAGES,
      icon: ImageIcon,
      cost: getCost(ProductKind.ADDON_IMAGES),
      hasLanguageParam: false,
      color: "text-indigo-500",
      iconBg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      kind: ProductKind.ADDON_AUDIOBOOK,
      icon: Headphones,
      cost: getCost(ProductKind.ADDON_AUDIOBOOK),
      hasLanguageParam: false,
      color: "text-emerald-500",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];
}

const STATUS_ICON: Record<string, typeof Clock> = {
  [AddonStatus.PENDING]: Clock,
  [AddonStatus.QUEUED]: Clock,
  [AddonStatus.PROCESSING]: Loader2,
  [AddonStatus.COMPLETED]: CheckCircle2,
  [AddonStatus.ERROR]: XCircle,
  [AddonStatus.CANCELLED]: XCircle,
};

interface AddonSectionProps {
  book: BookDetail;
  onRefetch: () => void;
}

export function AddonSection({ book, onRefetch }: AddonSectionProps) {
  const t = useTranslations("addons");
  const tCommon = useTranslations("common");
  const tTranslations = useTranslations("translations");
  const fetchWalletStore = useWalletStore((s) => s.fetchWallet);
  const getCreditsCost = useConfigStore((s) => s.getCreditsCost);
  const ADDON_CONFIGS = buildAddonConfigs(getCreditsCost);

  const [addons, setAddons] = useState<BookAddonSummary[]>(book.addons ?? []);
  const [balance, setBalance] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<AddonConfig | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [requesting, setRequesting] = useState(false);

  const fetchAddons = useCallback(async () => {
    try {
      const data = await addonsApi.list(book.id);
      setAddons(data);
    } catch {
      // silently fail
    }
  }, [book.id]);

  useEffect(() => {
    fetchAddons();
    walletApi.get().then((w) => setBalance(w.balance)).catch(() => {});
  }, [fetchAddons]);

  const getExistingAddon = (kind: ProductKind): BookAddonSummary | undefined => {
    // For translation addons, prioritize COMPLETED or PROCESSING over ERROR
    if (kind === ProductKind.ADDON_TRANSLATION || kind === ProductKind.ADDON_COVER_TRANSLATION) {
      const matching = addons.filter((a) => a.kind === kind);
      // Prefer completed, then processing, then most recent
      const completed = matching.find((a) => a.status === AddonStatus.COMPLETED);
      if (completed) return completed;
      const processing = matching.find((a) =>
        a.status === AddonStatus.PENDING ||
        a.status === AddonStatus.QUEUED ||
        a.status === AddonStatus.PROCESSING
      );
      if (processing) return processing;
      // Fallback to most recent (e.g. ERROR)
      return matching.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }
    return addons.find((a) => a.kind === kind);
  };

  const canRequestMore = (kind: ProductKind): boolean => {
    // Translation addons can always be requested again (different languages)
    if (kind === ProductKind.ADDON_TRANSLATION || kind === ProductKind.ADDON_COVER_TRANSLATION) {
      return true;
    }
    return false;
  };

  const openRequestDialog = (config: AddonConfig) => {
    setSelectedAddon(config);
    setSelectedLanguage("");
    setDialogOpen(true);
  };

  const handleRequest = async () => {
    if (!selectedAddon) return;
    setRequesting(true);
    try {
      const params: Record<string, unknown> = {};
      if (selectedAddon.hasLanguageParam && selectedLanguage) {
        params.targetLanguage = selectedLanguage;
      }
      await addonsApi.create(book.id, {
        kind: selectedAddon.kind,
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      toast.success(t("requestSuccess"));
      setDialogOpen(false);
      fetchAddons();
      walletApi.get().then((w) => setBalance(w.balance)).catch(() => {});
      fetchWalletStore();
      onRefetch();
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error?.response?.status === 402) {
        toast.error(t("insufficientCredits"));
      } else {
        toast.error(t("requestError"));
      }
    } finally {
      setRequesting(false);
    }
  };

  const isProcessing = (status: string) =>
    status === AddonStatus.PENDING ||
    status === AddonStatus.QUEUED ||
    status === AddonStatus.PROCESSING;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ADDON_CONFIGS.map((config) => {
          const Icon = config.icon;
          const existing = getExistingAddon(config.kind);
          const StatusIcon = existing
            ? STATUS_ICON[existing.status] ?? Clock
            : null;

          return (
            <div
              key={config.kind}
              className="glass rounded-2xl p-5 border border-border space-y-3"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center ${config.iconBg}`}
                >
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                {existing && (
                  <Badge
                    variant="secondary"
                    className={`text-[9px] font-black uppercase tracking-widest ${
                      existing.status === AddonStatus.COMPLETED
                        ? "bg-emerald-500/10 text-emerald-400"
                        : existing.status === AddonStatus.ERROR
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {StatusIcon && (
                      <StatusIcon
                        className={`w-3 h-3 mr-1 ${
                          isProcessing(existing.status) ? "animate-spin" : ""
                        }`}
                      />
                    )}
                    {t(`status_${existing.status}`)}
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="font-bold text-sm">{t(`kind_${config.kind}`)}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(`kindDesc_${config.kind}`)}
                </p>
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-primary/70">
                  <Clock className="w-3 h-3" />
                  {t(`time_${config.kind}`)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">
                  {config.cost} {tCommon("credits")}
                </span>
                {existing ? (
                  existing.status === AddonStatus.COMPLETED ? (
                    <div className="flex items-center gap-1.5">
                      {config.kind === ProductKind.ADDON_TRANSLATION ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-xs gap-1"
                          asChild
                        >
                          <Link href={`/dashboard/books/${book.id}/translations`}>
                            <Globe className="w-3 h-3" />
                            {tTranslations("viewTranslations")}
                          </Link>
                        </Button>
                      ) : config.kind === ProductKind.ADDON_COVER_TRANSLATION ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-xs gap-1"
                          asChild
                        >
                          <Link href={`/dashboard/books/${book.id}/translations?tab=covers`}>
                            <Globe className="w-3 h-3" />
                            {tTranslations("viewTranslatedCovers")}
                          </Link>
                        </Button>
                      ) : existing.resultUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-xs gap-1"
                          asChild
                        >
                          <a
                            href={existing.resultUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {t("viewResult")}
                          </a>
                        </Button>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-400 text-[10px]"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {t("done")}
                        </Badge>
                      )}
                      {canRequestMore(config.kind) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-xs"
                          onClick={() => openRequestDialog(config)}
                        >
                          <Sparkles className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ) : isProcessing(existing.status) ? (
                    <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t("processing")}
                    </span>
                  ) : existing.status === AddonStatus.ERROR ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs text-red-400 border-red-500/20"
                      onClick={() => openRequestDialog(config)}
                    >
                      {t("retry")}
                    </Button>
                  ) : null
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                    onClick={() => openRequestDialog(config)}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {t("request")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Request Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedAddon ? t(`kind_${selectedAddon.kind}`) : ""}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  {t("requestConfirm", {
                    cost: selectedAddon?.cost ?? 0,
                    balance: balance ?? 0,
                  })}
                </p>

                {selectedAddon?.hasLanguageParam && (
                  (() => {
                    const excludedLangs = new Set<string>();
                    // Exclude original language
                    if (book.settings?.language) excludedLangs.add(book.settings.language);
                    // Exclude languages with existing covers
                    if (selectedAddon.kind === ProductKind.ADDON_COVER_TRANSLATION) {
                      book.files
                        .filter((f) => f.fileType === ("COVER_TRANSLATED" as string))
                        .forEach((f) => {
                          const m = f.fileName.match(/cover-translated-([^.]+)\./);
                          if (m) excludedLangs.add(m[1]);
                        });
                    }
                    // Exclude languages with existing translations
                    if (selectedAddon.kind === ProductKind.ADDON_TRANSLATION) {
                      (book.translations ?? [])
                        .filter((tr) => tr.status !== "ERROR")
                        .forEach((tr) => excludedLangs.add(tr.targetLanguage));
                    }
                    const availableLangs = SUPPORTED_LANGUAGES.filter((l) => !excludedLangs.has(l.code));

                    return (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t("selectLanguage")}
                        </label>
                        <Select
                          value={selectedLanguage}
                          onValueChange={setSelectedLanguage}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder={t("selectLanguage")} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLangs.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })()
                )}

                {balance !== null &&
                  selectedAddon &&
                  balance < selectedAddon.cost && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                      {t("notEnoughCredits")}
                    </div>
                  )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            {balance !== null &&
            selectedAddon &&
            balance < selectedAddon.cost ? (
              <Button asChild>
                <Link href="/dashboard/wallet/buy-credits">
                  {t("buyCredits")}
                </Link>
              </Button>
            ) : (
              <AlertDialogAction
                onClick={handleRequest}
                disabled={
                  requesting ||
                  (selectedAddon?.hasLanguageParam && !selectedLanguage)
                }
              >
                {requesting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {t("confirmRequest")}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
