"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Check,
  BookOpen,
  AlertCircle,
  CreditCard,
  Sparkles,
  Globe,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { useTranslations } from "next-intl";
import { notificationsApi } from "@/lib/api/notifications";
import { useNotificationStore } from "@/stores/notification-store";
import type { NotificationItem, PaginationMeta } from "@/lib/api/types";
import { NotificationType } from "@bestsellers/shared";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  [NotificationType.BOOK_PREVIEW_READY]: BookOpen,
  [NotificationType.BOOK_GENERATED]: BookOpen,
  [NotificationType.BOOK_GENERATION_ERROR]: AlertCircle,
  [NotificationType.ADDON_COMPLETED]: Sparkles,
  [NotificationType.ADDON_ERROR]: AlertCircle,
  [NotificationType.TRANSLATION_COMPLETED]: Globe,
  [NotificationType.PUBLISHING_UPDATE]: Megaphone,
  [NotificationType.CREDITS_ADDED]: CreditCard,
  [NotificationType.CREDITS_LOW]: AlertCircle,
  [NotificationType.CREDITS_EXPIRING]: AlertCircle,
  [NotificationType.SUBSCRIPTION_RENEWED]: CreditCard,
  [NotificationType.SUBSCRIPTION_CANCELLED]: AlertCircle,
  [NotificationType.SYSTEM]: Bell,
};

function useTimeAgo() {
  const t = useTranslations("notificationsPage");
  return (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t("timeJustNow");
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t("timeMinutes", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("timeHours", { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 30) return t("timeDays", { count: days });
    return date.toLocaleDateString();
  };
}

export default function NotificationsPage() {
  const t = useTranslations("notificationsPage");
  const tTypes = useTranslations("notificationTypes");
  const timeAgo = useTimeAgo();
  const { setUnreadCount, decrementUnread } = useNotificationStore();

  const [tab, setTab] = useState("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({
        page,
        perPage: 15,
        sortOrder: "desc",
        unreadOnly: tab === "unread" ? true : undefined,
      });
      setNotifications(res.data);
      setMeta(res.meta);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, tab]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleTabChange = (value: string) => {
    setTab(value);
    setPage(1);
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
      decrementUnread();
    } catch {
      toast.error(t("markReadError"));
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await notificationsApi.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success(t("allMarkedRead", { count: res.count }));
    } catch {
      toast.error(t("markReadError"));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Button
            variant="outline"
            className="rounded-xl gap-2 font-bold"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            <CheckCheck className="w-4 h-4" />
            {t("markAllRead")}
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">
            {t("tabAll")}
          </TabsTrigger>
          <TabsTrigger value="unread" className="rounded-lg">
            {t("tabUnread")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={t("empty")}
              description={t("emptyDesc")}
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => {
                const isUnread = !notif.readAt;
                const Icon = NOTIFICATION_ICONS[notif.type] ?? Bell;

                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
                      isUnread
                        ? "bg-primary/5 border-primary/20"
                        : "bg-accent/30 border-border"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isUnread
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          isUnread ? "font-bold" : "font-medium"
                        }`}
                      >
                        {tTypes.has(`${notif.type}_title`) ? tTypes(`${notif.type}_title`) : notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {tTypes.has(`${notif.type}_message`) ? tTypes(`${notif.type}_message`) : notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full shrink-0 h-8 w-8"
                        onClick={() => handleMarkRead(notif.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {meta && <div className="mt-6"><Pagination meta={meta} onPageChange={setPage} /></div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
