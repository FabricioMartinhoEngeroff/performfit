import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter, useLocation } from "react-router-dom";
import type { AuthState } from "../../../../components/login/domain/types";
import { ANA } from "../helpers/fakeGateway";
import { setAuthState } from "../helpers/authState";

vi.mock("../../../../components/login/context/useAuth", async () =>
  (await import("../helpers/authState")).authModuleMock,
);

import { RequireAuth } from "../../../../components/login/routes/RequireAuth";

const PROTECTED_TEXT = "conteúdo protegido";

const setAuth = (state: AuthState) => act(() => setAuthState(state));

function LoginProbe() {
  const loc = useLocation();
  return <div data-testid="login-page">{(loc.state as { from?: string } | null)?.from ?? "sem-from"}</div>;
}

function build(children: ReactNode = <div>{PROTECTED_TEXT}</div>, initial = "/graficos") {
  const router = createMemoryRouter(
    [
      { path: "/", element: <LoginProbe /> },
      { path: "/graficos", element: <RequireAuth>{children}</RequireAuth> },
    ],
    { initialEntries: [initial] },
  );
  return { router, ui: <RouterProvider router={router} /> };
}

describe("G12 — RequireAuth", () => {
  it("loading → indicador role=status, sem filhos e sem redirecionar", () => {
    setAuth({ status: "loading" });
    const { router, ui } = build();
    render(ui);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText(PROTECTED_TEXT)).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/graficos");
  });

  it("anonymous → redireciona para / com replace e state.from", () => {
    setAuth({ status: "anonymous" });
    const { router, ui } = build();
    render(ui);
    expect(router.state.location.pathname).toBe("/");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(screen.getByTestId("login-page")).toHaveTextContent("/graficos");
    expect(screen.queryByText(PROTECTED_TEXT)).not.toBeInTheDocument();
  });

  it("authenticated → renderiza os filhos", () => {
    setAuth({ status: "authenticated", user: ANA });
    const { ui } = build();
    render(ui);
    expect(screen.getByText(PROTECTED_TEXT)).toBeInTheDocument();
  });

  it("logout (authenticated → anonymous) → redireciona", () => {
    setAuth({ status: "authenticated", user: ANA });
    const { router, ui } = build();
    render(ui);
    expect(screen.getByText(PROTECTED_TEXT)).toBeInTheDocument();

    setAuth({ status: "anonymous" });
    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByText(PROTECTED_TEXT)).not.toBeInTheDocument();
  });

  it("para anonymous, o conteúdo protegido nunca é renderizado (nem num render intermediário)", () => {
    const Child = vi.fn(() => <div>segredo</div>);
    const { ui } = build(<Child />);
    for (const state of [{ status: "loading" }, { status: "anonymous" }] as AuthState[]) {
      setAuth(state);
      render(ui);
    }
    expect(Child).not.toHaveBeenCalled();
  });
});