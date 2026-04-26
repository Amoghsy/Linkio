import { useEffect, useState, useMemo } from "react";
import { Search as SearchIcon, Zap } from "lucide-react";
import { useWorkerStore } from "@/store/useWorkerStore";
import { useAppStore } from "@/store/useAppStore";
import { WorkerCard } from "@/components/workers/WorkerCard";
import { WorkerCardSkeleton } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { VoiceInput } from "@/components/common/VoiceInput";
import { GradientButton } from "@/components/common/GradientButton";
import { demandService, type DemandItem } from "@/services/demandService";
import { mapService, type GeoPoint } from "@/services/mapService";
import { t, SUPPORTED_LANGS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DEMAND_COLORS: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-amber-500/10 text-amber-600 border-amber-400/30",
  low: "bg-success/10 text-success border-success/30",
};

/* =========================
   🔥 SMART SEARCH LOGIC
========================= */

// Normalize user query → category
const normalizeQuery = (input: string) => {
  const q = input.toLowerCase();

  if (q.includes("plumb") || q.includes("pipe") || q.includes("leak")) return "plumber";
  if (q.includes("electric") || q.includes("wire") || q.includes("switch")) return "electrician";
  if (q.includes("carpent") || q.includes("wood") || q.includes("furniture")) return "carpenter";
  if (q.includes("cook") || q.includes("chef") || q.includes("food")) return "cook";
  if (q.includes("clean") || q.includes("housekeeping")) return "cleaner";
  if (q.includes("repair") || q.includes("tech") || q.includes("ac") || q.includes("fridge")) return "technician";
  if (q.includes("emergency") || q.includes("urgent") || q.includes("ambulance")) return "emergency worker";

  return input; // fallback
};

export default function Search() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [demand, setDemand] = useState<DemandItem[]>([]);
  const [demandLoading, setDemandLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const {
    workers,
    loading,
    error,
    searchWorkers,
    emergency,
    setLanguage,
    setEmergency,
  } = useWorkerStore();

  const { language: uiLang, setLanguage: setUiLang } = useAppStore();

  useEffect(() => {
    demandService.getDemandPrediction().then((items) => {
      setDemand(items);
      setDemandLoading(false);
    });
  }, []);

  useEffect(() => {
    mapService.getCurrentLocation().then(setLocation);
  }, []);

  useEffect(() => {
    void searchWorkers({});
  }, [searchWorkers]);

  /* =========================
     🔍 CLIENT-SIDE FILTER LOGIC
     Filters the workers list in real-time as the user types.
     Backend searchWorkers is only called on form submit / chip click.
  ========================= */
  const filteredWorkers = useMemo(() => {
    const searchTerm = q.trim().toLowerCase();

    // No filters active → return everything from last backend fetch
    if (!searchTerm && !selectedLanguage) return workers;

    const normalizedCategory = searchTerm ? normalizeQuery(searchTerm) : "";

    return workers.filter((worker) => {
      // --- Text matching ---
      let textMatch = true;

      if (searchTerm) {
        // 1. Category match via normalizeQuery (e.g. "pipe leak" → "plumber")
        const categoryMatch =
          normalizedCategory &&
          worker.category?.toLowerCase().includes(normalizedCategory.toLowerCase());

        // 2. Direct name match
        const nameMatch = worker.name?.toLowerCase().includes(searchTerm);

        // 3. Skills array match
        const skillsMatch = (worker.skills as string[] | undefined)?.some((s) =>
          s.toLowerCase().includes(searchTerm)
        );

        // 4. Raw category text match (e.g. user types "electrician" directly)
        const rawCategoryMatch = worker.category?.toLowerCase().includes(searchTerm);

        // 5. Bio / description match (optional — safe if field doesn't exist)
        const bioMatch = worker.bio?.toLowerCase().includes(searchTerm);

        textMatch = !!(categoryMatch || nameMatch || skillsMatch || rawCategoryMatch || bioMatch);
      }

      // --- Language filter ---
      const languageMatch =
        !selectedLanguage ||
        (worker.languages as string[] | undefined)?.some((l) =>
          l.toLowerCase().includes(selectedLanguage.toLowerCase())
        );

      // --- Emergency filter ---
      const emergencyMatch =
        !emergency ||
        worker.category?.toLowerCase() === "emergency worker" ||
        (worker.skills as string[] | undefined)?.some((s) =>
          s.toLowerCase() === "emergency worker"
        );

      return textMatch && !!languageMatch && !!emergencyMatch;
    });
  }, [workers, q, selectedLanguage, emergency]);

  /* =========================
     🚀 BACKEND SEARCH FUNCTION
     Called only on submit / demand chip click.
  ========================= */
  const runSearch = async (queryOverride?: string) => {
    let query = (queryOverride ?? q).trim();

    let category = "";
    if (query) {
      try {
        category = normalizeQuery(query);
      } catch (err) {
        console.warn("Normalization failed, using fallback");
        category = normalizeQuery(query);
      }
    }

    const filters: any = {
      ...(category && { category }),
      ...(selectedLanguage && { language: selectedLanguage }),
      ...(emergency && { emergency: true }),
      ...(location && { lat: location.lat, lng: location.lng }),
    };

    console.log("Filters sent:", filters);

    setLanguage(selectedLanguage);

    await searchWorkers(filters);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await runSearch();
  };

  const handleAiMatch = (query: string) => {
    setQ(query.trim());
  };

  const handleEmergencyToggle = () => {
    const next = !emergency;
    setEmergency(next);
  };

  return (
    <div>
      <div className="rounded-3xl bg-gradient-brand-soft p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{t("search.title", uiLang)}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("search.subtitle", uiLang)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={uiLang}
              onChange={(e) => {
                const lang = e.target.value as typeof uiLang;
                setUiLang(lang);
                setSelectedLanguage(lang === "en" ? "" : lang);
              }}
              className="h-10 rounded-xl border px-3 text-sm"
            >
              {SUPPORTED_LANGS.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleEmergencyToggle}
              className={cn(
                "h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 border",
                emergency
                  ? "bg-destructive text-white"
                  : "bg-card text-muted-foreground"
              )}
            >
              <Zap size={15} />
              Emergency
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-4 flex items-center gap-3 flex-wrap"
        >
          <div className="flex-1 min-w-[280px] relative">
            <SearchIcon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try: plumber, pipe leak, wiring issue..."
              className="w-full h-14 pl-12 pr-4 rounded-2xl border text-sm"
            />
          </div>



          <VoiceInput onAiMatch={handleAiMatch} />
        </form>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {demandLoading ? (
          <div>Loading...</div>
        ) : (
          demand.map((item) => (
            <button
              key={item.service}
              onClick={() => {
                setQ(item.service);
                void runSearch(item.service);
              }}
              className={cn(
                "px-3 py-1 rounded-full text-xs border",
                DEMAND_COLORS[item.level]
              )}
            >
              {item.service}
            </button>
          ))
        )}
      </div>

      <div>
        {error && <div className="text-red-500">{error}</div>}

        <p className="text-sm mb-4">
          {loading
            ? "Searching..."
            : `${filteredWorkers.length} worker${filteredWorkers.length !== 1 ? "s" : ""} nearby`}
        </p>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <WorkerCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title="No workers found"
            description="Try a different service like plumber, electrician, etc."
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredWorkers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}