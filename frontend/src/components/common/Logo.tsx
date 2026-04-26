import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const Logo = ({ className, to = "/" }: { className?: string; to?: string }) => (
  <Link to={to} className={cn("flex items-center gap-2 group", className)}>
    <div className="relative w-9 h-9 rounded-xl bg-gradient-brand shadow-brand grid place-items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
      <span className="relative text-primary-foreground font-bold text-lg leading-none">L</span>
    </div>
    <span className="font-bold text-xl tracking-tight">
      Linkio
      <span className="ml-1 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">AI</span>
    </span>
  </Link>
);
