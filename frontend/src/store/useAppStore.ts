import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/i18n";

interface AppState {
  language: Lang;
  setLanguage: (lang: Lang) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => set({ language }),
    }),
    { name: "linkio-app-settings" }
  )
);
