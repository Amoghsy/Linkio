import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Star,
  Zap,
} from "lucide-react";
import { userService, type Worker, type WorkerAnalytics } from "@/services/userService";
import { reviewService, type Review } from "@/services/reviewService";
import { RatingStars } from "@/components/common/RatingStars";
import { TrustScoreBadge } from "@/components/common/TrustScoreBadge";
import { GradientButton } from "@/components/common/GradientButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { SUPPORTED_LANGS } from "@/lib/i18n";

export default function WorkerProfile() {
  const { id = "" } = useParams();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [analytics, setAnalytics] = useState<WorkerAnalytics | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    Promise.all([userService.getWorker(id), reviewService.getReviews(id)])
      .then(([nextWorker, nextReviews]) => {
        setWorker(nextWorker ?? null);
        setReviews(nextReviews);

        if (nextWorker) {
          setAnalyticsLoading(true);
          userService
            .getWorkerAnalytics(id, nextWorker)
            .then((nextAnalytics) => setAnalytics(nextAnalytics))
            .finally(() => setAnalyticsLoading(false));
        }
      })
      .catch((err: Error) => setError(err.message || "Failed to load worker profile."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 rounded-xl flex items-center gap-2">
        <AlertCircle size={16} />
        {error}
      </div>
    );
  }

  if (!worker) {
    return <p>Worker not found.</p>;
  }

  return (
    <div>
      <Link
        to="/app/search"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft size={14} />
        Back to search
      </Link>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div className="rounded-2xl overflow-hidden border border-border">
            <div className="h-32 bg-gradient-brand" />
            <div className="p-6 -mt-12">
              <div className="flex items-end gap-4">
                <img
                  src={worker.avatar}
                  alt={worker.name}
                  className="h-24 w-24 rounded-2xl border-4 border-card bg-card"
                />
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{worker.name}</h1>
                    <TrustScoreBadge score={worker.trustScore} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-sm text-primary font-semibold capitalize">{worker.category}</p>
                    {(worker.category?.toLowerCase() === "emergency worker" || (worker.skills && worker.skills.some(s => s.toLowerCase() === "emergency worker"))) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-bold flex items-center gap-1 uppercase">
                        <Zap size={10} className="fill-current" /> Emergency Responder
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <RatingStars rating={worker.rating} />
                <span>·</span>
                <span>{worker.reviewsCount} reviews</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} />
                  {worker.distanceKm} km away
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Briefcase size={14} />
                  {worker.experienceYears} yrs experience
                </span>
                {worker.location && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} />
                      {worker.location.lat.toFixed(3)}, {worker.location.lng.toFixed(3)}
                    </span>
                  </>
                )}
              </div>

              <p className="mt-4 text-foreground/90">{worker.bio}</p>
              {worker.languages && worker.languages.length > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Languages: {worker.languages.map(code => SUPPORTED_LANGS.find(l => l.value === code)?.label || code).join(", ")}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((skill, idx) => (
                <span
                  key={`${skill}-${idx}`}
                  className="px-3 py-1.5 rounded-full bg-gradient-brand-soft text-primary text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-primary" />
              <h2 className="font-semibold">Performance analytics</h2>
            </div>

            {analyticsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : analytics ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl bg-gradient-brand-soft p-4 text-center">
                  <CheckCircle2 size={20} className="mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{analytics.jobsCompleted}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Jobs done</p>
                </div>
                <div className="rounded-xl bg-amber-500/10 p-4 text-center">
                  <Star size={20} className="mx-auto text-amber-500 mb-1" />
                  <p className="text-2xl font-bold">{analytics.avgRating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Avg rating</p>
                </div>
                <div className="rounded-xl bg-blue-500/10 p-4 text-center">
                  <Clock size={20} className="mx-auto text-blue-500 mb-1" />
                  <p className="text-2xl font-bold">{analytics.responseTimeMinutes}m</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Response</p>
                </div>
                <div className="rounded-xl bg-success/10 p-4 text-center">
                  <BarChart3 size={20} className="mx-auto text-success mb-1" />
                  <p className="text-2xl font-bold">{analytics.completionRate}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Completion</p>
                </div>
              </div>
            ) : null}

            {!analyticsLoading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">

                  <span className="font-semibold text-primary">{worker.trustScore}/100</span>
                </div>

              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-border pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">
                        {review.customerName || "Customer"}
                      </p>
                      <RatingStars rating={review.rating} size={12} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside>
          <div className="lg:sticky lg:top-24 rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Starting from</p>
            <p className="text-3xl font-bold">₹{worker.priceFrom}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Up to ₹{worker.priceTo} based on scope
            </p>

            <div className="mt-5 space-y-2">
              <GradientButton size="lg" className="w-full" asChild>
                <Link to={`/app/book/${worker.id}`}>
                  <Calendar size={16} />
                  Book now
                </Link>
              </GradientButton>
              <GradientButton size="lg" variant="outline" className="w-full" asChild>
                <Link to={`/app/chat/${user?.id}_${worker.id}`}>
                  <MessageCircle size={16} />
                  Chat
                </Link>
              </GradientButton>
            </div>

            <p className="mt-4 text-xs text-muted-foreground text-center">
              Free cancellation up to 1 hour before.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
