'use client';

import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
}

interface NotificationActions {
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  clearUnread: () => void;
}

export type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()((set) => ({
  unreadCount: 0,

  setUnreadCount: (count) => set({ unreadCount: count }),

  decrementUnread: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  clearUnread: () => set({ unreadCount: 0 }),
}));
