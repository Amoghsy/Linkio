import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const RatingStars = ({ rating, size = 14, className }: { rating: number; size?: number; className?: string }) => {
  const full = Math.floor(rating);
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            "transition-base",
            i < full ? "fill-accent text-accent" : "text-muted-foreground/30"
          )}
        />
      ))}
      <span className="ml-1.5 text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
    </div>
  );
};
