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
  Clock,
  Eye,
  Lock,
  UserCheck,
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
import { ProductKind, AddonStatus, FileType, SUPPORTED_LANGUAGES } from "@bestsellers/shared";
import type { BundleConfigPayload } from "@bestsellers/shared";
import { useConfigStore } from "@/stores/config-store";
import type { BookAddonSummary, BookDetail, BookImageSummary, PublishingRequestSummary } from "@/lib/api/types";
import { publishingApi } from "@/lib/api/publishing";
import { PublishingInfoOverlay } from "./publishing-info-overlay";
import { AudiobookViewer } from "./audiobook-viewer";
import { PublishingResultSheet } from "./publishing-result-sheet";

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

function buildExtraConfigs(getCost: (kind: string) => number): AddonConfig[] {
  return [
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
      kind: ProductKind.ADDON_AUDIOBOOK,
      icon: Headphones,
      cost: getCost(ProductKind.ADDON_AUDIOBOOK),
      hasLanguageParam: false,
      color: "text-emerald-500",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
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
  ];
}

// All addon configs (for dialog lookup)
function buildAllAddonConfigs(getCost: (kind: string) => number): AddonConfig[] {
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
      kind: ProductKind.ADDON_IMAGES,
      icon: ImageIcon,
      cost: getCost(ProductKind.ADDON_IMAGES),
      hasLanguageParam: false,
      color: "text-indigo-500",
      iconBg: "bg-indigo-500/10 border-indigo-500/20",
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
    ...buildExtraConfigs(getCost),
  ];
}

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
  /** When set, this is a translated book — only show audiobook + publishing addons */
  translationId?: string;
}

