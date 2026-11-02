import { describe, it, expect, vi, afterEach } from "vitest";
import { MOCK_USERS_KEY } from "../../../../components/login/gateway/MockAuthGateway";
import { hashPassword } from "../../../../components/login/crypto/passwordHash";
import { makeMockGateway, registerAna } from "../helpers/mockGateway";
import {
  VALID_PASSWORD,
  WRONG_PASSWORD,
  UNKNOWN_EMAIL,
  PUBLIC_USER_KEYS,
  TEST_ITERATIONS,
  sorted,
  validLoginInput,
} from "../helpers/fixtures";
import { firstStoredUser, patchFirstStoredUser } from "../helpers/mockStorage";
import { unwrap } from "../helpers/results";

afterEach(() => vi.restoreAllMocks());

const WEAK_ITERATIONS = 500;
const MESSY_ANA_EMAIL = "  ANA@Example.com ";
const LEAKS_SECRETS = /hash|salt|password/i;

async function anaSignedOut() {
  const ctx = makeMockGateway();
  await registerAna(ctx.gateway);
  await ctx.gateway.signOut();
  return ctx;
}

async function anaWithWeakHash() {
  const ctx = makeMockGateway();
  await registerAna(ctx.gateway);
  const weak = await hashPassword(VALID_PASSWORD, WEAK_ITERATIONS);
  patchFirstStoredUser({ passwordHash: weak.hash, salt: weak.salt, iterations: WEAK_ITERATIONS });
  return { ...ctx, weak };
}

describe("G5 — MockAuthGateway.signIn", () => {
  it("credenciais corretas → ok; user sem hash, salt nem password", async () => {
    const { gateway } = await anaSignedOut();
    const user = unwrap(await gateway.signIn(validLoginInput()));
    expect(sorted(Object.keys(user))).toEqual(PUBLIC_USER_KEYS);
    expect(JSON.stringify(user)).not.toMatch(LEAKS_SECRETS);
  });

  it("senha errada → INVALID_CREDENTIALS", async () => {
    const { gateway } = await anaSignedOut();
    expect(await gateway.signIn(validLoginInput({ password: WRONG_PASSWORD }))).toEqual({
      ok: false,
      error: "INVALID_CREDENTIALS",
    });
  });

  it("e-mail inexistente → mesmo código INVALID_CREDENTIALS", async () => {
    const { gateway } = await anaSignedOut();
    const wrongPassword = await gateway.signIn(validLoginInput({ password: WRONG_PASSWORD }));
    const unknownEmail = await gateway.signIn(
      validLoginInput({ email: UNKNOWN_EMAIL, password: WRONG_PASSWORD }),
    );
    expect(unknownEmail).toEqual(wrongPassword);
  });

  it("e-mail com maiúsculas e espaços funciona", async () => {
    const { gateway } = await anaSignedOut();
    const result = await gateway.signIn(validLoginInput({ email: MESSY_ANA_EMAIL }));
    expect(result.ok).toBe(true);
  });

  it('a senha " abc" não é aceita como "abc"', async () => {
    const password = "Abc12345!";
    const { gateway } = makeMockGateway();
    await registerAna(gateway, { password });
    const result = await gateway.signIn(validLoginInput({ password: ` ${password}` }));
    expect(result.ok).toBe(false);
  });

  it("o login cria sessão mas não cria a chave token", async () => {
    const { gateway } = await anaSignedOut();
    await gateway.signIn(validLoginInput());
    expect(localStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(await gateway.restore()).not.toBeNull();
  });

  it("o user retornado é imutável e alterá-lo não muda o storage", async () => {
    const { gateway } = await anaSignedOut();
    const user = unwrap(await gateway.signIn(validLoginInput()));
    expect(Object.isFrozen(user)).toBe(true);
    const before = localStorage.getItem(MOCK_USERS_KEY);

    try {
      (user as { role: string }).role = "admin";
    } catch {
    
    expect(localStorage.getItem(MOCK_USERS_KEY)).toBe(before);
    const again = unwrap(await gateway.signIn(validLoginInput()));
    expect(again.role).toBe("user");
  }});

  it.each(["QuotaExceededError", "SecurityError"])(
    "erro de storage (%s) → UNKNOWN, sem lançar",
    async (errorName) => {
      const { gateway } = await anaSignedOut();
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("boom", errorName);
      });
      await expect(gateway.signIn(validLoginInput())).resolves.toEqual({
        ok: false,
        error: "UNKNOWN",
      });
    },
  );

  it("role inválida no storage ('root') é tratada como 'user'", async () => {
    const { gateway } = await anaSignedOut();
    patchFirstStoredUser({ role: "root" });
    const user = unwrap(await gateway.signIn(validLoginInput()));
    expect(user.role).toBe("user");
  });

  it("role 'admin' legítima no storage é preservada", async () => {
    const { gateway } = await anaSignedOut();
    patchFirstStoredUser({ role: "admin" });
    const user = unwrap(await gateway.signIn(validLoginInput()));
    expect(user.role).toBe("admin");
  });

  it("input inválido (senha vazia) → INVALID_CREDENTIALS ou INVALID_INPUT, sem exceção", async () => {
    const { gateway } = await anaSignedOut();
    const result = await gateway.signIn(validLoginInput({ password: "" }));
    expect(result.ok).toBe(false);
  });

  it("registro com menos iterações que o padrão é re-hasheado após login válido", async () => {
    const { gateway, weak } = await anaWithWeakHash();

    unwrap(await gateway.signIn(validLoginInput()));

    const after = firstStoredUser();
    expect(after.iterations).toBe(TEST_ITERATIONS);
    expect(after.salt).not.toBe(weak.salt);
    expect(JSON.stringify(after)).not.toContain(VALID_PASSWORD);
    expect((await gateway.signIn(validLoginInput())).ok).toBe(true);
  });

  it("login com senha errada não re-hasheia", async () => {
    const { gateway } = await anaWithWeakHash();
    await gateway.signIn(validLoginInput({ password: WRONG_PASSWORD }));
    expect(firstStoredUser().iterations).toBe(WEAK_ITERATIONS);
  });
});