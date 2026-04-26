import api from "./api";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";

export interface ChatMessage {
  id: string;
  chatId: string;
  text: string;
  from: "me" | "them"; // We might need to map senderId to "me" or "them" in UI or store based on auth user
  senderId?: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  jobId?: string | null;
  participantName?: string;
  participantAvatar?: string;
  participants?: string[];
  online?: boolean;
  messages?: ChatMessage[];
  updatedAt?: string | null;
  lastMessage?: string;
  customerName?: string;
  workerName?: string;
  customerAvatar?: string;
  workerAvatar?: string;
}

type RawChatMessage = Partial<ChatMessage> & {
  createdAt?: string | { seconds?: number; _seconds?: number; toDate?: () => Date };
};

type RawChatThread = Partial<ChatThread> & {
  messages?: RawChatMessage[];
  updatedAt?: string | { seconds?: number; _seconds?: number; toDate?: () => Date } | null;
};

const getCurrentUserId = () => useAuthStore.getState().user?.id;
const getCurrentUserRole = () => useAuthStore.getState().user?.role;

const normalizeTimestamp = (value: RawChatMessage["createdAt"] | RawChatThread["updatedAt"]): string => {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const timestamp = value as { seconds?: number; _seconds?: number; toDate?: () => Date };
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate().toISOString();
    }
    const seconds = timestamp.seconds ?? timestamp._seconds;
    if (typeof seconds === "number") {
      return new Date(seconds * 1000).toISOString();
    }
  }
  return new Date().toISOString();
};

const normalizeMessage = (message: RawChatMessage, chatId: string): ChatMessage => {
  const currentUserId = getCurrentUserId();
  const from =
    message.from === "me" || message.from === "them"
      ? message.from
      : message.senderId && currentUserId && message.senderId === currentUserId
        ? "me"
        : "them";

  return {
    id: message.id || crypto.randomUUID(),
    chatId: message.chatId || chatId,
    text: message.text || "",
    from,
    senderId: message.senderId,
    createdAt: normalizeTimestamp(message.createdAt),
  };
};

const deriveParticipantName = (payload: RawChatThread | null | undefined): string => {
  const role = getCurrentUserRole();
  if (role === "worker") {
    return payload?.customerName || payload?.participantName || "Customer";
  }
  return payload?.workerName || payload?.participantName || "Worker";
};

const deriveParticipantAvatar = (payload: RawChatThread | null | undefined): string | undefined => {
  const role = getCurrentUserRole();
  const avatar = role === "worker" ? payload?.customerAvatar : payload?.workerAvatar;
  return typeof avatar === "string" && avatar.trim() ? avatar : undefined;
};

const normalizeThread = (payload: RawChatThread | RawChatMessage[] | null | undefined, chatId: string): ChatThread => {
  if (Array.isArray(payload)) {
    return {
      id: chatId,
      participantName: "Conversation",
      messages: payload.map((message) => normalizeMessage(message, chatId)),
    };
  }

  return {
    id: payload?.id || chatId,
    jobId: payload?.jobId || chatId,
    participantName: deriveParticipantName(payload),
    participantAvatar: deriveParticipantAvatar(payload) || payload?.participantAvatar,
    participants: payload?.participants || [],
    online: payload?.online ?? false,
    messages: (payload?.messages || []).map((message) => normalizeMessage(message, chatId)),
    updatedAt: payload?.updatedAt ? normalizeTimestamp(payload.updatedAt) : null,
    lastMessage: payload?.lastMessage || "",
    customerName: payload?.customerName || "Customer",
    workerName: payload?.workerName || "Worker",
    customerAvatar: payload?.customerAvatar,
    workerAvatar: payload?.workerAvatar,
  };
};

export const chatService = {
  getChat: async (id: string): Promise<ChatThread> => {
    const r = await api.get(`/chats/${id}`);
    return normalizeThread(r.data, id);
  },

  listChats: async (userId: string): Promise<ChatThread[]> => {
    const r = await api.get(`/chats/user/${userId}`);
    return Array.isArray(r.data) ? r.data.map((chat) => normalizeThread(chat, chat?.id || crypto.randomUUID())) : [];
  },

  sendMessage: async (chatId: string, text: string): Promise<ChatMessage> => {
    const r = await api.post(`/chats/send`, { chatId, text });
    if (r.data && typeof r.data === "object" && "text" in r.data) {
      return normalizeMessage(r.data as RawChatMessage, chatId);
    }

    return {
      id: crypto.randomUUID(),
      chatId,
      text,
      from: "me",
      senderId: getCurrentUserId(),
      createdAt: new Date().toISOString(),
    };
  },

  subscribeToMessages: (chatId: string, callback: (messages: ChatMessage[]) => void) => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => {
        const data = doc.data() as RawChatMessage;
        return normalizeMessage({ ...data, id: doc.id }, chatId);
      });
      callback(messages);
    });
  },

  subscribeToUserChats: (userId: string, callback: (chats: ChatThread[]) => void) => {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return normalizeThread({ ...data, id: doc.id }, doc.id);
        })
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      callback(chats);
    });
  },
};
