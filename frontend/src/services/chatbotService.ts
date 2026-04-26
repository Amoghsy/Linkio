import api from "./api";

export interface ChatbotMessage {
  message: string;
}

export interface ChatbotReply {
  reply: string;
}

/** Local fallback responses when the API is unavailable. */
const LOCAL_REPLIES: Record<string, string> = {
  default: "I'm here to help! You can ask me about bookings, payments, or finding workers near you.",
  booking:
    "To book a service, go to Search, pick a worker, and tap 'Book Now'. You can also set emergency mode for immediate help!",
  payment:
    "Payments are made after the job is completed. We accept UPI, cards, and cash. If you have an issue, contact support.",
  "not arrived":
    "Sorry to hear that! Please wait 15 minutes past the scheduled time, then use the Chat feature to contact the worker directly.",
  "how does":
    "Linkio connects you with verified local service workers. Search, book, track in real-time, and pay after the job is done!",
  track:
    "Go to 'My Jobs' to see your active bookings and track the worker's live location.",
  find:
    "Use the Search page or the Map to find nearby workers by category, rating, and distance.",
};

const getLocalReply = (message: string): string => {
  const lower = message.toLowerCase();
  for (const [key, reply] of Object.entries(LOCAL_REPLIES)) {
    if (key !== "default" && lower.includes(key)) return reply;
  }
  return LOCAL_REPLIES.default;
};

export const chatbotService = {
  sendMessage: async (message: string): Promise<ChatbotReply> => {
    try {
      const r = await api.post<ChatbotReply>("/chatbot/message", { message });
      return r.data;
    } catch {
      // Graceful fallback – never crash the chatbot UI
      return { reply: getLocalReply(message) };
    }
  },
};
