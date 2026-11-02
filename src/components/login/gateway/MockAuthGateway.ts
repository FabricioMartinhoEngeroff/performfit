import type { AuthError } from "../domain/authErrors";
import { err, ok, type Result } from "../domain/result";
import { parseEmail, signUpSchema } from "../domain/schemas";
import { isRole, type AuthUser } from "../domain/types";
import {
  DEFAULT_ITERATIONS,
  hashPassword,
  needsRehash,
  verifyPassword,
  type PasswordRecord,
} from "../crypto/passwordHash";
import type { AuthGateway, SignInInput, SignUpInput } from "./AuthGateway";

export const MOCK_USERS_KEY = "gw-auth-users";
export const MOCK_SESSION_KEY = "gw-auth-session";
export const MOCK_LOGOUT_BROADCAST_KEY = "gw-auth-logout";
/** D5: a sessão mock expira em 8h. */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  salt: string;
  iterations: number;
}

export interface DevAdmin {
  email: string;
  password: string;
}

interface MockOptions {
  now?: () => number;
  iterations?: number;
  /** Conta admin fixa de desenvolvimento (vem do .env.local, só no `vite dev`). */
  devAdmin?: DevAdmin | null;
}

const isStoredUser = (v: unknown): v is StoredUser => {
  if (typeof v !== "object" || v === null) return false;
  const u = v as Record<string, unknown>;
  return (
    typeof u.id === "string" &&
    typeof u.name === "string" &&
    typeof u.email === "string" &&
    typeof u.passwordHash === "string" &&
    typeof u.salt === "string" &&
    typeof u.iterations === "number"
  );
};

const toRecord = (u: StoredUser): PasswordRecord => ({
  hash: u.passwordHash,
  salt: u.salt,
  iterations: u.iterations,
});

const toUser = (u: StoredUser): AuthUser =>
  Object.freeze({ id: u.id, name: u.name, email: u.email, role: isRole(u.role) ? u.role : "user" });

/** Gateway de desenvolvimento/teste (D9): usuários locais com senha em PBKDF2. */
export class MockAuthGateway implements AuthGateway {
  private readonly now: () => number;
  private readonly iterations: number;
  private readonly devAdmin: DevAdmin | null;
  private queue: Promise<unknown> = Promise.resolve();
  private dummy: Promise<PasswordRecord> | null = null;

  constructor(opts: MockOptions = {}) {
    this.now = opts.now ?? (() => Date.now());
    this.iterations = opts.iterations ?? DEFAULT_ITERATIONS;
    const adminEmail = opts.devAdmin ? parseEmail(opts.devAdmin.email) : null;
    this.devAdmin =
      adminEmail?.ok && opts.devAdmin?.password ? { email: adminEmail.value, password: opts.devAdmin.password } : null;
  }

  /** Garante a conta admin fixa: cria se não existir, ou promove a existente mantendo o id (e os dados). */
  private ensureDevAdmin(admin: DevAdmin): Promise<void> {
    return this.serialize(async () => {
      const record = await hashPassword(admin.password, this.iterations);
      const users = this.readUsers();
      const idx = users.findIndex((u) => u.email === admin.email);
      const base = idx >= 0 ? users[idx]! : { id: crypto.randomUUID(), name: "Admin", email: admin.email };
      const stored: StoredUser = {
        ...base,
        role: "admin",
        passwordHash: record.hash,
        salt: record.salt,
        iterations: record.iterations,
      };
      if (idx >= 0) users[idx] = stored;
      else users.push(stored);
      this.writeUsers(users);
    });
  }

