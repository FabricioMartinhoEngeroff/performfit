/** Artefatos do login antigo: token falso, e-mail em claro e usuários com senha em texto. */
const LEGACY_KEYS = ["token", "email", "newUser", "mock-users"] as const;

export function purgeLegacyAuthArtifacts(): void {
  for (const store of [localStorage, sessionStorage]) {
    for (const key of LEGACY_KEYS) {
      try {
        store.removeItem(key);
      } catch {
        /* storage indisponível */
      }
    }
  }
}
