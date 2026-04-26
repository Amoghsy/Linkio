import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Briefcase,
  Check,
  Clock,
  Flag,
  Globe,
  IndianRupee,
  MapPin,
  MessageCircle,
  Navigation,
  PhoneCall,
  Play,
  Star,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useJobStore } from "@/store/useJobStore";
import { useAuthStore } from "@/store/useAuthStore";
import { GradientButton } from "@/components/common/GradientButton";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/common/EmptyState";
import WorkerMapPanel from "@/components/map/WorkerMapPanel";
import RouteMapPanel from "@/components/map/RouteMapPanel";
import type { Job } from "@/services/jobService";
import { userService, type Worker } from "@/services/userService";

const STATUS_STYLES: Record<Job["status"], string> = {
  pending: "bg-warning/15 text-warning",
  accepted: "bg-primary/15 text-primary",
  in_progress: "bg-secondary/15 text-secondary-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
  ongoing: "",
};

export default function WorkerDashboard() {
  const { user } = useAuthStore();
  const { jobs: requests, loading, error, fetchJobs, updateJobStatus } = useJobStore();
  const { toast } = useToast();
  const [workerProfile, setWorkerProfile] = useState<Worker | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchJobs(user.id);
      userService.getWorker(user.id).then(setWorkerProfile).catch(() => setWorkerProfile(null));
    }
  }, [fetchJobs, user?.id]);

  const decide = async (id: string, decision: Job["status"]) => {
    try {
      await updateJobStatus(id, decision);
      toast({
        title:
          decision === "accepted"
            ? "Job accepted"
            : decision === "cancelled"
              ? "Job rejected"
              : `Job marked ${decision}`,
      });
      if (user?.id) {
        fetchJobs(user.id);
        userService.getWorker(user.id).then(setWorkerProfile).catch(() => setWorkerProfile(null));
      }
    } catch {
      // store handles the visible error state
    }
  };

  const toggleRoute = (job: Job) => {
    setSelectedJob((prev) => (prev?.id === job.id ? null : job));
  };

  const activeJobsCount = requests.filter(
    (r) => r.status === "accepted" || r.status === "in_progress" || r.status === "ongoing"
  ).length;
  const totalEarnings = requests
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + (Number(r.price) || 0), 0);
  const rating =
    workerProfile && workerProfile.reviewsCount > 0
      ? `${workerProfile.rating.toFixed(1)} ★`
      : "New";

  const stats = [
    { label: "Active jobs", value: activeJobsCount.toString(), icon: Briefcase, gradient: "bg-gradient-brand" },
    {
      label: "Total earnings",
      value: `₹${totalEarnings.toLocaleString()}`,
      icon: TrendingUp,
      gradient: "bg-gradient-amber",
    },
    { label: "Rating", value: rating, icon: Star, gradient: "bg-gradient-dark" },
  ];

  // Worker coords for routing
  const workerLocation = {
    lat: Number(workerProfile?.lat ?? workerProfile?.location?.lat ?? 0),
    lng: Number(workerProfile?.lng ?? workerProfile?.location?.lng ?? 0),
  };

  const activeRequests = requests.filter(
    (r) => r.status === "pending" || r.status === "accepted" || r.status === "in_progress" || r.status === "ongoing"
  );
  const historyRequests = requests.filter(
    (r) => r.status === "completed" || r.status === "cancelled"
  );

  const renderJobCard = (request: Job) => {
    const isRouteFocused = selectedJob?.id === request.id;
    const canRoute =
      (request.status === "accepted" || request.status === "in_progress" || request.status === "ongoing") &&
      (request.customerLat != null || request.customerLng != null);

    return (
      <div
        key={request.id}
        className={`p-5 flex flex-col md:flex-row md:items-start gap-4 transition-colors ${
          isRouteFocused ? "bg-primary/5 border-l-2 border-primary" : ""
        }`}
      >
        <img
          src={request.customerAvatar}
          alt=""
          className="h-12 w-12 rounded-2xl bg-secondary flex-shrink-0"
        />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-semibold">{request.customerName}</p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[request.status]}`}
            >
              {request.status}
            </span>
            {request.priority === "high" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-destructive/15 text-destructive flex items-center gap-1">
                <Zap size={10} className="fill-current" />
                Emergency
              </span>
            )}
          </div>

          {request.notes ? (
            <p className="text-sm text-muted-foreground">{request.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No specific details provided.
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} />
              {request.distanceKm ?? 0} km
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {request.date} {request.time}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <IndianRupee size={12} />
              {request.price}
            </span>
            {request.language && (
              <span className="inline-flex items-center gap-1" title="Preferred language">
                <Globe size={12} />
                {request.language.toUpperCase()}
              </span>
            )}
            {request.customerPhone && (
              <a
                href={`tel:${request.customerPhone}`}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline ml-2"
              >
                <PhoneCall size={12} />
                Call {request.customerPhone}
              </a>
            )}
            <Link
              to={`/worker/chat/${request.id}`}
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline ml-2"
            >
              <MessageCircle size={12} /> Chat
            </Link>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          {/* View Route — visible for active jobs */}
          {canRoute && (
            <>
              <GradientButton
                size="sm"
                variant={isRouteFocused ? "brand" : "outline"}
                onClick={() => toggleRoute(request)}
                title="View driving route to customer"
              >
                <Navigation size={14} className="mr-1" />
                {isRouteFocused ? "Close Route" : "View Route"}
              </GradientButton>
              <GradientButton
                size="sm"
                variant="outline"
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&origin=${workerLocation.lat},${workerLocation.lng}&destination=${request.customerLat},${request.customerLng}&travelmode=driving`,
                    "_blank"
                  );
                }}
                title="Open in Google Maps"
              >
                <MapPin size={14} className="mr-1" />
                Get Directions
              </GradientButton>
            </>
          )}

          {request.status === "pending" && (
            <>
              <GradientButton
                variant="outline"
                size="sm"
                onClick={() => decide(request.id, "cancelled")}
              >
                <X size={14} className="mr-1" />
                Reject
              </GradientButton>
              <GradientButton
                size="sm"
                onClick={() => decide(request.id, "accepted")}
              >
                <Check size={14} className="mr-1" />
                Accept
              </GradientButton>
            </>
          )}
          {request.status === "accepted" && (
            <GradientButton
              size="sm"
              onClick={() => decide(request.id, "in_progress")}
            >
              <Play size={14} className="mr-1" />
              Start job
            </GradientButton>
          )}
          {request.status === "in_progress" && (
            <GradientButton
              size="sm"
              onClick={() => decide(request.id, "completed")}
            >
              <Flag size={14} className="mr-1" />
              Complete
            </GradientButton>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-muted-foreground">Here's what's happening today.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
            <div className={`h-10 w-10 rounded-xl ${stat.gradient} grid place-items-center text-primary-foreground`}>
              <stat.icon size={18} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Worker location panel */}
      <WorkerMapPanel />

      {/* Route panel — appears when worker clicks "View Route" */}
      {selectedJob && (
        <RouteMapPanel
          job={selectedJob}
          workerLocation={workerLocation}
          onClose={() => setSelectedJob(null)}
        />
      )}

      {/* Active Job requests */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Incoming & Active Requests</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-amber text-accent-foreground font-bold">
            {activeRequests.filter((r) => r.status === "pending").length} new
          </span>
        </div>

        {error && (
          <div className="p-5 m-5 text-sm text-destructive-foreground bg-destructive/10 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading && activeRequests.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Loading requests...</div>
        ) : activeRequests.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No active requests"
            description="You're all caught up. We'll notify you instantly."
          />
        ) : (
          <div className="divide-y divide-border">
            {activeRequests.map(renderJobCard)}
          </div>
        )}
      </div>

      {/* History section */}
      {historyRequests.length > 0 && (
        <div className="rounded-2xl border border-border bg-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Job History</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
              {historyRequests.length} past jobs
            </span>
          </div>

          <div className="divide-y divide-border">
            {historyRequests.map(renderJobCard)}
          </div>
        </div>
      )}
    </div>
  );
}
