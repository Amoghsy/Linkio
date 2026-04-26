import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import type { Role } from "@/services/authService";

export const ProtectedRoute = ({ role, children }: { role: Role; children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) {
    const loginPath = role === "admin" ? "/admin/login" : "/login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }
  if (user.role !== role) {
    const home =
      user.role === "worker" ? "/worker/dashboard" : user.role === "admin" ? "/admin/dashboard" : "/app/search";
    return <Navigate to={home} replace />;
  }
  return <>{children}</>;
};
