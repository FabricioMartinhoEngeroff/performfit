import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import type { AuthState } from "../../../../components/login/domain/types";
import { ADMIN, ANA } from "../helpers/fakeGateway";
import { setAuthState } from "../helpers/authState";

vi.mock("../../../../components/login/context/useAuth", async () =>
  (await import("../helpers/authState")).authModuleMock,
);

import { RequireRole } from "../../../../components/login/routes/RequireRole";

const ADMIN_PANEL = "painel-admin";

function renderAt(state: AuthState) {
  setAuthState(state);
  const router = createMemoryRouter(
    [
      { path: "/", element: <div>tela-login</div> },
      { path: "/app", element: <div>tela-app</div> },
      { path: "/admin", element: <RequireRole role="admin"><div>{ADMIN_PANEL}</div></RequireRole> },
    ],
    { initialEntries: ["/admin"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("G12 — RequireRole", () => {
  it("admin → renderiza os filhos", () => {
    renderAt({ status: "authenticated", user: ADMIN });
    expect(screen.getByText(ADMIN_PANEL)).toBeInTheDocument();
  });

  it("user comum → redireciona para /app", () => {
    const router = renderAt({ status: "authenticated", user: ANA });
    expect(router.state.location.pathname).toBe("/app");
    expect(screen.queryByText(ADMIN_PANEL)).not.toBeInTheDocument();
  });

  it("anonymous → redireciona para /", () => {
    const router = renderAt({ status: "anonymous" });
    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByText(ADMIN_PANEL)).not.toBeInTheDocument();
  });

  it("loading → indicador, sem filhos e sem redirecionar", () => {
    const router = renderAt({ status: "loading" });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/admin");
    expect(screen.queryByText(ADMIN_PANEL)).not.toBeInTheDocument();
  });

  it("o role vem do user autenticado, não de storage", () => {
    localStorage.setItem("role", "admin");
    sessionStorage.setItem("role", "admin");
    const router = renderAt({ status: "authenticated", user: ANA });
    expect(router.state.location.pathname).toBe("/app");
  });
});