import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, ArrowRight } from "lucide-react";
import { jobService, type Job } from "@/services/jobService";
import { useAuthStore } from "@/store/useAuthStore";
import { GradientButton } from "@/components/common/GradientButton";

export default function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;

    jobService
      .fetchJobs({ customerId: user.id })
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map((index) => (
          <div key={index} className="h-24 rounded-xl bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Briefcase className="text-primary" />
        My Jobs
      </h1>

      {jobs.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground mb-4">You have no active or past jobs.</p>
          <GradientButton asChild>
            <Link to="/app/search">Find a Worker</Link>
          </GradientButton>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/app/jobs/${job.id}`}
              className="block bg-card hover:bg-secondary/50 border border-border rounded-xl p-4 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">
                    {job.category} {job.workerName ? `with ${job.workerName}` : ""}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {job.date} at {job.time} · ₹{job.price}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary font-semibold capitalize text-primary">
                    {job.status.replace("_", " ")}
                  </span>
                  <ArrowRight size={16} className="text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
