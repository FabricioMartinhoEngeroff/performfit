import { useSyncExternalStore } from "react";
import { vi } from "vitest";
import type { AuthState } from "../../../../components/login/domain/types";

export const authActions = {
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  sendPasswordReset: vi.fn(),
};

const toValue = (state: AuthState) => ({
  ...state,
  user: state.status === "authenticated" ? state.user : null,
  ...authActions,
});

const listeners = new Set<() => void>();
let current = toValue({ status: "loading" });

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => current;

export function setAuthState(state: AuthState) {
  current = toValue(state);
  listeners.forEach((listener) => listener());
}

const useFakeAuth = () => useSyncExternalStore(subscribe, getSnapshot);

export const authModuleMock = { useAuth: useFakeAuth };