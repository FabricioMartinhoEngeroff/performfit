// helpers/fakeGateway.ts
import { vi } from "vitest";
import type { AuthGateway } from "../../../../components/login/gateway/AuthGateway";
import type { AuthUser } from "../../../../components/login/domain/types";
import { ok } from "../../../../components/login/domain/result";
import { ANA_EMAIL, ANA_NAME } from "./fixtures";

export { deferred } from "./deferred";

export const ANA: AuthUser = Object.freeze({
  id: "11111111-1111-4111-8111-111111111111",
  name: ANA_NAME,
  email: ANA_EMAIL,
  role: "user",
});

export const ADMIN: AuthUser = Object.freeze({
  id: "22222222-2222-4222-8222-222222222222",
  name: "Admin",
  email: "admin@example.com",
  role: "admin",
});

type AuthChangeListener = (user: AuthUser | null) => void;
type AnyMock = ReturnType<typeof vi.fn>;

export type FakeGateway = AuthGateway & Record<keyof AuthGateway, AnyMock>;

export function createFakeGateway(overrides: Partial<AuthGateway> = {}) {
  let listener: AuthChangeListener | null = null;
  const unsubscribe = vi.fn(() => {
    listener = null;
  });

  const gateway = {
    signIn: vi.fn(async () => ok(ANA)),
    signUp: vi.fn(async () => ok(ANA)),
    signOut: vi.fn(async () => undefined),
    restore: vi.fn(async () => null as AuthUser | null),
    sendPasswordReset: vi.fn(async () => ok(undefined)),
    onAuthChange: vi.fn((cb: AuthChangeListener) => {
      listener = cb;
      return unsubscribe;
    }),
    ...overrides,
  } as unknown as FakeGateway;

  return {
    gateway,
    unsubscribe,
    emitAuthChange: (u: AuthUser | null) => listener?.(u),
  };
}