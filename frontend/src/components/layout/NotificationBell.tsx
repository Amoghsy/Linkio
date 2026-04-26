import { Bell, Check } from "lucide-react";
import { useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";

export const NotificationBell = () => {
  const { items, load, markAllRead, unread } = useNotificationStore();
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (userId && items.length === 0) {
      void load(userId);
    }
  }, [items.length, load, userId]);

  const count = unread();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative h-10 w-10 grid place-items-center rounded-full hover:bg-secondary transition-base"
        >
          <Bell size={20} />
          {count > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] rounded-full bg-gradient-amber text-[10px] font-bold text-accent-foreground grid place-items-center px-1">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="font-semibold">Notifications</span>
          {count > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              <Check size={12} /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "p-3 border-b border-border last:border-b-0 hover:bg-secondary/50 transition-base",
                  !n.read && "bg-gradient-brand-soft"
                )}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-gradient-amber shrink-0" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
