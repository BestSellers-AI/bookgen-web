"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  BookCheck,
  Palette,
  Package,
  Globe,
  ImageIcon,
  Headphones,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ExternalLink,
  Rocket,
  Crown,
  Zap,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useTranslations } from "next-intl";
import { addonsApi } from "@/lib/api/addons";
import { walletApi } from "@/lib/api/wallet";
import { useWalletStore } from "@/stores/wallet-store";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { ProductKind, AddonStatus, FileType } from "@bestsellers/shared";
import {
  CREDITS_COST,
  SUPPORTED_LANGUAGES,
  BUNDLE_PUBLISH_PREMIUM,
  BUNDLE_GLOBAL_LAUNCH,
} from "@bestsellers/shared";
import type { BundleConfig } from "@bestsellers/shared";
import type { BookAddonSummary, BookDetail, BookImageSummary } from "@/lib/api/types";

// ─── Types ───────────────────────────────────────────────────

interface AddonConfig {
  kind: ProductKind;
  icon: typeof Palette;
  cost: number;
  hasLanguageParam: boolean;
  color: string;
  iconBg: string;
}

type StepStatus = "completed" | "processing" | "available" | "locked" | "error";

// ─── Publishing Track Steps ──────────────────────────────────
// Book → Cover → Images → Amazon

const PUBLISHING_STEPS: {
  id: string;
  kinds: ProductKind[];
  icon: typeof Palette;
  color: string;
  completedBg: string;
}[] = [
  {
    id: "book",
    kinds: [],
    icon: BookCheck,
    color: "text-emerald-500",
    completedBg: "bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "cover",
    kinds: [ProductKind.ADDON_COVER],
    icon: Palette,
    color: "text-pink-500",
    completedBg: "bg-pink-500/10 border-pink-500/30",
  },
  {
    id: "images",
    kinds: [ProductKind.ADDON_IMAGES],
    icon: ImageIcon,
    color: "text-indigo-500",
    completedBg: "bg-indigo-500/10 border-indigo-500/30",
  },
  {
    id: "amazon",
    kinds: [ProductKind.ADDON_AMAZON_STANDARD, ProductKind.ADDON_AMAZON_PREMIUM],
    icon: Package,
    color: "text-orange-500",
    completedBg: "bg-orange-500/10 border-orange-500/30",
  },
];

// ─── Extras ──────────────────────────────────────────────────

