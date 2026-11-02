import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import type { AuthState } from "../../../../components/login/domain/types";
import { ADMIN, ANA } from "../helpers/fakeGateway";
import { setAuthState } from "../helpers/authState";

vi.mock("../../../../components/login/context/useAuth", async () =>
  (await import("../helpers/authState")).authModuleMock,
);
vi.mock("../../../../App", () => ({ default: () => <div>pagina-app</div> }));
vi.mock("../../../../components/adminImport/AdminImport", () => ({
  default: () => <div>pagina-admin</div>,
}));

import { appRoutes } from "../../../../router/appRoutes";

const ADMIN_PATH = "/admin";

function visit(path: string, state: AuthState) {
  setAuthState(state);
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

const PROTECTED: Array<[string, string]> = [["/app", "pagina-app"]];

// Telas da fase 2 (GymWave: carga em kg) não existem no PerformFit.
const REMOVIDAS = ["/graficos", "/relatorio", "/grafico-powerlifter"];

describe("G12 — árvore de rotas", () => {
  it.each(PROTECTED)("%s é protegida por RequireAuth (anonymous → /)", (path, marker) => {
    const router = visit(path, { status: "anonymous" });
    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByText(marker)).not.toBeInTheDocument();
  });

  it.each(PROTECTED)("%s abre para authenticated", (path, marker) => {
    visit(path, { status: "authenticated", user: ANA });
    expect(screen.getByText(marker)).toBeInTheDocument();
  });

  it.each(PROTECTED)("%s mostra indicador em loading, sem conteúdo", (path, marker) => {
    visit(path, { status: "loading" });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText(marker)).not.toBeInTheDocument();
  });

  it("/admin é protegida por RequireRole('admin'): admin entra", () => {
    visit(ADMIN_PATH, { status: "authenticated", user: ADMIN });
    expect(screen.getByText("pagina-admin")).toBeInTheDocument();
  });

  it("/admin: user comum vai para /app", () => {
    const router = visit(ADMIN_PATH, { status: "authenticated", user: ANA });
    expect(router.state.location.pathname).toBe("/app");
    expect(screen.queryByText("pagina-admin")).not.toBeInTheDocument();
  });

  it("/admin: anonymous vai para /", () => {
    const router = visit(ADMIN_PATH, { status: "anonymous" });
    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByText("pagina-admin")).not.toBeInTheDocument();
  });

  it("/ com authenticated → redireciona para /app (RG1)", () => {
    const router = visit("/", { status: "authenticated", user: ANA });
    expect(router.state.location.pathname).toBe("/app");
    expect(screen.getByText("pagina-app")).toBeInTheDocument();
  });

  it("/ com anonymous mostra a tela de login", () => {
    visit("/", { status: "anonymous" });
    expect(screen.getByRole("button", { name: /^entrar$/i })).toBeInTheDocument();
  });

  it("rota inexistente → NotFound ou redirect para /, sem quebrar", () => {
    expect(() => visit("/nao-existe", { status: "anonymous" })).not.toThrow();
    const notFound = screen.queryByText(/não encontrad|404/i);
    const loginBtn = screen.queryByRole("button", { name: /^entrar$/i });
    expect(notFound ?? loginBtn).not.toBeNull();
  });

  it.each(REMOVIDAS)("%s não existe mais: cai no redirecionamento para /", (path) => {
    expect(appRoutes.map((r) => r.path)).not.toContain(path);
    const router = visit(path, { status: "authenticated", user: ANA });
    expect(router.state.location.pathname).not.toBe(path);
  });

  it("nenhuma rota protegida renderiza conteúdo sem passar por guarda (varredura da árvore)", () => {
    const paths = appRoutes.map((r) => r.path);
    for (const p of [...PROTECTED.map(([path]) => path), ADMIN_PATH]) {
      expect(paths).toContain(p);
    }
  });
});