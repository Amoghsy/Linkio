import api from "./api";

export interface LocationPoint {
  lat: number;
  lng: number;
}

export interface WorkerReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface WorkerTrainingRecommendation {
  title: string;
  reason: string;
  action: string;
  priority: "high" | "medium" | "low";
}

export interface WorkerTrainingPayload {
  workerId: string;
  summary: string;
  recommendations: WorkerTrainingRecommendation[];
  updatedAt: string | null;
  feedbackCount: number;
  basedOnFeedback: boolean;
}

export interface WorkerAnalytics {
  jobsCompleted: number;
  avgRating: number;
  responseTimeMinutes: number;
  completionRate: number;
}

export interface Worker {
  id: string;
  name: string;
  avatar: string;
  category: string;
  skills: string[];
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  trustScore: number;
  distanceKm: number;
  priceFrom: number;
  priceTo: number;
  bio: string;
  verified: boolean;
  reviews?: WorkerReview[];
  availability?: boolean;
  languages?: string[];
  location?: LocationPoint | null;
  lat?: number;
  lng?: number;
  locationLabel?: string;
  feedbackSummary?: string;
  trainingRecommendations?: WorkerTrainingRecommendation[];
  analytics?: WorkerAnalytics;
  phone?: string;
}

export interface WorkerSearchParams {
  q?: string;
  query?: string;
  category?: string;
  skill?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  language?: string;
  emergency?: boolean;
  maxDistance?: number;
  minRating?: number;
  maxPrice?: number;
}

export interface WorkerProfileUpdateInput {
  bio?: string;
  category?: string;
  experienceYears?: number;
  languages?: string[];
  location?: LocationPoint | null;
  locationLabel?: string;
  lat?: number;
  lng?: number;
  availability?: boolean;
  priceFrom?: number;
  priceTo?: number;
  skills?: string[];
}

export interface UserProfileUpdateInput {
  avatar?: string;
  location?: LocationPoint | null;
  locationLabel?: string;
  lat?: number;
  lng?: number;
  name?: string;
  phone?: string;
}

const mockAnalytics = (worker: Worker): WorkerAnalytics => ({
  jobsCompleted: worker.reviewsCount ?? Math.floor(Math.random() * 80 + 20),
  avgRating: worker.rating,
  responseTimeMinutes: Math.floor(Math.random() * 20 + 5),
  completionRate: Math.floor(Math.random() * 15 + 85),
});

const normalizeLocation = (value: any): LocationPoint | null => {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    return null;
  }

  return { lat, lng };
};

const normalizeTrainingRecommendation = (value: any): WorkerTrainingRecommendation | null => {
  const title = typeof value?.title === "string" ? value.title : "";
  const reason = typeof value?.reason === "string" ? value.reason : "";
  const action = typeof value?.action === "string" ? value.action : "";
  const priority =
    value?.priority === "high" || value?.priority === "low" ? value.priority : "medium";

  if (!title || !reason || !action) {
    return null;
  }

  return { title, reason, action, priority };
};

const normalizeWorker = (worker: any): Worker => {
  const location = normalizeLocation(worker?.location ?? worker);

  return {
    id: String(worker?.id ?? ""),
    name: worker?.name ?? "Worker",
    avatar: worker?.avatar ?? "https://placehold.co/96x96?text=W",
    category: String(worker?.category ?? "").toLowerCase(),
    skills: Array.isArray(worker?.skills) ? worker.skills : [],
    experienceYears: Number(worker?.experienceYears ?? 0),
    rating: Number(worker?.rating ?? 0),
    reviewsCount: Number(worker?.reviewsCount ?? 0),
    trustScore: Number(worker?.trustScore ?? 0),
    distanceKm: Number(worker?.distanceKm ?? 0),
    priceFrom: Number(worker?.priceFrom ?? 0),
    priceTo: Number(worker?.priceTo ?? worker?.priceFrom ?? 0),
    bio: worker?.bio ?? "",
    verified: Boolean(worker?.verified),
    reviews: Array.isArray(worker?.reviews) ? worker.reviews : [],
    availability: worker?.availability ?? worker?.available ?? true,
    languages: Array.isArray(worker?.languages) ? worker.languages : [],
    location,
    lat: location?.lat ?? Number(worker?.lat ?? 0),
    lng: location?.lng ?? Number(worker?.lng ?? 0),
    locationLabel: typeof worker?.locationLabel === "string" ? worker.locationLabel : "",
    feedbackSummary: typeof worker?.feedbackSummary === "string" ? worker.feedbackSummary : "",
    trainingRecommendations: Array.isArray(worker?.trainingRecommendations)
      ? (worker.trainingRecommendations
          .map(normalizeTrainingRecommendation)
          .filter(Boolean) as WorkerTrainingRecommendation[])
      : [],
    analytics: worker?.analytics,
    phone: typeof worker?.phone === "string" ? worker.phone : "",
  };
};

