import { Link, NavLink, useNavigate } from "react-router-dom";
import { Logo } from "@/components/common/Logo";
import { useAuthStore } from "@/store/useAuthStore";
import { GradientButton } from "@/components/common/GradientButton";
import { NotificationBell } from "./NotificationBell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { LogOut, User, LayoutDashboard, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const publicLinks = [
  { to: "/", label: "Home" },

];

export const Navbar = ({ links, showNotifications = false }: { links?: { to: string; label: string }[]; showNotifications?: boolean }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const items = links ?? publicLinks;

  const dashboardHref =
    user?.role === "worker" ? "/worker/dashboard" : user?.role === "admin" ? "/admin/dashboard" : "/app/search";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
            {items.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-base",
                    isActive ? "text-primary bg-gradient-brand-soft" : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {showNotifications && <NotificationBell />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 h-10 px-2 pr-3 rounded-full hover:bg-secondary transition-base">
                  <div className="h-8 w-8 rounded-full bg-gradient-brand text-primary-foreground grid place-items-center font-semibold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user.name.split(" ")[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(dashboardHref)}>
                  <LayoutDashboard size={16} className="mr-2" /> Dashboard
                </DropdownMenuItem>
                {user.role === "worker" && (
                  <DropdownMenuItem onClick={() => navigate("/worker/profile")}>
                    <User size={16} className="mr-2" /> Profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate("/"); }}>
                  <LogOut size={16} className="mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block text-sm font-medium px-3 py-2 hover:text-primary transition-base">
                Sign in
              </Link>
              <GradientButton size="sm" asChild>
                <Link to="/signup">Get started</Link>
              </GradientButton>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <button className="md:hidden h-10 w-10 grid place-items-center rounded-full hover:bg-secondary">
                <Menu size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-2">
                {items.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end
                    className={({ isActive }) =>
                      cn("px-3 py-2 rounded-lg text-sm font-medium", isActive ? "bg-gradient-brand-soft text-primary" : "")
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
