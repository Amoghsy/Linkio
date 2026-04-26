import api from "./api";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const getAuthErrorMessage = (error: unknown): string => {
  const code = (error as { code?: string })?.code;

  if (code === "auth/configuration-not-found") {
    return "Firebase Auth is not configured for this project. Verify your VITE_FIREBASE_* values and enable Email/Password (and Google, if used) in Firebase Console.";
  }

  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Invalid email or password.";
  }

  return (error as { message?: string })?.message || "Authentication failed.";
};

export type Role = "customer" | "worker" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  login: async (email: string, password: string, role: Role): Promise<AuthResponse> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      const res = await api.post("/auth/login", { role }, {
          headers: { Authorization: `Bearer ${token}` }
      });
      return { token, user: res.data.user };
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  },

  signup: async (payload: Record<string, unknown> & { role: Role, email: string, password?: string, name?: string }): Promise<AuthResponse> => {
    // We assume password is required for normal signup. If missing, it might be a google signup which is handled below.
    if (!payload.password) throw new Error("Password is required for signup");
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
      const token = await userCredential.user.getIdToken();
      const res = await api.post("/auth/signup", payload, {
          headers: { Authorization: `Bearer ${token}` }
      });
      return { token, user: res.data.user };
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  },

  loginWithGoogle: async (role: Role): Promise<AuthResponse> => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const token = await userCredential.user.getIdToken();
      // We try to login first, if the user doesn't exist, the backend should ideally tell us, or we can just call signup to upsert.
      // Given the backend handles signup by checking if user exists, we can call signup.
      const res = await api.post("/auth/signup", {
          role,
          name: userCredential.user.displayName,
          email: userCredential.user.email
      }, {
          headers: { Authorization: `Bearer ${token}` }
      });
      return { token, user: res.data.user };
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  },

  logout: async (): Promise<void> => {
    await signOut(auth);
    // Optional backend logout notification
    await api.post("/auth/logout").catch(() => {});
  }
};
