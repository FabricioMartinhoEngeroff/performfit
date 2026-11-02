import type { AuthGateway } from "./AuthGateway";
import { AuthConfigError, getFirebaseConfig } from "./firebaseConfig";

export interface AuthEnv {
  DEV?: boolean;
  PROD?: boolean;
  MODE?: string;
  [key: string]: unknown;
}

/**
 * D9: o mock só existe em DEV e teste; produção sem config Firebase falha ao iniciar.
 * Os imports dinâmicos mantêm o mock (e o PBKDF2 dele) fora do bundle de produção.
 */
export async function createAuthGateway(env: AuthEnv): Promise<AuthGateway> {
  if (env.DEV === true || env.MODE === "test") {
    if (import.meta.env.PROD) throw new AuthConfigError("O gateway mock não está disponível em produção.");
    const { MockAuthGateway } = await import("./MockAuthGateway");
    return new MockAuthGateway({ devAdmin: typeof __DEV_ADMIN__ === "undefined" ? null : __DEV_ADMIN__ });
  }

  const config = getFirebaseConfig(env);
  const [{ initializeApp }, { getAuth }, { FirebaseAuthGateway }] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("./FirebaseAuthGateway"),
  ]);
  return new FirebaseAuthGateway(getAuth(initializeApp(config)));
}
