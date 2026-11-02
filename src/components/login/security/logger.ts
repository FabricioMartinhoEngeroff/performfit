const SENSITIVE_KEY = /^(password|senha|token|authorization|cpf)$/i;
const EMAIL = /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

const maskEmails = (text: string) => text.replace(EMAIL, "$1***@$2");

/** Devolve uma cópia sem segredos e com e-mails mascarados. Não muta a entrada. */
export function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") return maskEmails(value);
  if (typeof value !== "object" || value === null) return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (value instanceof Error) return { name: value.name, message: maskEmails(value.message) };
  if (Array.isArray(value)) return value.map((item) => sanitize(item, seen));

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? "[REDACTED]" : sanitize(v, seen);
  }
  return out;
}

/** Só loga em DEV; em produção fica silencioso. */
export function logAuthError(context: string, error: unknown): void {
  if (!import.meta.env.DEV) return;
  console.error(`[auth] ${context}`, sanitize(error));
}
