import { describe, it, expect, vi } from "vitest";

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signOut: vi.fn(),
  setPersistence: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  browserSessionPersistence: {},
}));
vi.mock("firebase/app", () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));

import { createAuthGateway } from "../../../../components/login/gateway/createAuthGateway";
import { MockAuthGateway } from "../../../../components/login/gateway/MockAuthGateway";
import { FirebaseAuthGateway } from "../../../../components/login/gateway/FirebaseAuthGateway";
import { AuthConfigError } from "../../../../components/login/gateway/firebaseConfig";

const DEV_ENV = { DEV: true, PROD: false, MODE: "development" } as const;
const TEST_ENV = { DEV: false, PROD: false, MODE: "test" } as const;
const PROD_ENV = { DEV: false, PROD: true, MODE: "production" } as const;

const FIREBASE_ENV = {
  VITE_FIREBASE_API_KEY: "k",
  VITE_FIREBASE_AUTH_DOMAIN: "x.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "x",
  VITE_FIREBASE_APP_ID: "1:2:web:3",
};

const without = (env: Record<string, string>, key: string): Record<string, string> =>
  Object.fromEntries(Object.entries(env).filter(([name]) => name !== key));

describe("G9 — createAuthGateway(env)", () => {
  it("DEV → MockAuthGateway", async () => {
    expect(await createAuthGateway(DEV_ENV)).toBeInstanceOf(MockAuthGateway);
  });

  it("teste → MockAuthGateway", async () => {
    expect(await createAuthGateway(TEST_ENV)).toBeInstanceOf(MockAuthGateway);
  });

  it("PROD com config Firebase completa → FirebaseAuthGateway", async () => {
    expect(await createAuthGateway({ ...PROD_ENV, ...FIREBASE_ENV })).toBeInstanceOf(
      FirebaseAuthGateway,
    );
  });

  it("PROD sem config → lança erro de configuração, sem cair no mock", async () => {
    await expect(createAuthGateway(PROD_ENV)).rejects.toThrow(AuthConfigError);
  });

  it("PROD com config parcial → lança, nomeando a variável faltante", async () => {
    const partial = without(FIREBASE_ENV, "VITE_FIREBASE_APP_ID");
    await expect(createAuthGateway({ ...PROD_ENV, ...partial })).rejects.toThrow(
      /VITE_FIREBASE_APP_ID/,
    );
  });

  it("cada chamada devolve uma instância nova (sem singleton escondido)", async () => {
    const a = await createAuthGateway(DEV_ENV);
    const b = await createAuthGateway(DEV_ENV);
    expect(a).not.toBe(b);
  });
});