import type { Execucao } from "./execucoes";

// ─── Regras de hábito do PerformFit ───────────────────────────────────────────
// Semana = segunda a domingo. Treino = sessão + data com pelo menos 1 série feita.
// Semana completa = treinos >= dias por semana da planilha (RN-03.1, RN-06.2).
// Sequência = semanas completas seguidas; a semana atual ainda em andamento não quebra.
// Folga: a primeira semana incompleta de cada mês (mês da segunda-feira) não quebra
// a sequência, mas também não soma. Total de semanas completas nunca diminui.

export type Granularidade = "semana" | "mes" | "ano";
export type StatusSemana = "completa" | "folga" | "incompleta" | "atual";

export interface SemanaInfo {
  inicioTs: number;
  treinos: number;
  status: StatusSemana;
}

export interface ResumoSequencia {
  atual: number;
  recorde: number;
  total: number;
  semanaAtual: { treinos: number; meta: number; completa: boolean };
  semanas: SemanaInfo[];
}

export interface Periodo {
  inicioTs: number;
  fimTs: number; // exclusivo
  label: string;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function inicioDaSemana(ts: number): number {
  const d = new Date(ts);
  const desdeSegunda = (d.getDay() + 6) % 7; // seg=0 … dom=6
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - desdeSegunda).getTime();
}

function somarDias(ts: number, dias: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias).getTime();
}

const ddmm = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/** Período que contém `ts`, deslocado `deslocamento` períodos (−1 = anterior). */
export function periodo(tipo: Granularidade, ts: number, deslocamento = 0): Periodo {
  const d = new Date(ts);
  if (tipo === "semana") {
    const inicioTs = somarDias(inicioDaSemana(ts), deslocamento * 7);
    const fimTs = somarDias(inicioTs, 7);
    return { inicioTs, fimTs, label: `${ddmm(inicioTs)} – ${ddmm(somarDias(inicioTs, 6))}` };
  }
  if (tipo === "mes") {
    const inicio = new Date(d.getFullYear(), d.getMonth() + deslocamento, 1);
    return {
      inicioTs: inicio.getTime(),
      fimTs: new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1).getTime(),
      label: `${MESES[inicio.getMonth()]} ${inicio.getFullYear()}`,
    };
  }
  const ano = d.getFullYear() + deslocamento;
  return { inicioTs: new Date(ano, 0, 1).getTime(), fimTs: new Date(ano + 1, 0, 1).getTime(), label: String(ano) };
}

/** Chaves "sessão|data" dos treinos com pelo menos uma série feita, agrupadas pela segunda-feira. */
function treinosPorSemana(execs: Execucao[]): Map<number, Set<string>> {
  const mapa = new Map<number, Set<string>>();
  for (const e of execs) {
    if (e.seriesFeitas <= 0) continue;
    const semana = inicioDaSemana(e.dataTs);
    let treinos = mapa.get(semana);
    if (!treinos) mapa.set(semana, (treinos = new Set()));
    treinos.add(`${e.sessaoId}|${e.data}`);
  }
  return mapa;
}

/** Treinos (sessão + data com série feita) em [deTs, ateTs). */
export function treinosNoPeriodo(execs: Execucao[], deTs: number, ateTs: number): number {
  const chaves = new Set<string>();
  for (const e of execs) {
    if (e.seriesFeitas > 0 && e.dataTs >= deTs && e.dataTs < ateTs) chaves.add(`${e.sessaoId}|${e.data}`);
  }
  return chaves.size;
}

export function treinosNaSemana(execs: Execucao[], ts: number): number {
  return treinosPorSemana(execs).get(inicioDaSemana(ts))?.size ?? 0;
}

/** Séries feitas por grupo em [deTs, ateTs), maior primeiro. `incluir` força grupos com 0. */
export function seriesPorGrupo(
  execs: Execucao[],
  deTs: number,
  ateTs: number,
  incluir: string[] = [],
): { grupo: string; series: number }[] {
  const soma = new Map<string, number>(incluir.map((g) => [g, 0]));
  for (const e of execs) {
    if (e.dataTs < deTs || e.dataTs >= ateTs || e.seriesFeitas <= 0) continue;
    soma.set(e.grupo, (soma.get(e.grupo) ?? 0) + e.seriesFeitas);
  }
  return [...soma.entries()]
    .map(([grupo, series]) => ({ grupo, series }))
    .sort((a, b) => b.series - a.series);
}

export function resumoSequencia(execs: Execucao[], meta: number, hojeTs = Date.now()): ResumoSequencia {
  const porSemana = treinosPorSemana(execs);
  const semanaHoje = inicioDaSemana(hojeTs);
  const treinosHoje = porSemana.get(semanaHoje)?.size ?? 0;
  const semanaAtual = { treinos: treinosHoje, meta, completa: treinosHoje >= meta };

  const comTreino = [...porSemana.keys()];
  if (comTreino.length === 0) return { atual: 0, recorde: 0, total: 0, semanaAtual, semanas: [] };

  const semanas: SemanaInfo[] = [];
  const folgaUsada = new Set<string>();
  let corrente = 0;
  let recorde = 0;
  let total = 0;

  for (let s = Math.min(...comTreino); s <= semanaHoje; s = somarDias(s, 7)) {
    const treinos = porSemana.get(s)?.size ?? 0;
    let status: StatusSemana;
    if (treinos >= meta) {
      status = "completa";
      corrente++;
      total++;
      recorde = Math.max(recorde, corrente);
    } else if (s === semanaHoje) {
      status = "atual";
    } else {
      const d = new Date(s);
      const mes = `${d.getFullYear()}-${d.getMonth()}`;
      if (!folgaUsada.has(mes)) {
        folgaUsada.add(mes);
        status = "folga";
      } else {
        status = "incompleta";
        corrente = 0;
      }
    }
    semanas.push({ inicioTs: s, treinos, status });
  }

  return { atual: corrente, recorde, total, semanaAtual, semanas };
}
