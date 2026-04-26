import { useEffect, useState } from "react";
import { jobService, type EarningsData } from "@/services/jobService";
import { useAuthStore } from "@/store/useAuthStore";
import { Wallet, Briefcase, TrendingUp } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

export default function Earnings() {
  const [data, setData] = useState<EarningsData | null>(null);
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    if (user?.id) {
      jobService.getEarnings(user.id).then(setData);
    }
  }, [user?.id]);
  if (!data) return null;

  const stats = [
    { label: "Total earnings", value: `₹${data.totalEarnings.toLocaleString()}`, icon: Wallet, gradient: "bg-gradient-brand" },
    { label: "Jobs completed", value: data.jobsCompleted, icon: Briefcase, gradient: "bg-gradient-amber" },
    { label: "This month", value: `₹${data.thisMonth.toLocaleString()}`, icon: TrendingUp, gradient: "bg-gradient-dark" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Earnings</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className={`h-10 w-10 rounded-xl ${s.gradient} grid place-items-center text-primary-foreground`}>
              <s.icon size={18} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-4">This week</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.weekly}>
              <defs>
                <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(173 80% 45%)" />
                  <stop offset="100%" stopColor="hsl(239 84% 62%)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip cursor={{ fill: "hsl(var(--secondary))" }} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="amount" fill="url(#bar)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <h2 className="p-5 font-semibold border-b border-border">Recent payouts</h2>
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-right p-3">Amount</th>
              <th className="text-right p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.history.map((h) => (
              <tr key={h.id} className="border-t border-border">
                <td className="p-3">{h.date}</td>
                <td className="p-3">{h.customer}</td>
                <td className="p-3 text-right font-semibold">₹{h.amount}</td>
                <td className="p-3 text-right">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                    h.status === "paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                  )}>{h.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
