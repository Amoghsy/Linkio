import api from "./api";
import { type AuthUser } from "./authService";
import { type Job } from "./jobService";

export interface AdminStats {
  totalUsers: number;
  totalWorkers: number;
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  totalRevenue: number;
  pendingVerifications: number;
  monthly: { month: string; jobs: number; signups: number }[];
}

export interface VerificationRow {
  id: string;
  name: string; // Worker name
  category: string;
  verified: boolean;
  verifiedAt?: string;
  documents?: string[];
  priceFrom?: number;
  priceTo?: number;
  lat?: number;
  lng?: number;
}

export const adminService = {
  getUsers: async (): Promise<AuthUser[]> => {
    const r = await api.get("/admin/users");
    return r.data;
  },

  getJobs: async (): Promise<Job[]> => {
    const r = await api.get("/admin/jobs");
    return r.data;
  },

  verifyWorker: async (id: string): Promise<{ id: string, verified: boolean }> => {
    const r = await api.put(`/admin/verify-worker/${id}`);
    return r.data;
  },

  stats: async (): Promise<AdminStats> => {
    const r = await api.get("/admin/analytics");
    return r.data;
  },

  verifications: async (): Promise<VerificationRow[]> => {
    // Fetch all workers so admin can manage fares for both pending and verified workers
    const r = await api.get("/admin/workers");
    return r.data.map((w: any) => ({
      id: w.id,
      name: w.name,
      category: w.category,
      verified: w.verified,
      verifiedAt: w.verifiedAt,
      priceFrom: w.priceFrom || 0,
      priceTo: w.priceTo || 0,
      lat: w.lat ?? w.location?.lat,
      lng: w.lng ?? w.location?.lng,
    }));
  },

  updateFare: async (id: string, priceFrom: number, priceTo: number): Promise<{ ok: boolean }> => {
    await api.put(`/admin/workers/${id}/fare`, { priceFrom, priceTo });
    return { ok: true };
  },

  decide: async (id: string, decision: "approve" | "reject"): Promise<{ ok: boolean }> => {
    if (decision === "approve") {
      await api.put(`/admin/verify-worker/${id}`);
    }
    // Reject logic might involve marking as rejected or deleting. Backend currently only has verify-worker.
    return { ok: true };
  },

  deleteWorker: async (id: string): Promise<{ ok: boolean }> => {
    await api.delete(`/admin/workers/${id}`);
    return { ok: true };
  }
};
