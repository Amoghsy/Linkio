import api from "./api";

export type DemandLevel = "high" | "medium" | "low";

export interface DemandItem {
  service: string;
  level: DemandLevel;
  icon?: string;
}

const MOCK_DEMAND: DemandItem[] = [
  { service: "Plumber", level: "high", icon: "🔧" },
  { service: "Electrician", level: "high", icon: "⚡" },
  { service: "AC Repair", level: "medium", icon: "❄️" },
  { service: "Carpenter", level: "low", icon: "🪚" },
  { service: "Painter", level: "medium", icon: "🎨" },
];

export const demandService = {
  getDemandPrediction: async (): Promise<DemandItem[]> => {
    try {
      const r = await api.get<DemandItem[]>("/analytics/demand");
      return Array.isArray(r.data) && r.data.length > 0 ? r.data : MOCK_DEMAND;
    } catch {
      // API not yet available – return mock data silently
      return MOCK_DEMAND;
    }
  },
};
