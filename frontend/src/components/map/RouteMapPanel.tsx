import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Clock,
  MapPin,
  Navigation,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import type { Job } from "@/services/jobService";

interface GeoPoint {
  lat: number;
  lng: number;
}

interface Props {
  job: Job;
  workerLocation: GeoPoint;
  onClose?: () => void;
}

// Libraries array kept outside component to avoid re-renders
const LIBRARIES: ["geometry", "routes"] = ["geometry", "routes"];

const WORKER_ICON = {
  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  scaledSize: undefined as any, // set after isLoaded
};

const CUSTOMER_ICON = {
  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
  scaledSize: undefined as any,
};

function isValidCoord(v: number | undefined | null): v is number {
  return typeof v === "number" && Number.isFinite(v) && !(v === 0);
}

export default function RouteMapPanel({ job, workerLocation, onClose }: Props) {
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [dirError, setDirError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const hasWorkerCoords =
    isValidCoord(workerLocation?.lat) && isValidCoord(workerLocation?.lng);
  const hasCustomerCoords =
    isValidCoord(job.customerLat) && isValidCoord(job.customerLng);

  const origin: GeoPoint = hasWorkerCoords
    ? workerLocation
    : { lat: 12.9716, lng: 77.5946 };

  const destination: GeoPoint | null =
    hasCustomerCoords
      ? { lat: job.customerLat!, lng: job.customerLng! }
      : null;

  // Fetch directions once map is loaded
  useEffect(() => {
    if (!isLoaded || !destination) return;

    setFetching(true);
    setDirError(null);

    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
      },
      (result, status) => {
        setFetching(false);
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          setDirError(
            status === "REQUEST_DENIED"
              ? "Directions API not enabled — enable it in the Google Cloud Console."
              : `Could not get route (${status}). Showing pin locations instead.`
          );
        }
      }
    );
  }, [isLoaded, origin.lat, origin.lng, destination?.lat, destination?.lng]);

  const handleLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Leg info
  const leg = directions?.routes?.[0]?.legs?.[0];
  const distanceText = leg?.distance?.text ?? null;
  const durationText = leg?.duration?.text ?? null;

  // Map center: midpoint between origin and dest (or just origin)
  const mapCenter: GeoPoint = destination
    ? {
        lat: (origin.lat + destination.lat) / 2,
        lng: (origin.lng + destination.lng) / 2,
      }
    : origin;

  if (loadError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 flex items-center gap-3 text-sm text-destructive">
        <AlertTriangle size={16} className="shrink-0" />
        Maps failed to load — check your API key.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-brand grid place-items-center text-primary-foreground shrink-0">
            <Navigation size={15} />
          </div>
          <div>
            <p className="font-semibold text-sm">Route to customer</p>
            <p className="text-xs text-muted-foreground truncate max-w-[220px]">
              {job.customerName ?? "Customer"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* ETA + Distance pills */}
          {durationText && (
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              <Clock size={11} />
              {durationText}
            </span>
          )}
          {distanceText && (
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
              <MapPin size={11} />
              {distanceText}
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground"
              aria-label="Close route"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Missing coords warning */}
      {!hasCustomerCoords && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-warning/10 text-warning text-xs font-medium border-b border-warning/20">
          <AlertTriangle size={13} className="shrink-0" />
          Customer has no saved location — route unavailable. Showing your position only.
        </div>
      )}
      {!hasWorkerCoords && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-warning/10 text-warning text-xs font-medium border-b border-warning/20">
          <AlertTriangle size={13} className="shrink-0" />
          Your location isn't saved — update it in your Profile to get accurate routing.
        </div>
      )}
      {dirError && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-destructive/10 text-destructive text-xs font-medium border-b border-destructive/20">
          <AlertTriangle size={13} className="shrink-0" />
          {dirError}
        </div>
      )}

      {/* Map */}
      <div className="relative h-[360px]">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary text-muted-foreground text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading map…
          </div>
        )}

        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={mapCenter}
            zoom={destination ? 12 : 14}
            onLoad={handleLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              zoomControl: true,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }],
                },
              ],
            }}
          >
            {/* Worker pin (blue) */}
            {!fetching && !directions && (
              <Marker
                position={origin}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
                title="Your location"
                zIndex={100}
              />
            )}

            {/* Customer pin (red) — only if no route line */}
            {!fetching && !directions && destination && (
              <Marker
                position={destination}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
                title={`${job.customerName ?? "Customer"}`}
                zIndex={99}
              />
            )}

            {/* Directions route (replaces individual markers with A/B markers) */}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: false,
                  polylineOptions: {
                    strokeColor: "#4f46e5",
                    strokeWeight: 5,
                    strokeOpacity: 0.85,
                  },
                }}
              />
            )}
          </GoogleMap>
        )}

        {/* Fetching overlay */}
        {fetching && isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Calculating route…
            </div>
          </div>
        )}
      </div>

      {/* Footer: job details */}
      <div className="px-5 py-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="font-medium text-foreground capitalize">{job.category}</span>
        <span>📅 {job.date} {job.time}</span>
        <span className="font-semibold text-foreground">₹{job.price}</span>
        {job.distanceKm != null && job.distanceKm > 0 && (
          <span>📍 {job.distanceKm} km (straight-line)</span>
        )}
      </div>
    </div>
  );
}
