import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { setCurrentUser } from "../../../utils/storage";
import type { AuthUser, AuthState } from "../domain/types";
import type { AuthGateway, SignInInput, SignUpInput } from "../gateway/AuthGateway";
import { purgeLegacyAuthArtifacts } from "../security/legacyPurge";
import { AuthContext, type AuthContextValue } from "./AuthContext";

interface Props {
  gateway: AuthGateway;
  children: ReactNode;
}

export function AuthProvider({ gateway, children }: Props) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  // Define o escopo dos dados de treino antes de qualquer filho autenticado renderizar.
  const apply = useCallback((user: AuthUser | null) => {
    setCurrentUser(user ? user.id : null);
    setState(user ? { status: "authenticated", user } : { status: "anonymous" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    purgeLegacyAuthArtifacts();

    const unsubscribe = gateway.onAuthChange((user) => {
      if (!cancelled) apply(user);
    });
    gateway
      .restore()
      .catch(() => null)
      .then((user) => {
        if (!cancelled) apply(user);
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [gateway, apply]);

  const signIn = useCallback(
    async (input: SignInInput) => {
      const result = await gateway.signIn(input);
      if (result.ok) apply(result.value);
      return result;
    },
    [gateway, apply],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const result = await gateway.signUp(input);
      if (result.ok) apply(result.value);
      return result;
    },
    [gateway, apply],
  );

  const signOut = useCallback(async () => {
    try {
      await gateway.signOut();
    } finally {
      apply(null);
    }
  }, [gateway, apply]);

  const sendPasswordReset = useCallback((email: string) => gateway.sendPasswordReset(email), [gateway]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: state.status === "authenticated" ? state.user : null,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
    }),
    [state, signIn, signUp, signOut, sendPasswordReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
