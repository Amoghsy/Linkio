import { create } from "zustand";
import { userService, type WorkerSearchParams, type Worker } from "@/services/userService";

interface WorkerState {
  workers: Worker[];
  loading: boolean;
  error: string | null;
  language: string;
  emergency: boolean;
  setLanguage: (lang: string) => void;
  setEmergency: (flag: boolean) => void;
  searchWorkers: (params: WorkerSearchParams) => Promise<void>;
}

export const useWorkerStore = create<WorkerState>((set, get) => ({
  workers: [],
  loading: false,
  error: null,
  language: "",
  emergency: false,

  setLanguage: (language) => set({ language }),
  setEmergency: (emergency) => set({ emergency }),

  searchWorkers: async (params) => {
    set({ loading: true, error: null });
    const { language, emergency } = get();
    try {
      const enrichedParams: WorkerSearchParams = {
        ...params,
        ...(language && { language }),
        ...(emergency && { emergency: true }),
      };
      const data = await userService.searchWorkers(enrichedParams);
      set({ workers: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to search workers", loading: false, workers: [] });
    }
  },
}));
