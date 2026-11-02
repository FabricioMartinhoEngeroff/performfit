import { describe, it, expect } from "vitest";
import { parseEmail } from "../../../../components/login/domain/schemas";
import { err, ok } from "../../../../components/login/domain/result";
import { emailWithLength } from "../helpers/fixtures";

const EMAIL_MAX = 254;

describe("G1 — parseEmail", () => {
  it("aplica trim e lowercase", () => {
    expect(parseEmail(" User@EXAMPLE.com ")).toEqual(ok("user@example.com"));
  });

  it("string vazia → REQUIRED", () => {
    expect(parseEmail("")).toEqual(err("REQUIRED"));
  });

  it.each(["abc", "user@", "@x.com", "a b@x.com"])("%j → INVALID_EMAIL", (input) => {
    expect(parseEmail(input)).toEqual(err("INVALID_EMAIL"));
  });

  it("aceita e-mail com exatamente 254 caracteres", () => {
    const email = emailWithLength(EMAIL_MAX);
    expect(email).toHaveLength(EMAIL_MAX);
    expect(parseEmail(email).ok).toBe(true);
  });

  it("e-mail com 255 caracteres → TOO_LONG", () => {
    const email = emailWithLength(EMAIL_MAX + 1);
    expect(email).toHaveLength(EMAIL_MAX + 1);
    expect(parseEmail(email)).toEqual(err("TOO_LONG"));
  });

  it.each([
    ["quebra de linha", "a@b.com\nbcc:x@y.com"],
    ["byte nulo", "a@b.com\0"],
    ["CRLF", "a@b.com\r\nbcc:x@y.com"],
  ])("injeção de cabeçalho (%s) → INVALID_EMAIL", (_label, input) => {
    expect(parseEmail(input)).toEqual(err("INVALID_EMAIL"));
  });

  it.each([null, undefined, 42, {}, []])("%j não lança e retorna erro", (input) => {
    expect(() => parseEmail(input)).not.toThrow();
    expect(parseEmail(input).ok).toBe(false);
  });
});