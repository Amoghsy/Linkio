import { create } from "zustand";
import { jobService, type Job } from "@/services/jobService";

interface JobState {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  fetchJobs: (workerId: string) => Promise<void>;
  updateJobStatus: (id: string, status: Job["status"]) => Promise<void>;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  loading: false,
  error: null,
  
  fetchJobs: async (workerId) => {
    set({ loading: true, error: null });
    try {
      const data = await jobService.fetchJobs({ workerId });
      set({ jobs: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch jobs", loading: false });
    }
  },

  updateJobStatus: async (id, status) => {
    set({ error: null });
    try {
      const updatedJob = await jobService.updateStatus(id, status);
      set((state) => ({
        jobs: state.jobs.map((job) => (job.id === id ? updatedJob : job)),
      }));
    } catch (err: any) {
      set({ error: err.message || "Failed to update job status" });
      throw err;
    }
  },
}));
