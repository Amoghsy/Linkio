import { useEffect, useState, useMemo } from "react";
import MapView, { type MapMarkerInput } from "./MapView";
import MapFilters from "@/components/map/MapFilters";
import { mapService, type GeoPoint, type MapWorker } from "@/services/mapService";
import { MapPin, AlertCircle } from "lucide-react";

// Haversine distance (km)
function calcDistance(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export default function MapPage() {
  const [center, setCenter] = useState<GeoPoint | null>(null);
  const [workers, setWorkers] = useState<MapWorker[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(10);
  const [category, setCategory] = useState("all");

  // ── 1. Get GPS then fetch initial workers + categories ──
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const loc = await mapService.getCurrentLocation();
      if (cancelled) return;

      console.log("[MapPage] User location:", loc);
      setCenter(loc);

      const [cats, nearby] = await Promise.all([
        mapService.getCategories().catch(() => []),
        mapService.getNearbyWorkers(loc, radius, "all", "").catch(() => []),
      ]);

      if (cancelled) return;

      console.log("[MapPage] Workers from API:", nearby);
      console.log(
        "[MapPage] Workers WITH location:",
        nearby.filter((w) => w.hasLocation).map((w) => ({ id: w.id, name: w.name, lat: w.lat, lng: w.lng }))
      );
      console.log(
        "[MapPage] Workers WITHOUT location:",
        nearby.filter((w) => !w.hasLocation).map((w) => ({ id: w.id, name: w.name }))
      );

      setCategories(cats);
      setWorkers(nearby);
      setLoading(false);
    };

    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Re-fetch when radius / category filter changes ──
  useEffect(() => {
    if (!center) return;
    let cancelled = false;
    setLoading(true);

    mapService
      .getNearbyWorkers(center, radius, category, query)
      .then((data) => {
        if (!cancelled) {
          setWorkers(data);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, category]);

  // ── 3. Client-side text filter (no re-fetch) ──
  const filteredWorkers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workers.filter((w) => {
      if (!q) return true;
      return (
        w.name?.toLowerCase().includes(q) ||
        w.category?.toLowerCase().includes(q) ||
        (w.skills as string[] | undefined)?.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [workers, query]);

  // Split into located vs. not-located for the list
  const locatedWorkers = filteredWorkers.filter((w) => w.hasLocation);
  const unlocatedWorkers = filteredWorkers.filter((w) => !w.hasLocation);

  // ── 4. Build Google Maps markers ──
  const markers = useMemo((): MapMarkerInput[] => {
    if (!center) return [];

    const workerMarkers: MapMarkerInput[] = locatedWorkers.map((w) => ({
      id: w.id,
      variant: "worker" as const,
      position: { lat: Number(w.lat), lng: Number(w.lng) },
      popup: (
        <div className="text-sm space-y-0.5 min-w-[140px]">
          <p className="font-bold">{w.name}</p>
          <p className="capitalize text-muted-foreground">{w.category}</p>
          <p className="text-xs text-muted-foreground">
            📍 {calcDistance(center, { lat: Number(w.lat), lng: Number(w.lng) })} km away
          </p>
          {w.rating != null && w.rating > 0 && (
            <p className="text-xs">⭐ {w.rating.toFixed(1)}</p>
          )}
          {w.priceFrom != null && w.priceFrom > 0 && (
            <p className="text-xs font-medium">₹{w.priceFrom}+</p>
          )}
        </div>
      ),
    }));

    console.log("[MapPage] Markers built:", [
      { id: "me", lat: center.lat, lng: center.lng },
      ...workerMarkers.map((m) => ({ id: m.id, ...m.position })),
    ]);

    return [
      {
        id: "me",
        variant: "user" as const,
        position: center,
        popup: <div className="text-sm font-semibold">📍 You are here</div>,
      },
      ...workerMarkers,
    ];
  }, [center, locatedWorkers]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workers Near You</h1>
        {loading && (
          <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

        {/* LEFT: Filters + Worker list */}
        <div className="space-y-4">
          <MapFilters
            query={query}
            onQueryChange={setQuery}
            radiusKm={radius}
            onRadiusChange={setRadius}
            category={category}
            onCategoryChange={setCategory}
            categories={categories}
          />

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Nearby workers</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {filteredWorkers.length}
              </span>
            </div>

            <div className="max-h-[460px] overflow-y-auto divide-y divide-border">
              {filteredWorkers.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                  {loading ? "Searching…" : "No workers found nearby."}
                </p>
              ) : (
                <>
                  {/* Workers with a known map location */}
                  {locatedWorkers.map((w) => (
                    <WorkerListRow
                      key={w.id}
                      worker={w}
                      center={center}
                      hasLocation
                    />
                  ))}

                  {/* Workers that haven't set their coordinates yet */}
                  {unlocatedWorkers.length > 0 && (
                    <>
                      {locatedWorkers.length > 0 && (
                        <div className="px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wide font-semibold bg-secondary/30">
                          Location not shared
                        </div>
                      )}
                      {unlocatedWorkers.map((w) => (
                        <WorkerListRow
                          key={w.id}
                          worker={w}
                          center={center}
                          hasLocation={false}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Summary badge */}
          {!loading && filteredWorkers.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              📍 {locatedWorkers.length} on map · {unlocatedWorkers.length} without location
            </p>
          )}
        </div>

        {/* RIGHT: Google Map */}
        <div className="h-[600px] lg:h-[calc(100vh-200px)] rounded-2xl overflow-hidden border border-border">
          {center ? (
            <MapView center={center} markers={markers} radiusKm={radius} height="100%" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse text-sm">
              Getting your location…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-component: single worker row ──
function WorkerListRow({
  worker: w,
  center,
  hasLocation,
}: {
  worker: MapWorker;
  center: GeoPoint | null;
  hasLocation: boolean;
}) {
  const dist = hasLocation && center
    ? calcDistance(center, { lat: w.lat, lng: w.lng })
    : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
        {w.name?.charAt(0)?.toUpperCase() ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{w.name}</p>
        <p className="text-xs text-primary capitalize">{w.category}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {w.rating != null && w.rating > 0 && `⭐ ${w.rating.toFixed(1)}`}
          {dist !== null && ` · ${dist} km`}
          {!hasLocation && (
            <span className="inline-flex items-center gap-0.5 text-warning ml-1">
              <AlertCircle size={10} />
              No location
            </span>
          )}
        </p>
      </div>
      {hasLocation && (
        <MapPin size={14} className="text-primary opacity-60 flex-shrink-0" />
      )}
    </div>
  );
}