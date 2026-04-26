import { NavLink, Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { ChatbotWidget } from "@/components/layout/ChatbotWidget";
import { GraduationCap, LayoutDashboard, MessageCircle, User, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/worker/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/worker/profile", label: "Profile", icon: User },
  { to: "/worker/trainings", label: "Trainings", icon: GraduationCap },
  { to: "/worker/earnings", label: "Earnings", icon: Wallet },
  { to: "/worker/messages", label: "Messages", icon: MessageCircle },
];

export const WorkerLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar showNotifications links={links.map((l) => ({ to: l.to, label: l.label }))} />
    <div className="flex-1 container grid lg:grid-cols-[220px_1fr] gap-8 py-6">
      <aside className="hidden lg:block">
        <nav className="sticky top-24 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-base",
                  isActive ? "bg-gradient-brand text-primary-foreground shadow-brand" : "hover:bg-secondary text-foreground"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
    <ChatbotWidget />
  </div>
);
