const DEFAULT_REDIRECT = "/app";

/** Só aceita caminhos internos (começam com uma única "/"); o resto cai em /app. */
export function safeRedirect(target: unknown): string {
  if (typeof target !== "string") return DEFAULT_REDIRECT;
  return /^\/[^\s\\/][^\s\\]*$/.test(target) ? target : DEFAULT_REDIRECT;
}
