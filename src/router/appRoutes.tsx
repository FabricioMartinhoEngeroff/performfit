import { Navigate, type RouteObject } from "react-router-dom";
import App from "../App";
import AdminImport from "../components/adminImport/AdminImport";
import { RequireAuth } from "../components/login/routes/RequireAuth";
import { RequireRole } from "../components/login/routes/RequireRole";
import { AuthPage } from "../components/login/ui/AuthPage";

export const appRoutes: RouteObject[] = [
  { path: "/", element: <AuthPage /> },
  {
    path: "/admin",
    element: (
      <RequireRole role="admin">
        <AdminImport />
      </RequireRole>
    ),
  },
  { path: "/app", element: <RequireAuth><App /></RequireAuth> },
  { path: "*", element: <Navigate to="/" replace /> },
];
