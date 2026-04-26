import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const TrustScoreBadge = ({ score, className }: { score: number; className?: string }) => (
  <div
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
      "bg-gradient-brand text-primary-foreground shadow-brand",
      className
    )}
  >
    <ShieldCheck size={14} />
       {score=1}
  </div>
);
