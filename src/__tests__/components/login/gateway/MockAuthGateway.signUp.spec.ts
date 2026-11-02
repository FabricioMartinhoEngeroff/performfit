import { describe, it, expect, vi, afterEach } from "vitest";
import {
  MockAuthGateway,
  MOCK_USERS_KEY,
  MOCK_SESSION_KEY,
} from "../../../../components/login/gateway/MockAuthGateway";
import { isValidUUID } from "../../../../utils/validateUUID";
import { makeMockGateway, registerAna } from "../helpers/mockGateway";
import {
  ANA_NAME,
  ANA_EMAIL,
  VALID_PASSWORD,
  PUBLIC_USER_KEYS,
  TEST_ITERATIONS,
  forge,
  sorted,
} from "../helpers/fixtures";
import {
  allStorageText,
  firstStoredUser,
  readStoredUsers,
  writeStoredUsers,
} from "../helpers/mockStorage";
import { unwrap } from "../helpers/results";

afterEach(() => vi.restoreAllMocks());

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MESSY_ANA_EMAIL = "  ANA@Example.COM ";
const JUNK_RECORDS = [{ email: "x@y.com" }, null, "str", 42, { id: "1", email: "z@z.com" }];

const forgedSignUp = (gateway: MockAuthGateway, overrides: Record<string, unknown> = {}) =>
  gateway.signUp(
    forge({ email: ANA_EMAIL, password: VALID_PASSWORD, ...overrides }),
  );

describe("G4 — MockAuthGateway.signUp", () => {
  it("cadastro só com e-mail e senha → ok com {id, name:'', email, role:'user'}", async () => {
    const { gateway } = makeMockGateway();
    const user = unwrap(await registerAna(gateway));
    expect(sorted(Object.keys(user))).toEqual(PUBLIC_USER_KEYS);
    expect(user).toMatchObject({ name: "", email: ANA_EMAIL, role: "user" });
  });

  it("nome enviado mesmo assim não é guardado", async () => {
    const { gateway } = makeMockGateway();
    const user = unwrap(await forgedSignUp(gateway, { name: ANA_NAME }));
    expect(user.name).toBe("");
    expect(JSON.stringify(readStoredUsers())).not.toContain(ANA_NAME);
  });

  it("o id é um UUID v4 válido", async () => {
    const { gateway } = makeMockGateway();
    const { id } = unwrap(await registerAna(gateway));
    expect(isValidUUID(id)).toBe(true);
    expect(id).toMatch(UUID_V4);
  });

  it("role é 'user' mesmo com input forjado", async () => {
    const { gateway } = makeMockGateway();
    const user = unwrap(await forgedSignUp(gateway, { role: "admin" }));
    expect(user.role).toBe("user");
    expect(JSON.stringify(readStoredUsers())).not.toContain("admin");
  });

  it("a senha nunca é persistida em texto", async () => {
    const { gateway } = makeMockGateway();
    await registerAna(gateway);
    expect(allStorageText()).not.toContain(VALID_PASSWORD);
  });

  it("persiste passwordHash, salt e iterations", async () => {
    const { gateway } = makeMockGateway();
    await registerAna(gateway);
    const record = firstStoredUser();
    expect(record).toMatchObject({
      email: ANA_EMAIL,
      iterations: TEST_ITERATIONS,
      passwordHash: expect.any(String),
      salt: expect.any(String),
    });
    expect(record).not.toHaveProperty("password");
  });

  it("e-mail duplicado (maiúsculas e espaços) → EMAIL_IN_USE, sem sobrescrever", async () => {
    const { gateway } = makeMockGateway();
    await registerAna(gateway);
    const before = localStorage.getItem(MOCK_USERS_KEY);

    const duplicate = await registerAna(gateway, { name: "Outra", email: MESSY_ANA_EMAIL });

    expect(duplicate).toEqual({ ok: false, error: "EMAIL_IN_USE" });
    expect(localStorage.getItem(MOCK_USERS_KEY)).toBe(before);
  });

  it("depois do cadastro existe sessão: restore() devolve o usuário", async () => {
    const { gateway } = makeMockGateway();
    const user = unwrap(await registerAna(gateway));
    expect(await gateway.restore()).toEqual(user);
  });

  it("não grava as chaves token, email nem newUser no localStorage", async () => {
    const { gateway } = makeMockGateway();
    await registerAna(gateway);
    for (const key of ["token", "email", "newUser"]) expect(localStorage.getItem(key)).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
  });

  it("JSON corrompido no storage → tratado como lista vazia, sem lançar", async () => {
    localStorage.setItem(MOCK_USERS_KEY, "{not json");
    const { gateway } = makeMockGateway();
    await expect(registerAna(gateway)).resolves.toMatchObject({ ok: true });
  });

  it("registros incompletos no storage são descartados", async () => {
    const { gateway } = makeMockGateway();
    await registerAna(gateway);
    writeStoredUsers([firstStoredUser(), ...JUNK_RECORDS]);

    const result = await registerAna(gateway, { email: "nova@example.com" });

    expect(result.ok).toBe(true);
    const emails = readStoredUsers().map((user) => user.email);
    expect(sorted(emails)).toEqual([ANA_EMAIL, "nova@example.com"]);
  });

  it("dois cadastros simultâneos com o mesmo e-mail → só um ok", async () => {
    const { gateway } = makeMockGateway();
    const [a, b] = await Promise.all([registerAna(gateway), registerAna(gateway)]);

    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    const failed = a.ok ? b : a;
    expect(failed).toEqual({ ok: false, error: "EMAIL_IN_USE" });
    expect(readStoredUsers()).toHaveLength(1);
  });

  const INVALID_INPUTS: Array<[string, Record<string, unknown>]> = [
    ["e-mail inválido", { email: "abc" }],
    ["senha fraca", { password: "123" }],
    ["campos ausentes", { email: undefined, password: undefined }],
  ];

  it.each(INVALID_INPUTS)(
    "input inválido que escapou da UI (%s) → INVALID_INPUT, sem exceção",
    async (_label, overrides) => {
      const { gateway } = makeMockGateway();
      expect(await forgedSignUp(gateway, overrides)).toEqual({ ok: false, error: "INVALID_INPUT" });
      expect(localStorage.getItem(MOCK_USERS_KEY)).toBeNull();
    },
  );

  it("a sessão criada vive no sessionStorage", async () => {
    const { gateway } = makeMockGateway();
    await registerAna(gateway);
    expect(sessionStorage.getItem(MOCK_SESSION_KEY)).not.toBeNull();
    expect(localStorage.getItem(MOCK_SESSION_KEY)).toBeNull();
  });

  it("falha de storage no cadastro → UNKNOWN, sem lançar", async () => {
    const { gateway } = makeMockGateway();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    await expect(registerAna(gateway)).resolves.toEqual({ ok: false, error: "UNKNOWN" });
  });

  it("MockAuthGateway é instanciável sem opções (usa padrões)", () => {
    expect(() => new MockAuthGateway()).not.toThrow();
  });
});