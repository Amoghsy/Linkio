import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "@/components/common/Logo";
import { useAuthStore } from "@/store/useAuthStore";
import { LayoutDashboard, ShieldCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
];

export const AdminLayout = () => {
  const { logout, user } = useAuthStore();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 hidden md:flex flex-col bg-gradient-dark text-primary-foreground p-5 sticky top-0 h-screen">
        <Logo className="text-primary-foreground [&_span]:text-primary-foreground" />
        <div className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
          Admin Portal
        </div>
        <nav className="mt-8 space-y-1 flex-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-base",
                  isActive ? "bg-gradient-brand shadow-brand" : "hover:bg-white/10 text-white/80"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => { logout(); nav("/admin/login"); }}
          className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-white/10"
        >
          <LogOut size={16} /> Sign out · {user?.name}
        </button>
      </aside>
      <main className="flex-1 p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
};
