import { Skeleton } from "@/components/ui/skeleton";

export const WorkerCardSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
    <div className="flex gap-3">
      <Skeleton className="h-14 w-14 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-2/3" />
    <Skeleton className="h-9 w-full rounded-xl" />
  </div>
);
