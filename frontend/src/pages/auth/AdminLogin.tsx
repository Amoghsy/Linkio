import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/common/Logo";
import { GradientButton } from "@/components/common/GradientButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";
import { loginSchema } from "@/lib/validation";
import { ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.errors.forEach((er) => { fe[er.path[0] as string] = er.message; });
      setErrors(fe);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await authService.login(email, password, "admin");
      setAuth(res.user, res.token);
      navigate("/admin/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-hero p-6">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-elegant p-8">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-dark text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={12} /> Admin Portal
          </span>
        </div>
        <h1 className="mt-6 text-2xl font-bold">Restricted access</h1>
        <p className="mt-1 text-sm text-muted-foreground">Authorized administrators only.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label>Admin email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
          </div>
          <GradientButton type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Enter Admin Portal"}
          </GradientButton>
        </form>
      </div>
    </div>
  );
}
