import { describe, it, expect, vi } from "vitest";
import {
  MOCK_SESSION_KEY,
  MOCK_LOGOUT_BROADCAST_KEY,
  SESSION_TTL_MS,
} from "../../../../components/login/gateway/MockAuthGateway";
import { makeMockGateway, registerAna } from "../helpers/mockGateway";
import { HOUR, ANA_EMAIL, VALID_PASSWORD, sorted } from "../helpers/fixtures";
import { writeStoredUsers } from "../helpers/mockStorage";
import { unwrap } from "../helpers/results";

const LEAKS_IDENTITY_OR_SECRETS = /ana@example|hash|salt|password/i;
const LEAKS_IDENTITY_IN_SIGNAL = /ana|token|hash/i;
const INVALID_SESSION_PAYLOADS = ["{broken", "null", '"str"', "[]", '{"userId":1}', '{"userId":"x"}'];

const sessionText = () => sessionStorage.getItem(MOCK_SESSION_KEY);

describe("G6 — MockAuthGateway: restore, signOut e sessão", () => {
  it("sem sessão → restore() devolve null", async () => {
    const { gateway } = makeMockGateway();
    expect(await gateway.restore()).toBeNull();
  });

  it("sessão válida → devolve o user", async () => {
    const { gateway } = makeMockGateway();
    const user = unwrap(await registerAna(gateway));
    expect(await gateway.restore()).toEqual(user);
  });

  it("a sessão expira em 8h", () => {
    expect(SESSION_TTL_MS).toBe(8 * HOUR);
  });

  it("sessão expirada (relógio injetado) → null e a sessão é removida", async () => {
    const { gateway, clock } = makeMockGateway();
    await registerAna(gateway);

    clock.advance(SESSION_TTL_MS - 1);
    expect(await gateway.restore()).not.toBeNull();

    clock.advance(2);
    expect(await gateway.restore()).toBeNull();
    expect(sessionText()).toBeNull();
  });

  it("sessão apontando para usuário inexistente → null e a sessão é limpa", async () => {
    const { gateway } = makeMockGateway();
    await registerAna(gateway);
    writeStoredUsers([]);

    expect(await gateway.restore()).toBeNull();
    expect(sessionText()).toBeNull();
  });

  it.each(INVALID_SESSION_PAYLOADS)(
    "JSON de sessão inválido (%s) → null e a sessão é limpa",
    async (raw) => {
      const { gateway } = makeMockGateway();
      sessionStorage.setItem(MOCK_SESSION_KEY, raw);

      expect(await gateway.restore()).toBeNull();
      expect(sessionText()).toBeNull();
    },
  );

  it("a sessão fica no sessionStorage, não no localStorage", async () => {
    const { gateway } = makeMockGateway();
    await registerAna(gateway);
    expect(sessionText()).not.toBeNull();
    expect(localStorage.getItem(MOCK_SESSION_KEY)).toBeNull();
  });

  it("a sessão contém só userId e expiresAt", async () => {
    const { gateway, clock } = makeMockGateway();
    const user = unwrap(await registerAna(gateway));
    const raw = sessionText()!;
    const session = JSON.parse(raw);

    expect(sorted(Object.keys(session))).toEqual(["expiresAt", "userId"]);
    expect(session.userId).toBe(user.id);
    expect(session.expiresAt).toBe(clock.now() + SESSION_TTL_MS);
    expect(raw).not.toMatch(LEAKS_IDENTITY_OR_SECRETS);
  });

  it("signOut remove a sessão; restore depois devolve null", async () => {
    const { gateway } = makeMockGateway();
    await registerAna(gateway);
    await gateway.signOut();

    expect(sessionText()).toBeNull();
    expect(await gateway.restore()).toBeNull();
  });

  it("signOut mantém os usuários cadastrados", async () => {
    const { gateway } = makeMockGateway();
    await registerAna(gateway);
    await gateway.signOut();

    const result = await gateway.signIn({ email: ANA_EMAIL, password: VALID_PASSWORD });
    expect(result.ok).toBe(true);
  });

  it("signOut sem sessão não lança", async () => {
    const { gateway } = makeMockGateway();
    await expect(gateway.signOut()).resolves.toBeUndefined();
  });
});

describe("G6 — onAuthChange", () => {
  const logoutFromOtherTab = () =>
    window.dispatchEvent(
      new StorageEvent("storage", { key: MOCK_LOGOUT_BROADCAST_KEY, newValue: String(Date.now()) }),
    );

  it("logout em outra aba → notifica null", async () => {
    const { gateway } = makeMockGateway();
    await registerAna(gateway);
    const listener = vi.fn();
    gateway.onAuthChange(listener);

    logoutFromOtherTab();

    expect(listener).toHaveBeenCalledWith(null);
  });

  it("signOut local publica o sinal de logout para as outras abas", async () => {
    const { gateway } = makeMockGateway();
    await registerAna(gateway);
    await gateway.signOut();

    const signal = localStorage.getItem(MOCK_LOGOUT_BROADCAST_KEY);
    expect(signal).not.toBeNull();
    expect(signal).not.toMatch(LEAKS_IDENTITY_IN_SIGNAL);
  });

  it("eventos de storage de outras chaves são ignorados", () => {
    const { gateway } = makeMockGateway();
    const listener = vi.fn();
    gateway.onAuthChange(listener);

    window.dispatchEvent(new StorageEvent("storage", { key: "outra-coisa", newValue: "x" }));

    expect(listener).not.toHaveBeenCalled();
  });

  it("devolve função de cancelamento; depois dela não há mais notificações", () => {
    const { gateway } = makeMockGateway();
    const listener = vi.fn();
    const unsubscribe = gateway.onAuthChange(listener);
    expect(typeof unsubscribe).toBe("function");

    unsubscribe();
    logoutFromOtherTab();

    expect(listener).not.toHaveBeenCalled();
  });

  it("cancelar duas vezes não lança", () => {
    const { gateway } = makeMockGateway();
    const unsubscribe = gateway.onAuthChange(vi.fn());
    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();
  });
});