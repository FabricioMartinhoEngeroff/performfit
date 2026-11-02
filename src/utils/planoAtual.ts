import { carregarPlano, type ExercicioPlano } from "./planoPerformfit";
import { storageKey } from "./storage";

// ─── Plano em uso pelas telas ─────────────────────────────────────────────────
// Vem só da planilha importada (RN-02.5): sem plano, não há treinos.

export function lerJSONObjeto<T extends object>(chave: string): T {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(storageKey(chave)) || "{}");
    return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

export function sessoesDoPlano(): string[] {
  return carregarPlano()?.treinos.map((t) => t.nome) ?? [];
}

export function carregarExercicios(treino: string): ExercicioPlano[] {
  return carregarPlano()?.treinos.find((t) => t.nome === treino)?.exercicios ?? [];
}

/** Grupos musculares do plano atual, na ordem em que aparecem. */
export function gruposDoPlano(): string[] {
  const grupos = new Set<string>();
  for (const t of carregarPlano()?.treinos ?? []) for (const ex of t.exercicios) grupos.add(ex.grupo);
  return [...grupos];
}
