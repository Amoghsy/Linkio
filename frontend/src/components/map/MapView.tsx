import { useEffect, useRef, useState, type ReactNode } from "react";
import type { GeoPoint } from "@/services/mapService";

export interface MapMarkerInput {
  id: string;
  position: GeoPoint;
  variant: "user" | "worker";
  popup?: ReactNode;
}

interface Props {
  center: GeoPoint;
  markers: MapMarkerInput[];
  radiusKm?: number;
  height?: string;
  zoom?: number;
}

/** Converts geo coords to pixel offsets relative to the map center. */
function geoToPixel(
  point: GeoPoint,
  center: GeoPoint,
  zoom: number,
  mapW: number,
  mapH: number
): { x: number; y: number } {
  // Mercator scale at this zoom: 256 * 2^zoom px / 360° for lng, slightly different for lat
  const scale = 256 * Math.pow(2, zoom);
  const dLng = point.lng - center.lng;
  const dLat = point.lat - center.lat;

  // Linear approximation (good for small areas)
  const x = mapW / 2 + (dLng / 360) * scale;
  const latRad = (center.lat * Math.PI) / 180;
  const y = mapH / 2 - (dLat / 360) * scale * (1 / Math.cos(latRad)) * 1.8;
  return { x, y };
}

/** Derive the OSM tile URL for the center + zoom. */
function osmSrc(lat: number, lng: number, zoom: number) {
  const bbox = 0.08 / Math.pow(2, zoom - 13);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - bbox},${lat - bbox},${lng + bbox},${lat + bbox}&layer=mapnik&marker=${lat},${lng}`;
}

const MapView = ({ center, markers, radiusKm = 10, height = "520px", zoom = 13 }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 520 });
  const [activePopup, setActivePopup] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDims({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Close popup when clicking elsewhere
  useEffect(() => {
    const handler = () => setActivePopup(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const src = osmSrc(center.lat, center.lng, zoom);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden border border-border shadow-elegant"
      style={{ height }}
    >
      {/* OSM base map */}
      <iframe
        title="map"
        src={src}
        className="absolute inset-0 w-full h-full"
        style={{ border: "none", pointerEvents: "auto" }}
        loading="lazy"
      />

      {/* Marker overlay — sits above the iframe via a transparent pointer-events layer */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" overflow="visible">
          {/* Radius circle */}
          {(() => {
            const c = geoToPixel(center, center, zoom, dims.w, dims.h);
            // Roughly: 1 degree lat ≈ 111 km, so radiusKm in pixels:
            const latRad = (center.lat * Math.PI) / 180;
            const scale = 256 * Math.pow(2, zoom);
            const rPx = (radiusKm / 111) * (scale / 360) * (1 / Math.cos(latRad)) * 1.8;
            return (
              <circle
                cx={c.x}
                cy={c.y}
                r={rPx}
                fill="hsl(173 80% 36% / 0.08)"
                stroke="hsl(173 80% 36% / 0.35)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
            );
          })()}
        </svg>

        {/* Markers */}
        {markers.map((m) => {
          const { x, y } = geoToPixel(m.position, center, zoom, dims.w, dims.h);
          const isUser = m.variant === "user";
          const isActive = activePopup === m.id;
          return (
            <div
              key={m.id}
              className="absolute pointer-events-auto"
              style={{ left: x, top: y, transform: "translate(-50%, -100%)" }}
            >
              {/* Pin */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePopup(isActive ? null : m.id);
                }}
                className={`flex flex-col items-center gap-0 focus:outline-none group`}
                aria-label={isUser ? "Your location" : "Worker"}
              >
                <div
                  className={`
                    flex items-center justify-center rounded-full border-2 border-white shadow-lg transition-base
                    ${isUser
                      ? "h-9 w-9 bg-gradient-brand text-white"
                      : "h-8 w-8 bg-white hover:scale-110 group-hover:shadow-brand"
                    }
                  `}
                >
                  {isUser ? (
                    <span className="text-[10px] font-bold">YOU</span>
                  ) : (
                    <span className="text-[10px] font-bold text-primary">W</span>
                  )}
                </div>
                {/* Stem */}
                <div
                  className={`w-0.5 h-2 ${isUser ? "bg-primary" : "bg-border"}`}
                />
              </button>

              {/* Popup */}
              {isActive && m.popup && (
                <div
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-60 rounded-2xl border border-border bg-card shadow-elegant p-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {m.popup}
                  {/* Arrow */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-r border-b border-border bg-card" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Attribution overlay */}
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-card/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border">
        © OpenStreetMap contributors
      </div>
    </div>
  );
};

export type { Props as MapViewProps };
export default MapView;
