export const REQUIRED_FIREBASE_ENV = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConfigError";
  }
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export function getFirebaseConfig(env: Record<string, unknown>): FirebaseConfig {
  const value = (key: (typeof REQUIRED_FIREBASE_ENV)[number]) => {
    const v = env[key];
    if (typeof v !== "string" || v.trim() === "") {
      throw new AuthConfigError(`Configuração do Firebase ausente: ${key}`);
    }
    return v.trim();
  };
  return {
    apiKey: value("VITE_FIREBASE_API_KEY"),
    authDomain: value("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: value("VITE_FIREBASE_PROJECT_ID"),
    appId: value("VITE_FIREBASE_APP_ID"),
  };
}
