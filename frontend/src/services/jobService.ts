import api from "./api";

export type JobStatus =
  | "pending"
  | "accepted"
  | "ongoing"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Job {
  id: string;
  userId: string;
  workerId: string;
  workerName?: string;
  category: string;
  date: string;
  time: string;
  price: number;
  status: JobStatus;
  notes?: string;
  customerName?: string;
  customerAvatar?: string;
  customerPhone?: string;
  distanceKm?: number;
  priority?: "normal" | "high";
  language?: string;
  workerLat?: number;
  workerLng?: number;
  customerLat?: number;
  customerLng?: number;
  reviewSubmitted?: boolean;
  reviewId?: string | null;
}

export interface EarningsData {
  totalEarnings: number;
  jobsCompleted: number;
  thisMonth: number;
  weekly: { day: string; amount: number }[];
  history: { id: string; date: string; customer: string; amount: number; status: "paid" | "pending" }[];
}

export interface CreateBookingPayload {
  workerId: string;
  date?: string;
  time?: string;
  notes?: string;
  customerLat?: number;
  customerLng?: number;
  price: number;
  title: string;
  category: string;
  priority?: "normal" | "high";
  language?: string;
}

const normalizeJob = (job: any): Job => ({
  id: String(job?.id ?? ""),
  userId: String(job?.userId ?? ""),
  workerId: String(job?.workerId ?? ""),
  workerName: typeof job?.workerName === "string" ? job.workerName : undefined,
  category: typeof job?.category === "string" ? job.category : "",
  date: typeof job?.date === "string" ? job.date : "",
  time: typeof job?.time === "string" ? job.time : "",
  price: Number(job?.price ?? 0),
  status: job?.status ?? "pending",
  notes: typeof job?.notes === "string" ? job.notes : "",
  customerName: typeof job?.customerName === "string" ? job.customerName : undefined,
  customerAvatar: typeof job?.customerAvatar === "string" ? job.customerAvatar : undefined,
  customerPhone: typeof job?.customerPhone === "string" ? job.customerPhone : undefined,
  distanceKm: Number(job?.distanceKm ?? 0),
  priority: job?.priority === "high" ? "high" : "normal",
  language: typeof job?.language === "string" ? job.language : undefined,
  workerLat: Number.isFinite(Number(job?.workerLat)) ? Number(job.workerLat) : undefined,
  workerLng: Number.isFinite(Number(job?.workerLng)) ? Number(job.workerLng) : undefined,
  customerLat: Number.isFinite(Number(job?.customerLat)) ? Number(job.customerLat) : undefined,
  customerLng: Number.isFinite(Number(job?.customerLng)) ? Number(job.customerLng) : undefined,
  reviewSubmitted: Boolean(job?.reviewSubmitted),
  reviewId: typeof job?.reviewId === "string" ? job.reviewId : null,
});

export const jobService = {
  createBooking: async (payload: CreateBookingPayload): Promise<Job> => {
    const response = await api.post("/jobs", payload);
    return normalizeJob(response.data);
  },

  getJob: async (id: string): Promise<Job> => {
    const response = await api.get(`/jobs/${id}`);
    return normalizeJob(response.data);
  },

  updateStatus: async (id: string, status: JobStatus): Promise<Job> => {
    const response = await api.patch(`/jobs/${id}/status`, { status });
    return normalizeJob(response.data);
  },

  fetchJobs: async (filters: {
    customerId?: string;
    workerId?: string;
    status?: JobStatus;
  }): Promise<Job[]> => {
    const params = {
      ...(filters.customerId ? { userId: filters.customerId } : {}),
      ...(filters.workerId ? { workerId: filters.workerId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
    const response = await api.get("/jobs", { params });
    return Array.isArray(response.data) ? response.data.map(normalizeJob) : [];
  },

  getEarnings: async (workerId: string): Promise<EarningsData> => {
    const response = await api.get(`/workers/${workerId}/earnings`);
    return response.data;
  },
};
