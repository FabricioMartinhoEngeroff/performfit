/** D6: a partir da 5ª falha seguida, espera de 30s, dobrando até 300s. */
const FREE_FAILURES = 4;
const BASE_WAIT_SECONDS = 30;
const MAX_WAIT_SECONDS = 300;

export interface ThrottleCheck {
  canAttempt: boolean;
  retryAfterSeconds: number;
}

export interface LoginThrottle {
  check(email: string): ThrottleCheck;
  recordFailure(email: string): void;
  recordSuccess(email: string): void;
}

interface Entry {
  failures: number;
  blockedUntil: number;
}

const normalize = (email: string) => email.trim().toLowerCase();

/** Estado só em memória (UX, não segurança): o servidor é quem realmente limita. */
export function createLoginThrottle(
  { now = () => performance.now() }: { now?: () => number } = {},
): LoginThrottle {
  const entries = new Map<string, Entry>();

  return {
    check(email) {
      const entry = entries.get(normalize(email));
      const remainingMs = entry ? entry.blockedUntil - now() : 0;
      if (remainingMs > 0) return { canAttempt: false, retryAfterSeconds: Math.ceil(remainingMs / 1000) };
      return { canAttempt: true, retryAfterSeconds: 0 };
    },

    recordFailure(email) {
      const key = normalize(email);
      const entry = entries.get(key) ?? { failures: 0, blockedUntil: 0 };
      entry.failures += 1;
      if (entry.failures > FREE_FAILURES) {
        const wait = Math.min(BASE_WAIT_SECONDS * 2 ** (entry.failures - FREE_FAILURES - 1), MAX_WAIT_SECONDS);
        entry.blockedUntil = now() + wait * 1000;
      }
      entries.set(key, entry);
    },

    recordSuccess(email) {
      entries.delete(normalize(email));
    },
  };
}

/** Instância compartilhada: remontar a tela não zera o contador. */
export const sharedLoginThrottle = createLoginThrottle();
