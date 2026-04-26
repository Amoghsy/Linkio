import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({ icon: Icon, title, description, action, className }: Props) => (
  <div className={cn("flex flex-col items-center justify-center text-center py-16 px-4", className)}>
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-gradient-brand-soft grid place-items-center mb-4">
        <Icon className="text-primary" size={28} />
      </div>
    )}
    <h3 className="font-semibold text-lg">{title}</h3>
    {description && <p className="text-muted-foreground text-sm mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
