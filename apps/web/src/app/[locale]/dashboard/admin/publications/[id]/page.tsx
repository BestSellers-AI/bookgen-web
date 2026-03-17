"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookCheck,
  Download,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  Headphones,
  Palette,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Collapsible is handled by AssetGroup component below
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { publishingApi } from "@/lib/api/publishing";
import { booksApi } from "@/lib/api/books";
import { toast } from "sonner";
import type { AdminPublishingDetail } from "@/lib/api/types";
import { PageHeader } from "@/components/ui/page-header";

const PUBLISHING_STATUSES = [
  "PREPARING",
  "REVIEW",
  "READY",
  "SUBMITTED",
  "PUBLISHED",
  "REJECTED",
  "CANCELLED",
];

export default function AdminPublicationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("publishingStatus");

  const [detail, setDetail] = useState<AdminPublishingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Status update
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Complete form
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [amazonAsin, setAmazonAsin] = useState("");
  const [kdpUrl, setKdpUrl] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showOtherCovers, setShowOtherCovers] = useState(false);
  const [showOtherIllustrations, setShowOtherIllustrations] = useState(false);

  // Webhook dispatch
  const [showWebhook, setShowWebhook] = useState(false);
  // TODO: persist webhook URL in AppConfig (e.g. key "PUBLISHING_WEBHOOK_URL")
  // so it survives page reloads and is editable via admin settings
  const [webhookUrl, setWebhookUrl] = useState("https://n8n-api.01.prod.bestsellers.digital/webhook/saas-publishing");
  const [webhookEditable, setWebhookEditable] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingDocx, setGeneratingDocx] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await publishingApi.getDetail(id);
      setDetail(data);
      setNewStatus(data.status);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === detail?.status) return;
    setUpdatingStatus(true);
    try {
      const updated = await publishingApi.updateStatus(id, newStatus);
      setDetail(updated);
      toast.success(t("statusUpdateSuccess"));
    } catch {
      toast.error(t("statusUpdateError"));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const updated = await publishingApi.complete(id, {
        publishedUrl: publishedUrl || undefined,
        amazonAsin: amazonAsin || undefined,
        kdpUrl: kdpUrl || undefined,
        adminNotes: adminNotes || undefined,
      });
      setDetail(updated);
      setShowCompleteForm(false);
      toast.success(t("completeSuccess"));
    } catch {
      toast.error(t("completeError"));
    } finally {
      setCompleting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!detail) return;
    setGeneratingPdf(true);
    try {
      const bookDetail = await booksApi.getById(detail.bookId);
      const { downloadBookPdf } = await import("@/lib/book-template/download");
      await downloadBookPdf(bookDetail, (detail.book?.settings?.language as string) ?? "en");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!detail) return;
    setGeneratingDocx(true);
    try {
      const bookDetail = await booksApi.getById(detail.bookId);
      const { downloadBookDocx } = await import("@/lib/book-template/download");
      await downloadBookDocx(bookDetail, (detail.book?.settings?.language as string) ?? "en");
    } catch {
      toast.error("Failed to generate DOCX");
    } finally {
      setGeneratingDocx(false);
    }
  };

  const handleDispatchWebhook = async () => {
    if (!detail || !webhookUrl) return;
    setDispatching(true);
    try {
      await publishingApi.dispatchWebhook(id, webhookUrl);
      toast.success(t("webhookSuccess"));
    } catch {
      toast.error(t("webhookError"));
    } finally {
      setDispatching(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(t("cancelPublishingConfirm"))) return;
    setCancelling(true);
    try {
      await publishingApi.cancel(id);
      await fetchDetail();
      toast.success(t("cancelPublishingSuccess"));
    } catch {
      toast.error(t("cancelPublishingError"));
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-500/10 text-emerald-400";
      case "REVIEW":
      case "SUBMITTED":
        return "bg-amber-500/10 text-amber-400";
      case "REJECTED":
      case "CANCELLED":
        return "bg-red-500/10 text-red-400";
      default:
        return "bg-blue-500/10 text-blue-400";
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 rounded-[2rem]" />
        <Skeleton className="h-48 rounded-[2rem]" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorState onRetry={fetchDetail} />
      </div>
    );
  }

  // Categorize assets
  const bookFiles = detail.book?.files ?? [];
  const bookImages = detail.book?.images ?? [];
  const allCoverFiles = bookFiles.filter((f) =>
    f.fileType === "COVER_IMAGE" || f.fileType === "COVER_TRANSLATED",
  );
  const selectedCover = allCoverFiles.find((f) => f.id === detail.book?.selectedCoverFileId);
  const otherCovers = allCoverFiles.filter((f) => f.id !== detail.book?.selectedCoverFileId);
  const allIllustrations = bookImages;
  const selectedIllustrations = allIllustrations.filter((img) => img.chapterId !== null);
  const otherIllustrations = allIllustrations.filter((img) => img.chapterId === null);
  const audiobooks = detail.book?.audiobooks ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-2" asChild>
        <Link href="/dashboard/admin/publications">
          <ArrowLeft className="w-4 h-4" />
          {t("publications")}
        </Link>
      </Button>

      <PageHeader title={t("publicationDetail")} />

      {/* ─── Publication Info Card ─── */}
      <div className="glass rounded-[2rem] p-6 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold">{detail.book?.title}</h3>
            {detail.book?.subtitle && (
              <p className="text-sm text-muted-foreground">{detail.book?.subtitle}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {detail.book?.author} &middot; {detail.user?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-bold">
              {detail.addon?.kind === "ADDON_AMAZON_PREMIUM" ? t("typePremium") : t("typeStandard")}
            </Badge>
            <Badge
              variant="secondary"
              className={`text-[9px] font-black uppercase tracking-widest ${getStatusColor(detail.status)}`}
            >
              {tStatus.has(detail.status as "PREPARING") ? tStatus(detail.status as "PREPARING") : detail.status}
            </Badge>
          </div>
        </div>

        {detail.translation && (
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-blue-400 font-bold">
              Translation: {detail.translation.targetLanguage}
              {detail.translation.translatedTitle && ` — ${detail.translation.translatedTitle}`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
          <div>
            <p className="font-bold text-foreground text-[10px] uppercase tracking-wider mb-0.5">{t("created")}</p>
            <p>{new Date(detail.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-bold text-foreground text-[10px] uppercase tracking-wider mb-0.5">{t("status")}</p>
            <p>{tStatus.has(detail.status as "PREPARING") ? tStatus(detail.status as "PREPARING") : detail.status}</p>
          </div>
          {detail.publishedAt && (
            <div>
              <p className="font-bold text-foreground text-[10px] uppercase tracking-wider mb-0.5">{t("publishedDate")}</p>
              <p>{new Date(detail.publishedAt).toLocaleDateString()}</p>
            </div>
          )}
          {detail.amazonAsin && (
            <div>
              <p className="font-bold text-foreground text-[10px] uppercase tracking-wider mb-0.5">ASIN</p>
              <p className="font-mono">{detail.amazonAsin}</p>
            </div>
          )}
        </div>

        {detail.publishedUrl && (
          <a
            href={detail.publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {detail.publishedUrl}
          </a>
        )}
      </div>

      {/* ─── Status Update ─── */}
      {detail.status !== "PUBLISHED" && detail.status !== "CANCELLED" && (
        <div className="glass rounded-[2rem] p-6 space-y-4">
          <h3 className="text-sm font-bold">{t("updateStatus")}</h3>
          <div className="flex items-center gap-3">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="rounded-xl max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PUBLISHING_STATUSES.filter((s) => s !== "PUBLISHED" && s !== "CANCELLED" && s !== "REJECTED").map((s) => (
                  <SelectItem key={s} value={s}>
                    {tStatus.has(s as "PREPARING") ? tStatus(s as "PREPARING") : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={handleUpdateStatus}
              disabled={updatingStatus || newStatus === detail.status}
            >
              {updatingStatus && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t("updateStatus")}
            </Button>
          </div>

          {/* Add to spreadsheet */}
          <div className="border-t border-border pt-4">
            {showWebhook ? (
              <div className="space-y-3">
                <h4 className="text-sm font-bold">{t("addToSpreadsheet")}</h4>
                <div className="flex items-center gap-2">
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    disabled={!webhookEditable}
                    className="rounded-xl flex-1 font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-xs shrink-0"
                    onClick={() => setWebhookEditable((v) => !v)}
                  >
                    {webhookEditable ? t("lockUrl") : t("editUrl")}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-xl"
                    onClick={handleDispatchWebhook}
                    disabled={dispatching || !webhookUrl}
                  >
                    {dispatching && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {t("dispatchWebhook")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setShowWebhook(false)}
                  >
                    {tCommon("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => setShowWebhook(true)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t("addToSpreadsheet")}
              </Button>
            )}
          </div>

          <div className="border-t border-border pt-4">
            {showCompleteForm ? (
              <div className="space-y-3">
                <h4 className="text-sm font-bold">{t("markCompleted")}</h4>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t("publishedUrl")}</label>
                  <Input
                    value={publishedUrl}
                    onChange={(e) => setPublishedUrl(e.target.value)}
                    placeholder="https://amazon.com/dp/..."
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t("amazonAsin")}</label>
                  <Input
                    value={amazonAsin}
                    onChange={(e) => setAmazonAsin(e.target.value)}
                    placeholder="B0XXXXXXXXX"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t("kdpUrlLabel")}</label>
                  <Input
                    value={kdpUrl}
                    onChange={(e) => setKdpUrl(e.target.value)}
                    placeholder="https://kdp.amazon.com/..."
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t("adminNotes")}</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Notes visible to the author..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm min-h-[80px] resize-y"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={handleComplete}
                    disabled={completing}
                  >
                    {completing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {t("markCompleted")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setShowCompleteForm(false)}
                  >
                    {tCommon("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                onClick={() => setShowCompleteForm(true)}
              >
                <BookCheck className="w-4 h-4 mr-2" />
                {t("markCompleted")}
              </Button>
            )}
          </div>

          {/* Cancel button */}
          <div className="border-t border-border pt-4">
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t("cancelPublishing")}
            </Button>
            <p className="text-xs text-muted-foreground mt-1.5">{t("cancelPublishingDesc")}</p>
          </div>
        </div>
      )}

      {/* ─── Downloadable Assets ─── */}
      <div className="glass rounded-[2rem] p-6 space-y-4">
        <h3 className="text-sm font-bold">{t("downloadAssets")}</h3>

        {/* Covers */}
        {allCoverFiles.length > 0 && (
          <AssetGroup
            title={t("covers")}
            icon={<Palette className="w-4 h-4 text-pink-500" />}
            defaultOpen
          >
            <div className="space-y-3">
              {/* Selected cover */}
              {selectedCover && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-emerald-500/50 ring-2 ring-emerald-500/20">
                      <img src={selectedCover.fileUrl} alt={selectedCover.fileName} className="w-full h-full object-cover" />
                    </div>
                    <a
                      href={selectedCover.fileUrl}
                      download={selectedCover.fileName}
                      className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
                    >
                      <Download className="w-3 h-3" />
                      {selectedCover.fileName}
                    </a>
                  </div>
                </div>
              )}

              {/* Other covers toggle */}
              {otherCovers.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowOtherCovers((v) => !v)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOtherCovers ? "rotate-180" : ""}`} />
                    {showOtherCovers ? t("hideOthers") : `${t("showOthers")} (${otherCovers.length})`}
                  </button>
                  {showOtherCovers && (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {otherCovers.map((file) => (
                        <div key={file.id} className="space-y-1.5">
                          <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border opacity-70">
                            <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-cover" />
                          </div>
                          <a
                            href={file.fileUrl}
                            download={file.fileName}
                            className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
                          >
                            <Download className="w-3 h-3" />
                            {file.fileName}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </AssetGroup>
        )}

        {/* Illustrations */}
        {allIllustrations.length > 0 && (
          <AssetGroup
            title={t("illustrations")}
            icon={<ImageIcon className="w-4 h-4 text-indigo-500" />}
          >
            <div className="space-y-3">
              {/* Selected illustrations (assigned to chapters) */}
              {selectedIllustrations.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedIllustrations.map((img) => (
                    <div key={img.id} className="space-y-1.5">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-emerald-500/50 ring-2 ring-emerald-500/20">
                        <img src={img.imageUrl} alt={img.caption ?? ""} className="w-full h-full object-cover" />
                      </div>
                      <a
                        href={img.imageUrl}
                        download
                        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
                      >
                        <Download className="w-3 h-3" />
                        {img.caption ? img.caption.slice(0, 30) : "illustration"}
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Other illustrations toggle */}
              {otherIllustrations.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowOtherIllustrations((v) => !v)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOtherIllustrations ? "rotate-180" : ""}`} />
                    {showOtherIllustrations ? t("hideOthers") : `${t("showOthers")} (${otherIllustrations.length})`}
                  </button>
                  {showOtherIllustrations && (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {otherIllustrations.map((img) => (
                        <div key={img.id} className="space-y-1.5">
                          <div className="aspect-square rounded-lg overflow-hidden border border-border opacity-70">
                            <img src={img.imageUrl} alt={img.caption ?? ""} className="w-full h-full object-cover" />
                          </div>
                          <a
                            href={img.imageUrl}
                            download
                            className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
                          >
                            <Download className="w-3 h-3" />
                            {img.caption ? img.caption.slice(0, 30) : "illustration"}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </AssetGroup>
        )}

        {/* Documents */}
        <AssetGroup
          title={t("documents")}
          icon={<FileText className="w-4 h-4 text-blue-500" />}
          defaultOpen
        >
          <div className="space-y-2">
            {/* Generate PDF / DOCX buttons */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border hover:bg-accent/50 transition-colors w-full text-left disabled:opacity-50"
            >
              {generatingPdf ? <Loader2 className="w-5 h-5 text-red-400 shrink-0 animate-spin" /> : <FileText className="w-5 h-5 text-red-400 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t("generatePdf")}</p>
                <p className="text-[10px] text-muted-foreground">KDP 6&quot;×9&quot;</p>
              </div>
              <Download className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={generatingDocx}
              className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border hover:bg-accent/50 transition-colors w-full text-left disabled:opacity-50"
            >
              {generatingDocx ? <Loader2 className="w-5 h-5 text-blue-400 shrink-0 animate-spin" /> : <FileText className="w-5 h-5 text-blue-400 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t("generateDocx")}</p>
                <p className="text-[10px] text-muted-foreground">Word</p>
              </div>
              <Download className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </div>
        </AssetGroup>

        {/* Audio */}
        {audiobooks.length > 0 && (
          <AssetGroup
            title={t("audioFiles")}
            icon={<Headphones className="w-4 h-4 text-emerald-500" />}
          >
            <div className="space-y-2">
              {audiobooks.map((ab) => (
                <div key={ab.id} className="space-y-2">
                  {ab.fullAudioUrl && (
                    <a
                      href={ab.fullAudioUrl}
                      download="audiobook-full.mp3"
                      className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border hover:bg-accent/50 transition-colors"
                    >
                      <Headphones className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{t("fullAudiobook")}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {ab.voiceName && `Voice: ${ab.voiceName}`}
                          {ab.totalDuration && ` · ${Math.floor(ab.totalDuration / 60)}min`}
                          {ab.translationId && " · Translation"}
                        </p>
                      </div>
                      <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                    </a>
                  )}
                  {ab.chapters.map((ch) =>
                    ch.audioUrl ? (
                      <a
                        key={ch.id}
                        href={ch.audioUrl}
                        download={`${ch.sectionType || `chapter-${ch.sequence}`}.mp3`}
                        className="flex items-center gap-3 p-2 pl-8 rounded-xl bg-accent/20 border border-border/50 hover:bg-accent/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{ch.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {ch.durationSecs && `${Math.floor(ch.durationSecs / 60)}:${String(ch.durationSecs % 60).padStart(2, "0")}`}
                          </p>
                        </div>
                        <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </a>
                    ) : null,
                  )}
                </div>
              ))}
            </div>
          </AssetGroup>
        )}

        {allCoverFiles.length === 0 && allIllustrations.length === 0 && audiobooks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">{t("noAssets")}</p>
        )}
      </div>
    </div>
  );
}

function AssetGroup({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-border hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-bold">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  );
}
