import api from "./api";

export interface CreatePaymentResponse {
  paymentId: string;
  jobId: string;
  amount: number;
  razorpayOrderId: string | null;
  currency: string;
}

export interface VerifyPaymentPayload {
  paymentId: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export const paymentService = {
  getConfig: async (): Promise<{ key: string }> => {
    const response = await api.get(`/payments/config?t=${Date.now()}`);
    return response.data;
  },

  createPayment: async (jobId: string, amount: number): Promise<CreatePaymentResponse> => {
    const response = await api.post("/payments/create", { jobId, amount });
    return response.data;
  },

  verifyPayment: async (payload: VerifyPaymentPayload): Promise<{ success: boolean; paymentId: string }> => {
    const response = await api.post("/payments/verify", payload);
    return response.data;
  },
};
