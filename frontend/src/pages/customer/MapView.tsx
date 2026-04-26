import {
  GoogleMap,
  Marker,
  InfoWindow,
  Circle,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";

export type MapMarkerInput = {
  id: string;
  position: { lat: number; lng: number };
  popup?: React.ReactNode;
  variant?: "user" | "worker";
};

type Props = {
  center: { lat: number; lng: number } | null;
  markers?: MapMarkerInput[];
  radiusKm?: number;
  height?: string;
};

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

// Check a position has valid, non-zero coords
const isValidPosition = (pos: { lat: number; lng: number } | undefined): pos is { lat: number; lng: number } =>
  pos != null &&
  Number.isFinite(pos.lat) &&
  Number.isFinite(pos.lng) &&
  !(pos.lat === 0 && pos.lng === 0);

const LIBRARIES: ["geometry", "routes"] = ["geometry", "routes"];

export default function MapView({
  center,
  markers = [],
  radiusKm = 10,
  height = "500px",
}: Props) {
  const [selected, setSelected] = useState<MapMarkerInput | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const safeCenter = {
    lat: Number(center?.lat ?? DEFAULT_CENTER.lat),
    lng: Number(center?.lng ?? DEFAULT_CENTER.lng),
  };

  const safeMarkers = useMemo(
    () => (Array.isArray(markers) ? markers : []),
    [markers]
  );

  const userMarker = safeMarkers.find((m) => m.variant === "user");
  const workerMarkers = safeMarkers.filter(
    (m) => m.variant === "worker" && isValidPosition(m.position)
  );

  // Auto-fit the map to encompass all valid markers
  const fitBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const validMarkers = safeMarkers.filter((m) => isValidPosition(m.position));
    if (validMarkers.length === 0) return;

    if (validMarkers.length === 1) {
      map.setCenter(validMarkers[0].position);
      map.setZoom(14);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    validMarkers.forEach((m) => bounds.extend(m.position));
    map.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
  }, [safeMarkers]);

  // Re-fit whenever the marker set changes (new workers loaded)
  useEffect(() => {
    if (isLoaded) fitBounds();
  }, [isLoaded, fitBounds]);

  const handleLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      fitBounds();
    },
    [fitBounds]
  );

  if (loadError)
    return (
      <div className="flex items-center justify-center h-full text-destructive text-sm gap-2">
        ❌ Map failed to load — check your API key
      </div>
    );

  if (!isLoaded)
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm animate-pulse">
        Loading map…
      </div>
    );

  return (
    <div style={{ width: "100%", height }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={safeCenter}
        zoom={13}
        onLoad={handleLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
          // Neutral map style — works in both light and dark UIs
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
          ],
        }}
      >
        {/* 🔵 CUSTOMER / USER MARKER */}
        {userMarker && isValidPosition(userMarker.position) && (
          <Marker
            position={userMarker.position}
            onClick={() => setSelected(userMarker)}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            title="You are here"
            zIndex={999}
          />
        )}

        {/* 🔴 WORKER MARKERS */}
        {workerMarkers.map((m) => (
          <Marker
            key={m.id}
            position={m.position}
            onClick={() => setSelected(m)}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
              scaledSize: new window.google.maps.Size(36, 36),
            }}
            title={`Worker: ${m.id}`}
          />
        ))}

        {/* 💬 INFO POPUP */}
        {selected && isValidPosition(selected.position) && (
          <InfoWindow
            position={selected.position}
            onCloseClick={() => setSelected(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -36) }}
          >
            <div style={{ minWidth: "160px", maxWidth: "240px", fontFamily: "inherit" }}>
              {selected.popup || (
                <span style={{ fontSize: 13, color: "#555" }}>No details</span>
              )}
            </div>
          </InfoWindow>
        )}

        {/* 🔵 RADIUS CIRCLE */}
        {radiusKm > 0 && isValidPosition(safeCenter) && (
          <Circle
            center={safeCenter}
            radius={radiusKm * 1000}
            options={{
              fillColor: "#4f46e5",
              fillOpacity: 0.07,
              strokeColor: "#4f46e5",
              strokeOpacity: 0.4,
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}