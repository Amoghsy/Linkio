import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { GradientButton } from "@/components/common/GradientButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService, type Role } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";
import { loginSchema } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Login() {
  const [role, setRole] = useState<Role>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      const res = await authService.login(email, password, role);
      setAuth(res.user, res.token);
      toast({ title: `Welcome back, ${res.user.name.split(" ")[0]}!` });
      navigate(role === "worker" ? "/worker/dashboard" : "/app/search");
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const res = await authService.loginWithGoogle(role);
      setAuth(res.user, res.token);
      navigate(role === "worker" ? "/worker/dashboard" : "/app/search");
    } catch (error) {
      toast({
        title: "Google sign in failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue to Linkio."
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
        </>
      }
    >
      {/* Role selector */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-secondary mb-6">
        {(["customer", "worker"] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "h-10 rounded-lg text-sm font-semibold capitalize transition-base",
              role === r ? "bg-gradient-brand text-primary-foreground shadow-brand" : "text-muted-foreground"
            )}
          >
            I'm a {r}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button type="button" className="text-xs text-primary font-medium hover:underline">Forgot?</button>
          </div>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
        </div>

        <GradientButton type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </GradientButton>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <GoogleButton onClick={handleGoogle} />
      </form>
    </AuthCard>
  );
}
