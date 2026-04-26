import { Link } from "react-router-dom";
import { type Worker } from "@/services/userService";
import { RatingStars } from "@/components/common/RatingStars";
import { TrustScoreBadge } from "@/components/common/TrustScoreBadge";
import { GradientButton } from "@/components/common/GradientButton";
import { MapPin, Zap } from "lucide-react";
import { SUPPORTED_LANGS } from "@/lib/i18n";

export const WorkerCard = ({ worker }: { worker: Worker }) => (
  <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-elegant hover:border-primary/30 transition-base">
    <div className="flex items-start gap-4">
      <img src={worker.avatar} alt={worker.name} className="h-14 w-14 rounded-2xl bg-secondary" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold truncate">{worker.name}</h3>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-brand-soft text-primary font-medium capitalize">
                {worker.category}
              </span>
              {(worker.category?.toLowerCase() === "emergency worker" || (worker.skills && worker.skills.some(s => s.toLowerCase() === "emergency worker"))) && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-bold flex items-center gap-1 uppercase">
                  <Zap size={10} className="fill-current" /> Emergency
                </span>
              )}
            </div>
          </div>
          {worker.verified && <TrustScoreBadge score={worker.trustScore} />}
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          <RatingStars rating={worker.rating} />
          <span className="inline-flex items-center gap-1"><MapPin size={12} /> {worker.distanceKm} km</span>
        </div>
        <div className="mt-1.5 flex flex-col gap-0.5 text-xs text-muted-foreground bg-secondary/30 p-2 rounded-lg mt-2">
          <p>
            <span className="font-semibold text-foreground/80">Languages:</span>{" "}
            {worker.languages && worker.languages.length > 0 
              ? worker.languages.map(code => SUPPORTED_LANGS.find(l => l.value === code)?.label || code).join(", ") 
              : "English"}
          </p>
          <p>
            <span className="font-semibold text-foreground/80">Location:</span>{" "}
            {worker.locationLabel ? worker.locationLabel : worker.location ? `${worker.location.lat.toFixed(3)}, ${worker.location.lng.toFixed(3)}` : "Not specified"}
          </p>
          <p>
            <span className="font-semibold text-foreground/80">Phone:</span>{" "}
            {worker.phone || "Not provided"}
          </p>
        </div>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-1.5">
      {worker.skills.slice(0, 3).map((s, idx) => (
        <span key={`${s}-${idx}`} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{s}</span>
      ))}
    </div>

    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm">
        <span className="font-bold text-foreground">₹{worker.priceFrom}</span>
        <span className="text-muted-foreground"> – ₹{worker.priceTo}</span>
      </p>
      <GradientButton size="sm" asChild>
        <Link to={`/app/worker/${worker.id}`}>View Profile</Link>
      </GradientButton>
    </div>
  </div>
);
