/**
 * RN-09.4 — a tela do app é fixa na largura do celular; só rola na vertical.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../components/login/context/useAuth", () => ({
  useAuth: () => ({ user: { name: "Ana" }, signOut: vi.fn() }),
}));

import App from "../App";

function renderApp() {
  const { container } = render(<MemoryRouter><App /></MemoryRouter>);
  return container.firstElementChild as HTMLElement;
}

describe("RN-09.4 tela fixa, sem rolagem lateral", () => {
  it("o contêiner do app fica preso à tela e usa a largura do celular (não 100vw)", () => {
    const shell = renderApp();
    expect(shell).toHaveStyle({ position: "fixed", top: "0px", left: "0px", right: "0px", bottom: "0px", width: "100%" });
    expect(getComputedStyle(shell).width).not.toBe("100vw");
    expect(shell).toHaveStyle({ overflow: "hidden" });
  });

  it.each(["Treinar", "Semana", "Evolução", "Perfil"])("aba %s rola só na vertical", (aba) => {
    const shell = renderApp();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(aba, "i") }));
    const tela = shell.querySelector("header + div > *") as HTMLElement;
    expect(tela).toHaveStyle({ overflowY: "auto", overflowX: "hidden" });
  });
});
