import { create } from "zustand";
import { notificationService, type Notification } from "@/services/notificationService";

interface NotificationState {
  items: Notification[];
  loading: boolean;
  unread: () => number;
  load: (userId: string) => Promise<void>;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  loading: false,
  unread: () => get().items.filter((n) => !n.read).length,
  load: async (userId: string) => {
    set({ loading: true });
    const items = await notificationService.list(userId);
    set({ items, loading: false });
  },
  markAllRead: () => set({ items: get().items.map((n) => ({ ...n, read: true })) }),
}));
