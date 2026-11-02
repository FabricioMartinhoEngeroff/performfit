import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const fb = vi.hoisted(() => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signOut: vi.fn(),
  setPersistence: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  browserSessionPersistence: { type: "SESSION" },
  getAuth: vi.fn(),
}));

vi.mock("firebase/auth", () => fb);
vi.mock("firebase/app", () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));

import { FirebaseAuthGateway } from "../../../../components/login/gateway/FirebaseAuthGateway";
import {
  getFirebaseConfig,
  AuthConfigError,
  REQUIRED_FIREBASE_ENV,
} from "../../../../components/login/gateway/firebaseConfig";
import { VALID_PASSWORD } from "../helpers/fixtures";

const auth = { signOut: fb.signOut } as never;

function fbUser(over: Record<string, unknown> = {}, claims: Record<string, unknown> = {}) {
  return {
    uid: "uid-1",
    displayName: "Ana Silva",
    email: "ana@example.com",
    getIdTokenResult: vi.fn(async () => ({ claims })),
    ...over,
  };
}

const fbError = (code: string, message = "Firebase: boom (" + code + ").") =>
  Object.assign(new Error(message), { code });

let gw: FirebaseAuthGateway;

beforeEach(() => {
  vi.clearAllMocks();
  fb.setPersistence.mockResolvedValue(undefined);
  fb.updateProfile.mockResolvedValue(undefined);
  fb.signOut.mockResolvedValue(undefined);
  fb.sendPasswordResetEmail.mockResolvedValue(undefined);
  gw = new FirebaseAuthGateway(auth);
});
afterEach(() => vi.restoreAllMocks());

