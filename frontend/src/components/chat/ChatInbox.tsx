import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { chatService, type ChatThread } from "@/services/chatService";
import { cn } from "@/lib/utils";

const formatUpdatedAt = (value?: string | null) => {
  if (!value) return "";

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "";
  }

  const now = new Date();
  const sameDay = now.toDateString() === timestamp.toDateString();
  return sameDay
    ? timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : timestamp.toLocaleDateString([], { month: "short", day: "numeric" });
};

export function ChatInbox() {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    chatService
      .listChats(user.id)
      .then((fetchedChats) => {
        if (isMounted) {
          setChats(fetchedChats);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || "Failed to load chats.");
          setLoading(false);
        }
      });

    const unsubscribe = chatService.subscribeToUserChats(user.id, (liveChats) => {
      if (!isMounted) return;
      setChats(liveChats);
      setLoading(false);
      setError(null);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold mb-6 text-[#0f9d58]">Messages</h1>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-secondary rounded w-1/3" />
              <div className="h-3 bg-secondary rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4 flex flex-col items-center justify-center py-12 text-destructive">
        <RefreshCw className="h-8 w-8 mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  const chatBasePath = user?.role === "worker" ? "/worker/chat" : "/app/chat";

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-background">
      <div className="px-4 py-6 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
        <h1 className="text-2xl font-bold text-[#0f9d58]">Messages</h1>
      </div>

      <div className="divide-y divide-border/50">
        {chats.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-muted-foreground text-center">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>No messages yet.</p>
            <p className="text-sm mt-1">Your conversations will appear here once a chat starts.</p>
          </div>
        ) : (
          chats.map((chat) => {
            const displayName = chat.participantName || (user?.role === "worker" ? "Customer" : "Worker");
            const preview = chat.lastMessage?.trim() || "Start the conversation...";
            const timeString = formatUpdatedAt(chat.updatedAt);
            const avatar = chat.participantAvatar?.trim() ? chat.participantAvatar : undefined;

            return (
              <Link
                key={chat.id}
                to={`${chatBasePath}/${chat.id}`}
                className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="relative shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={displayName}
                      className="w-14 h-14 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.nextElementSibling) {
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = "grid";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="w-14 h-14 rounded-full bg-[#0f9d58] text-white flex items-center justify-center font-bold text-xl shadow-sm"
                    style={{ display: avatar ? "none" : "flex" }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-foreground truncate pr-2">{displayName}</h3>
                    <span className={cn("text-xs whitespace-nowrap", timeString ? "text-muted-foreground" : "text-transparent")}>
                      {timeString || "--:--"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate pr-4">{preview}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
