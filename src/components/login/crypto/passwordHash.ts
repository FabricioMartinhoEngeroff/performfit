/** D8: PBKDF2-SHA-256 com salt de 16 bytes; 600.000 iterações por padrão. */
export const DEFAULT_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

export interface PasswordRecord {
  hash: string;
  salt: string;
  iterations: number;
}

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

/** Comparação em tempo constante em relação ao conteúdo. */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export async function hashPassword(
  password: string,
  iterations: number = DEFAULT_ITERATIONS,
): Promise<PasswordRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, iterations);
  return { hash: toBase64(hash), salt: toBase64(salt), iterations };
}

export async function verifyPassword(password: string, record: PasswordRecord): Promise<boolean> {
  try {
    const expected = fromBase64(record.hash);
    const actual = await derive(password, fromBase64(record.salt), record.iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function needsRehash(record: PasswordRecord, targetIterations: number): boolean {
  return record.iterations < targetIterations;
}
