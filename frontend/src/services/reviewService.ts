import api from "./api";

export interface Review {
  id: string;
  workerId: string;
  userId: string;
  jobId: string;
  customerName?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const normalizeCreatedAt = (value: any): string => {
  if (typeof value === "string") {
    return value;
  }
  if (value?.seconds) {
    return new Date(value.seconds * 1000).toISOString();
  }
  return new Date().toISOString();
};

export const reviewService = {
  submitReview: async (payload: {
    jobId: string;
    workerId: string;
    rating: number;
    comment: string;
  }): Promise<Review> => {
    const response = await api.post("/reviews", payload);
    return {
      ...response.data,
      createdAt: normalizeCreatedAt(response.data?.createdAt),
    };
  },

  getReviews: async (workerId: string): Promise<Review[]> => {
    const response = await api.get(`/reviews/${workerId}`);
    return Array.isArray(response.data)
      ? response.data.map((review: any) => ({
          ...review,
          createdAt: normalizeCreatedAt(review?.createdAt),
        }))
      : [];
  },
};