const normalizeTrainingPayload = (payload: any): WorkerTrainingPayload => ({
  workerId: String(payload?.workerId ?? ""),
  summary: typeof payload?.summary === "string" ? payload.summary : "",
  recommendations: Array.isArray(payload?.recommendations)
    ? (payload.recommendations
        .map(normalizeTrainingRecommendation)
        .filter(Boolean) as WorkerTrainingRecommendation[])
    : [],
  updatedAt: normalizeDateLike(payload?.updatedAt),
  feedbackCount: Number(payload?.feedbackCount ?? 0),
  basedOnFeedback: Boolean(payload?.basedOnFeedback),
});

export const userService = {
  searchWorkers: async (params: WorkerSearchParams = {}): Promise<Worker[]> => {
    const normalizedParams = {
      ...(params.category ? { category: params.category } : {}),
      ...(params.query ? { query: params.query } : {}),
      ...(params.q ? { q: params.q } : {}),
      ...(params.skill ? { skill: params.skill } : {}),
      ...(params.lat !== undefined ? { lat: params.lat } : {}),
      ...(params.lng !== undefined ? { lng: params.lng } : {}),
      ...(params.radius !== undefined ? { radius: params.radius } : {}),
      ...(params.language ? { language: params.language } : {}),
      ...(params.emergency !== undefined ? { emergency: params.emergency } : {}),
      ...(params.maxDistance !== undefined ? { maxDistance: params.maxDistance } : {}),
      ...(params.minRating !== undefined ? { minRating: params.minRating } : {}),
      ...(params.maxPrice !== undefined ? { maxPrice: params.maxPrice } : {}),
    };
    const response = await api.get("/workers", { params: normalizedParams });
    return Array.isArray(response.data) ? response.data.map(normalizeWorker) : [];
  },

  updateWorker: async (id: string, updates: WorkerProfileUpdateInput): Promise<Worker> => {
    const response = await api.put(`/workers/${id}`, updates);
    return normalizeWorker(response.data);
  },

  updateWorkerAvailability: async (id: string, availability: boolean): Promise<Worker> => {
    const response = await api.patch(`/workers/${id}/availability`, { availability });
    return normalizeWorker(response.data);
  },

  getWorker: async (id: string): Promise<Worker> => {
    const response = await api.get(`/workers/${id}`);
    return normalizeWorker(response.data);
  },

  getWorkerTrainings: async (id: string): Promise<WorkerTrainingPayload> => {
    const response = await api.get(`/workers/${id}/trainings`);
    return normalizeTrainingPayload(response.data);
  },

  updateUser: async (id: string, updates: UserProfileUpdateInput): Promise<Record<string, unknown>> => {
    const response = await api.put(`/users/${id}`, updates);
    return response.data;
  },

  getWorkerAnalytics: async (id: string, worker?: Worker): Promise<WorkerAnalytics> => {
    try {
      const response = await api.get<WorkerAnalytics>(`/workers/${id}/analytics`);
      return response.data;
    } catch {
      return mockAnalytics(worker ?? ({ id, rating: 4.5, reviewsCount: 30 } as Worker));
    }
  },
};
const normalizeDateLike = (value: any): string | null => {
  if (typeof value === "string") {
    return value;
  }
  if (value?.seconds) {
    return new Date(value.seconds * 1000).toISOString();
  }
  return null;
};
