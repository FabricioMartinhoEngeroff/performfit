import { describe, it, expect, expectTypeOf } from "vitest";
import {
  AUTH_ERRORS,
  authErrorMessages,
  getAuthErrorMessage,
  type AuthError,
} from "../../../../components/login/domain/authErrors";
import { sorted } from "../helpers/fixtures";

const EXPECTED_CODES = [
  "EMAIL_IN_USE",
  "INVALID_CREDENTIALS",
  "INVALID_INPUT",
  "NETWORK",
  "TOO_MANY_ATTEMPTS",
  "UNKNOWN",
  "WEAK_PASSWORD",
];

const ENGLISH_WORDS = /\b(invalid|error|please|try again|wrong|the)\b/i;
const PORTUGUESE_WORDS = /\b(de|do|da|não|e|ou|em|com|tente|ao|para|sua|seu|este|esta)\b/i;

const REVEALS_UNKNOWN_EMAIL = /não (existe|encontrad|cadastrad)/i;
const REVEALS_WRONG_PASSWORD = /^senha (incorreta|errada)/i;

const INTERNAL_DETAILS = /auth\/|firebase/i;

describe("G2 — mensagens de erro de autenticação", () => {
  it("AUTH_ERRORS lista todos os códigos esperados", () => {
    expect(sorted(AUTH_ERRORS)).toEqual(sorted(EXPECTED_CODES));
  });

  it("o mapa cobre todos os códigos (exaustivo)", () => {
    expectTypeOf(authErrorMessages).toEqualTypeOf<Record<AuthError, string>>();
    expect(sorted(Object.keys(authErrorMessages))).toEqual(sorted(EXPECTED_CODES));
  });

  it("todas as mensagens são PT-BR e não vazias", () => {
    for (const code of AUTH_ERRORS) {
      const msg = getAuthErrorMessage(code);
      expect(msg.trim().length, code).toBeGreaterThan(0);
      expect(msg, code).not.toMatch(ENGLISH_WORDS);
      expect(msg, code).toMatch(PORTUGUESE_WORDS);
    }
  });

  it("INVALID_CREDENTIALS não distingue e-mail inexistente de senha errada", () => {
    const msg = getAuthErrorMessage("INVALID_CREDENTIALS");
    expect(msg).not.toMatch(REVEALS_UNKNOWN_EMAIL);
    expect(msg).not.toMatch(REVEALS_WRONG_PASSWORD);
    expect(msg).toMatch(/e-mail/i);
    expect(msg).toMatch(/senha/i);
  });

  it("TOO_MANY_ATTEMPTS inclui os segundos restantes quando informados", () => {
    expect(getAuthErrorMessage("TOO_MANY_ATTEMPTS", { retryAfterSeconds: 42 })).toContain("42");
  });

  it("TOO_MANY_ATTEMPTS sem segundos continua legível", () => {
    const msg = getAuthErrorMessage("TOO_MANY_ATTEMPTS");
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).not.toMatch(/undefined|NaN|null/);
  });

  it("nenhuma mensagem vaza detalhe interno de SDK", () => {
    for (const code of AUTH_ERRORS) expect(getAuthErrorMessage(code)).not.toMatch(INTERNAL_DETAILS);
  });
});