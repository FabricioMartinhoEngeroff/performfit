import { describe, it, expect, vi, afterEach } from "vitest";
import { sanitize, logAuthError } from "../../../../components/login/security/logger";

const EMAIL = "ana@dominio.com";
const SECRET = "valor-secreto";
const SENSITIVE_KEYS = ["password", "senha", "token", "authorization", "cpf"];
const CONSOLE_METHODS = ["log", "info", "warn", "error", "debug"] as const;

const redacted = (value: unknown) => JSON.stringify(sanitize(value));

function circular() {
  const node: Record<string, unknown> = { a: 1 };
  node.self = node;
  return node;
}

/** Silencia o console e devolve os espiões para inspecionar o que seria logado. */
const silenceConsole = () =>
  CONSOLE_METHODS.map((method) => vi.spyOn(console, method).mockImplementation(() => {}));

const loggedCalls = (spies: ReturnType<typeof silenceConsole>) =>
  spies.flatMap((spy) => spy.mock.calls);

function runningIn(mode: "development" | "production") {
  vi.stubEnv("DEV", mode === "development");
  vi.stubEnv("PROD", mode === "production");
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("G20 — sanitize", () => {
  it.each(SENSITIVE_KEYS)("redige a chave %s", (key) => {
    const out = sanitize({ [key]: SECRET, ok: 1 }) as Record<string, unknown>;
    expect(JSON.stringify(out)).not.toContain(SECRET);
    expect(out.ok).toBe(1);
  });

  it("redige recursivamente, inclusive em arrays", () => {
    const text = redacted({
      a: { b: { Password: "p1" } },
      list: [{ token: "t1" }, { nested: [{ senha: "s1" }] }],
    });
    for (const secret of ["p1", "t1", "s1"]) expect(text).not.toContain(secret);
  });

  it("a comparação de chave ignora caixa (Authorization, PASSWORD)", () => {
    const text = redacted({ Authorization: "Bearer segredo-auth", PASSWORD: "segredo-senha" });
    expect(text).not.toContain("segredo-auth");
    expect(text).not.toContain("segredo-senha");
  });

  it("mascara e-mails (a***@dominio.com)", () => {
    const out = sanitize({ email: EMAIL, msg: "falha para bruno@x.org agora" }) as Record<
      string,
      string
    >;
    expect(out.email).toBe("a***@dominio.com");
    expect(out.msg).toContain("b***@x.org");
    expect(out.msg).not.toContain("bruno@");
  });

  it("não muta o objeto original", () => {
    const original = { password: "p", email: EMAIL, arr: [{ token: "t" }] };
    const snapshot = structuredClone(original);

    sanitize(original);

    expect(original).toEqual(snapshot);
  });

  it.each([
    ["null", null],
    ["primitivo", 42],
    ["referência circular", circular()],
  ])("tolera %s sem lançar", (_label, input) => {
    expect(() => sanitize(input)).not.toThrow();
  });

  it("sanitiza Error preservando só nome/mensagem sem segredos", () => {
    expect(redacted(new Error(`falha para ${EMAIL}`))).not.toContain(EMAIL);
  });
});

describe("G20 — logAuthError", () => {
  const ATTEMPT = { email: EMAIL, password: "segredo" };

  it("em DEV loga, com dados sanitizados", () => {
    runningIn("development");
    const spies = silenceConsole();

    logAuthError("signIn", ATTEMPT);

    const calls = loggedCalls(spies);
    expect(calls.length).toBeGreaterThan(0);
    const text = JSON.stringify(calls);
    expect(text).not.toContain("segredo");
    expect(text).not.toContain(EMAIL);
  });

  it("em produção fica silencioso", () => {
    runningIn("production");
    const spies = silenceConsole();

    logAuthError("signIn", ATTEMPT);

    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});