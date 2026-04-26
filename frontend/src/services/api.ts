import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

// Use environment variable or default to localhost
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 50000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API Error:", err);
    if (err.response?.status === 401) {
      const url = String(err.config?.url || "");
      if (!url.includes("/auth/logout")) {
        useAuthStore.getState().clearAuth();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    } else {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message || "An error occurred");
    }
    return Promise.reject(err);
  }
);

export default api;
