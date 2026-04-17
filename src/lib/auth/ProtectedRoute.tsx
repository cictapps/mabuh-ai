import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, useAuthStore } from "./store";

type Props = {
  children: ReactNode;
  allowedRoles?: Array<"user" | "moderator" | "admin">;
};

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const initialize = useAuthStore((s) => s.initialize);
  const { isAuthenticated, profile, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Preparing your sanctuary...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
