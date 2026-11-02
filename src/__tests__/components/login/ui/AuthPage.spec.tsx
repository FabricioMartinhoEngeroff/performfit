import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ANA } from "../helpers/fakeGateway";

const mocks = vi.hoisted(() => ({
  auth: { current: {} as Record<string, unknown> },
}));
vi.mock("../../../../components/login/context/useAuth", () => ({
  useAuth: () => mocks.auth.current,
}));

import { AuthPage } from "../../../../components/login/ui/AuthPage";

type Status = "loading" | "anonymous" | "authenticated";

function setAuth(status: Status) {
  mocks.auth.current = {
    status,
    user: status === "authenticated" ? ANA : null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    sendPasswordReset: vi.fn(),
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/app" element={<div>pagina-app</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const loginButton = () => screen.queryByRole("button", { name: /^entrar$/i });
const confirmField = () => screen.queryByLabelText(/confirmar senha/i);
const click = (name: RegExp) => userEvent.click(screen.getByRole("button", { name }));

beforeEach(() => setAuth("anonymous"));
afterEach(() => vi.restoreAllMocks());

describe("G17 — AuthPage", () => {
  it("mostra o nome PerformFit e o subtítulo", () => {
    renderPage();
    expect(screen.getByText("PerformFit")).toBeInTheDocument();
    expect(screen.getByText("Treino e performance encaixados na sua vida")).toBeInTheDocument();
  });

  it("inicia em login", () => {
    renderPage();
    expect(loginButton()).toBeInTheDocument();
    expect(confirmField()).toBeNull();
  });

  it("'Cadastre-se' mostra o cadastro; 'Já tenho conta' volta ao login", async () => {
    renderPage();

    await click(/cadastre-se/i);
    expect(confirmField()).toBeInTheDocument();
    expect(loginButton()).toBeNull();

    await click(/já tenho conta/i);
    expect(loginButton()).toBeInTheDocument();
    expect(confirmField()).toBeNull();
  });

  it("não usa window.addEventListener('toggleRegister'): o evento não troca a tela", async () => {
    const addListener = vi.spyOn(window, "addEventListener");
    renderPage();

    window.dispatchEvent(new Event("toggleRegister"));
    await Promise.resolve(); 

    expect(confirmField()).toBeNull();
    expect(loginButton()).toBeInTheDocument();
    expect(addListener.mock.calls.some(([type]) => type === "toggleRegister")).toBe(false);
  });

  it("já authenticated ao abrir / → Navigate para /app", () => {
    setAuth("authenticated");
    renderPage();
    expect(screen.getByText("pagina-app")).toBeInTheDocument();
    expect(loginButton()).toBeNull();
  });

  it("loading → indicador, sem formulários", () => {
    setAuth("loading");
    const { container } = renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(container.querySelector("form")).toBeNull();
    expect(screen.queryByLabelText(/e-mail/i)).toBeNull();
  });

  it("alternar o modo limpa erros e senhas do formulário anterior", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/e-mail/i), "abc");
    await userEvent.type(screen.getByLabelText(/^senha$/i), "segredo");
    await click(/^entrar$/i);
    expect(screen.getByLabelText(/e-mail/i)).toHaveAttribute("aria-invalid", "true");

    await click(/cadastre-se/i);
    await click(/já tenho conta/i);

    expect((screen.getByLabelText(/^senha$/i) as HTMLInputElement).value).toBe("");
    expect(screen.getByLabelText(/e-mail/i)).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("'Esqueci minha senha' abre a recuperação", async () => {
    renderPage();
    await click(/esqueci minha senha/i);
    expect(
      screen.getByRole("button", { name: /enviar (link|e-mail)|recuperar/i }),
    ).toBeInTheDocument();
  });
});