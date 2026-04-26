import { useEffect, useState } from "react";
import { Loader2, Navigation, Wifi, WifiOff } from "lucide-react";
import { type GeoPoint } from "@/services/mapService";
import { useAuthStore } from "@/store/useAuthStore";
import { userService } from "@/services/userService";
import { locationService } from "@/services/locationService";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const LIBRARIES: ["geometry", "routes"] = ["geometry", "routes"];

const WorkerMapPanel = () => {
  const { user } = useAuthStore();
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [available, setAvailable] = useState(true);
  const [locating, setLocating] = useState(true);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  useEffect(() => {
    let active = true;

    const loadPanel = async () => {
      if (!user?.id) {
        if (active) setLocating(false);
        return;
      }

      try {
        const [worker, currentLocation] = await Promise.all([
          userService.getWorker(user.id).catch(() => null),
          locationService.syncWorkerLocation(user.id).catch(() => null),
        ]);

        if (!active) return;

        setAvailable(worker?.availability ?? true);
        setLocation(currentLocation ?? worker?.location ?? null);
      } finally {
        if (active) {
          setLocating(false);
        }
      }
    };

    void loadPanel();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const toggleAvailability = async () => {
    if (!user?.id) return;

    const nextAvailability = !available;
    setAvailable(nextAvailability);

    try {
      await userService.updateWorkerAvailability(user.id, nextAvailability);
    } catch {
      setAvailable(!nextAvailability);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden mb-6">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-brand grid place-items-center text-primary-foreground">
            <Navigation size={15} />
          </div>
          <div>
            <p className="font-semibold text-sm">Your location</p>
            {location ? (
              <p className="text-xs text-muted-foreground">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Detecting...</p>
            )}
          </div>
        </div>

        <button
          onClick={toggleAvailability}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-base border ${available
            ? "bg-success/10 text-success border-success/30 hover:bg-success/20"
            : "bg-muted text-muted-foreground border-border hover:bg-secondary"
            }`}
        >
          {available ? (
            <>
              <Wifi size={13} />
              Available
            </>
          ) : (
            <>
              <WifiOff size={13} />
              Offline
            </>
          )}
        </button>
      </div>

      <div className="relative h-[180px] bg-secondary">
        {locating || !isLoaded ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">Loading map...</span>
          </div>
        ) : location ? (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={location}
            zoom={15}
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
            <Marker
              position={location}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              title="Your location"
            />
          </GoogleMap>
        ) : null}

        {!available && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <WifiOff className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-medium text-muted-foreground">You are offline</p>
              <p className="text-xs text-muted-foreground">Customers cannot find you</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerMapPanel;