const EXTRA_CONFIGS: AddonConfig[] = [
  {
    kind: ProductKind.ADDON_TRANSLATION,
    icon: Globe,
    cost: CREDITS_COST[ProductKind.ADDON_TRANSLATION],
    hasLanguageParam: true,
    color: "text-blue-500",
    iconBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    kind: ProductKind.ADDON_COVER_TRANSLATION,
    icon: Globe,
    cost: CREDITS_COST[ProductKind.ADDON_COVER_TRANSLATION],
    hasLanguageParam: true,
    color: "text-cyan-500",
    iconBg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    kind: ProductKind.ADDON_AUDIOBOOK,
    icon: Headphones,
    cost: CREDITS_COST[ProductKind.ADDON_AUDIOBOOK],
    hasLanguageParam: false,
    color: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

// All addon configs (for dialog lookup)
const ALL_ADDON_CONFIGS: AddonConfig[] = [
  {
    kind: ProductKind.ADDON_COVER,
    icon: Palette,
    cost: CREDITS_COST[ProductKind.ADDON_COVER],
    hasLanguageParam: false,
    color: "text-pink-500",
    iconBg: "bg-pink-500/10 border-pink-500/20",
  },
  {
    kind: ProductKind.ADDON_IMAGES,
    icon: ImageIcon,
    cost: CREDITS_COST[ProductKind.ADDON_IMAGES],
    hasLanguageParam: false,
    color: "text-indigo-500",
    iconBg: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    kind: ProductKind.ADDON_AMAZON_STANDARD,
    icon: Package,
    cost: CREDITS_COST[ProductKind.ADDON_AMAZON_STANDARD],
    hasLanguageParam: false,
    color: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
  },
  {
    kind: ProductKind.ADDON_AMAZON_PREMIUM,
    icon: Package,
    cost: CREDITS_COST[ProductKind.ADDON_AMAZON_PREMIUM],
    hasLanguageParam: false,
    color: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
  },
  ...EXTRA_CONFIGS,
];

// ─── Helpers ─────────────────────────────────────────────────

function isAddonProcessing(status: string) {
  return (
    status === AddonStatus.PENDING ||
    status === AddonStatus.QUEUED ||
    status === AddonStatus.PROCESSING
  );
}

function getStepStatus(
  stepKinds: ProductKind[],
  addons: BookAddonSummary[],
): StepStatus {
  if (stepKinds.length === 0) return "completed";
  const matching = addons.filter((a) =>
    stepKinds.includes(a.kind as ProductKind),
  );
  if (matching.length === 0) return "available";
  if (matching.some((a) => a.status === AddonStatus.COMPLETED))
    return "completed";
  if (matching.some((a) => a.status === AddonStatus.ERROR)) return "error";
  if (matching.some((a) => isAddonProcessing(a.status))) return "processing";
  return "available";
}

// ─── Component ───────────────────────────────────────────────

interface AuthorJourneyProps {
  book: BookDetail;
  onRefetch: () => void;
}

export function AuthorJourney({ book, onRefetch }: AuthorJourneyProps) {
  const t = useTranslations("addons");
  const tj = useTranslations("authorJourney");
  const tCommon = useTranslations("common");
  const fetchWalletStore = useWalletStore((s) => s.fetchWallet);

  const [addons, setAddons] = useState<BookAddonSummary[]>(book.addons ?? []);
  const [balance, setBalance] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [extrasOpen, setExtrasOpen] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<AddonConfig | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [requesting, setRequesting] = useState(false);

  // Cover gallery state
  const [coverGalleryOpen, setCoverGalleryOpen] = useState(false);
  const [expandedCover, setExpandedCover] = useState<{ id: string; url: string; name: string } | null>(null);
  const [selectingCover, setSelectingCover] = useState<string | null>(null);
  const [requestingMoreCovers, setRequestingMoreCovers] = useState(false);

  // Image gallery state
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{ id: string; url: string; caption: string | null; chapterId: string | null } | null>(null);
  const [selectingImage, setSelectingImage] = useState<string | null>(null);
  const [requestingMoreImages, setRequestingMoreImages] = useState(false);
  const [selectedChapterForImage, setSelectedChapterForImage] = useState("");

  // Bundle state
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<BundleConfig | null>(null);
  const [requestingBundle, setRequestingBundle] = useState(false);

  const prevAddonsRef = useRef<BookAddonSummary[]>(addons);

  const fetchAddons = useCallback(async () => {
    try {
      const data = await addonsApi.list(book.id);
      // Detect addons that just completed → refetch book to get new files/images
      const prev = prevAddonsRef.current;
      const justCompleted = data.some(
        (a) =>
          a.status === AddonStatus.COMPLETED &&
          prev.some((p) => p.id === a.id && isAddonProcessing(p.status)),
      );
      prevAddonsRef.current = data;
      setAddons(data);
      if (justCompleted) {
        onRefetch();
      }
    } catch {
      // silently fail
    }
  }, [book.id, onRefetch]);

  useEffect(() => {
    fetchAddons();
    walletApi
      .get()
      .then((w) => setBalance(w.balance))
      .catch(() => {});
  }, [fetchAddons]);

  // Poll addons every 5s while any are processing
  const hasProcessing = addons.some((a) => isAddonProcessing(a.status));
  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      fetchAddons();
    }, 5000);
    return () => clearInterval(interval);
  }, [hasProcessing, fetchAddons]);

  const getExistingAddon = (kind: ProductKind): BookAddonSummary | undefined =>
    addons.find((a) => a.kind === kind);

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
      walletApi
        .get()
        .then((w) => setBalance(w.balance))
        .catch(() => {});
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

  // Bundle availability helpers
  const isBundleAvailable = (bundle: BundleConfig) =>
    bundle.kinds.every((kind) => {
      const existing = getExistingAddon(kind);
      return !existing || existing.status === AddonStatus.ERROR || existing.status === AddonStatus.CANCELLED;
    });

  const publishBundleAvailable = isBundleAvailable(BUNDLE_PUBLISH_PREMIUM);
  const globalLaunchBundleAvailable = isBundleAvailable(BUNDLE_GLOBAL_LAUNCH);

  const openBundleDialog = (bundle: BundleConfig) => {
    setSelectedBundle(bundle);
    setBundleDialogOpen(true);
  };

  const handleBundleRequest = async () => {
    if (!selectedBundle) return;
    setRequestingBundle(true);
    try {
      await addonsApi.createBundle(book.id, selectedBundle.id);
      toast.success(tj(`bundleSuccess_${selectedBundle.id}`));
      setBundleDialogOpen(false);
      fetchAddons();
      walletApi
        .get()
        .then((w) => setBalance(w.balance))
        .catch(() => {});
      fetchWalletStore();
      onRefetch();
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error?.response?.status === 402) {
        toast.error(t("insufficientCredits"));
      } else if (error?.response?.status === 400) {
        toast.error(tj("bundleAlreadyExists"));
      } else {
        toast.error(t("requestError"));
      }
    } finally {
      setRequestingBundle(false);
    }
  };

  // Cover images from book files
  const coverImages = (book.files ?? []).filter(
    (f) => f.fileType === FileType.COVER_IMAGE,
  );

  const handleSelectCover = async (fileId: string) => {
    setSelectingCover(fileId);
    try {
      await addonsApi.selectCover(book.id, fileId);
      toast.success(tj("coverSelected"));
      setCoverGalleryOpen(false);
      onRefetch();
    } catch {
      toast.error(t("requestError"));
    } finally {
      setSelectingCover(null);
    }
  };

  const hasProcessingCovers = addons.some(
    (a) => a.kind === ProductKind.ADDON_COVER && isAddonProcessing(a.status),
  );

  const handleRequestMoreCovers = async () => {
    setRequestingMoreCovers(true);
    try {
      await addonsApi.create(book.id, { kind: ProductKind.ADDON_COVER });
      toast.success(t("requestSuccess"));
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
      setRequestingMoreCovers(false);
    }
  };

  // All book images (arrive without chapterId — user assigns them)
  const bookImages = (book.images ?? []) as BookImageSummary[];

  const handleSelectChapterImage = async (chapterId: string, imageId: string) => {
    setSelectingImage(imageId);
    try {
      await addonsApi.selectChapterImage(book.id, chapterId, imageId);
      toast.success(tj("imageSelected"));
      setImageGalleryOpen(false);
      setExpandedImage(null);
      onRefetch();
    } catch {
      toast.error(t("requestError"));
    } finally {
      setSelectingImage(null);
    }
  };

  const hasProcessingImages = addons.some(
    (a) => a.kind === ProductKind.ADDON_IMAGES && isAddonProcessing(a.status),
  );

  const handleRequestMoreImages = async () => {
    setRequestingMoreImages(true);
    try {
      await addonsApi.create(book.id, { kind: ProductKind.ADDON_IMAGES });
      toast.success(t("requestSuccess"));
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
      setRequestingMoreImages(false);
    }
  };

  // ── Compute track ──

  const stepStatuses = PUBLISHING_STEPS.map((step) => ({
    ...step,
    status: getStepStatus(step.kinds, addons),
  }));

  const completedSteps = stepStatuses.filter(
    (s) => s.status === "completed",
  ).length;
  const totalSteps = stepStatuses.length;
  const remainingSteps = totalSteps - completedSteps;
  const progressPercent = (completedSteps / totalSteps) * 100;
  const allPublishingDone = completedSteps === totalSteps;

  const nextStep = stepStatuses.find(
    (s) => s.status === "available" || s.status === "error",
  );

  const extrasCompleted = EXTRA_CONFIGS.filter((cfg) => {
    const existing = getExistingAddon(cfg.kind);
    return existing?.status === AddonStatus.COMPLETED;
  }).length;

  // ── Render ──

  return (
    <>
      {/* ─── PUBLISHING TRACK ─── */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-amber-500/10">
        {/* Animated glow background */}
        {!allPublishingDone && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-primary/20 rounded-full blur-[60px] animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-amber-500/20 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: "1s" }} />
          </div>
        )}

        <div className="relative">
          {/* Header — always visible, tappable */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left p-5 md:p-6"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${allPublishingDone ? "bg-emerald-500/20 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20" : "bg-primary/20 border-2 border-primary/40 shadow-lg shadow-primary/20 animate-pulse"}`}>
                {allPublishingDone ? (
                  <Crown className="w-6 h-6 text-emerald-400" />
                ) : (
                  <Rocket className="w-6 h-6 text-primary" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                {/* Headline */}
                {allPublishingDone ? (
                  <h3 className="font-heading font-black text-base md:text-lg text-emerald-400">
                    {tj("headlineComplete")}
                  </h3>
                ) : (
                  <h3 className="font-heading font-black text-base md:text-lg text-foreground leading-tight">
                    {tj("headline", { steps: remainingSteps })}
                  </h3>
                )}

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <Progress value={progressPercent} className="h-3 flex-1" />
                  <span className="text-xs font-black text-primary tabular-nums shrink-0">
                    {completedSteps}/{totalSteps}
                  </span>
                </div>

                {/* Next step hint when collapsed */}
                {!expanded && nextStep && (
                  <p className="text-xs font-bold text-primary/80 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {tj("nextAction")}: {tj(`step_${nextStep.id}`)}
                  </p>
                )}
              </div>

              <ChevronDown
                className={`w-5 h-5 text-muted-foreground shrink-0 mt-1 transition-transform duration-200 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* Expanded — vertical stepper */}
          {expanded && (
            <div className="px-5 md:px-6 pb-6">
              {/* Steps */}
              <div className="space-y-0">
                {stepStatuses.map((step, i) => {
                  const Icon = step.icon;
                  const isLast = i === stepStatuses.length - 1;
                  const isNext =
                    step.status === "available" &&
                    nextStep?.id === step.id;

                  return (
                    <div key={step.id} className="flex gap-3">
                      {/* Vertical connector + icon */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${
                            step.status === "completed"
                              ? step.completedBg
                              : step.status === "processing"
                                ? "bg-amber-500/10 border-amber-500/40 animate-pulse"
                                : step.status === "error"
                                  ? "bg-red-500/10 border-red-500/40"
                                  : isNext
                                    ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/10"
                                    : "bg-accent/50 border-border"
                          }`}
                        >
                          {step.status === "completed" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : step.status === "processing" ? (
                            <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                          ) : step.status === "error" ? (
                            <XCircle className="w-5 h-5 text-red-400" />
                          ) : (
                            <Icon
                              className={`w-5 h-5 ${isNext ? "text-primary" : "text-muted-foreground/50"}`}
                            />
                          )}
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 flex-1 min-h-6 my-1 rounded-full transition-colors ${
                              step.status === "completed"
                                ? "bg-emerald-500/40"
                                : "bg-border"
                            }`}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 ${isLast ? "pb-0" : "pb-3"}`}>
                        <div className="flex items-center justify-between gap-2 min-h-10">
                          <div>
                            <p
                              className={`text-sm font-bold ${
                                step.status === "completed"
                                  ? "text-foreground"
                                  : isNext
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {tj(`step_${step.id}`)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {tj(`stepDesc_${step.id}`)}
                            </p>
                          </div>
                          {step.status === "completed" && (
                            <CheckBadge />
                          )}
                          {step.status === "processing" && (
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-black uppercase tracking-widest shrink-0 animate-pulse">
                              {t("processing")}
                            </Badge>
                          )}
                        </div>

                        {/* ── CTA Buttons ── */}
                        {(step.status === "available" || step.status === "error") &&
                          step.id === "cover" && (
                            <StepCTA
                              config={ALL_ADDON_CONFIGS.find(
                                (c) => c.kind === ProductKind.ADDON_COVER,
                              )!}
                              existing={getExistingAddon(
                                ProductKind.ADDON_COVER,
                              )}
                              isNext={isNext}
                              onRequest={openRequestDialog}
                              tAddons={t}
                              tCommon={tCommon}
                            />
                          )}

                        {(step.status === "available" || step.status === "error") &&
                          step.id === "images" && (
                            <StepCTA
                              config={ALL_ADDON_CONFIGS.find(
                                (c) => c.kind === ProductKind.ADDON_IMAGES,
                              )!}
                              existing={getExistingAddon(
                                ProductKind.ADDON_IMAGES,
                              )}
                              isNext={isNext}
                              onRequest={openRequestDialog}
                              tAddons={t}
                              tCommon={tCommon}
                            />
                          )}

                        {(step.status === "available" || step.status === "error") &&
                          step.id === "amazon" && (
                            <div className="mt-3 space-y-2">
                              <StepCTA
                                config={ALL_ADDON_CONFIGS.find(
                                  (c) =>
                                    c.kind ===
                                    ProductKind.ADDON_AMAZON_STANDARD,
                                )!}
                                existing={getExistingAddon(
                                  ProductKind.ADDON_AMAZON_STANDARD,
                                )}
                                isNext={isNext}
                                onRequest={openRequestDialog}
                                tAddons={t}
                                tCommon={tCommon}
                                label={tj("amazonStandard")}
                                sublabel={`${CREDITS_COST[ProductKind.ADDON_AMAZON_STANDARD]} ${tCommon("credits")}`}
                              />
                              <StepCTA
                                config={ALL_ADDON_CONFIGS.find(
                                  (c) =>
                                    c.kind ===
                                    ProductKind.ADDON_AMAZON_PREMIUM,
                                )!}
                                existing={getExistingAddon(
                                  ProductKind.ADDON_AMAZON_PREMIUM,
                                )}
                                isNext={isNext}
                                onRequest={openRequestDialog}
                                tAddons={t}
                                tCommon={tCommon}
                                label={tj("amazonPremium")}
                                sublabel={`${CREDITS_COST[ProductKind.ADDON_AMAZON_PREMIUM]} ${tCommon("credits")}`}
                                premium
                              />
                            </div>
                          )}

                        {/* Result link / Cover gallery */}
                        {step.status === "completed" &&
                          step.kinds.length > 0 &&
                          (() => {
                            // Cover step: open gallery instead of external link
                            if (step.id === "cover" && coverImages.length > 0) {
                              return (
                                <div className="mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-xs gap-1.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                    onClick={() => setCoverGalleryOpen(true)}
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    {tj("viewCovers")}
                                  </Button>
                                </div>
                              );
                            }

                            // Images step: always open gallery (not external link)
                            if (step.id === "images") {
                              return (
                                <div className="mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-xs gap-1.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                    onClick={() => setImageGalleryOpen(true)}
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    {tj("viewImages")}
                                  </Button>
                                </div>
                              );
                            }

                            const completed = addons.find(
                              (a) =>
                                step.kinds.includes(a.kind as ProductKind) &&
                                a.status === AddonStatus.COMPLETED &&
                                a.resultUrl,
                            );
                            if (!completed) return null;
                            return (
                              <div className="mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl text-xs gap-1.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                  asChild
                                >
                                  <a
                                    href={completed.resultUrl!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    {t("viewResult")}
                                  </a>
                                </Button>
                              </div>
                            );
                          })()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Premium Bundle Card (full width, below stepper) ── */}
              {publishBundleAvailable && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {tCommon("or")}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <BundleCard
                    bundle={BUNDLE_PUBLISH_PREMIUM}
                    onRequest={() => openBundleDialog(BUNDLE_PUBLISH_PREMIUM)}
                    tj={tj}
                    tCommon={tCommon}
                  />
                </div>
              )}
            </div>
          )}

          {/* Extras trigger */}
          <div className="border-t border-primary/10">
            <button
              type="button"
              onClick={() => setExtrasOpen(true)}
              className="w-full flex items-center justify-between gap-3 px-5 md:px-6 py-3.5 text-left hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {tj("extrasTitle")}
                </span>
                {extrasCompleted > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black">
                    {extrasCompleted}/{EXTRA_CONFIGS.length}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-primary font-bold flex items-center gap-1">
                {tj("viewExtras")}
                <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Cover Gallery Sheet ─── */}
      <Sheet open={coverGalleryOpen} onOpenChange={(open) => {
        setCoverGalleryOpen(open);
        if (!open) setExpandedCover(null);
      }}>
        <SheetContent
          side="bottom"
          className="rounded-t-[2rem] max-h-[85vh] overflow-y-auto"
        >
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-pink-500" />
              {tj("coverGalleryTitle")}
            </SheetTitle>
            <SheetDescription>{tj("coverGallerySubtitle")}</SheetDescription>
          </SheetHeader>

          {/* Expanded view */}
          {expandedCover ? (
            <div className="pb-6 space-y-4">
              <button
                type="button"
                onClick={() => setExpandedCover(null)}
                className="text-xs font-bold text-primary flex items-center gap-1"
              >
                <ArrowRight className="w-3 h-3 rotate-180" />
                {tj("backToGallery")}
              </button>

              <div className="flex justify-center">
                <img
                  src={expandedCover.url}
                  alt={expandedCover.name}
                  className="max-h-[50vh] w-auto rounded-xl border-2 border-border shadow-xl object-contain"
                />
              </div>

              {book.selectedCoverFileId === expandedCover.id ? (
                <div className="flex items-center justify-center gap-2 py-3 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  {tj("currentCover")}
                </div>
              ) : (
                <Button
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-amber-500 text-primary-foreground hover:from-primary/90 hover:to-amber-500/90 font-bold"
                  size="lg"
                  onClick={() => handleSelectCover(expandedCover.id)}
                  disabled={selectingCover === expandedCover.id}
                >
                  {selectingCover === expandedCover.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Palette className="w-4 h-4 mr-2" />
                  )}
                  {tj("selectAsCover")}
                </Button>
              )}
            </div>
          ) : (
            /* Grid view */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-6">
              {coverImages.map((file) => {
                const isSelected = book.selectedCoverFileId === file.id;

                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setExpandedCover({ id: file.id, url: file.fileUrl, name: file.fileName })}
                    className={`relative group rounded-xl overflow-hidden border-2 transition-all aspect-[3/4] ${
                      isSelected
                        ? "border-emerald-400 shadow-lg shadow-emerald-500/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={file.fileUrl}
                      alt={file.fileName}
                      className="w-full h-full object-cover"
                    />

                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Tap hint overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                      <span className="text-white text-[10px] font-bold bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                        {tj("tapToExpand")}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Generate more covers button */}
              <button
                type="button"
                onClick={handleRequestMoreCovers}
                disabled={requestingMoreCovers || hasProcessingCovers}
                className="rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all aspect-[3/4] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestingMoreCovers || hasProcessingCovers ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                    <span className="text-[10px] font-bold text-primary/60">
                      {tj("generatingCovers")}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xs font-bold">{tj("generateMoreCovers")}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {CREDITS_COST[ProductKind.ADDON_COVER]} {tCommon("credits")}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Image Gallery Sheet ─── */}
      <Sheet open={imageGalleryOpen} onOpenChange={(open) => {
        setImageGalleryOpen(open);
        if (!open) setExpandedImage(null);
      }}>
        <SheetContent
          side="bottom"
          className="rounded-t-[2rem] max-h-[85vh] overflow-y-auto"
        >
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              {tj("imageGalleryTitle")}
            </SheetTitle>
            <SheetDescription>{tj("imageGallerySubtitle")}</SheetDescription>
          </SheetHeader>

          {/* Expanded view */}
          {expandedImage ? (
            <div className="pb-6 space-y-4">
              <button
                type="button"
                onClick={() => setExpandedImage(null)}
                className="text-xs font-bold text-primary flex items-center gap-1"
              >
                <ArrowRight className="w-3 h-3 rotate-180" />
                {tj("backToGallery")}
              </button>

              <div className="flex justify-center">
                <img
                  src={expandedImage.url}
                  alt={expandedImage.caption ?? ""}
                  className="max-h-[50vh] w-auto rounded-xl border-2 border-border shadow-xl object-contain"
                />
              </div>

              {expandedImage.caption && (
                <p className="text-xs text-muted-foreground text-center italic">
                  {expandedImage.caption}
                </p>
              )}

              {/* Already assigned to a chapter? Show badge or reassign */}
              {(() => {
                const assignedChapter = expandedImage.chapterId
                  ? book.chapters.find((ch) => ch.selectedImageId === expandedImage.id)
                  : null;

                if (assignedChapter) {
                  return (
                    <div className="flex items-center justify-center gap-2 py-3 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      {tj("currentImage")} — {assignedChapter.sequence}. {assignedChapter.title}
                    </div>
                  );
                }

                return null;
              })()}

              {/* Chapter selector + assign button */}
              <div className="space-y-3">
                <Select value={selectedChapterForImage} onValueChange={setSelectedChapterForImage}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={tj("chooseChapter")} />
                  </SelectTrigger>
                  <SelectContent>
                    {book.chapters.map((ch) => (
                      <SelectItem key={ch.id} value={ch.id}>
                        {ch.sequence}. {ch.title}
                        {ch.selectedImageId ? ` ✓` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-500/90 hover:to-purple-500/90 font-bold"
                  size="lg"
                  onClick={() => handleSelectChapterImage(selectedChapterForImage, expandedImage.id)}
                  disabled={!selectedChapterForImage || selectingImage === expandedImage.id}
                >
                  {selectingImage === expandedImage.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ImageIcon className="w-4 h-4 mr-2" />
                  )}
                  {tj("selectAsImage")}
                </Button>
              </div>
            </div>
          ) : (
            /* Flat grid — all images */
            <div className="pb-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {bookImages.map((img) => {
                  const isSelected = book.chapters.some((ch) => ch.selectedImageId === img.id);

                  return (
                    <ImageGridItem
                      key={img.id}
                      img={img}
                      isSelected={isSelected}
                      onExpand={(data) => {
                        setSelectedChapterForImage("");
                        setExpandedImage(data);
                      }}
                      tj={tj}
                    />
                  );
                })}
              </div>

              {/* Generate more images button */}
              <button
                type="button"
                onClick={handleRequestMoreImages}
                disabled={requestingMoreImages || hasProcessingImages}
                className="w-full rounded-xl border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 transition-all py-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestingMoreImages || hasProcessingImages ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500/60" />
                    <span className="text-[10px] font-bold text-indigo-500/60">
                      {tj("generatingImages")}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-indigo-500" />
                    </div>
                    <span className="text-xs font-bold">{tj("generateMoreImages")}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {CREDITS_COST[ProductKind.ADDON_IMAGES]} {tCommon("credits")}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Extras Bottom Sheet ─── */}
      <Sheet open={extrasOpen} onOpenChange={setExtrasOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[2rem] max-h-[80vh] overflow-y-auto"
        >
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {tj("extrasTitle")}
            </SheetTitle>
            <SheetDescription>{tj("extrasSubtitle")}</SheetDescription>
          </SheetHeader>

          <div className="space-y-3 pb-6">
            {/* Global Launch Bundle */}
            {globalLaunchBundleAvailable && (
              <>
                <BundleCard
                  bundle={BUNDLE_GLOBAL_LAUNCH}
                  onRequest={() => {
                    setExtrasOpen(false);
                    openBundleDialog(BUNDLE_GLOBAL_LAUNCH);
                  }}
                  tj={tj}
                  tCommon={tCommon}
                />
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {tCommon("or")}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              </>
            )}

            {EXTRA_CONFIGS.map((config) => {
              const Icon = config.icon;
              const existing = getExistingAddon(config.kind);

              return (
                <div
                  key={config.kind}
                  className="flex items-center gap-3 p-4 rounded-xl bg-accent/30 border border-border"
                >
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${config.iconBg}`}
                  >
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {t(`kind_${config.kind}`)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t(`kindDesc_${config.kind}`)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <ExtraAddonAction
                      config={config}
                      existing={existing}
                      onRequest={openRequestDialog}
                      tAddons={t}
                      tCommon={tCommon}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Request Dialog ─── */}
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
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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

      {/* ─── Bundle Confirmation Dialog ─── */}
      <AlertDialog open={bundleDialogOpen} onOpenChange={setBundleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              {selectedBundle ? tj(`bundleTitle_${selectedBundle.id}`) : ""}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  {selectedBundle
                    ? tj(`bundleConfirm_${selectedBundle.id}`, {
                        cost: selectedBundle.cost,
                        originalCost: selectedBundle.originalCost,
                        balance: balance ?? 0,
                      })
                    : ""}
                </p>

                {balance !== null &&
                  selectedBundle &&
                  balance < selectedBundle.cost && (
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
            selectedBundle &&
            balance < selectedBundle.cost ? (
              <Button asChild>
                <Link href="/dashboard/wallet/buy-credits">
                  {t("buyCredits")}
                </Link>
              </Button>
            ) : (
              <AlertDialogAction
                onClick={handleBundleRequest}
                disabled={requestingBundle}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
              >
                {requestingBundle ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Package className="w-4 h-4 mr-2" />
                )}
                {selectedBundle ? tj(`bundleCta_${selectedBundle.id}`) : ""}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function CheckBadge() {
  return (
    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    </div>
  );
}

/** Big, eye-catching CTA button for publishing steps */
function StepCTA({
  config,
  existing,
  isNext,
  onRequest,
  tAddons,
  tCommon,
  label,
  sublabel,
  premium,
}: {
  config: AddonConfig;
  existing: BookAddonSummary | undefined;
  isNext: boolean;
  onRequest: (config: AddonConfig) => void;
  tAddons: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
  label?: string;
  sublabel?: string;
  premium?: boolean;
}) {
  if (existing?.status === AddonStatus.COMPLETED) {
    return existing.resultUrl ? (
      <div className="mt-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl text-xs gap-1.5 border-emerald-500/20 text-emerald-400"
          asChild
        >
          <a href={existing.resultUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5" />
            {tAddons("viewResult")}
          </a>
        </Button>
      </div>
    ) : null;
  }

  if (existing && isAddonProcessing(existing.status)) {
    return (
      <div className="mt-2">
        <span className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {tAddons("processing")}
        </span>
      </div>
    );
  }

  const displayLabel = label ?? tAddons("request");
  const displayCost = sublabel ?? `${config.cost} ${tCommon("credits")}`;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => onRequest(config)}
        className={`w-full group relative overflow-hidden rounded-xl p-4 text-left transition-all active:scale-[0.97] ${
          premium
            ? "bg-gradient-to-r from-amber-500/20 to-orange-500/15 border-2 border-amber-500/40 hover:border-amber-400/60 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20"
            : isNext
              ? "bg-gradient-to-r from-primary/15 to-primary/5 border-2 border-primary/40 hover:border-primary/60 shadow-lg shadow-primary/10 hover:shadow-primary/20"
              : "bg-accent/50 border-2 border-border hover:border-primary/30"
        }`}
      >
        {/* Shimmer sweep */}
        {(isNext || premium) && (
          <div
            className={`absolute inset-0 animate-shimmer pointer-events-none ${
              premium
                ? "bg-gradient-to-r from-transparent via-amber-400/20 to-transparent"
                : "bg-gradient-to-r from-transparent via-white/15 to-transparent"
            }`}
          />
        )}

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                premium
                  ? "bg-amber-500/20"
                  : "bg-primary/20"
              }`}
            >
              {premium ? (
                <Crown className="w-5 h-5 text-amber-400" />
              ) : (
                <Zap className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <p className={`text-sm font-black ${premium ? "text-amber-400" : "text-foreground"}`}>
                {displayLabel}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                {displayCost}
              </p>
            </div>
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5 ${
              premium
                ? "bg-amber-500/20"
                : "bg-primary/20"
            }`}
          >
            <ArrowRight
              className={`w-4 h-4 ${
                premium ? "text-amber-400" : "text-primary"
              }`}
            />
          </div>
        </div>
      </button>
    </div>
  );
}

function ExtraAddonAction({
  config,
  existing,
  onRequest,
  tAddons,
  tCommon,
}: {
  config: AddonConfig;
  existing: BookAddonSummary | undefined;
  onRequest: (config: AddonConfig) => void;
  tAddons: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  if (existing?.status === AddonStatus.COMPLETED) {
    return existing.resultUrl ? (
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl text-xs gap-1"
        asChild
      >
        <a href={existing.resultUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-3 h-3" />
          {tAddons("viewResult")}
        </a>
      </Button>
    ) : (
      <Badge className="bg-emerald-500/10 text-emerald-400 text-[9px]">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {tAddons("done")}
      </Badge>
    );
  }

  if (existing && isAddonProcessing(existing.status)) {
    return (
      <Badge className="bg-amber-500/10 text-amber-400 text-[9px] animate-pulse">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        {tAddons("processing")}
      </Badge>
    );
  }

  if (existing?.status === AddonStatus.ERROR) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl text-xs text-red-400 border-red-500/20"
        onClick={() => onRequest(config)}
      >
        {tAddons("retry")}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl text-xs font-bold"
      onClick={() => onRequest(config)}
    >
      {config.cost} {tCommon("credits")}
    </Button>
  );
}

/** Eye-catching bundle card with shake animation — works for any bundle */
function BundleCard({
  bundle,
  onRequest,
  tj,
  tCommon,
}: {
  bundle: BundleConfig;
  onRequest: () => void;
  tj: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const [shaking, setShaking] = useState(false);

  // Periodic shake every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      type="button"
      onClick={onRequest}
      className={`w-full group relative overflow-hidden rounded-2xl p-5 text-left transition-all active:scale-[0.97] bg-gradient-to-br from-amber-500/25 via-orange-500/15 to-yellow-500/20 border-2 border-amber-400/50 hover:border-amber-400/80 shadow-xl shadow-amber-500/15 hover:shadow-amber-500/30 ${
        shaking ? "animate-shake" : ""
      }`}
      onMouseEnter={() => {
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
      }}
    >
      {/* Shimmer sweep */}
      <div className="absolute inset-0 animate-shimmer pointer-events-none bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

      {/* Glow pulse */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-amber-400/20 rounded-full blur-[40px] animate-pulse" />

      <div className="relative">
        {/* Badge row */}
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-widest border-0 px-2.5 py-0.5 shadow-lg shadow-amber-400/30">
            {tj("bundleBadge")}
          </Badge>
          <Badge className="bg-red-500/90 text-white text-[10px] font-black border-0 px-2 py-0.5">
            {tj("bundleDiscount", { percent: bundle.discountPercent })}
          </Badge>
        </div>

        {/* Title + description */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
              <Crown className="w-4 h-4 shrink-0" />
              {tj(`bundleTitle_${bundle.id}`)}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {tj(`bundleSubtitle_${bundle.id}`)}
            </p>
          </div>

          {/* Package icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/30 to-orange-500/20 border-2 border-amber-400/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <Package className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        {/* Price row */}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-muted-foreground line-through">
            {bundle.originalCost} {tCommon("credits")}
          </span>
          <span className="text-lg font-black text-amber-400">
            {bundle.cost} {tCommon("credits")}
          </span>
        </div>

        {/* CTA button */}
        <div className="mt-3 flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl px-4 py-3 text-amber-950 group-hover:from-amber-400 group-hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25">
          <span className="text-sm font-black tracking-wide">
            {tj(`bundleCta_${bundle.id}`)}
          </span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}

/** Reusable image thumbnail for the gallery grid */
function ImageGridItem({
  img,
  isSelected,
  onExpand,
  tj,
}: {
  img: BookImageSummary;
  isSelected: boolean;
  onExpand: (data: { id: string; url: string; caption: string | null; chapterId: string | null }) => void;
  tj: ReturnType<typeof useTranslations>;
}) {
  return (
    <button
      type="button"
      onClick={() => onExpand({ id: img.id, url: img.imageUrl, caption: img.caption, chapterId: img.chapterId })}
      className={`relative group rounded-xl overflow-hidden border-2 transition-all aspect-square ${
        isSelected
          ? "border-emerald-400 shadow-lg shadow-emerald-500/20"
          : "border-border hover:border-indigo-500/50"
      }`}
    >
      <img
        src={img.imageUrl}
        alt={img.caption ?? ""}
        className="w-full h-full object-cover"
      />

      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
        <span className="text-white text-[10px] font-bold bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-sm">
          {tj("tapToExpand")}
        </span>
      </div>
    </button>
  );
}
