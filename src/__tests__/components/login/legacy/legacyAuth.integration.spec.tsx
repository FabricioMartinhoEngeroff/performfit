import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";

vi.mock("../../../../App", () => ({ default: () => <div>pagina-app</div> }));
vi.mock("../../../../components/adminImport/AdminImport", () => ({
  default: () => <div>pagina-admin</div>,
}));

import { AuthProvider } from "../../../../components/login/context/AuthProvider";
import { appRoutes } from "../../../../router/appRoutes";
import { makeMockGateway } from "../helpers/mockGateway";
import { ANA_EMAIL } from "../helpers/fixtures";

const LEGACY_TOKEN = "fake-token-hardcoded";
const LEGACY_PASSWORD = "@Treino123";
const FAR_FUTURE_EXP = 9999999999;

const base64Url = (text: string) =>
  btoa(text).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
const encodeSegment = (value: object) => base64Url(JSON.stringify(value));

/** JWT de admin sem assinatura válida, como o app antigo aceitaria. */
function forgeAdminJwt() {
  const header = { alg: "HS256", typ: "JWT" };
  const claims = { email: "x@y.com", role: "admin", exp: FAR_FUTURE_EXP };
  return `${encodeSegment(header)}.${encodeSegment(claims)}.${btoa("segredo-simulado")}`;
}

/** Deixa no navegador a lista de usuários da versão antiga (senha em texto). */
function plantLegacyUsers(password: string) {
  localStorage.setItem(
    "mock-users",
    JSON.stringify([{ email: "a@b.com", password, role: "admin" }]),
  );
}

function open(path: string) {
  const { gateway } = makeMockGateway();
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(
    <AuthProvider gateway={gateway}>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
}

const loginScreen = () => screen.findByRole("button", { name: /^entrar$/i });

/** Quem não está autenticado acaba na tela de login, em "/", sem ver a página pedida. */
async function expectSentToLogin(router: ReturnType<typeof open>, blockedPage: string) {
  expect(await loginScreen()).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/");
  expect(screen.queryByText(blockedPage)).not.toBeInTheDocument();
}

describe("G7 — artefatos legados não autenticam", () => {
  it('token legado "fake-token-hardcoded" → RequireAuth redireciona, sem autenticar', async () => {
    localStorage.setItem("token", LEGACY_TOKEN);
    localStorage.setItem("email", ANA_EMAIL);

    const router = open("/app");

    await expectSentToLogin(router, "pagina-app");
  });

  it("JWT forjado com role admin no storage → sem acesso ao /admin", async () => {
    const forged = forgeAdminJwt();
    localStorage.setItem("token", forged);
    sessionStorage.setItem("token", forged);

    const router = open("/admin");

    await expectSentToLogin(router, "pagina-admin");
  });

  it("a inicialização limpa os artefatos legados antes de decidir a sessão", async () => {
    localStorage.setItem("token", LEGACY_TOKEN);
    plantLegacyUsers(LEGACY_PASSWORD);

    open("/");
    await loginScreen();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("mock-users")).toBeNull();
  });

  it("usuários antigos com senha em texto não conseguem logar no mock novo", async () => {
    const { gateway } = makeMockGateway();
    plantLegacyUsers("Abcdef1!");

    const result = await gateway.signIn({ email: "a@b.com", password: "Abcdef1!" });

    expect(result).toEqual({ ok: false, error: "INVALID_CREDENTIALS" });
  });
});