import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Check,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  RefreshCw,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { jobService } from "@/services/jobService";
import type { Job, JobStatus } from "@/services/jobService";
import { reviewService } from "@/services/reviewService";
import { GradientButton } from "@/components/common/GradientButton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const STEPS: { key: JobStatus; label: string; desc: string }[] = [
  { key: "pending", label: "Pending", desc: "Waiting for worker confirmation" },
  { key: "accepted", label: "Accepted", desc: "Worker is on the way" },
  { key: "in_progress", label: "Ongoing", desc: "Job in progress" },
  { key: "completed", label: "Completed", desc: "Payment released" },
];

const jitter = (base: number, amplitude = 0.001) =>
  base + (Math.random() - 0.5) * amplitude * 2;

export default function JobTracking() {
  const { jobId = "" } = useParams();
  const { user } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workerPos, setWorkerPos] = useState<{ lat: number; lng: number } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const driftRef = useRef<{ lat: number; lng: number } | null>(null);

  const loadJob = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const nextJob = await jobService.getJob(jobId);
      setJob(nextJob);
      setError(null);

      if (nextJob.workerLat && nextJob.workerLng) {
        driftRef.current = { lat: nextJob.workerLat, lng: nextJob.workerLng };
        setWorkerPos({ lat: nextJob.workerLat, lng: nextJob.workerLng });
      } else if (!driftRef.current) {
        driftRef.current = { lat: 12.9716, lng: 77.5946 };
        setWorkerPos(driftRef.current);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load job.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadJob();
  }, [jobId]);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      void loadJob(true);

      if (driftRef.current && job?.status !== "completed") {
        const nextLocation = {
          lat: jitter(driftRef.current.lat),
          lng: jitter(driftRef.current.lng),
        };
        driftRef.current = nextLocation;
        setWorkerPos(nextLocation);
      }
    }, 8000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [job?.status, jobId]);

  const advance = async () => {
    if (!job) return;
    const currentStepIndex = STEPS.findIndex((step) => step.key === job.status);
    const nextStep = STEPS[currentStepIndex + 1];
    if (!nextStep) return;
    const updatedJob = await jobService.updateStatus(job.id, nextStep.key);
    setJob(updatedJob);
  };

  const submitReview = async () => {
    if (!job || reviewRating < 1) return;

    setReviewSubmitting(true);
    try {
      await reviewService.submitReview({
        jobId: job.id,
        workerId: job.workerId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setJob({ ...job, reviewSubmitted: true });
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-24 rounded-3xl bg-secondary animate-pulse" />
        <div className="h-64 rounded-2xl bg-secondary animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
        <RefreshCw size={16} />
        {error}
        <button onClick={() => void loadJob()} className="ml-auto underline">
          Retry
        </button>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const currentStepIndex = STEPS.findIndex((step) => step.key === job.status);
  const isEmergency = job.priority === "high";
  const canReview =
    job.status === "completed" &&
    !job.reviewSubmitted &&
    Boolean(user?.id) &&
    user?.id === job.userId;

  return (
    <div className="max-w-3xl mx-auto">
      <div
        className={cn(
          "rounded-3xl p-6 flex items-center gap-4",
          isEmergency ? "bg-destructive/10 border border-destructive/30" : "bg-gradient-brand-soft"
        )}
      >
        <div
          className={cn(
            "h-14 w-14 rounded-2xl grid place-items-center text-primary-foreground",
            isEmergency ? "bg-destructive" : "bg-gradient-brand shadow-brand"
          )}
        >
          {isEmergency ? <Zap size={24} className="fill-white" /> : <Sparkles size={24} />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase font-bold tracking-widest text-primary">Job #{job.id}</p>
            {isEmergency && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground font-bold">
                EMERGENCY
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold">
            {job.category} · {job.workerName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {job.date} at {job.time} · ₹{job.price}
          </p>
        </div>
        <GradientButton variant="outline" asChild>
          <Link to={`/app/chat/${job.id}`}>
            <MessageCircle size={16} />
            Chat
          </Link>
        </GradientButton>
      </div>

      {workerPos && job.status !== "pending" && (
        <div className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-primary animate-pulse" />
              <h2 className="font-semibold text-sm">Live worker location</h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/30 font-semibold">
              LIVE
            </span>
          </div>
          <div className="relative h-40 bg-gradient-to-br from-blue-950 to-slate-900 overflow-hidden">
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              {Array.from({ length: 6 }).map((_, index) => (
                <line
                  key={`h-${index}`}
                  x1="0"
                  y1={`${(index + 1) * 16.7}%`}
                  x2="100%"
                  y2={`${(index + 1) * 16.7}%`}
                  stroke="white"
                  strokeWidth="0.5"
                />
              ))}
              {Array.from({ length: 8 }).map((_, index) => (
                <line
                  key={`v-${index}`}
                  x1={`${(index + 1) * 12.5}%`}
                  y1="0"
                  x2={`${(index + 1) * 12.5}%`}
                  y2="100%"
                  stroke="white"
                  strokeWidth="0.5"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-6 rounded-full bg-primary/20 animate-ping" />
                <div className="absolute -inset-3 rounded-full bg-primary/30" />
                <div className="h-10 w-10 rounded-full bg-gradient-brand border-2 border-white shadow-brand flex items-center justify-center">
                  <MapPin size={16} className="text-white fill-white" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-2 right-3 text-[10px] text-white/60 font-mono">
              {workerPos.lat.toFixed(4)}, {workerPos.lng.toFixed(4)}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-6">Progress</h2>
        <ol className="space-y-6">
          {STEPS.map((step, index) => {
            const done = index < currentStepIndex;
            const active = index === currentStepIndex;

            return (
              <li key={step.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full grid place-items-center transition-base",
                      done && "bg-gradient-brand text-primary-foreground shadow-brand",
                      active && "bg-gradient-amber text-accent-foreground shadow-amber animate-pulse-ring",
                      !done && !active && "bg-secondary text-muted-foreground"
                    )}
                  >
                    {done ? <Check size={18} /> : <Clock size={18} />}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn("w-px flex-1 mt-1", done ? "bg-primary" : "bg-border")}
                      style={{ minHeight: 24 }}
                    />
                  )}
                </div>
                <div className="pb-4">
                  <p className={cn("font-semibold", active && "text-primary")}>{step.label}</p>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {job.status !== "completed" && (
          <GradientButton onClick={advance} className="mt-4" variant="outline">

          </GradientButton>
        )}
      </div>

      {job.status === "completed" && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">Rate this worker</h2>
          {job.reviewSubmitted ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Thanks for sharing your feedback. It has been added to the worker profile and training plan.
            </p>
          ) : canReview ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewRating(value)}
                      className="rounded-full p-1"
                    >
                      <Star
                        size={22}
                        className={cn(
                          reviewRating >= value
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/40"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <Textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Describe the work quality, punctuality, communication, and anything the worker should improve."
                maxLength={500}
              />
              <GradientButton onClick={submitReview} disabled={reviewSubmitting || reviewRating < 1}>
                {reviewSubmitting ? "Submitting..." : "Submit review"}
              </GradientButton>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Reviews can be submitted by the customer who completed this job.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
