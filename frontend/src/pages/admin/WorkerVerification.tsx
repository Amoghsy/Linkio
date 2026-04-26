import { useEffect, useState } from "react";
import { adminService, type VerificationRow } from "@/services/adminService";
import { userService } from "@/services/userService";
import { GradientButton } from "@/components/common/GradientButton";
import { Check, X, FileText, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function WorkerVerification() {
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const { toast } = useToast();

  useEffect(() => { adminService.verifications().then(setRows); }, []);

  const decide = async (id: string, decision: "approve" | "reject") => {
    await adminService.decide(id, decision);
    setRows((r) => r.map((x) => x.id === id ? { ...x, verified: decision === "approve" } : x));
    toast({ title: `Worker ${decision}d` });
  };

  const deleteWorker = async (id: string) => {
    if (!confirm("Are you sure you want to delete this worker? This action cannot be undone.")) return;
    try {
      await adminService.deleteWorker(id);
      setRows((r) => r.filter((x) => x.id !== id));
      toast({ title: "Worker deleted successfully" });
    } catch (err) {
      toast({ title: "Failed to delete worker", variant: "destructive" });
    }
  };

  const updateFare = async (id: string, priceFrom: number, priceTo: number) => {
    try {
      await adminService.updateFare(id, priceFrom, priceTo);
      toast({ title: "Fare range updated successfully" });
    } catch (err) {
      toast({ title: "Failed to update fare", variant: "destructive" });
    }
  };

  const updateLocation = async (id: string, latStr: string, lngStr: string) => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast({ title: "Invalid coordinates", variant: "destructive" });
      return;
    }
    try {
      await userService.updateWorker(id, { location: { lat, lng }, lat, lng });
      setRows((prev) => prev.map((x) => x.id === id ? { ...x, lat, lng } : x));
      toast({ title: "Location updated", description: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    } catch {
      toast({ title: "Failed to update location", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Worker verifications</h1>
        <p className="text-sm text-muted-foreground">Review submitted documents and approve trustworthy workers.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-4">Worker</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Fare Range (₹)</th>
              <th className="text-left p-4">Location (lat, lng)</th>
              <th className="text-left p-4">Documents</th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                <td className="p-4 font-semibold">{r.name}</td>
                <td className="p-4">{r.category}</td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      className="w-16 h-8 rounded-md border border-border bg-card px-2 text-xs focus:outline-none focus:border-primary"
                      value={r.priceFrom || 0}
                      onChange={(e) => setRows(rows.map(x => x.id === r.id ? { ...x, priceFrom: Number(e.target.value) } : x))}
                    />
                    <span className="text-muted-foreground">-</span>
                    <input
                      type="number"
                      className="w-16 h-8 rounded-md border border-border bg-card px-2 text-xs focus:outline-none focus:border-primary"
                      value={r.priceTo || 0}
                      onChange={(e) => setRows(rows.map(x => x.id === r.id ? { ...x, priceTo: Number(e.target.value) } : x))}
                    />
                    <button 
                      onClick={() => updateFare(r.id, r.priceFrom || 0, r.priceTo || 0)}
                      className="text-[10px] text-primary-foreground bg-primary px-2 py-1 rounded-md font-medium hover:brightness-110 ml-2 transition-all"
                    >
                      Save
                    </button>
                  </div>
                </td>
                {/* ── Location editor ── */}
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-muted-foreground shrink-0" />
                    <input
                      type="number"
                      step="0.00001"
                      placeholder="lat"
                      className="w-20 h-8 rounded-md border border-border bg-card px-2 text-xs focus:outline-none focus:border-primary"
                      value={(r as any).lat ?? ""}
                      onChange={(e) => setRows(rows.map(x => x.id === r.id ? { ...x, lat: e.target.value } as any : x))}
                    />
                    <input
                      type="number"
                      step="0.00001"
                      placeholder="lng"
                      className="w-20 h-8 rounded-md border border-border bg-card px-2 text-xs focus:outline-none focus:border-primary"
                      value={(r as any).lng ?? ""}
                      onChange={(e) => setRows(rows.map(x => x.id === r.id ? { ...x, lng: e.target.value } as any : x))}
                    />
                    <button
                      onClick={() => updateLocation(r.id, String((r as any).lat ?? ""), String((r as any).lng ?? ""))}
                      className="text-[10px] text-primary-foreground bg-primary px-2 py-1 rounded-md font-medium hover:brightness-110 ml-1 transition-all"
                    >
                      Set
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {r.documents?.map((d) => (
                      <button key={d} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-gradient-brand-soft text-primary font-medium hover:brightness-95">
                        <FileText size={12} /> {d}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold capitalize",
                    !r.verified && "bg-warning/15 text-warning",
                    r.verified && "bg-success/15 text-success"
                  )}>
                    {r.verified ? "approved" : "pending"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2 items-center">
                    {!r.verified ? (
                      <>
                        <GradientButton variant="outline" size="sm" onClick={() => decide(r.id, "reject")}>
                          <X size={14} /> Reject
                        </GradientButton>
                        <GradientButton size="sm" onClick={() => decide(r.id, "approve")}>
                          <Check size={14} /> Approve
                        </GradientButton>
                      </>
                    ) : (
                      <p className="text-right text-xs text-muted-foreground mr-2">Done</p>
                    )}
                    <button 
                      onClick={() => deleteWorker(r.id)}
                      className="text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors ml-2"
                      title="Delete worker"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
