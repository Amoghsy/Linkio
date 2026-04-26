import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { GradientButton } from "@/components/common/GradientButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";
import { customerSignupSchema, workerSignupSchema } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGS } from "@/lib/i18n";

const SKILLS = ["Plumbing", "Electrical", "Cleaning", "Carpentry", "Painting", "AC Repair", "Gardening", "Appliance", "Emergency Worker"];

export default function Signup() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Customer state
  const [c, setC] = useState({ name: "", phone: "", email: "", password: "" });
  const [cErr, setCErr] = useState<Record<string, string>>({});

  // Worker state
  const [w, setW] = useState({ name: "", phone: "", email: "", password: "", dob: "", experience: "" });
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [doc, setDoc] = useState<File | null>(null);
  const [wErr, setWErr] = useState<Record<string, string>>({});

  const submitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customerSignupSchema.safeParse(c);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.errors.forEach((er) => { fe[er.path[0] as string] = er.message; });
      setCErr(fe);
      return;
    }
    setCErr({});
    try {
      const res = await authService.signup({ ...parsed.data, role: "customer", email: parsed.data.email, password: parsed.data.password, name: parsed.data.name });
      setAuth(res.user, res.token);
      toast({ title: "Account created!" });
      navigate("/app/search");
    } catch (error) {
      toast({
        title: "Signup failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const submitWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = workerSignupSchema.safeParse({ ...w, skills, languages });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.errors.forEach((er) => { fe[er.path[0] as string] = er.message; });
      setWErr(fe);
      return;
    }
    setWErr({});
    try {
      const res = await authService.signup({ ...parsed.data, role: "worker", email: parsed.data.email, password: parsed.data.password, name: parsed.data.name });
      setAuth(res.user, res.token);
      toast({ title: "Welcome aboard!", description: "Your profile is under verification." });
      navigate("/worker/dashboard");
    } catch (error) {
      toast({
        title: "Worker signup failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Linkio in less than a minute."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link></>}
    >
      <Tabs defaultValue="customer">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="customer">As Customer</TabsTrigger>
          <TabsTrigger value="worker">As Worker</TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="mt-6">
          <form onSubmit={submitCustomer} className="space-y-3">
            {(["name", "phone", "email", "password"] as const).map((field) => (
              <div key={field}>
                <Label htmlFor={field} className="capitalize">{field}</Label>
                <Input
                  id={field}
                  type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                  value={c[field]}
                  onChange={(e) => setC({ ...c, [field]: e.target.value })}
                  className="mt-1.5"
                />
                {cErr[field] && <p className="mt-1 text-xs text-destructive">{cErr[field]}</p>}
              </div>
            ))}
            <GradientButton type="submit" size="lg" className="w-full">Create account</GradientButton>
            <GoogleButton />
          </form>
        </TabsContent>

        <TabsContent value="worker" className="mt-6">
          <form onSubmit={submitWorker} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Full name</Label>
                <Input value={w.name} onChange={(e) => setW({ ...w, name: e.target.value })} className="mt-1.5" />
                {wErr.name && <p className="mt-1 text-xs text-destructive">{wErr.name}</p>}
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={w.phone} onChange={(e) => setW({ ...w, phone: e.target.value })} className="mt-1.5" />
                {wErr.phone && <p className="mt-1 text-xs text-destructive">{wErr.phone}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={w.email} onChange={(e) => setW({ ...w, email: e.target.value })} className="mt-1.5" />
                {wErr.email && <p className="mt-1 text-xs text-destructive">{wErr.email}</p>}
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={w.password} onChange={(e) => setW({ ...w, password: e.target.value })} className="mt-1.5" />
                {wErr.password && <p className="mt-1 text-xs text-destructive">{wErr.password}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date of birth</Label>
                <Input type="date" value={w.dob} onChange={(e) => setW({ ...w, dob: e.target.value })} className="mt-1.5" />
                {wErr.dob && <p className="mt-1 text-xs text-destructive">{wErr.dob}</p>}
              </div>
              <div>
                <Label>Years of experience</Label>
                <Input type="number" min={0} value={w.experience} onChange={(e) => setW({ ...w, experience: e.target.value })} className="mt-1.5" />
                {wErr.experience && <p className="mt-1 text-xs text-destructive">{wErr.experience}</p>}
              </div>
            </div>

            <div>
              <Label>Skills</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {SKILLS.map((s) => {
                  const on = skills.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSkills(on ? skills.filter((x) => x !== s) : [...skills, s])}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-base",
                        on ? "bg-gradient-brand text-primary-foreground border-transparent shadow-brand" : "border-border hover:bg-secondary"
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {wErr.skills && <p className="mt-1 text-xs text-destructive">{wErr.skills}</p>}
            </div>

            <div>
              <Label>Languages spoken</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {SUPPORTED_LANGS.map((lang) => {
                  const selected = languages.includes(lang.value);
                  return (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() =>
                        setLanguages(
                          selected
                            ? languages.filter((value) => value !== lang.value)
                            : [...languages, lang.value]
                        )
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-base",
                        selected ? "bg-gradient-brand text-primary-foreground border-transparent shadow-brand" : "border-border hover:bg-secondary"
                      )}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
              {wErr.languages && <p className="mt-1 text-xs text-destructive">{wErr.languages}</p>}
            </div>

            <div>
              <Label>ID / Certificate document</Label>
              <label
                htmlFor="doc"
                className="mt-1.5 flex items-center justify-between gap-2 px-4 h-12 rounded-xl border border-dashed border-border hover:border-primary/50 cursor-pointer transition-base"
              >
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload size={16} /> {doc ? doc.name : "Upload PDF/JPG (max 5 MB)"}
                </span>
                {doc && (
                  <button type="button" onClick={(e) => { e.preventDefault(); setDoc(null); }} className="text-muted-foreground hover:text-destructive">
                    <X size={16} />
                  </button>
                )}
                <input
                  id="doc"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size > 5 * 1024 * 1024) {
                      toast({ title: "File too large", description: "Max 5 MB.", variant: "destructive" });
                      return;
                    }
                    setDoc(f ?? null);
                  }}
                />
              </label>
            </div>

            <GradientButton type="submit" size="lg" className="w-full">Create worker account</GradientButton>
            <GoogleButton />
          </form>
        </TabsContent>
      </Tabs>
    </AuthCard>
  );
}
