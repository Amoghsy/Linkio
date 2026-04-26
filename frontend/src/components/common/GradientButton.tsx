import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "brand" | "amber" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const GradientButton = forwardRef<HTMLButtonElement, Props>(
  ({ asChild, className, variant = "brand", size = "md", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-base",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          size === "sm" && "h-9 px-4 text-sm",
          size === "md" && "h-11 px-6 text-sm",
          size === "lg" && "h-14 px-8 text-base",
          variant === "brand" && "bg-gradient-brand text-primary-foreground shadow-brand hover:shadow-lg hover:brightness-110",
          variant === "amber" && "bg-gradient-amber text-accent-foreground shadow-amber hover:brightness-110",
          variant === "outline" && "border border-border bg-card hover:bg-secondary text-foreground",
          variant === "ghost" && "hover:bg-secondary text-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
GradientButton.displayName = "GradientButton";
