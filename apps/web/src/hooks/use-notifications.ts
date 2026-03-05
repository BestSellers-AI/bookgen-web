"use client";

import { useEffect, useRef } from "react";
import { notificationsApi } from "@/lib/api/notifications";
import { useNotificationStore } from "@/stores/notification-store";

const POLL_INTERVAL = 30_000;

export function useNotifications() {
  const { setUnreadCount } = useNotificationStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchCount = () => {
      notificationsApi
        .getUnreadCount()
        .then((res) => setUnreadCount(res.count))
        .catch(() => {});
    };

    fetchCount();
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [setUnreadCount]);
}
