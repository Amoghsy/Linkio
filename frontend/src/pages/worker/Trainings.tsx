import { useEffect, useState } from "react";
import { AlertCircle, GraduationCap, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { userService, type WorkerTrainingPayload } from "@/services/userService";
import { Skeleton } from "@/components/ui/skeleton";

const PRIORITY_STYLES: Record<"high" | "medium" | "low", string> = {
  high: "border-destructive/30 bg-destructive/5",
  medium: "border-amber-400/30 bg-amber-500/5",
  low: "border-border bg-background/60",
};

export default function WorkerTrainingsPage() {
  const { user } = useAuthStore();
  const [training, setTraining] = useState<WorkerTrainingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    userService
      .getWorkerTrainings(user.id)
      .then((payload) => setTraining(payload))
      .catch((err: Error) => setError(err.message || "Failed to load trainings"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
        <AlertCircle size={16} />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-gradient-brand-soft p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-brand text-primary-foreground grid place-items-center shadow-brand">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Training recommendations</h1>
            <p className="text-sm text-muted-foreground">
              Gemini uses customer feedback to suggest the next coaching areas for your work.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-primary/15 bg-card/70 p-4">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            Feedback summary
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {training?.summary || "No training insights are available yet."}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {training?.basedOnFeedback
              ? `Generated from ${training.feedbackCount} customer feedback entr${training.feedbackCount === 1 ? "y" : "ies"} using Gemini.`
              : "No customer feedback is available yet, so the page is showing a starter training plan."}
          </p>
          {training?.updatedAt && (
            <p className="mt-3 text-xs text-muted-foreground">
              Updated {new Date(training.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {training?.recommendations?.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className={`rounded-2xl border p-5 ${PRIORITY_STYLES[item.priority]}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{item.title}</h2>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {item.priority} priority
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
            <p className="mt-3 text-sm">{item.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
