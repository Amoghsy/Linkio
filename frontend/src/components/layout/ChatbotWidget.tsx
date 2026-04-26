import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatbotService } from "@/services/chatbotService";

const QUICK_REPLIES = [
  "Booking help",
  "Payment issue",
  "How does Linkio work?",
];

interface Msg {
  id: string;
  from: "bot" | "me";
  text: string;
}

export const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: "1", from: "bot", text: "Hi! I'm Linkio Assistant 👋  How can I help today?" },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Msg = { id: String(Date.now()), from: "me", text: trimmed };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setIsLoading(true);

    const { reply } = await chatbotService.sendMessage(trimmed);
    setIsLoading(false);
    setMsgs((m) => [
      ...m,
      { id: String(Date.now() + 1), from: "bot", text: reply },
    ]);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open chatbot"
        className={cn(
          "fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gradient-brand text-primary-foreground shadow-brand grid place-items-center transition-base hover:scale-105",
          open && "rotate-90"
        )}
      >
        {open ? <X size={22} /> : <Bot size={24} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[340px] max-w-[calc(100vw-2rem)] h-[480px] rounded-2xl bg-card border border-border shadow-elegant flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-brand text-primary-foreground p-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-white/20 grid place-items-center">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="font-semibold leading-tight">Linkio Assistant</p>
                <p className="text-xs opacity-90">AI-powered · Always on</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-background">
            {msgs.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  m.from === "me"
                    ? "ml-auto bg-gradient-brand text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                )}
              >
                {m.text}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 bg-secondary rounded-2xl rounded-bl-sm px-3 py-2 w-fit">
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">typing…</span>
              </div>
            )}

            {/* Quick replies – show only at start */}
            {msgs.length <= 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-2">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-secondary transition-base"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="p-2 border-t border-border flex gap-2 bg-card"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              disabled={isLoading}
              className="flex-1 h-10 rounded-xl bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 rounded-xl bg-gradient-brand text-primary-foreground grid place-items-center hover:brightness-110 transition-base disabled:opacity-50"
              aria-label="Send"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}
    </>
  );
};
