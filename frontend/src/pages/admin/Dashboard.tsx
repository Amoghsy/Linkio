import { useEffect, useState } from "react";
import { adminService, type AdminStats } from "@/services/adminService";
import { Users, Briefcase, ShieldCheck, UserPlus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  useEffect(() => { adminService.stats().then(setStats); }, []);
  if (!stats) return null;

  const cards = [
    { label: "Total users", value: stats.totalUsers.toLocaleString(), icon: Users, gradient: "bg-gradient-brand" },
    { label: "Total workers", value: stats.totalWorkers.toLocaleString(), icon: UserPlus, gradient: "bg-gradient-amber" },
    { label: "Total jobs", value: stats.totalJobs.toLocaleString(), icon: Briefcase, gradient: "bg-gradient-dark" },
    { label: "Pending verifications", value: stats.pendingVerifications, icon: ShieldCheck, gradient: "bg-gradient-brand" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">Platform health, at a glance.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
            <div className={`h-10 w-10 rounded-xl ${c.gradient} grid place-items-center text-primary-foreground`}>
              <c.icon size={18} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-4">Growth — last 6 months</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={stats.monthly}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(173 80% 45%)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(173 80% 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(38 95% 55%)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(38 95% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" name="New Jobs" dataKey="jobs" stroke="hsl(173 80% 45%)" strokeWidth={2} fill="url(#g1)" />
              <Area type="monotone" name="New Workers" dataKey="signups" stroke="hsl(38 95% 55%)" strokeWidth={2} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
