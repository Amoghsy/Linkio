import { Link } from "react-router-dom";
import { GradientButton } from "@/components/common/GradientButton";
import { VoiceInput } from "@/components/common/VoiceInput";
import {
  ArrowRight, Search, Sparkles, ShieldCheck, MapPin,
  Wrench, Zap, Hammer, PaintBucket, Wind, Leaf, Refrigerator,
} from "lucide-react";
import { useEffect, useState } from "react";
import { mapService } from "@/services/mapService";

const iconMap: Record<string, React.ElementType> = {
  Wrench, Zap, Sparkles, Hammer, PaintBucket, Wind, Leaf, Refrigerator,
};

export default function Home() {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    mapService.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(38_95%_55%/0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(173_80%_45%/0.25),transparent_60%)]" />

        <div className="container relative py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1.5 text-xs font-medium border border-white/20">
                <Sparkles size={14} className="text-accent" />
                AI-powered matching · live in your neighborhood
              </div>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]">
                AI-powered <span className="bg-gradient-amber bg-clip-text text-transparent">hyperlocal</span><br />
                job marketplace for<br />community growth
              </h1>
              <p className="mt-5 text-lg text-white/80 max-w-xl">
                Find trusted plumbers, electricians, cleaners, and more — verified, nearby, and matched to your exact need in seconds.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <GradientButton variant="amber" size="lg" asChild>
                  <Link to="/login"><Search size={18} /> Find a Worker</Link>
                </GradientButton>
                <GradientButton variant="outline" size="lg" asChild className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Link to="/signup">Find Work <ArrowRight size={18} /></Link>
                </GradientButton>
              </div>

              <div className="mt-10 flex items-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-accent" /> Verified workers</div>
                <div className="flex items-center gap-2"><MapPin size={16} className="text-accent" /> Within 5 km</div>
              </div>
            </div>

            {/* Voice + sample card */}
            <div className="relative animate-float">
              <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-elegant">
                <div className="flex items-center gap-4">
                  <VoiceInput size="lg" />
                  <div>
                    <p className="font-semibold">Try voice search</p>
                    <p className="text-sm text-white/70">"Find a plumber near me"</p>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-card text-card-foreground p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-brand grid place-items-center text-primary-foreground font-bold">RK</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Ravi Kumar · Plumber</p>
                      <p className="text-xs text-muted-foreground">★ 4.8 · 1.2 km away · ₹250+</p>
                    </div>
                    <span className="text-xs font-bold text-primary px-2 py-1 rounded-full bg-gradient-brand-soft">Best match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">From need to done in 3 steps</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { icon: Search, title: "Tell us what you need", desc: "Type or speak — our AI understands context, not keywords." },
            { icon: Sparkles, title: "Get matched instantly", desc: "Top-ranked workers nearby based on skills, trust, and price." },
            { icon: ShieldCheck, title: "Book, chat, done", desc: "Track in real-time. Pay securely after the job is complete." },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 hover:shadow-elegant transition-base">
              <div className="h-12 w-12 rounded-2xl bg-gradient-brand grid place-items-center text-primary-foreground shadow-brand">
                <s.icon size={22} />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Categories</p>
            <h2 className="mt-1 text-3xl font-bold">Every service, one tap away</h2>
          </div>
          <Link to="/login" className="text-sm font-semibold text-primary hover:underline hidden sm:block">
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = iconMap[category] ?? Wrench;
            return (
              <Link
                key={category}
                to="/login"
                className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-brand/30 hover:shadow-lg transition-base"
              >
                <div className="h-11 w-11 rounded-xl bg-gradient-brand-soft grid place-items-center group-hover:bg-gradient-brand group-hover:text-primary-foreground transition-base">
                  <Icon size={22} className="text-primary group-hover:text-primary-foreground" />
                </div>
                <p className="mt-3 font-semibold">{category}</p>
                <p className="text-xs text-muted-foreground">120+ workers nearby</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Impact / SDG 8 */}
      <section className="container py-20">
        <div className="rounded-3xl bg-gradient-dark text-primary-foreground p-8 lg:p-14 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-gradient-amber opacity-20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary opacity-30 blur-3xl" />

          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest">
                SDG 8 · Decent Work & Growth
              </div>
              <h2 className="mt-4 text-3xl lg:text-4xl font-bold leading-tight">
                Empowering local workers,<br />
                <span className="bg-gradient-amber bg-clip-text text-transparent">building stronger communities.</span>
              </h2>
              <p className="mt-4 text-white/80 max-w-lg">
                Linkio aligns with the UN Sustainable Development Goal 8 — promoting inclusive economic growth and decent work for all by giving every skilled worker direct access to local demand.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { k: "12,480+", v: "Workers earning" },
                { k: "₹4.2 Cr", v: "Income generated" },
                { k: "9,876", v: "Jobs completed" },
                { k: "98%", v: "Verified profiles" },
              ].map((s) => (
                <div key={s.v} className="rounded-2xl bg-white/10 border border-white/20 p-5 backdrop-blur">
                  <p className="text-3xl font-bold bg-gradient-amber bg-clip-text text-transparent">{s.k}</p>
                  <p className="text-sm text-white/80 mt-1">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
