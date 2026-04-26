import { useEffect, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { userService, type Worker } from "@/services/userService";
import { TrustScoreBadge } from "@/components/common/TrustScoreBadge";
import { RatingStars } from "@/components/common/RatingStars";
import { GradientButton } from "@/components/common/GradientButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGS } from "@/lib/i18n";
import { type GeoPoint } from "@/services/mapService";
import { locationService } from "@/services/locationService";

const ALL_SKILLS = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Carpentry",
  "Painting",
  "AC Repair",
  "Gardening",
  "Appliance",
  "Pipe fitting",
  "Leak repair",
  "Bathroom install",
  "Wiring",
  "Fan install",
  "Deep clean",
  "Emergency Worker",
];

export default function WorkerProfilePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("0");
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    userService
      .getWorker(user.id)
      .then((nextWorker) => {
        setWorker(nextWorker);
        setSkills(nextWorker.skills ?? []);
        setLanguages(nextWorker.languages && nextWorker.languages.length > 0 ? nextWorker.languages : ["en"]);
        setBio(nextWorker.bio ?? "");
        setExperience(String(nextWorker.experienceYears ?? 0));
        const loc = nextWorker.location ?? null;
        setLocation(loc);
        if (loc) {
          setManualLat(String(loc.lat));
          setManualLng(String(loc.lng));
        }
      })
      .catch(() => {
        setWorker(null);
        setSkills([]);
        setLanguages(["en"]);
        setBio("");
        setExperience("0");
        setLocation(null);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    try {
      const updatedWorker = await userService.updateWorker(user.id, {
        bio: bio.trim(),
        experienceYears: Number(experience) || 0,
        languages,
        skills,
      });
      setWorker(updatedWorker);
      setLocation(updatedWorker.location ?? location);
      toast({ title: "Profile saved" });
    } catch (error) {
      toast({
        title: "Failed to save profile",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const refreshLocation = async () => {
    if (!user?.id) return;

    setLocating(true);
    try {
      const currentLocation = await locationService.syncWorkerLocation(user.id);
      setLocation(currentLocation);
      setManualLat(String(currentLocation.lat));
      setManualLng(String(currentLocation.lng));
      setWorker((currentWorker) =>
        currentWorker
          ? { ...currentWorker, location: currentLocation, lat: currentLocation.lat, lng: currentLocation.lng }
          : currentWorker
      );
      toast({ title: "Location updated via GPS" });
    } catch (error) {
      toast({
        title: "Failed to update location",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLocating(false);
    }
  };

  const saveManualLocation = async () => {
    if (!user?.id) return;
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast({ title: "Invalid coordinates", description: "Please enter valid numbers for latitude and longitude.", variant: "destructive" });
      return;
    }
    setSavingLocation(true);
    try {
      await userService.updateWorker(user.id, { location: { lat, lng }, lat, lng });
      const newLoc = { lat, lng };
      setLocation(newLoc);
      setWorker((cw) => cw ? { ...cw, location: newLoc, lat, lng } : cw);
      toast({ title: "Location saved", description: `Set to ${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    } catch (error) {
      toast({ title: "Failed to save location", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSavingLocation(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl overflow-hidden border border-border">
        <div className="h-28 bg-gradient-brand" />
        <div className="p-6 -mt-12">
          <div className="flex items-end gap-4">
            <div className="h-24 w-24 rounded-2xl border-4 border-card bg-gradient-amber grid place-items-center text-accent-foreground font-bold text-3xl">
              {user?.name?.charAt(0) ?? "W"}
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              <div className="mt-1 flex items-center gap-3 flex-wrap">
                <RatingStars rating={worker?.rating ?? 0} />
                <TrustScoreBadge score={worker?.trustScore ?? 0} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={save} className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div>
          <Label>Years of experience</Label>
          <Input
            type="number"
            min={0}
            value={experience}
            onChange={(event) => setExperience(event.target.value)}
            className="mt-1.5 max-w-[160px]"
            disabled={loading || saving}
          />
        </div>

        <div>
          <Label>Bio</Label>
          <Textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className="mt-1.5"
            maxLength={400}
            disabled={loading || saving}
          />
        </div>

        <div>
          <Label>Skills</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {ALL_SKILLS.map((skill) => {
              const selected = skills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() =>
                    setSkills(
                      selected ? skills.filter((value) => value !== skill) : [...skills, skill]
                    )
                  }
                  disabled={loading || saving}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-base",
                    selected
                      ? "bg-gradient-brand text-primary-foreground border-transparent shadow-brand"
                      : "border-border hover:bg-secondary"
                  )}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label>Languages spoken</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {SUPPORTED_LANGS.map((language) => {
              const selected = languages.includes(language.value);
              return (
                <button
                  key={language.value}
                  type="button"
                  onClick={() =>
                    setLanguages(
                      selected
                        ? languages.filter((value) => value !== language.value)
                        : [...languages, language.value]
                    )
                  }
                  disabled={loading || saving}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-base",
                    selected
                      ? "bg-gradient-brand text-primary-foreground border-transparent shadow-brand"
                      : "border-border hover:bg-secondary"
                  )}
                >
                  {language.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background/60 p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                <MapPin size={15} />
                Current saved location
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {location
                  ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                  : "No current location has been saved yet."}
              </p>
            </div>
            <GradientButton
              type="button"
              variant="outline"
              onClick={refreshLocation}
              disabled={loading || saving || locating || savingLocation}
            >
              <LocateFixed size={15} />
              {locating ? "Detecting..." : "Use GPS"}
            </GradientButton>
          </div>

          {/* Manual coordinate editor */}
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">✏️ Or enter coordinates manually</p>
            <div className="flex items-end gap-2 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <Label className="text-xs">Latitude</Label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="e.g. 12.9716"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="mt-1 h-8 text-xs"
                  disabled={loading || saving || locating || savingLocation}
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <Label className="text-xs">Longitude</Label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="e.g. 77.5946"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  className="mt-1 h-8 text-xs"
                  disabled={loading || saving || locating || savingLocation}
                />
              </div>
              <GradientButton
                type="button"
                size="sm"
                onClick={saveManualLocation}
                disabled={loading || saving || locating || savingLocation || !manualLat || !manualLng}
              >
                {savingLocation ? "Saving..." : "Save"}
              </GradientButton>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Tip: You can find your coordinates on Google Maps by right-clicking your location.
            </p>
          </div>
        </div>

        <GradientButton type="submit" disabled={loading || saving}>
          {saving ? "Saving..." : "Save changes"}
        </GradientButton>
      </form>
    </div>
  );
}
