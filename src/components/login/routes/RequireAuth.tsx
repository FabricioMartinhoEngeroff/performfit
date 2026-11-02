import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { AuthLoading } from "../ui/AuthLoading";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <AuthLoading />;
  if (status === "anonymous") {
    return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
