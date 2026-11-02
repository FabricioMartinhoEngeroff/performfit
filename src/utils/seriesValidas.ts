import type { RegistroExercicio, SeriesValidas } from "../types/TrainingData";

// ─── Modelo de séries válidas ─────────────────────────────────────────────────
//   1 → só Top Set 1 (protocolos de 1 série até a falha)
//   2 → Top Set 1 + Top Set 2
//   3 → Top Set 1 + Top Set 2 + Back-off (~90% da carga, slot "extra")
//   4 → Top Set 1 + Top Set 2 + Série 3 (slot "extra") + Série 4 — sem redução de carga

/** Converte o valor vindo de planilha, plano ou rascunho; qualquer coisa fora de 1/3/4 vira 2. */
export function normalizarSeriesValidas(v: unknown): SeriesValidas {
  const n = typeof v === "string" ? Number(v.trim()) : v;
  return n === 1 || n === 3 || n === 4 ? n : 2;
}

export interface SugestaoUltimoTreino {
  topSetKg: string;
  topSetReps: string;
  backoffKg: string;
  backoffReps: string;
  extraKg: string;
  extraReps: string;
  serie4Kg: string;
  serie4Reps: string;
  backoffKgDoLogbook: boolean;
  extraKgDoLogbook: boolean;
}

const positivo = (n: number | undefined): n is number => typeof n === "number" && n > 0;
const texto = (n: number | undefined) => (positivo(n) ? String(n) : "");


export function sugestaoDoUltimoTreino(
    ultimo: RegistroExercicio,
  seriesValidas: SeriesValidas,
  backoffPct: number,
): SugestaoUltimoTreino {
  const topSetKg = texto(ultimo.topSetKg);
  const topSetReps = texto(ultimo.topSetReps);
  const sugestao: SugestaoUltimoTreino = {
    topSetKg,
    topSetReps,
    backoffKg: texto(ultimo.backoffKg) || topSetKg,
    backoffReps: texto(ultimo.backoffReps),
    extraKg: "",
    extraReps: "",
    serie4Kg: "",
    serie4Reps: "",
    backoffKgDoLogbook: positivo(ultimo.backoffKg),
    extraKgDoLogbook: false,
  };
  const eraQuatro = ultimo.seriesValidas === 4;

  if (seriesValidas === 3) {
    const backoffSalvo = eraQuatro ? "" : texto(ultimo.extraKg);
    const backoffCalculado = positivo(ultimo.topSetKg) ? String(Math.round(ultimo.topSetKg * backoffPct)) : "";
    sugestao.extraKg = backoffSalvo || backoffCalculado;
    sugestao.extraReps = eraQuatro ? "" : texto(ultimo.extraReps);
    sugestao.extraKgDoLogbook = backoffSalvo !== "";
  }

  if (seriesValidas === 4) {
    const kg = (v: number | undefined) => (eraQuatro && texto(v)) || topSetKg;
    const reps = (v: number | undefined) => (eraQuatro && texto(v)) || topSetReps;
    sugestao.extraKg = kg(ultimo.extraKg);
    sugestao.extraReps = reps(ultimo.extraReps);
    sugestao.serie4Kg = kg(ultimo.serie4Kg);
    sugestao.serie4Reps = reps(ultimo.serie4Reps);
  }

  return sugestao;
}

/** Volume (kg × reps) e séries válidas de um registro fora do Cluster Set. */
export function volumeESeriesDoRegistro(reg: RegistroExercicio): { volume: number; series: number } {
  const slots: [number | undefined, number | undefined][] = [
    [reg.topSetKg, reg.topSetReps],
    [reg.backoffKg, reg.backoffReps],
  ];
  if (reg.seriesValidas === 3 || reg.seriesValidas === 4) slots.push([reg.extraKg, reg.extraReps]);
  if (reg.seriesValidas === 4) slots.push([reg.serie4Kg, reg.serie4Reps]);

  let volume = 0;
  let series = 0;
  for (const [kg, reps] of slots) {
    if (positivo(kg) && positivo(reps)) {
      volume += kg * reps;
      series++;
    }
  }
  return { volume, series };
}
