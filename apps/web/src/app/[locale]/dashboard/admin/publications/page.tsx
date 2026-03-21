"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, BookCheck, Settings2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { publishingApi } from "@/lib/api/publishing";
import { adminApi } from "@/lib/api/admin";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import type { PaginationMeta, AdminPublishingDetail } from "@/lib/api/types";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@bestsellers/shared";

type StatusFilter = "all" | "requested" | "in_progress" | "completed";

const STATUS_FILTER_MAP: Record<StatusFilter, string | undefined> = {
  all: undefined,
  requested: "PREPARING,READY",
  in_progress: "REVIEW,SUBMITTED",
  completed: "PUBLISHED",
};

export default function AdminPublicationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("publishingStatus");
  const [publications, setPublications] = useState<AdminPublishingDetail[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const debouncedSearch = useDebounce(search, 300);

  // Webhook settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);

  const fetchPublications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await publishingApi.list({
        page,
        perPage: 20,
        search: debouncedSearch || undefined,
        status: STATUS_FILTER_MAP[statusFilter],
      });
      setPublications(res.data);
      setMeta(res.meta);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const loadWebhookUrl = async () => {
    setWebhookLoading(true);
    try {
      const configs = await adminApi.getAppConfigs();
      const found = configs.find((c) => c.key === "PUBLISHING_WEBHOOK_URL");
      setWebhookUrl(found?.value?.url ?? "");
    } catch {
      // ignore
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    try {
      await adminApi.updateAppConfig("PUBLISHING_WEBHOOK_URL", { url: webhookUrl });
      toast.success(t("webhookUrlSaved"));
      setSettingsOpen(false);
    } catch {
      toast.error(t("webhookUrlError"));
    } finally {
      setSavingWebhook(false);
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

  const getAddonTypeLabel = (kind: string) => {
    if (kind === "ADDON_AMAZON_PREMIUM") return t("typePremium");
    return t("typeStandard");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={t("publications")} subtitle={t("publicationsSubtitle")} />
        {isAdmin && (
          <Dialog
            open={settingsOpen}
            onOpenChange={(open) => {
              setSettingsOpen(open);
              if (open) loadWebhookUrl();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl gap-2">
                <Settings2 className="w-4 h-4" />
                {t("publishingSettings")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("publishingSettings")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("webhookUrlLabel")}</label>
                  <p className="text-xs text-muted-foreground">{t("webhookUrlDesc")}</p>
                  {webhookLoading ? (
                    <Skeleton className="h-10 rounded-xl" />
                  ) : (
                    <Input
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://..."
                      className="rounded-xl font-mono text-xs"
                    />
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setSettingsOpen(false)}
                  >
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-xl"
                    onClick={handleSaveWebhook}
                    disabled={savingWebhook || webhookLoading}
                  >
                    {savingWebhook && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {tCommon("save")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">{t("filterAll")}</TabsTrigger>
          <TabsTrigger value="requested">{t("filterRequested")}</TabsTrigger>
          {/* <TabsTrigger value="in_progress">{t("filterInProgress")}</TabsTrigger> */}
          <TabsTrigger value="completed">{t("filterCompleted")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPublications")}
          className="pl-10 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : publications.length === 0 ? (
        <div className="glass rounded-[2rem] p-12 text-center">
          <BookCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{t("noPublications")}</p>
        </div>
      ) : (
        <div className="glass rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("bookTitle")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("author")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("user")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("addonType")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("status")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">{t("date")}</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {publications.map((pub) => (
                  <tr
                    key={pub.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium max-w-[200px] truncate">
                      {pub.book.title}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {pub.book.author}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {pub.user.email}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="text-[9px] font-black uppercase">
                        {getAddonTypeLabel(pub.addon.kind)}
                      </Badge>
                      {pub.translation && (
                        <Badge variant="secondary" className="ml-1 text-[9px] bg-blue-500/10 text-blue-400">
                          {pub.translation.targetLanguage}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] font-black uppercase ${getStatusColor(pub.status)}`}
                      >
                        {tStatus.has(pub.status as "PREPARING") ? tStatus(pub.status as "PREPARING") : pub.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(pub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm" className="rounded-xl text-xs" asChild>
                        <Link href={`/dashboard/admin/publications/${pub.id}`}>
                          {t("view")}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}
