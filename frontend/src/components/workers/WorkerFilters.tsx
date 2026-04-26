import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";
import { SUPPORTED_LANGS, t, type Lang } from "@/lib/i18n";

export interface FilterState {
  maxDistance: number;
  minRating: number;
  maxPrice: number;
  language?: string;
  emergency?: boolean;
}

interface WorkerFiltersProps {
  value: FilterState;
  onChange: (v: FilterState) => void;
  /** Current UI language for translating filter labels */
  uiLang?: Lang;
}

export const WorkerFilters = ({ value, onChange, uiLang = "en" }: WorkerFiltersProps) => (
  <div className="rounded-2xl border border-border bg-card p-5 space-y-6">
    <h3 className="font-semibold">Filters</h3>

    {/* Distance */}
    <div>
      <div className="flex items-center justify-between">
        <Label>Max distance</Label>
        <span className="text-sm font-semibold text-primary">{value.maxDistance} km</span>
      </div>
      <Slider
        className="mt-3"
        min={1}
        max={20}
        step={1}
        value={[value.maxDistance]}
        onValueChange={([v]) => onChange({ ...value, maxDistance: v })}
      />
    </div>

    {/* Rating */}
    <div>
      <div className="flex items-center justify-between">
        <Label>Min rating</Label>
        <span className="text-sm font-semibold text-primary">{value.minRating.toFixed(1)} ★</span>
      </div>
      <Slider
        className="mt-3"
        min={0}
        max={5}
        step={0.5}
        value={[value.minRating]}
        onValueChange={([v]) => onChange({ ...value, minRating: v })}
      />
    </div>

    {/* Price */}
    <div>
      <div className="flex items-center justify-between">
        <Label>Max price (₹)</Label>
        <span className="text-sm font-semibold text-primary">₹{value.maxPrice}</span>
      </div>
      <Slider
        className="mt-3"
        min={100}
        max={3000}
        step={100}
        value={[value.maxPrice]}
        onValueChange={([v]) => onChange({ ...value, maxPrice: v })}
      />
    </div>

    {/* Language */}
    <div>
      <Label>{t("filter.language", uiLang)}</Label>
      <select
        value={value.language ?? ""}
        onChange={(e) => onChange({ ...value, language: e.target.value || undefined })}
        className="mt-2 w-full h-10 rounded-xl border border-border bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Any language</option>
        {SUPPORTED_LANGS.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>
    </div>

    {/* Emergency toggle */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} className={value.emergency ? "text-destructive" : "text-muted-foreground"} />
        <Label htmlFor="emergency-filter" className="cursor-pointer">
          {t("filter.emergency", uiLang)}
        </Label>
      </div>
      <Switch
        id="emergency-filter"
        checked={!!value.emergency}
        onCheckedChange={(checked) => onChange({ ...value, emergency: checked })}
      />
    </div>
  </div>
);
