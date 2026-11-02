import { describe, it, expect } from "vitest";
import { loginSchema } from "../../../../components/login/domain/schemas";
import { issueCodes, validLoginInput } from "../helpers/fixtures";

const PASSWORD_MAX = 128;

const parse = (overrides: Record<string, unknown> = {}) =>
  loginSchema.safeParse(validLoginInput(overrides));

describe("G1 — loginSchema (só obrigatório e tamanho máximo; sem política de senha)", () => {
  it("e-mail e senha válidos → ok; a senha preserva espaços", () => {
    const r = parse({ email: " Ana@Example.com ", password: " abc " });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("ana@example.com");
      expect(r.data.password).toBe(" abc ");
    }
  });

  it("senha vazia → REQUIRED", () => {
    expect(issueCodes(parse({ password: "" }))).toContain("REQUIRED");
  });

  it("senha de 128 caracteres → ok", () => {
    expect(parse({ password: "x".repeat(PASSWORD_MAX) }).success).toBe(true);
  });

  it("senha de 129 caracteres → TOO_LONG", () => {
    expect(issueCodes(parse({ password: "x".repeat(PASSWORD_MAX + 1) }))).toContain("TOO_LONG");
  });

  it('senha "123" → ok (política forte não vale no login)', () => {
    expect(parse({ password: "123" }).success).toBe(true);
  });

  it("e-mail inválido → INVALID_EMAIL", () => {
    expect(issueCodes(parse({ email: "abc" }))).toContain("INVALID_EMAIL");
  });
});