  /** Serializa leituras-e-escritas para que cadastros simultâneos não se atropelem. */
  private serialize<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private readUsers(): StoredUser[] {
    const raw = localStorage.getItem(MOCK_USERS_KEY);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isStoredUser) : [];
    } catch {
      return [];
    }
  }

  private writeUsers(users: StoredUser[]) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  }

  private startSession(userId: string) {
    sessionStorage.setItem(
      MOCK_SESSION_KEY,
      JSON.stringify({ userId, expiresAt: this.now() + SESSION_TTL_MS }),
    );
  }

  private clearSession() {
    try {
      sessionStorage.removeItem(MOCK_SESSION_KEY);
    } catch {
      /* storage indisponível: nada a limpar */
    }
  }

  private dummyRecord(): Promise<PasswordRecord> {
    this.dummy ??= hashPassword("senha-ficticia", this.iterations);
    return this.dummy;
  }

  signUp(input: SignUpInput): Promise<Result<AuthUser, AuthError>> {
    return this.serialize(async () => {
      try {
        const parsed = signUpSchema.safeParse(input);
        if (!parsed.success) return err("INVALID_INPUT" as const);
        const { email, password } = parsed.data;

        const users = this.readUsers();
        if (users.some((u) => u.email === email)) return err("EMAIL_IN_USE" as const);

        const record = await hashPassword(password, this.iterations);
        const stored: StoredUser = {
          id: crypto.randomUUID(),
          name: "", // o cadastro não pede nome
          email,
          role: "user",
          passwordHash: record.hash,
          salt: record.salt,
          iterations: record.iterations,
        };
        this.writeUsers([...users, stored]);
        this.startSession(stored.id);
        return ok(toUser(stored));
      } catch {
        return err("UNKNOWN" as const);
      }
    });
  }

  async signIn(input: SignInInput): Promise<Result<AuthUser, AuthError>> {
    try {
      const email = parseEmail(input?.email);
      const password = typeof input?.password === "string" ? input.password : "";
      const admin = this.devAdmin;
      if (admin && email.ok && email.value === admin.email && password === admin.password) {
        await this.ensureDevAdmin(admin);
      }
      const found = email.ok ? this.readUsers().find((u) => u.email === email.value) : undefined;

      // Hash fictício quando o usuário não existe: iguala o tempo de resposta.
      const valid = await verifyPassword(password, found ? toRecord(found) : await this.dummyRecord());
      if (!found || !valid) return err("INVALID_CREDENTIALS");

      if (needsRehash(toRecord(found), this.iterations)) await this.rehash(found.id, password);
      this.startSession(found.id);
      return ok(toUser(found));
    } catch {
      return err("UNKNOWN");
    }
  }

  private async rehash(userId: string, password: string) {
    try {
      const record = await hashPassword(password, this.iterations);
      await this.serialize(async () => {
        const users = this.readUsers();
        const idx = users.findIndex((u) => u.id === userId);
        if (idx < 0) return;
        users[idx] = { ...users[idx]!, passwordHash: record.hash, salt: record.salt, iterations: record.iterations };
        this.writeUsers(users);
      });
    } catch {
      /* o login continua válido mesmo sem conseguir atualizar o hash */
    }
  }

  async restore(): Promise<AuthUser | null> {
    try {
      const raw = sessionStorage.getItem(MOCK_SESSION_KEY);
      if (raw === null) return null;

      let session: unknown;
      try {
        session = JSON.parse(raw);
      } catch {
        session = null;
      }
      const s = session as { userId?: unknown; expiresAt?: unknown } | null;
      if (
        typeof s !== "object" ||
        s === null ||
        typeof s.userId !== "string" ||
        typeof s.expiresAt !== "number" ||
        this.now() >= s.expiresAt
      ) {
        this.clearSession();
        return null;
      }

      const user = this.readUsers().find((u) => u.id === s.userId);
      if (!user) {
        this.clearSession();
        return null;
      }
      return toUser(user);
    } catch {
      return null;
    }
  }

  async signOut(): Promise<void> {
    this.clearSession();
    try {
      // Sinal para as outras abas (só o localStorage dispara `storage` entre abas).
      localStorage.setItem(MOCK_LOGOUT_BROADCAST_KEY, String(this.now()));
    } catch {
      /* sem broadcast */
    }
  }

  onAuthChange(cb: (user: AuthUser | null) => void): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key !== MOCK_LOGOUT_BROADCAST_KEY || e.newValue === null) return;
      this.clearSession();
      cb(null);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }

  async sendPasswordReset(): Promise<Result<void, AuthError>> {
    return ok(undefined);
  }
}
