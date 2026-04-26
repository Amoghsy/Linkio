import api from "./api";

export type NotificationType = "job" | "chat" | "system" | "payment" | "general";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
}

export const notificationService = {
  list: async (userId: string): Promise<Notification[]> => {
    const r = await api.get(`/notifications/${userId}`);
    return r.data;
  },
  
  markRead: async (id: string): Promise<{ id: string, read: boolean }> => {
    const r = await api.patch(`/notifications/${id}/read`);
    return r.data;
  }
};
