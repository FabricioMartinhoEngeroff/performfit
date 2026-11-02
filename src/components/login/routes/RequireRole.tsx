import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import type { Role } from "../domain/types";
import { AuthLoading } from "../ui/AuthLoading";

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { status, user } = useAuth();

  if (status === "loading") return <AuthLoading />;
  if (status === "anonymous" || !user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to="/app" replace />;
  return <>{children}</>;
}
