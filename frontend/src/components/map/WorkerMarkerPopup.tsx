import { Link } from "react-router-dom";
import type { MapWorker } from "@/services/mapService";
import { Star, MapPin, IndianRupee } from "lucide-react";
import { GradientButton } from "@/components/common/GradientButton";

interface Props {
  worker: MapWorker;
}

const WorkerMarkerPopup = ({ worker }: Props) => (
  <div className="w-56">
    <div className="flex items-center gap-3 mb-3">
      <img
        src={worker.avatar}
        alt={worker.name}
        className="h-11 w-11 rounded-xl bg-secondary flex-shrink-0"
      />
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate">{worker.name}</p>
        <p className="text-xs text-primary font-medium">{worker.category}</p>
      </div>
    </div>

    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
      <span className="flex items-center gap-1 font-medium text-warning">
        <Star className="h-3 w-3 fill-current" />
        {worker.rating}
      </span>
      <span className="flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        {worker.distanceKm} km
      </span>
      <span className="flex items-center gap-1 font-semibold text-foreground">
        <IndianRupee className="h-3 w-3" />
        {worker.priceFrom}+
      </span>
    </div>

    {!worker.available && (
      <p className="text-xs text-muted-foreground mb-2 text-center">
        Currently unavailable
      </p>
    )}

    <GradientButton size="sm" className="w-full" asChild disabled={!worker.available}>
      <Link to={`/app/worker/${worker.id}`}>
        {worker.available ? "View & Book" : "Unavailable"}
      </Link>
    </GradientButton>
  </div>
);

export default WorkerMarkerPopup;
