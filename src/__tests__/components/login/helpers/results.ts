type Outcome<T> = { ok: true; value: T } | { ok: false; error: unknown };

export function unwrap<T>(result: Outcome<T>): T {
  if (!result.ok) throw new Error(`esperava ok, mas veio erro: ${String(result.error)}`);
  return result.value;
}