/**
 * RN-14.1 — erro dentro de uma rota mostra a tela de erro do app,
 * não a tela padrão do React Router ("Unexpected Application Error!").
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { ANA } from "../helpers/fakeGateway";
import { setAuthState } from "../helpers/authState";

vi.mock("../../../../components/login/context/useAuth", async () =>
  (await import("../helpers/authState")).authModuleMock,
);
vi.mock("../../../../App", () => ({
  default: () => {
    throw new Error("falha na tela");
  },
}));

import { appRoutes } from "../../../../router/appRoutes";

describe("RN-14.1 rotas com tela de erro", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("todas as rotas têm errorElement", () => {
    for (const rota of appRoutes) expect(rota.errorElement, rota.path).toBeTruthy();
  });

  it("tela do aluno quebrada → 'Algo deu errado', sem a tela padrão em inglês", () => {
    setAuthState({ status: "authenticated", user: ANA });
    render(<RouterProvider router={createMemoryRouter(appRoutes, { initialEntries: ["/app"] })} />);
    expect(screen.getByRole("heading", { name: "Algo deu errado" })).toBeInTheDocument();
    expect(screen.queryByText(/Unexpected Application Error/)).not.toBeInTheDocument();
  });
});
