import { Navigate, type RouteObject } from "react-router-dom";
import App from "../App";
import AdminImport from "../components/adminImport/AdminImport";
import { RequireAuth } from "../components/login/routes/RequireAuth";
import { RequireRole } from "../components/login/routes/RequireRole";
import { AuthPage } from "../components/login/ui/AuthPage";
import { ErroDeRota } from "../mensagens/TelaDeErro";

const rotas: RouteObject[] = [
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

// RN-14.1: toda rota mostra a tela de erro do app se quebrar (nunca a tela padrão do React Router).
export const appRoutes: RouteObject[] = rotas.map((r) => ({ ...r, errorElement: <ErroDeRota /> }));
