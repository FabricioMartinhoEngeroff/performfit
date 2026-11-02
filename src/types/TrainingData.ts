
export interface RegistroTreino {
  data: string;
  pesos?: string[];
  reps?: string[];
  obs?: string;
  exercicio?: string;
}

export type DadosTreino = {
  [exercicio: string]: {
    [ciclo: string]: RegistroTreino;
  };
};

export interface SerieInfo {
  serie: number;
  rep: string;
  peso: string;
}

export interface LinhaRelatorio {
  data: string;
  exercicio: string;
  cicloKey: string;
  ciclo: string;
  series: SerieInfo[];
  obs?: string;
}

/** 1 = só TS1 | 2 = TS1+TS2 | 3 = TS1+TS2+Back-off (~90%) | 4 = TS1+TS2+Série 3+Série 4 (sem redução). */
export type SeriesValidas = 1 | 2 | 3 | 4;

// ── New Saizen logbook types ────────────────────────────────────────────────

export interface RegistroExercicio {
  exercicio: string;
  treinoId: string; // "UA", "UB", "LA", "LB", "BR"
  data: string; // "DD/MM/YYYY"
  dataTs: number;

  // ── Modelo de séries v6 ────────────────────────────────────────────────────
  // Os 3 slots de carga abaixo mapeiam para os blocos da UI assim (sem migração
  // de dados — nomes de campo mantidos por compatibilidade):
  //   topSetKg/Reps  = Top Set 1
  //   backoffKg/Reps = Top Set 2  (sempre presente; pesado, na faixa do Top Set)
  //   extraKg/Reps   = Back-off   (~90% da carga) quando seriesValidas === 3;
  //                    Série 3 (mesma carga do último treino) quando seriesValidas === 4
  //   serie4Kg/Reps  = Série 4    (só quando seriesValidas === 4)
  // O volume soma os 3 slots; a contagem de séries válidas conta cada slot
  // preenchido, então 2 válidas = TS1+TS2 e 3 válidas = TS1+TS2+Back-off.

  // Top Set 1
  topSetKg: number;
  topSetReps: number;
  topSetFaixaMin: number;
  topSetFaixaMax: number;
  topSetBateuTeto: boolean; // reps >= faixaMax -> sobe peso

  // Top Set 2 (slot histórico "backoff")
  backoffKg: number;
  backoffReps: number;
  backoffFaixaMin: number;
  backoffFaixaMax: number;

  tecnica?: "RP" | null;
  // Cluster Set: cada série cluster é um grupo de blocos (kg×reps). Série 1 fica
  // em clusterSeries; a Série 2 em clusterSeries2 (registros antigos têm só a 1).
  // O volume soma todos os blocos das duas; cada série não-vazia conta como 1
  // série válida nos contadores.
  clusterSeries?: { kg: number; reps: number }[];
  clusterSeries2?: { kg: number; reps: number }[];

  // Series count (read from import spreadsheet, persisted per registro)
  seriesValidas: SeriesValidas;

  // Slot histórico "extra": Back-off (~90%, até a falha) com 3 válidas; Série 3 com 4 válidas
  extraKg?: number;
  extraReps?: number;

  // Série 4 — só quando seriesValidas === 4
  serie4Kg?: number;
  serie4Reps?: number;

  // Progression
  pesoAnterior?: number;
  repsAnterior?: number;
  progrediu: boolean; // true if topSetKg > pesoAnterior
  isDeload?: boolean;

  obs?: string;
}

// Visão agrupada por exercício usada pelo app. No localStorage o histórico fica
// na chave "registros" (lista plana, ver utils/registros.ts); o Logbook é montado dela.
export type Logbook = Record<string, RegistroExercicio[]>;

// ── Legacy plan type (kept for backward compatibility) ──────────────────────

export interface PlanoExercicio {
  ordem: number;
  series_validas: number;
  series_C1?: number;
  series_C2?: number;
  series_C3?: number;
  series_C4?: number;
}

export type PlanoTreino = {
  [sessao: string]: {
    [exercicio: string]: PlanoExercicio;
  };
};
