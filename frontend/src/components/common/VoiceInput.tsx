import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
  onAiMatch?: (query: string) => void;
}

export const VoiceInput = ({ size = "md", className, onAiMatch }: Props) => {
  const [active, setActive] = useState(false);
  const { toast } = useToast();
  const dim = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const icon = size === "lg" ? 28 : size === "sm" ? 16 : 22;

  return (
    <button
      type="button"
      onClick={() => {
        if (active) return;
        
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          toast({ title: "Not Supported", description: "Voice search is not supported in this browser.", variant: "destructive" });
          return;
        }

        setActive(true);
        toast({ title: "Listening...", description: "Speak now to search." });

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US'; // Or map this from user's preferred language

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          toast({ title: "Voice recognized", description: `"${transcript}"` });
          if (onAiMatch) onAiMatch(transcript);
          setActive(false);
        };

        recognition.onerror = (event: any) => {
          toast({ title: "Error", description: `Microphone error: ${event.error}`, variant: "destructive" });
          setActive(false);
        };

        recognition.onend = () => {
          setActive(false);
        };

        try {
          recognition.start();
        } catch (e) {
          setActive(false);
        }
      }}
      aria-label="Voice search"
      className={cn(
        "rounded-full bg-gradient-amber text-accent-foreground grid place-items-center shadow-amber transition-base hover:brightness-110",
        active && "animate-pulse-ring",
        dim,
        className
      )}
    >
      <Mic size={icon} />
    </button>
  );
};
