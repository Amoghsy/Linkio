import { Search, SlidersHorizontal } from "lucide-react";

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  radiusKm: number;
  onRadiusChange: (v: number) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  categories: string[];
}

const RADIUS_OPTIONS = [2, 5, 10, 20, 50];

const MapFilters = ({
  query,
  onQueryChange,
  radiusKm,
  onRadiusChange,
  category,
  onCategoryChange,
  categories,
}: Props) => (
  <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
    {/* Search */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Name or skill…"
        className="w-full h-10 pl-9 pr-3 rounded-xl bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
      />
    </div>

    {/* Radius */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Radius
        </label>
        <span className="text-xs font-bold text-primary">{radiusKm} km</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {RADIUS_OPTIONS.map((r) => (
          <button
            key={r}
            onClick={() => onRadiusChange(r)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-base ${
              radiusKm === r
                ? "bg-gradient-brand text-primary-foreground shadow-brand"
                : "bg-secondary text-foreground hover:bg-primary/10"
            }`}
          >
            {r} km
          </button>
        ))}
      </div>
    </div>

    {/* Category */}
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">Category</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onCategoryChange("all")}
          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-base ${
            category === "all"
              ? "bg-gradient-brand text-primary-foreground"
              : "bg-secondary text-foreground hover:bg-primary/10"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => onCategoryChange(c)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-base ${
              category === c
                ? "bg-gradient-brand text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-primary/10"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default MapFilters;
