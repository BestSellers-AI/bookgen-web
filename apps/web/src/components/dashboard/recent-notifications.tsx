"use client";

import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { notificationsApi } from "@/lib/api/notifications";
import { useNotificationStore } from "@/stores/notification-store";
import { useTranslations } from "next-intl";
import type { NotificationItem } from "@/lib/api/types";
import { useState } from "react";

interface RecentNotificationsProps {
  notifications: NotificationItem[];
}

export function RecentNotifications({ notifications: initialNotifications }: RecentNotificationsProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const { decrementUnread } = useNotificationStore();
  const t = useTranslations("dashboard");
  const tNotif = useTranslations("notifications");
  const tTypes = useTranslations("notificationTypes");

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      decrementUnread();
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
    } catch {}
  };

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title={t("noNotifications")}
        className="rounded-[2rem]"
      />
    );
  }

  return (
    <div className="glass rounded-[2rem] overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          {t("recentNotifications")}
        </h3>
      </div>
      <div className="divide-y divide-border">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 px-6 py-4 ${
              !notification.readAt ? "bg-primary/5" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">
                {tTypes.has(`${notification.type}_title`) ? tTypes(`${notification.type}_title`) : notification.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {tTypes.has(`${notification.type}_message`) ? tTypes(`${notification.type}_message`) : notification.message}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(notification.createdAt).toLocaleDateString()}
              </p>
            </div>
            {!notification.readAt && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 w-7 h-7 rounded-lg"
                onClick={() => handleMarkRead(notification.id)}
              >
                <Check className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
