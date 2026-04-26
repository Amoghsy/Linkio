import { NavLink, Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { ChatbotWidget } from "@/components/layout/ChatbotWidget";
import { Search, Briefcase, MessageCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/app/search", label: "Search ", icon: Search },
  { to: "/app/map",    label: "Map",    icon: MapPin },
  { to: "/app/jobs", label: "My Jobs", icon: Briefcase },
  { to: "/app/messages", label: "Messages", icon: MessageCircle },
];

export const CustomerLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar
      showNotifications
      links={links.map((l) => ({ to: l.to, label: l.label }))}
    />
    <main className="flex-1 container py-6">
      <Outlet />
    </main>
    {/* Mobile bottom nav */}
    <nav className="md:hidden sticky bottom-0 z-30 bg-card border-t border-border grid grid-cols-4">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn("flex flex-col items-center gap-1 py-2 text-xs", isActive ? "text-primary" : "text-muted-foreground")
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
    <ChatbotWidget />
  </div>
);
