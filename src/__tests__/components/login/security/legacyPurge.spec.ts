import { describe, it, expect } from "vitest";
import { purgeLegacyAuthArtifacts } from "../../../../components/login/security/legacyPurge";
import {
  MOCK_USERS_KEY,
  MOCK_SESSION_KEY,
} from "../../../../components/login/gateway/MockAuthGateway";

const LEGACY = {
  token: "fake-token-hardcoded",
  email: "ana@example.com",
  newUser: "true",
  "mock-users": JSON.stringify([
    { email: "ana@example.com", password: "@Treino123", role: "admin" },
  ]),
};
const LEGACY_KEYS = Object.keys(LEGACY);

/** Dados do app que a limpeza NÃO pode tocar. */
const KEPT_DATA: Record<string, string> = {
  logbook: '{"supino":[]}',
  dadosTreino: "{}",
  planoTreino: "{}",
  sessoes_config: "{}",
  "gw:user-1:logbook": "{}",
  "gw:user-1:dadosTreino": "{}",
};

function seed(storage: Storage = localStorage, entries: Record<string, string> = LEGACY) {
  for (const [key, value] of Object.entries(entries)) storage.setItem(key, value);
}

function expectNoneOf(storage: Storage, keys: string[]) {
  for (const key of keys) expect(storage.getItem(key), key).toBeNull();
}

describe("G7 — purgeLegacyAuthArtifacts", () => {
  it("remove token, email, newUser e mock-users (senha em texto)", () => {
    seed();
    purgeLegacyAuthArtifacts();
    expectNoneOf(localStorage, LEGACY_KEYS);
  });

  it("também limpa as mesmas chaves do sessionStorage", () => {
    seed(sessionStorage);
    purgeLegacyAuthArtifacts();
    expectNoneOf(sessionStorage, LEGACY_KEYS);
  });

  it("não remove dados de treino nem chaves escopadas por usuário", () => {
    seed();
    seed(localStorage, KEPT_DATA);

    purgeLegacyAuthArtifacts();

    for (const [key, value] of Object.entries(KEPT_DATA)) {
      expect(localStorage.getItem(key), key).toBe(value);
    }
  });

  it("não remove as chaves do novo mock (usuários hasheados e sessão)", () => {
    localStorage.setItem(MOCK_USERS_KEY, "[]");
    sessionStorage.setItem(MOCK_SESSION_KEY, "{}");

    purgeLegacyAuthArtifacts();

    expect(localStorage.getItem(MOCK_USERS_KEY)).toBe("[]");
    expect(sessionStorage.getItem(MOCK_SESSION_KEY)).toBe("{}");
  });

  it("é idempotente", () => {
    seed();
    purgeLegacyAuthArtifacts();

    expect(() => purgeLegacyAuthArtifacts()).not.toThrow();
    expect(localStorage.length).toBe(0);
  });

  it("funciona com storage vazio", () => {
    expect(() => purgeLegacyAuthArtifacts()).not.toThrow();
  });
});