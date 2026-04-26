import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Send, Paperclip, ArrowLeft, RefreshCw } from "lucide-react";
import { chatService, type ChatThread } from "@/services/chatService";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { t } from "@/lib/i18n";
import { jobService } from "@/services/jobService";
import { useAuthStore } from "@/store/useAuthStore";

export default function Chat() {
  const { chatId = "chat-1" } = useParams();
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { language: uiLang } = useAppStore();
  const { user } = useAuthStore();

  const messages = thread?.messages ?? [];
  const participantName =
    thread?.participantName && thread.participantName !== "Conversation"
      ? thread.participantName
      : user?.role === "worker"
        ? "Customer"
        : "Worker";
  const validAvatar = thread?.participantAvatar?.trim() ? thread.participantAvatar : undefined;

  // Initial load
  useEffect(() => {
    setError(null);
    setThread(null);

    const fetchJob =
      chatId && !chatId.startsWith("chat-")
        ? jobService.getJob(chatId).catch(() => null)
        : Promise.resolve(null);

    Promise.all([
      chatService.getChat(chatId),
      fetchJob,
    ])
      .then(([th, job]) => {
        let enhancedThread = th;
        const isWorker = user?.role === "worker";

        if (job) {
          enhancedThread = {
            ...th,
            participantName: isWorker ? (job.customerName || "Customer") : (job.workerName || "Worker"),
            participantAvatar: isWorker ? job.customerAvatar : th.workerAvatar,
          };
        } else if (!th.participantName || th.participantName === "Conversation") {
          enhancedThread = {
            ...th,
            participantName: isWorker ? (th.customerName || "Customer") : (th.workerName || "Worker"),
          };
        }

        setThread(enhancedThread);
      })
      .catch((err) => setError(err?.message || "Failed to load chat."));
  }, [chatId, user?.role]);

  // Real-time listener for new messages
  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(chatId, (messages) => {
      setThread((currentThread) => {
        if (!currentThread) {
          return {
            id: chatId,
            participantName: user?.role === "worker" ? "Customer" : "Worker",
            messages,
          };
        }

        return {
          ...currentThread,
          messages,
          lastMessage: messages[messages.length - 1]?.text || currentThread.lastMessage,
          updatedAt: messages[messages.length - 1]?.createdAt || currentThread.updatedAt,
        };
      });
    });

    return () => unsubscribe();
  }, [chatId, user?.role]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");
    setIsSending(true);

    try {
      const msg = await chatService.sendMessage(chatId, text);
      setThread((currentThread) =>
        currentThread
          ? {
              ...currentThread,
              messages: [...(currentThread.messages ?? []).filter(m => m.id !== msg.id), msg],
              lastMessage: msg.text,
              updatedAt: msg.createdAt,
            }
          : {
              id: chatId,
              participantName: user?.role === "worker" ? "Customer" : "Worker",
              messages: [msg],
              lastMessage: msg.text,
              updatedAt: msg.createdAt,
            }
      );
    } catch (err: any) {
      setInput(text);
      setError(err?.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  if (!thread && !error) {
    return (
      <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading chat...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
        <RefreshCw size={16} />
        {error}
        <button
          onClick={() => {
            setError(null);
            chatService.getChat(chatId).then(setThread).catch((err) => setError(err?.message));
          }}
          className="ml-auto underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-brand text-primary-foreground p-4 flex items-center gap-3">
        <Link to={user?.role === "worker" ? "/worker/messages" : "/app/messages"} className="md:hidden">
          <ArrowLeft size={20} />
        </Link>
        {validAvatar ? (
          <img
            src={validAvatar}
            alt={participantName}
            className="h-10 w-10 rounded-full bg-white/20 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              if (e.currentTarget.nextElementSibling) {
                (e.currentTarget.nextElementSibling as HTMLElement).style.display = "grid";
              }
            }}
          />
        ) : null}
        <div 
          className="h-10 w-10 rounded-full bg-white/20 grid place-items-center font-bold text-sm"
          style={{ display: validAvatar ? "none" : "grid" }}
        >
          {participantName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold leading-tight">{participantName}</p>
          <p className="text-xs opacity-90 flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", thread?.online ? "bg-success" : "bg-muted-foreground")} />
            {thread?.online ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-secondary/30">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
              m.from === "me"
                ? "ml-auto bg-gradient-brand text-primary-foreground rounded-br-sm"
                : "bg-card text-foreground rounded-bl-sm"
            )}
          >
            {m.text}
            <div className={cn("mt-0.5 text-[10px]", m.from === "me" ? "text-white/70" : "text-muted-foreground")}>
              {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation below.
          </p>
        )}
      </div>

      {/* Input */}
      <form onSubmit={send} className="p-3 border-t border-border bg-card flex items-center gap-2">
        <button type="button" className="h-10 w-10 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground">
          <Paperclip size={18} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chat.placeholder", uiLang)}
          maxLength={1000}
          className="flex-1 h-11 rounded-full bg-secondary px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="h-11 w-11 rounded-full bg-gradient-brand text-primary-foreground grid place-items-center hover:brightness-110 shadow-brand disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