describe("G8 — FirebaseAuthGateway.signIn", () => {
  it("chama signInWithEmailAndPassword com e-mail normalizado e senha intacta", async () => {
    fb.signInWithEmailAndPassword.mockResolvedValue({ user: fbUser() });
    await gw.signIn({ email: "  ANA@Example.com ", password: " Abc 123 " });
    expect(fb.signInWithEmailAndPassword).toHaveBeenCalledWith(auth, "ana@example.com", " Abc 123 ");
  });

  it("sucesso → {id: uid, name: displayName, email, role}", async () => {
    fb.signInWithEmailAndPassword.mockResolvedValue({ user: fbUser() });
    const r = await gw.signIn({ email: "ana@example.com", password: VALID_PASSWORD });
    expect(r).toEqual({
      ok: true,
      value: { id: "uid-1", name: "Ana Silva", email: "ana@example.com", role: "user" },
    });
  });

  it("displayName nulo → name ''", async () => {
    fb.signInWithEmailAndPassword.mockResolvedValue({ user: fbUser({ displayName: null }) });
    const r = await gw.signIn({ email: "ana@example.com", password: VALID_PASSWORD });
    expect(r.ok && r.value.name).toBe("");
  });

  it("role vem de custom claim validada", async () => {
    fb.signInWithEmailAndPassword.mockResolvedValue({ user: fbUser({}, { role: "admin" }) });
    const r = await gw.signIn({ email: "ana@example.com", password: VALID_PASSWORD });
    expect(r.ok && r.value.role).toBe("admin");
  });

  it.each([[{}], [{ role: "root" }], [{ role: 1 }], [{ role: null }]])(
    "claim ausente ou inválida (%j) → 'user'",
    async (claims) => {
      fb.signInWithEmailAndPassword.mockResolvedValue({ user: fbUser({}, claims) });
      const r = await gw.signIn({ email: "ana@example.com", password: VALID_PASSWORD });
      expect(r.ok && r.value.role).toBe("user");
    },
  );

  it("falha ao ler claims → 'user', sem derrubar o login", async () => {
    const user = fbUser();
    user.getIdTokenResult.mockRejectedValue(new Error("x"));
    fb.signInWithEmailAndPassword.mockResolvedValue({ user });
    const r = await gw.signIn({ email: "ana@example.com", password: VALID_PASSWORD });
    expect(r.ok && r.value.role).toBe("user");
  });

  it("a persistência é browserSessionPersistence, configurada antes do login", async () => {
    fb.signInWithEmailAndPassword.mockResolvedValue({ user: fbUser() });
    await gw.signIn({ email: "ana@example.com", password: VALID_PASSWORD });
    expect(fb.setPersistence).toHaveBeenCalledWith(auth, fb.browserSessionPersistence);
    expect(fb.setPersistence.mock.invocationCallOrder[0]).toBeLessThan(
      fb.signInWithEmailAndPassword.mock.invocationCallOrder[0]!,
    );
  });

  it.each([
    ["auth/invalid-credential", "INVALID_CREDENTIALS"],
    ["auth/wrong-password", "INVALID_CREDENTIALS"],
    ["auth/user-not-found", "INVALID_CREDENTIALS"],
    ["auth/invalid-email", "INVALID_CREDENTIALS"],
    ["auth/too-many-requests", "TOO_MANY_ATTEMPTS"],
    ["auth/network-request-failed", "NETWORK"],
  ])("%s → %s", async (code, expected) => {
    fb.signInWithEmailAndPassword.mockRejectedValue(fbError(code));
    expect(await gw.signIn({ email: "ana@example.com", password: VALID_PASSWORD })).toEqual({
      ok: false,
      error: expected,
    });
  });

  it("código desconhecido → UNKNOWN, sem vazar a mensagem do SDK", async () => {
    fb.signInWithEmailAndPassword.mockRejectedValue(fbError("auth/internal-error", "SEGREDO-DO-SDK"));
    const r = await gw.signIn({ email: "ana@example.com", password: VALID_PASSWORD });
    expect(r).toEqual({ ok: false, error: "UNKNOWN" });
    expect(JSON.stringify(r)).not.toContain("SEGREDO-DO-SDK");
  });

  it("erro que não é do SDK (sem code) → UNKNOWN, sem lançar", async () => {
    fb.signInWithEmailAndPassword.mockRejectedValue("string solta");
    await expect(gw.signIn({ email: "a@b.com", password: "x" })).resolves.toEqual({
      ok: false,
      error: "UNKNOWN",
    });
  });

  it("e-mail inválido localmente → não chama o SDK", async () => {
    const r = await gw.signIn({ email: "abc", password: "x" });
    expect(r.ok).toBe(false);
    expect(fb.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });
});

describe("G8 — FirebaseAuthGateway.signUp", () => {
  const input = { email: "Ana@Example.com", password: VALID_PASSWORD };

  it("chama só createUserWithEmailAndPassword (sem nome no perfil)", async () => {
    fb.createUserWithEmailAndPassword.mockResolvedValue({ user: fbUser({ displayName: null }) });
    const r = await gw.signUp(input);
    expect(fb.createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, "ana@example.com", VALID_PASSWORD);
    expect(fb.updateProfile).not.toHaveBeenCalled();
    expect(r.ok && r.value).toMatchObject({ id: "uid-1", name: "", email: "ana@example.com", role: "user" });
  });

  it("nome forjado no input não vai para o Firebase", async () => {
    fb.createUserWithEmailAndPassword.mockResolvedValue({ user: fbUser({ displayName: null }) });
    const r = await gw.signUp({ ...input, name: "Ana Silva" } as never);
    expect(fb.updateProfile).not.toHaveBeenCalled();
    expect(r.ok && r.value.name).toBe("");
  });

  it("a persistência de sessão é configurada antes do cadastro", async () => {
    fb.createUserWithEmailAndPassword.mockResolvedValue({ user: fbUser() });
    await gw.signUp(input);
    expect(fb.setPersistence.mock.invocationCallOrder[0]).toBeLessThan(
      fb.createUserWithEmailAndPassword.mock.invocationCallOrder[0]!,
    );
  });

  it.each([
    ["auth/email-already-in-use", "EMAIL_IN_USE"],
    ["auth/weak-password", "WEAK_PASSWORD"],
    ["auth/network-request-failed", "NETWORK"],
    ["auth/whatever", "UNKNOWN"],
  ])("%s → %s", async (code, expected) => {
    fb.createUserWithEmailAndPassword.mockRejectedValue(fbError(code));
    expect(await gw.signUp(input)).toEqual({ ok: false, error: expected });
  });

  it("role nunca vem do input", async () => {
    fb.createUserWithEmailAndPassword.mockResolvedValue({ user: fbUser() });
    const r = await gw.signUp({ ...input, role: "admin" } as never);
    expect(r.ok && r.value.role).toBe("user");
  });
});

describe("G8 — signOut, restore, onAuthChange, reset", () => {
  it("signOut chama auth.signOut()", async () => {
    await gw.signOut();
    expect(fb.signOut).toHaveBeenCalledTimes(1);
  });

  it("restore resolve com o primeiro onAuthStateChanged e já cancela a inscrição", async () => {
    const unsub = vi.fn();
    fb.onAuthStateChanged.mockImplementation((_a: unknown, cb: (u: unknown) => void) => {
      queueMicrotask(() => cb(fbUser()));
      return unsub;
    });
    const user = await gw.restore();
    expect(user).toMatchObject({ id: "uid-1" });
    expect(unsub).toHaveBeenCalledTimes(1);
  });

  it("restore sem usuário → null", async () => {
    const unsub = vi.fn();
    fb.onAuthStateChanged.mockImplementation((_a: unknown, cb: (u: unknown) => void) => {
      queueMicrotask(() => cb(null));
      return unsub;
    });
    expect(await gw.restore()).toBeNull();
    expect(unsub).toHaveBeenCalled();
  });

  it("restore cancela a inscrição mesmo se o callback rodar de forma síncrona", async () => {
    const unsub = vi.fn();
    fb.onAuthStateChanged.mockImplementation((_a: unknown, cb: (u: unknown) => void) => {
      cb(null);
      return unsub;
    });
    await gw.restore();
    expect(unsub).toHaveBeenCalled();
  });

  it("onAuthChange repassa usuário mapeado e devolve o unsubscribe do SDK", async () => {
    const unsub = vi.fn();
    let sdkCb!: (u: unknown) => void;
    fb.onAuthStateChanged.mockImplementation((_a: unknown, cb: (u: unknown) => void) => {
      sdkCb = cb;
      return unsub;
    });
    const seen: unknown[] = [];
    const off = gw.onAuthChange((u) => seen.push(u));
    sdkCb(null);
    sdkCb(fbUser());
    await vi.waitFor(() => expect(seen).toHaveLength(2));
    expect(seen[0]).toBeNull();
    expect(seen[1]).toMatchObject({ id: "uid-1" });
    off();
    expect(unsub).toHaveBeenCalled();
  });

  it("sendPasswordReset normaliza o e-mail e retorna ok", async () => {
    expect(await gw.sendPasswordReset("  ANA@Example.com ")).toEqual({ ok: true, value: undefined });
    expect(fb.sendPasswordResetEmail).toHaveBeenCalledWith(auth, "ana@example.com");
  });

  it("sendPasswordReset retorna ok também para user-not-found", async () => {
    fb.sendPasswordResetEmail.mockRejectedValue(fbError("auth/user-not-found"));
    expect(await gw.sendPasswordReset("x@y.com")).toEqual({ ok: true, value: undefined });
  });

  it("sendPasswordReset → NETWORK em falha de rede", async () => {
    fb.sendPasswordResetEmail.mockRejectedValue(fbError("auth/network-request-failed"));
    expect(await gw.sendPasswordReset("x@y.com")).toEqual({ ok: false, error: "NETWORK" });
  });

  it("e-mail inválido no reset → erro, sem chamar o SDK", async () => {
    const r = await gw.sendPasswordReset("abc");
    expect(r.ok).toBe(false);
    expect(fb.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe("G8 — nenhum erro do SDK é logado com a senha", () => {
  it("console.* nunca recebe a senha em falhas de signIn/signUp", async () => {
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
    const leaky = fbError("auth/internal-error", `falha para senha=${VALID_PASSWORD}`);
    fb.signInWithEmailAndPassword.mockRejectedValue(leaky);
    fb.createUserWithEmailAndPassword.mockRejectedValue(leaky);
    await gw.signIn({ email: "ana@example.com", password: VALID_PASSWORD });
    await gw.signUp({ name: "Ana Silva", email: "ana@example.com", password: VALID_PASSWORD });
    for (const s of spies) {
      for (const call of s.mock.calls) {
        expect(JSON.stringify(call, (_k, v) => (v instanceof Error ? v.message : v))).not.toContain(VALID_PASSWORD);
      }
    }
  });
});

describe("G8 — configuração (import.meta.env)", () => {
  const full = Object.fromEntries(REQUIRED_FIREBASE_ENV.map((k) => [k, `valor-${k}`]));

  it("lê a config do env injetado", () => {
    const cfg = getFirebaseConfig(full);
    expect(cfg).toMatchObject({ apiKey: full.VITE_FIREBASE_API_KEY });
  });

  it("exige as variáveis mínimas", () => {
    expect(REQUIRED_FIREBASE_ENV).toEqual(
      expect.arrayContaining([
        "VITE_FIREBASE_API_KEY",
        "VITE_FIREBASE_AUTH_DOMAIN",
        "VITE_FIREBASE_PROJECT_ID",
        "VITE_FIREBASE_APP_ID",
      ]),
    );
  });

  it.each(REQUIRED_FIREBASE_ENV)("chave faltando (%s) → erro de configuração claro", (missing) => {
    const env = { ...full };
    delete env[missing];
    expect(() => getFirebaseConfig(env)).toThrow(AuthConfigError);
    expect(() => getFirebaseConfig(env)).toThrow(new RegExp(missing));
  });

  it("valor vazio conta como faltando", () => {
    expect(() => getFirebaseConfig({ ...full, VITE_FIREBASE_API_KEY: "  " })).toThrow(AuthConfigError);
  });
});
