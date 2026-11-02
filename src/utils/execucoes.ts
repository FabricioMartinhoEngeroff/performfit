import { storageKey } from "./storage";

// ─── Execuções (PerformFit) ───────────────────────────────────────────────────
// Registro enxuto do aluno: quantas séries válidas ele marcou em cada exercício
// de um treino. Não há peso nem repetições — o histórico de kg do GymWave
// (chave "registros") fica intocado.

export interface Execucao {
  exercicio: string;
  grupo: string;            // grupo muscular, guardado para o histórico não depender do plano atual
  sessao: string;           // rótulo do treino ("Upper A", "S1 Seg · Pull")
  sessaoId: string;         // id curto ("UA", "S1SEG")
  data: string;             // "DD/MM/YYYY"
  dataTs: number;
  seriesPlanejadas: number;
  seriesFeitas: number;
  obs?: string;
}

const CHAVE = "execucoes";

const texto = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const inteiro = (v: unknown, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(typeof v === "number" && Number.isFinite(v) ? v : 0)));

function sanitizar(v: unknown): Execucao | null {
  if (typeof v !== "object" || v === null) return null;
  const r = v as Record<string, unknown>;
  if (!texto(r.exercicio) || !texto(r.sessaoId) || !texto(r.data)) return null;
  if (typeof r.dataTs !== "number" || !Number.isFinite(r.dataTs)) return null;
  const planejadas = inteiro(r.seriesPlanejadas, 1, 10);
  return {
    exercicio: r.exercicio,
    grupo: texto(r.grupo) ? r.grupo : "Outros",
    sessao: texto(r.sessao) ? r.sessao : r.sessaoId,
    sessaoId: r.sessaoId,
    data: r.data,
    dataTs: r.dataTs,
    seriesPlanejadas: planejadas,
    seriesFeitas: inteiro(r.seriesFeitas, 0, planejadas),
    ...(texto(r.obs) ? { obs: r.obs } : {}),
  };
}

/** Lista vinda de storage ou de backup: descarta o que não é execução válida. */
export function sanitizarExecucoes(v: unknown): Execucao[] {
  return Array.isArray(v) ? v.map(sanitizar).filter((e): e is Execucao => e !== null) : [];
}

export function carregarExecucoes(): Execucao[] {
  try {
    return sanitizarExecucoes(JSON.parse(localStorage.getItem(storageKey(CHAVE)) ?? "[]"));
  } catch {
    return [];
  }
}

export function salvarExecucoes(lista: Execucao[]): void {
  localStorage.setItem(storageKey(CHAVE), JSON.stringify(lista));
}

/** Acrescenta as execuções de um treino ao histórico. */
export function registrarTreino(novas: Execucao[]): void {
  salvarExecucoes([...carregarExecucoes(), ...novas]);
}

export function existeTreinoNaData(sessaoId: string, data: string): boolean {
  return carregarExecucoes().some((e) => e.sessaoId === sessaoId && e.data === data);
}

export function removerTreinoNaData(sessaoId: string, data: string): void {
  salvarExecucoes(carregarExecucoes().filter((e) => !(e.sessaoId === sessaoId && e.data === data)));
}

export function ultimaDataDaSessao(sessaoId: string): string | null {
  let ultima: Execucao | null = null;
  for (const e of carregarExecucoes()) {
    if (e.sessaoId === sessaoId && (!ultima || e.dataTs > ultima.dataTs)) ultima = e;
  }
  return ultima?.data ?? null;
}
