import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService, type AuthUser, type Role } from "@/services/authService";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  logout: () => void;
  role: () => Role | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      logout: () => {
        authService.logout().catch(console.error);
        get().clearAuth();
      },
      role: () => get().user?.role ?? null,
    }),
    { name: "linkio-auth" }
  )
);
