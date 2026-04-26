import api from "./api";
import { type Worker } from "./userService";

export type MapWorker = Worker & {
  lat: number;
  lng: number;
  available: boolean;
  hasLocation: boolean; // true only when real non-zero coords exist
};

export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Safely parse a lat/lng value from any shape the backend may return.
 * Returns null if the value is missing, non-numeric, or (0, 0).
 */
function extractCoords(raw: any): GeoPoint | null {
  // Support Firestore GeoPoint serialised as { _lat, _long }
  const lat =
    Number(raw?.location?._lat ?? raw?.location?.lat ?? raw?.lat ?? NaN);
  const lng =
    Number(raw?.location?._long ?? raw?.location?.lng ?? raw?.lng ?? NaN);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null; // placeholder — not a real location
  return { lat, lng };
}

export const mapService = {
  /** Resolves to the user's real GPS location, or a Bengaluru default. */
  getCurrentLocation: (): Promise<GeoPoint> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve({ lat: 12.9716, lng: 77.5946 });
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: 12.9716, lng: 77.5946 }),
        { timeout: 6000, maximumAge: 30_000 }
      );
    }),

  /** Returns workers within `radiusKm`, filtered by category and query. */
  getNearbyWorkers: async (
    center: GeoPoint,
    radiusKm: number,
    category: string,
    query: string,
    filters?: {
      minRating?: number;
      maxPrice?: number;
      language?: string;
      emergency?: boolean;
    }
  ): Promise<MapWorker[]> => {
    const params: Record<string, any> = {
      lat: center.lat,
      lng: center.lng,
      radius: radiusKm,
    };

    if (category && category !== "all") params.skill = category;
    if (query) params.q = query;
    if (filters?.minRating) params.minRating = filters.minRating;
    if (filters?.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters?.language) params.language = filters.language;
    if (filters?.emergency) params.emergency = filters.emergency;

    const r = await api.get("/workers", { params });
    const raw: any[] = Array.isArray(r.data) ? r.data : [];

    console.log(`[mapService] Raw API response (${raw.length} workers):`, raw);

    return raw.map((w): MapWorker => {
      const coords = extractCoords(w);
      return {
        ...w,
        // Ensure availability is always a boolean
        available: w.available ?? w.availability ?? true,
        availability: w.availability ?? w.available ?? true,
        // Coordinates — fall back to 0/0 for list display, flag missing ones
        lat: coords?.lat ?? 0,
        lng: coords?.lng ?? 0,
        hasLocation: coords !== null,
      };
    });
  },

  getCategories: async (): Promise<string[]> => {
    const r = await api.get("/workers/categories");
    return Array.isArray(r.data) ? r.data : [];
  },
};