export function AuthorJourney({ book, onRefetch, translationId }: AuthorJourneyProps) {
  const t = useTranslations("addons");
  const tj = useTranslations("authorJourney");
  const tCommon = useTranslations("common");
  const tPublishing = useTranslations("publishing");
  const tTrans = useTranslations("translations");
  const fetchWalletStore = useWalletStore((s) => s.fetchWallet);
  const getCreditsCost = useConfigStore((s) => s.getCreditsCost);
  const getBundles = useConfigStore((s) => s.getBundles);

  const EXTRA_CONFIGS_ALL = buildExtraConfigs(getCreditsCost);
  const ALL_ADDON_CONFIGS = buildAllAddonConfigs(getCreditsCost);

  // For translated books: only show audiobook + publishing + cover translation (if needed)
  // For original books: hide amazon (already in the stepper)
  const currentTranslation = translationId
    ? book.translations?.find((tr) => tr.id === translationId)
    : null;
  const translationLang = currentTranslation?.targetLanguage;
  const TRANSLATION_ALLOWED_KINDS = new Set([
    ProductKind.ADDON_AUDIOBOOK,
    ProductKind.ADDON_AMAZON_STANDARD,
    ProductKind.ADDON_AMAZON_PREMIUM,
    ProductKind.ADDON_COVER_TRANSLATION,
  ]);
  const STEPPER_KINDS = new Set([
    ProductKind.ADDON_COVER,
    ProductKind.ADDON_IMAGES,
    ProductKind.ADDON_AMAZON_STANDARD,
    ProductKind.ADDON_AMAZON_PREMIUM,
  ]);
  const EXTRA_CONFIGS_UNFILTERED = translationId
    ? EXTRA_CONFIGS_ALL.filter((c) => TRANSLATION_ALLOWED_KINDS.has(c.kind))
    : EXTRA_CONFIGS_ALL.filter((c) => !STEPPER_KINDS.has(c.kind));

  const bundles = getBundles();
  const BUNDLE_PUBLISH_PREMIUM = bundles["BUNDLE_PUBLISH_PREMIUM"];
  const BUNDLE_GLOBAL_LAUNCH = bundles["BUNDLE_GLOBAL_LAUNCH"];

  const [addons, setAddons] = useState<BookAddonSummary[]>(book.addons ?? []);
  const [balance, setBalance] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [extrasOpen, setExtrasOpen] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<AddonConfig | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [languagePreset, setLanguagePreset] = useState(false);
  const [selectedVoiceGender, setSelectedVoiceGender] = useState<"female" | "male">("female");
  const [isRegeneration, setIsRegeneration] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Audiobook viewer state
  const [audiobookViewerOpen, setAudiobookViewerOpen] = useState(false);

  // Publishing state
  const [publishingRequests, setPublishingRequests] = useState<PublishingRequestSummary[]>([]);
  const [publishingResultSheetOpen, setPublishingResultSheetOpen] = useState(false);
  const [publishingResultAddon, setPublishingResultAddon] = useState<{ publishing: PublishingRequestSummary; addonKind: string } | null>(null);

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

  // Translation sheets state
  const [translationsSheetOpen, setTranslationsSheetOpen] = useState(false);
  const [coverTranslationsSheetOpen, setCoverTranslationsSheetOpen] = useState(false);
  const [expandedTranslatedCover, setExpandedTranslatedCover] = useState<{ url: string; fileName: string } | null>(null);
  const [regeneratingCover, setRegeneratingCover] = useState(false);
  const [coverLangFilter, setCoverLangFilter] = useState<string>("all");

  // Sync expanded translated cover when book files update (after regeneration)
  useEffect(() => {
    if (!expandedTranslatedCover) return;
    const updated = book.files.find(
      (f) => f.fileType === ("COVER_TRANSLATED" as string) && f.fileName === expandedTranslatedCover.fileName,
    );
    if (updated && updated.fileUrl !== expandedTranslatedCover.url) {
      setExpandedTranslatedCover({ url: updated.fileUrl, fileName: updated.fileName });
      setRegeneratingCover(false);
    }
  }, [book.files, expandedTranslatedCover]);

  // Confirmation dialog for "generate more" actions
  const [confirmMoreType, setConfirmMoreType] = useState<"covers" | "images" | null>(null);

  // Publishing overlay state
  const [publishingOverlayOpen, setPublishingOverlayOpen] = useState(false);

  // Bundle state
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<BundleConfigPayload | null>(null);
  const [requestingBundle, setRequestingBundle] = useState(false);

  // Hide the other publishing type when one is already requested (not ERROR/CANCELLED)
  const activePublishingKind = addons.find(
    (a) =>
      (a.kind === ProductKind.ADDON_AMAZON_STANDARD || a.kind === ProductKind.ADDON_AMAZON_PREMIUM) &&
      a.status !== AddonStatus.ERROR &&
      a.status !== AddonStatus.CANCELLED &&
      (translationId ? a.translationId === translationId : !a.translationId),
  )?.kind as ProductKind | undefined;

  const EXTRA_CONFIGS = activePublishingKind
    ? EXTRA_CONFIGS_UNFILTERED.filter((c) => {
        if (c.kind === ProductKind.ADDON_AMAZON_STANDARD || c.kind === ProductKind.ADDON_AMAZON_PREMIUM) {
          return c.kind === activePublishingKind;
        }
        return true;
      })
    : EXTRA_CONFIGS_UNFILTERED;

  const prevAddonsRef = useRef<BookAddonSummary[]>(addons);

  const fetchAddons = useCallback(async () => {
    try {
      const data = await addonsApi.list(book.id);
      // Detect addons that just completed → refetch book to get new files/images
      // Covers two cases:
      // 1. Addon existed in prev as processing, now completed
      // 2. New addon appeared (wasn't in prev) and is already completed
      const prev = prevAddonsRef.current;
      const justCompleted = data.some((a) => {
        if (a.status !== AddonStatus.COMPLETED) return false;
        const prevAddon = prev.find((p) => p.id === a.id);
        if (!prevAddon) return prev.length > 0; // new addon appeared (skip initial load)
        return isAddonProcessing(prevAddon.status);
      });
      prevAddonsRef.current = data;
      setAddons(data);
      if (justCompleted) {
        onRefetch();
      }
    } catch {
      // silently fail
    }
  }, [book.id, onRefetch]);

  const fetchPublishingRequests = useCallback(async () => {
    try {
      const data = await publishingApi.listByBook(book.id);
      setPublishingRequests(data);
    } catch {
      // silently fail
    }
  }, [book.id]);

  useEffect(() => {
    fetchAddons();
    fetchPublishingRequests();
    walletApi
      .get()
      .then((w) => setBalance(w.balance))
      .catch(() => {});
  }, [fetchAddons, fetchPublishingRequests]);

  // Poll addons every 5s while any are processing
  const hasProcessing = addons.some((a) => isAddonProcessing(a.status));
  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      fetchAddons();
    }, 5000);
    return () => clearInterval(interval);
  }, [hasProcessing, fetchAddons]);

  // Addon kinds that are linked to a specific translation (have translationId in params)
  const TRANSLATION_SCOPED_KINDS = new Set([
    ProductKind.ADDON_AUDIOBOOK,
    ProductKind.ADDON_AMAZON_STANDARD,
    ProductKind.ADDON_AMAZON_PREMIUM,
  ]);

  const getExistingAddon = (kind: ProductKind | string): BookAddonSummary | undefined => {
    const matching = addons.filter((a) => {
      if (a.kind !== kind) return false;
      // For translation-scoped addons, filter by translationId context
      if (TRANSLATION_SCOPED_KINDS.has(a.kind as ProductKind)) {
        if (translationId) return a.translationId === translationId;
        return !a.translationId;
      }
      // For book-level addons (cover, images, translation, cover-translation), always show
      return true;
    });
    if (matching.length <= 1) return matching[0];
    // Prioritize: processing > COMPLETED > most recent (ERROR etc.)
    // Processing takes precedence so regeneration shows loading state
    return (
      matching.find((a) => isAddonProcessing(a.status)) ??
      matching.find((a) => a.status === AddonStatus.COMPLETED) ??
      matching.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    );
  };

  const openRequestDialog = (config: AddonConfig, presetLanguage?: string, regenerate?: boolean) => {
    setSelectedAddon(config);
    setSelectedLanguage(presetLanguage ?? "");
    setLanguagePreset(!!presetLanguage);
    setIsRegeneration(regenerate ?? false);
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
      if (selectedAddon.kind === ProductKind.ADDON_AUDIOBOOK) {
        params.voiceGender = selectedVoiceGender;
        if (isRegeneration) params.regenerate = true;
      }
      // Cover translation is always a book-level addon (not tied to a specific translation)
      if (translationId && selectedAddon.kind !== ProductKind.ADDON_COVER_TRANSLATION) {
        params.translationId = translationId;
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
  const isBundleAvailable = (bundle: BundleConfigPayload) =>
    bundle.kinds.every((kind) => {
      const existing = getExistingAddon(kind);
      return !existing || existing.status === AddonStatus.ERROR || existing.status === AddonStatus.CANCELLED;
    });

  // Check if the original book (not translation) has an active publishing request
  const hasOriginalBookPublishing = addons.some(
    (a) =>
      (a.kind === ProductKind.ADDON_AMAZON_STANDARD || a.kind === ProductKind.ADDON_AMAZON_PREMIUM) &&
      a.status !== AddonStatus.ERROR &&
      a.status !== AddonStatus.CANCELLED &&
      !a.translationId,
  );

  const publishBundleAvailable = isBundleAvailable(BUNDLE_PUBLISH_PREMIUM);
  const globalLaunchBundleAvailable = isBundleAvailable(BUNDLE_GLOBAL_LAUNCH);

  const [bundleLanguage, setBundleLanguage] = useState("");

  const bundleNeedsLanguage = (bundle: BundleConfigPayload) =>
    bundle.kinds.includes(ProductKind.ADDON_TRANSLATION as string) ||
    bundle.kinds.includes(ProductKind.ADDON_COVER_TRANSLATION as string);

  const openBundleDialog = (bundle: BundleConfigPayload) => {
    setSelectedBundle(bundle);
    setBundleLanguage("");
    setBundleDialogOpen(true);
  };

  const handleBundleRequest = async () => {
    if (!selectedBundle) return;
    if (bundleNeedsLanguage(selectedBundle) && !bundleLanguage) return;
    setRequestingBundle(true);
    try {
      const params: Record<string, unknown> = {};
      if (bundleNeedsLanguage(selectedBundle) && bundleLanguage) {
        params.targetLanguage = bundleLanguage;
      }
      await addonsApi.createBundle(book.id, selectedBundle.id, Object.keys(params).length > 0 ? params : undefined);
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

  // Cover images from book files — deduplicated by URL, sorted by creation date
  const coverImages = (() => {
    const covers = (book.files ?? []).filter(
      (f) => f.fileType === FileType.COVER_IMAGE,
    );
    const seen = new Set<string>();
    return covers
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .filter((f) => {
        if (seen.has(f.fileUrl)) return false;
        seen.add(f.fileUrl);
        return true;
      });
  })();

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

  // Chapter images — deduplicated by URL (old batches shared the same S3 key)
  const bookImages = (() => {
    const imgs = (book.images ?? []) as BookImageSummary[];
    const seen = new Set<string>();
    return imgs.filter((img) => {
      if (seen.has(img.imageUrl)) return false;
      seen.add(img.imageUrl);
      return true;
    });
  })();

  const handleSelectChapterImage = async (chapterId: string, imageId: string) => {
    setSelectingImage(imageId);
    try {
      await addonsApi.selectChapterImage(book.id, chapterId, imageId);
      toast.success(tj("imageSelected"));
      setExpandedImage(null);
      setSelectedChapterForImage("");
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

  const handleRegenerateCoverTranslation = async (langCode: string) => {
    setRegeneratingCover(true);
    try {
      await addonsApi.create(book.id, {
        kind: ProductKind.ADDON_COVER_TRANSLATION,
        params: { targetLanguage: langCode, regenerate: true },
      });
      toast.success(t("requestSuccess"));
      fetchAddons();
      onRefetch();
    } catch {
      toast.error(t("requestError"));
    } finally {
      setRegeneratingCover(false);
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
      {/* ─── PUBLISHING TRACK (hidden for translations) ─── */}
      {translationId ? (
        /* For translated books: show extras inline */
        <div className="space-y-3">
          {EXTRA_CONFIGS.map((config) => {
            const Icon = config.icon;
            const existing = getExistingAddon(config.kind);
            const isPublishingAddonProcessing =
              (config.kind === ProductKind.ADDON_AMAZON_STANDARD || config.kind === ProductKind.ADDON_AMAZON_PREMIUM) &&
              existing && isAddonProcessing(existing.status);

            return (
              <div
                key={config.kind}
                className={`p-4 rounded-xl space-y-3 ${
                  isPublishingAddonProcessing
                    ? "bg-blue-500/5 border border-blue-500/30"
                    : "bg-accent/30 border border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                    isPublishingAddonProcessing
                      ? "bg-blue-500/10 border-blue-500/20"
                      : config.iconBg
                  }`}>
                    {isPublishingAddonProcessing ? (
                      <UserCheck className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{t(`kind_${config.kind}`)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t(`kindDesc_${config.kind}`)}</p>
                    {isPublishingAddonProcessing ? (
                      <>
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-blue-400/80">
                          <Clock className="w-3 h-3" />
                          {t(`time_${config.kind}`)}
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {tj("publishingMessage")}
                        </p>
                      </>
                    ) : t(`time_${config.kind}`) && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-primary/70">
                        <Clock className="w-3 h-3" />
                        {t(`time_${config.kind}`)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <ExtraAddonAction
                    config={config}
                    existing={existing}
                    onRequest={(cfg) => {
                      // For cover translation in translation view, preset the language
                      if (cfg.kind === ProductKind.ADDON_COVER_TRANSLATION && translationLang) {
                        openRequestDialog(cfg, translationLang);
                      } else {
                        openRequestDialog(cfg);
                      }
                    }}

                    tAddons={t}
                    tCommon={tCommon}
                    onViewCoverTranslations={() => setCoverTranslationsSheetOpen(true)}
                    onViewAudiobook={() => setAudiobookViewerOpen(true)}
                    onViewPublication={() => {
                      const pubReq = publishingRequests.find((p) => existing && p.addonId === existing.id);
                      if (pubReq) {
                        setPublishingResultAddon({ publishing: pubReq, addonKind: config.kind });
                        setPublishingResultSheetOpen(true);
                      }
                    }}
                    viewLabel={
                      config.kind === ProductKind.ADDON_COVER_TRANSLATION
                        ? tj("viewTranslatedCover")
                        : config.kind === ProductKind.ADDON_AUDIOBOOK
                          ? tj("viewAudiobook")
                          : (config.kind === ProductKind.ADDON_AMAZON_STANDARD || config.kind === ProductKind.ADDON_AMAZON_PREMIUM)
                            ? tj("viewPublication")
                            : undefined
                    }
                    disabled={config.kind === ProductKind.ADDON_COVER_TRANSLATION && !book.selectedCoverFileId}
                    disabledMessage={t("coverRequired")}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
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

                  const isPublishingStep = step.id === "amazon" && step.status === "processing";

                  return (
                    <div key={step.id} className="flex gap-3">
                      {/* Vertical connector + icon */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${
                            step.status === "completed"
                              ? step.completedBg
                              : isPublishingStep
                                ? "bg-blue-500/10 border-blue-500/40"
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
                          ) : isPublishingStep ? (
                            <UserCheck className="w-5 h-5 text-blue-400" />
                          ) : step.status === "processing" ? (
                            <Loader2 className="w-5 h-5 dark:text-amber-400 text-amber-600 animate-spin" />
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
                            {step.kinds.length > 0 && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-primary/70">
                                <Clock className="w-3 h-3" />
                                {t(`time_${step.kinds[0]}`)}
                              </span>
                            )}
                          </div>
                          {step.status === "completed" && (
                            <CheckBadge />
                          )}
                          {step.status === "processing" && (
                            isPublishingStep ? (
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] font-black uppercase tracking-widest shrink-0">
                                <UserCheck className="w-3 h-3 mr-1" />
                                {t("publishingAwaiting")}
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/10 dark:text-amber-400 text-amber-600 border-amber-500/20 text-[9px] font-black uppercase tracking-widest shrink-0 animate-pulse">
                                {t("processing")}
                              </Badge>
                            )
                          )}
                        </div>

                        {/* Publishing step: human-action message */}
                        {isPublishingStep && (
                          <div className="mt-2 space-y-1.5">
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {tj("publishingMessage")}
                            </p>
                          </div>
                        )}

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
                              {(!activePublishingKind || activePublishingKind === ProductKind.ADDON_AMAZON_STANDARD) && (
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
                                sublabel={t("requestForCredits", { cost: getCreditsCost(ProductKind.ADDON_AMAZON_STANDARD) })}
                              />
                              )}
                              {(!activePublishingKind || activePublishingKind === ProductKind.ADDON_AMAZON_PREMIUM) && (
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
                                sublabel={t("requestForCredits", { cost: getCreditsCost(ProductKind.ADDON_AMAZON_PREMIUM) })}
                                premium
                              />
                              )}
                              <button
                                type="button"
                                onClick={() => setPublishingOverlayOpen(true)}
                                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r dark:from-amber-500/20 dark:via-orange-500/20 dark:to-amber-500/20 from-amber-600/15 via-orange-600/10 to-amber-600/15 border dark:border-amber-500/30 border-amber-600/30 dark:text-amber-400 text-amber-700 text-xs font-bold uppercase tracking-wider dark:hover:from-amber-500/30 dark:hover:via-orange-500/30 dark:hover:to-amber-500/30 hover:from-amber-600/25 hover:via-orange-600/20 hover:to-amber-600/25 dark:hover:border-amber-500/50 hover:border-amber-600/50 hover:shadow-lg dark:hover:shadow-amber-500/10 hover:shadow-amber-600/10 transition-all duration-300 flex items-center justify-center gap-2"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {tPublishing("learnMore")}
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
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

                            // Amazon publishing step: show publishing-aware display
                            if (step.id === "amazon") {
                              const amazonAddon = addons.find(
                                (a) =>
                                  step.kinds.includes(a.kind as ProductKind) &&
                                  a.status === AddonStatus.COMPLETED,
                              );
                              const pubReq = publishingRequests.find(
                                (p) => amazonAddon && p.addonId === amazonAddon.id,
                              );
                              if (pubReq) {
                                const isPubCompleted = pubReq.status === "PUBLISHED";
                                const isPubInProgress = pubReq.status === "REVIEW" || pubReq.status === "SUBMITTED";
                                return (
                                  <div className="mt-2 space-y-2.5">
                                    {isPubCompleted ? (
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <p className="text-xs font-bold text-emerald-400">{tj("publishingCompleted")}</p>
                                      </div>
                                    ) : isPubInProgress ? (
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                        <p className="text-xs font-bold text-amber-400">{tj("publishingInProgress")}</p>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                                        <p className="text-xs font-bold text-blue-400">{tj("publishingRequested")}</p>
                                      </div>
                                    )}
                                    {!isPubCompleted && (
                                      <p className="text-[11px] text-muted-foreground leading-relaxed">{tj("publishingMessage")}</p>
                                    )}
                                    {!isPubCompleted && pubReq.createdAt && (
                                      <p className="text-[10px] text-muted-foreground/70">
                                        {tj("publishingRequestedOn", { date: new Date(pubReq.createdAt).toLocaleDateString() })}
                                      </p>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-xl text-xs gap-1.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                      onClick={() => {
                                        setPublishingResultAddon({
                                          publishing: pubReq,
                                          addonKind: amazonAddon?.kind ?? "",
                                        });
                                        setPublishingResultSheetOpen(true);
                                      }}
                                    >
                                      <BookCheck className="w-3.5 h-3.5" />
                                      {tj("viewPublication")}
                                    </Button>
                                  </div>
                                );
                              }
                              // No publishing request yet — fall through to generic handler
                            }

                            // Translation addons: open sheets
                            const hasTranslation = addons.find(
                              (a) =>
                                step.kinds.includes(a.kind as ProductKind) &&
                                a.status === AddonStatus.COMPLETED &&
                                a.kind === ProductKind.ADDON_TRANSLATION,
                            );
                            if (hasTranslation) {
                              return (
                                <div className="mt-2">
                                  <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" onClick={() => setTranslationsSheetOpen(true)}>
                                    <Globe className="w-3.5 h-3.5" />
                                    {tTrans("viewTranslations")}
                                  </Button>
                                </div>
                              );
                            }

                            const hasCoverTranslation = addons.find(
                              (a) =>
                                step.kinds.includes(a.kind as ProductKind) &&
                                a.status === AddonStatus.COMPLETED &&
                                a.kind === ProductKind.ADDON_COVER_TRANSLATION,
                            );
                            if (hasCoverTranslation) {
                              return (
                                <div className="mt-2">
                                  <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" onClick={() => setCoverTranslationsSheetOpen(true)}>
                                    <Globe className="w-3.5 h-3.5" />
                                    {tTrans("viewTranslatedCovers")}
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
          <div className="border-t border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
            <button
              type="button"
              onClick={() => setExtrasOpen(true)}
              className="w-full px-5 md:px-6 py-5 text-center md:text-left hover:bg-primary/10 transition-colors"
            >
              <div className="flex flex-col items-center md:flex-row md:items-center gap-2.5 md:gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-sm font-black text-foreground">
                      {tj("extrasTitle")}
                    </span>
                    {extrasCompleted > 0 && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black shrink-0">
                        {extrasCompleted}/{EXTRA_CONFIGS.length}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] md:text-[11px] text-muted-foreground leading-relaxed">
                    {tj("extrasSubtitle")}
                  </p>
                  {/* Mobile only */}
                  <span className="text-xs text-primary font-bold inline-flex items-center gap-1 pt-1 md:hidden">
                    {tj("viewExtras")}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                {/* Desktop only — right-aligned */}
                <span className="hidden md:flex items-center gap-1 text-xs text-primary font-bold shrink-0">
                  {tj("viewExtras")}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
      )}

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
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-amber-500 text-primary-foreground hover:from-primary/90 hover:to-amber-400 font-bold"
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
                onClick={() => setConfirmMoreType("covers")}
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
                      {getCreditsCost(ProductKind.ADDON_COVER)} {tCommon("credits")}
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
                  const assignedChapter = book.chapters.find((ch) => ch.selectedImageId === img.id);

                  return (
                    <ImageGridItem
                      key={img.id}
                      img={img}
                      isSelected={!!assignedChapter}
                      chapterLabel={assignedChapter ? `${assignedChapter.sequence}. ${assignedChapter.title}` : undefined}
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
                onClick={() => setConfirmMoreType("images")}
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
                      {getCreditsCost(ProductKind.ADDON_IMAGES)} {tCommon("credits")}
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
                {hasOriginalBookPublishing && book.selectedCoverFileId ? (
                  <BundleCard
                    bundle={BUNDLE_GLOBAL_LAUNCH}
                    onRequest={() => {
                      setExtrasOpen(false);
                      openBundleDialog(BUNDLE_GLOBAL_LAUNCH);
                    }}
                    tj={tj}
                    tCommon={tCommon}
                  />
                ) : (
                  <LockedBundleCard
                    bundle={BUNDLE_GLOBAL_LAUNCH}
                    tj={tj}
                    tCommon={tCommon}
                    message={!hasOriginalBookPublishing ? undefined : !book.selectedCoverFileId ? t("coverRequired") : undefined}
                  />
                )}
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
                  className="p-4 rounded-xl bg-accent/30 border border-border space-y-3"
                >
                  <div className="flex items-start gap-3">
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
                      {t(`time_${config.kind}`) && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-primary/70">
                          <Clock className="w-3 h-3" />
                          {t(`time_${config.kind}`)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <ExtraAddonAction
                      config={config}
                      existing={existing}
                      onRequest={openRequestDialog}
  
                      tAddons={t}
                      tCommon={tCommon}
                      onViewTranslations={() => setTranslationsSheetOpen(true)}
                      onViewCoverTranslations={() => setCoverTranslationsSheetOpen(true)}
                      onViewAudiobook={() => setAudiobookViewerOpen(true)}
                      onViewPublication={() => {
                        const pubReq = publishingRequests.find((p) => existing && p.addonId === existing.id);
                        if (pubReq) {
                          setPublishingResultAddon({ publishing: pubReq, addonKind: config.kind });
                          setPublishingResultSheetOpen(true);
                        }
                      }}
                      viewLabel={
                        config.kind === ProductKind.ADDON_TRANSLATION
                          ? tj("viewTranslations")
                          : config.kind === ProductKind.ADDON_COVER_TRANSLATION
                            ? tj("viewTranslatedCovers")
                            : config.kind === ProductKind.ADDON_AUDIOBOOK
                              ? tj("viewAudiobook")
                              : (config.kind === ProductKind.ADDON_AMAZON_STANDARD || config.kind === ProductKind.ADDON_AMAZON_PREMIUM)
                                ? tj("viewPublication")
                                : undefined
                      }
                      disabled={config.kind === ProductKind.ADDON_COVER_TRANSLATION && !book.selectedCoverFileId}
                      disabledMessage={t("coverRequired")}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Translated Covers Sheet ─── */}
      <Sheet open={coverTranslationsSheetOpen} onOpenChange={(open) => {
        setCoverTranslationsSheetOpen(open);
        if (!open) { setExpandedTranslatedCover(null); setCoverLangFilter("all"); }
      }}>
        <SheetContent side="bottom" className="rounded-t-[2rem] max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-500" />
              {tTrans("translatedCovers")}
            </SheetTitle>
          </SheetHeader>

          {expandedTranslatedCover ? (
            (() => {
              const elMatch = expandedTranslatedCover.fileName.match(/cover-translated-([^.]+)\./);
              const elLangCode = elMatch ? elMatch[1] : "";
              const elLangName = SUPPORTED_LANGUAGES.find((l) => l.code === elLangCode)?.name ?? elLangCode;
              const elIsLoading = regeneratingCover || addons.some(
                (a) => a.kind === ProductKind.ADDON_COVER_TRANSLATION && isAddonProcessing(a.status),
              );
              const elMatchingTrans = book.translations?.find(
                (tr) => tr.targetLanguage === elLangCode && tr.status === "TRANSLATED",
              );

              return (
                <div className="pb-6 space-y-4">
                  <button
                    type="button"
                    onClick={() => setExpandedTranslatedCover(null)}
                    className="text-xs font-bold text-primary flex items-center gap-1"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180" />
                    {tTrans("backToGallery")}
                  </button>

                  <div className="flex justify-center relative">
                    <img
                      src={expandedTranslatedCover.url}
                      alt={expandedTranslatedCover.fileName}
                      className={`max-h-[50vh] w-auto rounded-xl border-2 border-border shadow-xl object-contain transition-opacity ${elIsLoading ? "opacity-40" : ""}`}
                    />
                    {elIsLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <span className="text-sm font-bold text-primary">{tTrans("regenerating")}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 text-xs font-bold">
                      <Globe className="w-3 h-3 mr-1" />
                      {elLangName}
                    </Badge>

                    {elMatchingTrans && (
                      <Button variant="outline" size="sm" className="rounded-xl text-xs gap-2" asChild>
                        <Link href={`/dashboard/books/${book.id}/translations/${elMatchingTrans.id}`}>
                          <Eye className="w-3 h-3" />
                          {tTrans("viewTranslatedBook")}
                        </Link>
                      </Button>
                    )}

                    {elLangCode && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs gap-2"
                        onClick={() => handleRegenerateCoverTranslation(elLangCode)}
                        disabled={elIsLoading}
                      >
                        <Palette className="w-3 h-3" />
                        {tTrans("regenerateCover")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            (() => {
              const allTranslatedCovers = book.files.filter((f) => {
                if (f.fileType !== ("COVER_TRANSLATED" as string)) return false;
                // In translation context, show only covers for this language
                if (translationLang) return f.fileName.includes(`cover-translated-${translationLang}`);
                return true;
              });
              // Extract unique languages from cover filenames
              const coverLanguages = [...new Set(allTranslatedCovers.map((f) => {
                const m = f.fileName.match(/cover-translated-([^.]+)\./);
                return m ? m[1] : "unknown";
              }))];
              const filteredCovers = coverLangFilter === "all"
                ? allTranslatedCovers
                : allTranslatedCovers.filter((f) => f.fileName.includes(`cover-translated-${coverLangFilter}`));

              return (
                <div className="pb-6 space-y-4">
                  {/* Language filter dropdown */}
                  {coverLanguages.length > 1 && (
                    <Select value={coverLangFilter} onValueChange={setCoverLangFilter}>
                      <SelectTrigger className="rounded-xl w-full">
                        <SelectValue placeholder={tTrans("filterByLanguage")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{tTrans("allLanguages")}</SelectItem>
                        {coverLanguages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.name ?? lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredCovers.map((file) => {
                      const match = file.fileName.match(/cover-translated-([^.]+)\./);
                      const langCode = match ? match[1] : "unknown";
                      const langName = SUPPORTED_LANGUAGES.find((l) => l.code === langCode)?.name ?? langCode;

                      return (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => setExpandedTranslatedCover({ url: file.fileUrl, fileName: file.fileName })}
                          className="relative group rounded-xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all aspect-[3/4]"
                        >
                          <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="bg-black/60 text-white text-[9px] font-bold backdrop-blur-sm border-none">
                              <Globe className="w-2.5 h-2.5 mr-1" />
                              {langName}
                            </Badge>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                            <span className="text-white text-[10px] font-bold bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                              {tTrans("tapToExpand")}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {allTranslatedCovers.length === 0 && (
                      <div className="col-span-full py-8 text-center text-muted-foreground text-sm">
                        {tTrans("noCoverTranslations")}
                      </div>
                    )}

                    {/* Generate another translated cover (hide in translation context if cover already exists) */}
                    {(() => {
                      // In translation context, don't show "add another" if a cover for this language already exists
                      if (translationLang && allTranslatedCovers.length > 0) return null;
                      const hasCoverTransProcessing = addons.some(
                        (a) => a.kind === ProductKind.ADDON_COVER_TRANSLATION && isAddonProcessing(a.status),
                      );
                      const coverTransConfig = ALL_ADDON_CONFIGS.find((c) => c.kind === ProductKind.ADDON_COVER_TRANSLATION);
                      if (!coverTransConfig) return null;
                      const noCoverYet = !book.selectedCoverFileId;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setCoverTranslationsSheetOpen(false);
                            openRequestDialog(coverTransConfig);
                          }}
                          disabled={hasCoverTransProcessing || noCoverYet}
                          className="rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all aspect-[3/4] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {hasCoverTransProcessing ? (
                            <>
                              <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                              <span className="text-[10px] font-bold text-primary/60">
                                {t("processing")}
                              </span>
                            </>
                          ) : noCoverYet ? (
                            <>
                              <Palette className="w-8 h-8 text-muted-foreground/50" />
                              <span className="text-[10px] font-medium text-center px-2">
                                {t("coverRequired")}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Plus className="w-6 h-6 text-primary" />
                              </div>
                              <span className="text-xs font-bold text-center px-2">{tTrans("translatedCovers")}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {coverTransConfig.cost} {tCommon("credits")}
                              </span>
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })()
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Book Translations Sheet ─── */}
      <Sheet open={translationsSheetOpen} onOpenChange={setTranslationsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[2rem] max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              {tTrans("bookTranslations")}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-3 pb-6">
            {(() => {
              const visibleTranslations = (book.translations ?? []).filter((tr) => tr.status !== "ERROR");
              return visibleTranslations.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  {tTrans("noTranslations")}
                </div>
              ) : (
              visibleTranslations.map((trans) => {
                const langName = SUPPORTED_LANGUAGES.find((l) => l.code === trans.targetLanguage)?.name ?? trans.targetLanguage;
                return (
                  <div key={trans.id} className="flex items-center justify-between rounded-xl border border-border p-4 bg-accent/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{langName}</p>
                        {trans.translatedTitle && (
                          <p className="text-xs text-muted-foreground">{trans.translatedTitle}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="secondary" className={`text-[8px] font-black uppercase tracking-widest ${
                            trans.status === "TRANSLATED"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : trans.status === "ERROR"
                                ? "bg-red-500/10 text-red-400"
                                : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {trans.status === "TRANSLATED" ? (
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                            ) : trans.status === "ERROR" ? (
                              <XCircle className="w-2.5 h-2.5 mr-0.5" />
                            ) : (
                              <Loader2 className="w-2.5 h-2.5 mr-0.5 animate-spin" />
                            )}
                            {trans.status === "TRANSLATED"
                              ? tTrans("completed")
                              : trans.status === "ERROR"
                                ? t("status_ERROR")
                                : tTrans("translating")}
                          </Badge>
                          {trans.status === "TRANSLATING" && (
                            <span className="text-[9px] text-muted-foreground">
                              {tTrans("chapterProgress", { completed: trans.completedChapters, total: trans.totalChapters })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {trans.status === "TRANSLATED" && (
                      <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1" asChild>
                        <Link href={`/dashboard/books/${book.id}/translations/${trans.id}`}>
                          <Eye className="w-3 h-3" />
                          {tTrans("viewTranslatedBook")}
                        </Link>
                      </Button>
                    )}
                  </div>
                );
              })
            );
            })()}

            {/* Translate to another language button */}
            {(() => {
              const hasTransProcessing = addons.some(
                (a) => a.kind === ProductKind.ADDON_TRANSLATION && isAddonProcessing(a.status),
              );
              const transConfig = ALL_ADDON_CONFIGS.find((c) => c.kind === ProductKind.ADDON_TRANSLATION);
              if (!transConfig) return null;
              return (
                <button
                  type="button"
                  onClick={() => {
                    setTranslationsSheetOpen(false);
                    openRequestDialog(transConfig);
                  }}
                  disabled={hasTransProcessing}
                  className="w-full rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all p-4 flex items-center justify-center gap-3 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hasTransProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
                      <span className="text-xs font-bold text-primary/60">{t("processing")}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-xs font-bold">{tTrans("translateToAnotherLanguage")}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {transConfig.cost} {tCommon("credits")}
                      </span>
                    </>
                  )}
                </button>
              );
            })()}
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
                  {isRegeneration
                    ? t("regenerateConfirm")
                    : t("requestConfirm", {
                        cost: selectedAddon?.cost ?? 0,
                        balance: balance ?? 0,
                      })}
                </p>

                {selectedAddon?.hasLanguageParam && (
                  languagePreset ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t("selectLanguage")}
                      </label>
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 text-sm font-bold px-3 py-1.5">
                        <Globe className="w-3.5 h-3.5 mr-1.5" />
                        {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name ?? selectedLanguage}
                      </Badge>
                    </div>
                  ) :
                  (() => {
                    // Hide: original language + languages that already have a translated cover/book
                    const existingLangs = new Set<string>();

                    // Exclude the book's original language
                    const originalLang = book.settings?.language;
                    if (originalLang) existingLangs.add(originalLang);

                    if (selectedAddon.kind === ProductKind.ADDON_COVER_TRANSLATION) {
                      book.files
                        .filter((f) => f.fileType === ("COVER_TRANSLATED" as string))
                        .forEach((f) => {
                          const m = f.fileName.match(/cover-translated-([^.]+)\./);
                          if (m) existingLangs.add(m[1]);
                        });
                    }

                    if (selectedAddon.kind === ProductKind.ADDON_TRANSLATION) {
                      (book.translations ?? [])
                        .filter((tr) => tr.status !== "ERROR")
                        .forEach((tr) => existingLangs.add(tr.targetLanguage));
                    }

                    const availableLanguages = SUPPORTED_LANGUAGES.filter(
                      (lang) => !existingLangs.has(lang.code),
                    );

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
                            {availableLanguages.map((lang) => (
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

                {selectedAddon?.kind === ProductKind.ADDON_AUDIOBOOK && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t("selectVoice")}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          selectedVoiceGender === "female"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                            : "bg-accent/30 border-border text-muted-foreground hover:bg-accent/50"
                        }`}
                        onClick={() => setSelectedVoiceGender("female")}
                      >
                        {t("voiceFemale")}
                      </button>
                      <button
                        type="button"
                        className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          selectedVoiceGender === "male"
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-500"
                            : "bg-accent/30 border-border text-muted-foreground hover:bg-accent/50"
                        }`}
                        onClick={() => setSelectedVoiceGender("male")}
                      >
                        {t("voiceMale")}
                      </button>
                    </div>
                  </div>
                )}

                {!isRegeneration &&
                  balance !== null &&
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
            {!isRegeneration &&
            balance !== null &&
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
              <Package className="w-5 h-5 text-amber-500" />
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

                {selectedBundle && bundleNeedsLanguage(selectedBundle) && (
                  (() => {
                    const excludedLangs = new Set<string>();
                    if (book.settings?.language) excludedLangs.add(book.settings.language);
                    (book.translations ?? [])
                      .filter((tr) => tr.status !== "ERROR")
                      .forEach((tr) => excludedLangs.add(tr.targetLanguage));
                    const availableLangs = SUPPORTED_LANGUAGES.filter((l) => !excludedLangs.has(l.code));
                    return (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t("selectLanguage")}</label>
                        <Select value={bundleLanguage} onValueChange={setBundleLanguage}>
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
                disabled={requestingBundle || (!!selectedBundle && bundleNeedsLanguage(selectedBundle) && !bundleLanguage)}
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

      {/* ─── Generate More Confirmation Dialog ─── */}
      <AlertDialog open={confirmMoreType !== null} onOpenChange={(open) => { if (!open) setConfirmMoreType(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmMoreType === "covers" ? (
                <><Palette className="w-5 h-5 text-pink-500" />{tj("confirmMoreCoversTitle")}</>
              ) : (
                <><ImageIcon className="w-5 h-5 text-indigo-500" />{tj("confirmMoreImagesTitle")}</>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMoreType === "covers"
                ? tj("confirmMoreCoversDescription", { cost: getCreditsCost(ProductKind.ADDON_COVER) })
                : tj("confirmMoreImagesDescription", { cost: getCreditsCost(ProductKind.ADDON_IMAGES) })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmMoreType === "covers") {
                  handleRequestMoreCovers();
                } else {
                  handleRequestMoreImages();
                }
                setConfirmMoreType(null);
              }}
            >
              {tj("confirmGenerate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PublishingInfoOverlay
        open={publishingOverlayOpen}
        onClose={() => setPublishingOverlayOpen(false)}
      />

      {/* ─── Audiobook Viewer ─── */}
      {(() => {
        const audiobookAddon = getExistingAddon(ProductKind.ADDON_AUDIOBOOK);
        return audiobookAddon?.status === AddonStatus.COMPLETED ? (
          <AudiobookViewer
            open={audiobookViewerOpen}
            onOpenChange={setAudiobookViewerOpen}
            addon={audiobookAddon}
            onRegenerate={() => {
              setAudiobookViewerOpen(false);
              const audiobookConfig = EXTRA_CONFIGS.find((c) => c.kind === ProductKind.ADDON_AUDIOBOOK);
              if (audiobookConfig) openRequestDialog(audiobookConfig, undefined, true);
            }}
          />
        ) : null;
      })()}

      {/* ─── Publishing Result Sheet ─── */}
      {publishingResultAddon && (
        <PublishingResultSheet
          open={publishingResultSheetOpen}
          onOpenChange={setPublishingResultSheetOpen}
          publishing={publishingResultAddon.publishing}
          addonKind={publishingResultAddon.addonKind}
        />
      )}
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
  onViewTranslations,
  onViewCoverTranslations,
  viewLabel,
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
  onViewTranslations?: () => void;
  onViewCoverTranslations?: () => void;
  viewLabel?: string;
}) {
  if (existing?.status === AddonStatus.COMPLETED) {
    // Translation addons open sheets via onViewTranslations/onViewCoverTranslations
    if (config.kind === ProductKind.ADDON_TRANSLATION && onViewTranslations) {
      return (
        <div className="mt-2">
          <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-emerald-500/20 text-emerald-400" onClick={onViewTranslations}>
            <Globe className="w-3.5 h-3.5" />
            {viewLabel ?? tAddons("viewResult")}
          </Button>
        </div>
      );
    }
    if (config.kind === ProductKind.ADDON_COVER_TRANSLATION && onViewCoverTranslations) {
      return (
        <div className="mt-2">
          <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-emerald-500/20 text-emerald-400" onClick={onViewCoverTranslations}>
            <Globe className="w-3.5 h-3.5" />
            {viewLabel ?? tAddons("viewResult")}
          </Button>
        </div>
      );
    }
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
        <span className="text-xs dark:text-amber-400 text-amber-600 font-bold flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {tAddons("processing")}
        </span>
      </div>
    );
  }

  const displayLabel = label ?? tAddons("requestForCredits", { cost: config.cost });
  const displayCost = sublabel;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => onRequest(config)}
        className={`w-full group relative overflow-hidden rounded-xl p-4 text-left transition-all active:scale-[0.97] ${
          premium
            ? "dark:bg-gradient-to-br dark:from-amber-500/25 dark:via-orange-500/15 dark:to-yellow-500/20 bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-600 border-2 dark:border-amber-400/50 dark:hover:border-amber-400/80 border-amber-400/30 hover:border-amber-400/50 shadow-lg dark:shadow-amber-500/15 dark:hover:shadow-amber-500/30 shadow-amber-950/15 hover:shadow-amber-950/25"
            : "bg-gradient-to-r from-primary/15 to-primary/5 border-2 border-primary/40 hover:border-primary/60 shadow-lg shadow-primary/10 hover:shadow-primary/20"
        }`}
      >
        {/* Shimmer sweep */}
        {!premium && (
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
                  ? "dark:bg-amber-500/20 bg-amber-800/20"
                  : "bg-primary/20"
              }`}
            >
              {premium ? (
                <Crown className="w-5 h-5 dark:text-amber-400 text-amber-950" />
              ) : (
                <Zap className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <p className={`text-sm font-black ${premium ? "dark:text-amber-400 text-amber-950" : "text-foreground"}`}>
                {displayLabel}
              </p>
              {displayCost && (
                <p className="text-[11px] text-muted-foreground font-medium">
                  {displayCost}
                </p>
              )}
            </div>
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5 ${
              premium
                ? "dark:bg-amber-500/20 bg-amber-800/20"
                : "bg-primary/20"
            }`}
          >
            <ArrowRight
              className={`w-4 h-4 ${
                premium ? "dark:text-amber-400 text-amber-950" : "text-primary"
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
  tCommon: _tCommon,
  onViewTranslations,
  onViewCoverTranslations,
  onViewAudiobook,
  onViewPublication,
  viewLabel,
  disabled,
  disabledMessage,
}: {
  config: AddonConfig;
  existing: BookAddonSummary | undefined;
  onRequest: (config: AddonConfig) => void;
  tAddons: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
  onViewTranslations?: () => void;
  onViewCoverTranslations?: () => void;
  onViewAudiobook?: () => void;
  onViewPublication?: () => void;
  viewLabel?: string;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  if (existing?.status === AddonStatus.COMPLETED) {
    if (config.kind === ProductKind.ADDON_TRANSLATION && onViewTranslations) {
      return (
        <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" onClick={onViewTranslations}>
          <Globe className="w-3 h-3" />
          {viewLabel ?? tAddons("viewResult")}
        </Button>
      );
    }
    if (config.kind === ProductKind.ADDON_COVER_TRANSLATION && onViewCoverTranslations) {
      return (
        <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" onClick={onViewCoverTranslations}>
          <Globe className="w-3 h-3" />
          {viewLabel ?? tAddons("viewResult")}
        </Button>
      );
    }
    if (config.kind === ProductKind.ADDON_AUDIOBOOK && onViewAudiobook) {
      return (
        <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" onClick={onViewAudiobook}>
          <Headphones className="w-3 h-3" />
          {viewLabel ?? tAddons("viewResult")}
        </Button>
      );
    }
    if ((config.kind === ProductKind.ADDON_AMAZON_STANDARD || config.kind === ProductKind.ADDON_AMAZON_PREMIUM) && onViewPublication) {
      return (
        <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" onClick={onViewPublication}>
          <BookCheck className="w-3 h-3" />
          {viewLabel ?? tAddons("viewResult")}
        </Button>
      );
    }
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
    // Publishing addons: show static status badge instead of spinner
    if (config.kind === ProductKind.ADDON_AMAZON_STANDARD || config.kind === ProductKind.ADDON_AMAZON_PREMIUM) {
      return (
        <Badge className="bg-blue-500/10 text-blue-400 text-[9px]">
          <Clock className="w-3 h-3 mr-1" />
          {tAddons("publishingAwaiting")}
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/10 dark:text-amber-400 text-amber-600 text-[9px] animate-pulse">
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

  if (disabled) {
    return (
      <p className="text-[11px] text-muted-foreground italic">
        {disabledMessage}
      </p>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl text-xs font-bold"
      onClick={() => onRequest(config)}
    >
      {tAddons("requestForCredits", { cost: config.cost })}
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
  bundle: BundleConfigPayload;
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
      className={`w-full group relative overflow-hidden rounded-2xl p-5 text-left transition-all active:scale-[0.97] dark:bg-gradient-to-br dark:from-amber-500/25 dark:via-orange-500/15 dark:to-yellow-500/20 bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-600 border-2 dark:border-amber-400/50 dark:hover:border-amber-400/80 border-amber-400/30 hover:border-amber-400/50 shadow-xl dark:shadow-amber-500/15 dark:hover:shadow-amber-500/30 shadow-amber-950/20 hover:shadow-amber-950/30 ${
        shaking ? "animate-shake" : ""
      }`}
      onMouseEnter={() => {
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
      }}
    >
      {/* Shimmer sweep */}
      <div className="absolute inset-0 animate-shimmer pointer-events-none bg-gradient-to-r from-transparent dark:via-amber-400/20 via-white/40 to-transparent" />

      {/* Glow pulse */}
      <div className="absolute -top-6 -right-6 w-32 h-32 dark:bg-amber-400/20 bg-white/20 rounded-full blur-[40px] animate-pulse" />

      <div className="relative">
        {/* Badge row */}
        <div className="flex items-center gap-2 mb-3">
          <Badge className="dark:bg-amber-400 dark:text-amber-950 bg-amber-900 text-amber-100 text-[10px] font-black uppercase tracking-widest border-0 px-2.5 py-0.5 shadow-lg shadow-amber-900/30">
            {tj("bundleBadge")}
          </Badge>
          <Badge className="bg-red-500/90 text-white text-[10px] font-black border-0 px-2 py-0.5">
            {tj("bundleDiscount", { percent: bundle.discountPercent })}
          </Badge>
        </div>

        {/* Title + description */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black dark:text-amber-400 text-amber-950 flex items-center gap-1.5">
              <Crown className="w-4 h-4 shrink-0" />
              {tj(`bundleTitle_${bundle.id}`)}
            </h4>
            <p className="text-xs dark:text-muted-foreground text-amber-800 mt-1">
              {tj(`bundleSubtitle_${bundle.id}`)}
            </p>
          </div>

          {/* Package icon */}
          <div className="w-12 h-12 rounded-xl dark:bg-gradient-to-br dark:from-amber-400/30 dark:to-orange-500/20 bg-amber-800/20 border-2 dark:border-amber-400/40 border-amber-800/30 flex items-center justify-center shrink-0 shadow-lg dark:shadow-amber-500/20 shadow-amber-800/10">
            <Package className="w-6 h-6 dark:text-amber-400 text-amber-950" />
          </div>
        </div>

        {/* Price row */}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs dark:text-muted-foreground text-amber-800/70 line-through">
            {bundle.originalCost} {tCommon("credits")}
          </span>
          <span className="text-lg font-black dark:text-amber-400 text-amber-950">
            {bundle.cost} {tCommon("credits")}
          </span>
        </div>

        {/* CTA button */}
        <div className="mt-3 flex items-center justify-between dark:bg-gradient-to-r dark:from-amber-500 dark:to-orange-500 bg-amber-900 rounded-xl px-4 py-3 dark:text-amber-950 text-amber-100 dark:group-hover:from-amber-400 dark:group-hover:to-orange-400 group-hover:bg-amber-800 transition-all shadow-lg dark:shadow-amber-500/25 shadow-amber-900/30">
          <span className="text-sm font-black tracking-wide">
            {tj(`bundleCta_${bundle.id}`)}
          </span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}

function LockedBundleCard({
  bundle,
  tj,
  tCommon,
  message,
}: {
  bundle: BundleConfigPayload;
  tj: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
  message?: string;
}) {
  const [showMessage, setShowMessage] = useState(false);

  return (
    <div>
      {/* Card + lock wrapper */}
      <div className="relative">
        {/* Full BundleCard with opacity */}
        <div className="opacity-50 pointer-events-none">
          <BundleCard
            bundle={bundle}
            onRequest={() => {}}
            tj={tj}
            tCommon={tCommon}
          />
        </div>

        {/* Lock overlay */}
        <button
          type="button"
          onClick={() => setShowMessage((v) => !v)}
          className="absolute inset-0 rounded-2xl cursor-pointer"
        />
        <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border-2 border-amber-500/40 flex items-center justify-center shadow-xl pointer-events-none">
          <Lock className="w-4.5 h-4.5 text-amber-500" />
        </div>
      </div>

      {/* Alert message on lock click — outside the relative container */}
      {showMessage && (
        <div className="mt-2 p-4 rounded-xl bg-amber-950/95 backdrop-blur-md border-2 border-amber-500/50 text-sm font-bold text-amber-300 shadow-2xl shadow-amber-500/20 animate-in fade-in duration-200 flex items-center gap-2.5">
          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
          {message ?? tj("bundleRequiresPublishing")}
        </div>
      )}
    </div>
  );
}

/** Reusable image thumbnail for the gallery grid */
function ImageGridItem({
  img,
  isSelected,
  chapterLabel,
  onExpand,
  tj,
}: {
  img: BookImageSummary;
  isSelected: boolean;
  chapterLabel?: string;
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

      {/* Chapter label badge */}
      {chapterLabel && (
        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm px-2 py-1.5">
          <span className="text-white text-[10px] font-bold line-clamp-1">
            {chapterLabel}
          </span>
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
