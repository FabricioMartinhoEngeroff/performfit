import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  type Auth,
  type User,
} from "firebase/auth";
import type { AuthError } from "../domain/authErrors";
import { err, ok, type Result } from "../domain/result";
import { parseEmail } from "../domain/schemas";
import { isRole, type AuthUser, type Role } from "../domain/types";
import type { AuthGateway, SignInInput, SignUpInput } from "./AuthGateway";

const ERROR_MAP: Record<string, AuthError> = {
  "auth/invalid-credential": "INVALID_CREDENTIALS",
  "auth/wrong-password": "INVALID_CREDENTIALS",
  "auth/user-not-found": "INVALID_CREDENTIALS",
  "auth/invalid-email": "INVALID_CREDENTIALS",
  "auth/too-many-requests": "TOO_MANY_ATTEMPTS",
  "auth/network-request-failed": "NETWORK",
  "auth/email-already-in-use": "EMAIL_IN_USE",
  "auth/weak-password": "WEAK_PASSWORD",
};

/** Nunca repassa a mensagem do SDK: só o código, traduzido. */
function mapError(error: unknown): AuthError {
  const code = typeof error === "object" && error !== null ? (error as { code?: unknown }).code : undefined;
  return (typeof code === "string" && ERROR_MAP[code]) || "UNKNOWN";
}

async function readRole(user: User): Promise<Role> {
  try {
    const { claims } = await user.getIdTokenResult();
    return isRole(claims.role) ? claims.role : "user";
  } catch {
    return "user";
  }
}

async function toUser(user: User): Promise<AuthUser> {
  return {
    id: user.uid,
    name: user.displayName ?? "",
    email: user.email ?? "",
    role: await readRole(user),
  };
}

export class FirebaseAuthGateway implements AuthGateway {
  private persistence: Promise<void> | null = null;

  constructor(private readonly auth: Auth) {}

  /** D5: sessão vale só enquanto a aba/janela existir; configurada antes do login. */
  private ensurePersistence(): Promise<void> {
    this.persistence ??= setPersistence(this.auth, browserSessionPersistence).catch(() => undefined);
    return this.persistence;
  }

  async signIn(input: SignInInput): Promise<Result<AuthUser, AuthError>> {
    const email = parseEmail(input.email);
    if (!email.ok) return err("INVALID_CREDENTIALS");
    try {
      await this.ensurePersistence();
      const cred = await signInWithEmailAndPassword(this.auth, email.value, input.password);
      return ok(await toUser(cred.user));
    } catch (e) {
      return err(mapError(e));
    }
  }

  async signUp(input: SignUpInput): Promise<Result<AuthUser, AuthError>> {
    const email = parseEmail(input.email);
    if (!email.ok) return err("INVALID_INPUT");
    try {
      await this.ensurePersistence();
      // Só e-mail e senha: nenhum outro dado pessoal vai para o Firebase.
      const cred = await createUserWithEmailAndPassword(this.auth, email.value, input.password);
      return ok(await toUser(cred.user));
    } catch (e) {
      return err(mapError(e));
    }
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }

  restore(): Promise<AuthUser | null> {
    return new Promise((resolve) => {
      const sub: { off?: () => void } = {};
      let done = false;
      const finish = async (user: User | null) => {
        if (done) return;
        done = true;
        sub.off?.();
        resolve(user ? await toUser(user) : null);
      };
      sub.off = onAuthStateChanged(this.auth, (u) => void finish(u), () => void finish(null));
      if (done) sub.off();
    });
  }

  onAuthChange(cb: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, (u) => {
      void (u ? toUser(u) : Promise.resolve(null)).then(cb);
    });
  }

  async sendPasswordReset(rawEmail: string): Promise<Result<void, AuthError>> {
    const email = parseEmail(rawEmail);
    if (!email.ok) return err("INVALID_INPUT");
    try {
      await sendPasswordResetEmail(this.auth, email.value);
      return ok(undefined);
    } catch (e) {
      const code = (e as { code?: unknown } | null)?.code;
      if (code === "auth/user-not-found") return ok(undefined); // não revela se o e-mail existe
      return err(mapError(e));
    }
  }
}
