"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationStore } from "@/stores/notification-store";
import { notificationsApi } from "@/lib/api/notifications";
import type { NotificationItem } from "@/lib/api/types";
import { useTranslations } from "next-intl";

export function NotificationPopover() {
  const { unreadCount, clearUnread } = useNotificationStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const t = useTranslations("notifications");
  const tTypes = useTranslations("notificationTypes");

  useEffect(() => {
    if (open) {
      notificationsApi.list({ perPage: 5, sortOrder: "desc" }).then((res) => {
        setNotifications(res.data);
      }).catch(() => {});
    }
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      clearUnread();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
      );
    } catch {}
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="text-sm font-bold">{t("title")}</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={handleMarkAllRead}
            >
              <Check className="w-3 h-3 mr-1" />
              {t("markAllRead")}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Inbox className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">{t("empty")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 text-sm ${
                    !notification.readAt ? "bg-primary/5" : ""
                  }`}
                >
                  <p className="font-medium leading-tight">
                    {tTypes.has(`${notification.type}_title`) ? tTypes(`${notification.type}_title`) : notification.title}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                    {tTypes.has(`${notification.type}_message`) ? tTypes(`${notification.type}_message`) : notification.message}
                  </p>
                  <p className="text-muted-foreground text-[10px] mt-1">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
