import { describe, it, expect } from "vitest";
import { MockAuthGateway, MOCK_USERS_KEY } from "../../../../components/login/gateway/MockAuthGateway";
import { createFakeClock, TEST_ITERATIONS, VALID_PASSWORD } from "../helpers/fixtures";
import { unwrap } from "../helpers/results";

const ADMIN = { email: "Treino@Gmail.com ", password: "@Treino123" };

function gatewayComAdmin(devAdmin: { email: string; password: string } | null = ADMIN) {
  return new MockAuthGateway({ now: createFakeClock().now, iterations: TEST_ITERATIONS, devAdmin });
}

const storedUsers = () => JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]") as Array<Record<string, unknown>>;

describe("MockAuthGateway — admin fixo de DEV", () => {
  it("entra como admin sem cadastro prévio", async () => {
    const user = unwrap(await gatewayComAdmin().signIn({ email: "treino@gmail.com", password: "@Treino123" }));
    expect(user.role).toBe("admin");
    expect(user.email).toBe("treino@gmail.com");
    expect(JSON.stringify(storedUsers())).not.toContain("@Treino123");
  });

  it("mantém o mesmo id em logins seguidos (os dados de treino continuam)", async () => {
    const gw = gatewayComAdmin();
    const a = unwrap(await gw.signIn({ email: "treino@gmail.com", password: "@Treino123" }));
    const b = unwrap(await gw.signIn({ email: "treino@gmail.com", password: "@Treino123" }));
    expect(b.id).toBe(a.id);
    expect(storedUsers()).toHaveLength(1);
  });

  it("promove uma conta comum com o mesmo e-mail, mantendo o id", async () => {
    const gw = gatewayComAdmin();
    const comum = unwrap(await gw.signUp({ name: "Fabricio", email: "treino@gmail.com", password: VALID_PASSWORD }));
    expect(comum.role).toBe("user");

    const admin = unwrap(await gw.signIn({ email: "treino@gmail.com", password: "@Treino123" }));
    expect(admin.role).toBe("admin");
    expect(admin.id).toBe(comum.id);
  });

  it("senha errada não cria nem promove a conta", async () => {
    const r = await gatewayComAdmin().signIn({ email: "treino@gmail.com", password: "errada123" });
    expect(r.ok).toBe(false);
    expect(storedUsers()).toHaveLength(0);
  });

  it("sem devAdmin configurado nada muda", async () => {
    const r = await gatewayComAdmin(null).signIn({ email: "treino@gmail.com", password: "@Treino123" });
    expect(r.ok).toBe(false);
  });
});
