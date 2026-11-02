import { EXERCICIOS } from "../data/exercise";
import { MESMO_EXERCICIO } from "../data/exerciseAliases";
import { EXERCISE_VIDEOS } from "../data/exerciseVideos";
import { MUSCLE_MAP } from "../data/muscleMap";
import { SESSOES } from "../data/sessionExercises";
import type { Logbook, RegistroExercicio, SeriesValidas } from "../types/TrainingData";

// ─── Formato v3 do histórico ──────────────────────────────────────────────────
// Uma lista plana, um registro por exercício por treino, sempre acrescentada
// (nunca sobrescrita). Só guarda o que não dá para deduzir: dataTs, progressão,
// pesoAnterior etc. são recalculados ao converter para RegistroExercicio.

export type TipoSerie = "top1" | "top2" | "backoff" | "serie3" | "serie4" | "cluster1" | "cluster2";

export interface Serie {
  tipo: TipoSerie;
  kg: number;
  reps: number;
}

export interface Registro {
  id: string; // "2026-10-13_UA_supino_reto_barra"
  data: string; // "YYYY-MM-DD"
  sessao: string; // "UA", "UB", "LA", "LB"…
  exercicio: string; // slug: "supino_reto_barra"
  nome?: string; // nome legível ("Supino reto barra"); falta só em registros antigos (ver comNome)
  series: Serie[]; // série não feita não aparece
  faixa?: [number, number]; // faixa de reps dos Top Sets
  faixaBackoff?: [number, number];
  validas?: SeriesValidas; // só quando não dá para deduzir das séries
  bateuTeto?: boolean; // só quando difere da regra (reps do Top Set 1 >= teto da faixa)
  tecnica?: "RP";
  deload?: true;
  obs?: string;
}

// ─── Exercício: slug ↔ nome do catálogo ───────────────────────────────────────

function slugBruto(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Sem separadores, "Pull-down", "Pull down" e "Pulldown" caem na mesma entrada.
const compacto = (slug: string) => slug.replace(/_/g, "");

let catalogo: Map<string, { slug: string; nome: string }> | null = null;

function getCatalogo() {
  if (catalogo) return catalogo;
  catalogo = new Map();
  const nomes = [
    ...EXERCICIOS,
    ...Object.values(SESSOES).flatMap((lista) => lista.map((e) => e.nome)),
    ...Object.keys(MUSCLE_MAP),
    ...Object.keys(EXERCISE_VIDEOS),
  ];
  for (const nome of nomes) {
    const slug = slugBruto(nome);
    if (!catalogo.has(compacto(slug))) catalogo.set(compacto(slug), { slug, nome });
  }
  // Outro nome para o mesmo exercício aponta para a entrada do catálogo.
  for (const [alias, nome] of Object.entries(MESMO_EXERCICIO)) {
    const destino = catalogo.get(compacto(slugBruto(nome)));
    const chave = compacto(slugBruto(alias));
    if (destino && !catalogo.has(chave)) catalogo.set(chave, destino);
  }
  return catalogo;
}

const doCatalogo = (nomeOuSlug: string) => getCatalogo().get(compacto(slugBruto(nomeOuSlug)));

export function slugExercicio(nome: string): string {
  return doCatalogo(nome)?.slug ?? slugBruto(nome);
}

export function nomeExercicio(slug: string, nomeGuardado?: string): string {
  return doCatalogo(slug)?.nome ?? nomeGuardado ?? slug;
}

/** Registro gravado antes de o nome ser sempre guardado ganha o nome do catálogo. */
export function comNome(reg: Registro): Registro {
  return reg.nome ? reg : { ...reg, nome: nomeExercicio(reg.exercicio) };
}

// ─── Datas ────────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");

export function dataBRparaISO(data: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  const [d, m, y] = data.split("/").map(Number);
  if (!d || !m || !y) return data;
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function dataISOparaBR(data: string): string {
  const [y, m, d] = data.split("-").map(Number);
  if (!d || !m || !y) return data;
  return `${pad(d)}/${pad(m)}/${y}`;
}

function tsDeISO(data: string): number {
  const [y, m, d] = data.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d).getTime() : 0;
}

// ─── RegistroExercicio → Registro ─────────────────────────────────────────────

function normalizarValidas(v: unknown): SeriesValidas {
  return v === 1 || v === 3 || v === 4 ? v : 2;
}

function deduzirValidas(series: Serie[]): SeriesValidas {
  if (series.some((s) => s.tipo === "serie3" || s.tipo === "serie4")) return 4;
  if (series.some((s) => s.tipo === "backoff")) return 3;
  // só o Top Set 1 = 1 válida; cluster sem séries normais segue o padrão de 2
  if (series.length > 0 && series.every((s) => s.tipo === "top1")) return 1;
  return 2;
}

function deduzirTeto(series: Serie[], faixa: [number, number] | undefined, tecnica: unknown): boolean {
  const top1 = series.find((s) => s.tipo === "top1");
  return !tecnica && !!faixa && !!top1 && top1.reps >= faixa[1];
}

function faixaDe(min: unknown, max: unknown): [number, number] | undefined {
  return typeof min === "number" && typeof max === "number" && (min > 0 || max > 0) ? [min, max] : undefined;
}

export function paraRegistro(r: RegistroExercicio): Registro {
  const validas = normalizarValidas(r.seriesValidas);
  const series: Serie[] = [];
  const add = (tipo: TipoSerie, kg: unknown, reps: unknown) => {
    const k = Number(kg) || 0;
    const rp = Math.round(Number(reps) || 0);
    if (k > 0 || rp > 0) series.push({ tipo, kg: k, reps: rp });
  };
  add("top1", r.topSetKg, r.topSetReps);
  add("top2", r.backoffKg, r.backoffReps);
  add(validas === 4 ? "serie3" : "backoff", r.extraKg, r.extraReps);
  add("serie4", r.serie4Kg, r.serie4Reps);
  r.clusterSeries?.forEach((b) => add("cluster1", b.kg, b.reps));
  r.clusterSeries2?.forEach((b) => add("cluster2", b.kg, b.reps));

  const data = dataBRparaISO(r.data);
  const sessao = String(r.treinoId ?? "").trim();
  const exercicio = slugExercicio(r.exercicio);
  const faixa = faixaDe(r.topSetFaixaMin, r.topSetFaixaMax);
  const faixaBackoff = faixaDe(r.backoffFaixaMin, r.backoffFaixaMax);
  const obs = r.obs?.trim();

  return {
    id: `${data}_${sessao.replace(/\s+/g, "_")}_${exercicio}`,
    data,
    sessao,
    exercicio,
    nome: nomeExercicio(exercicio, r.exercicio), // legível para quem lê o JSON (pessoa ou IA)
    series,
    ...(faixa && { faixa }),
    ...(faixaBackoff && { faixaBackoff }),
    ...(validas !== deduzirValidas(series) && { validas }),
    ...(!!r.topSetBateuTeto !== deduzirTeto(series, faixa, r.tecnica) && { bateuTeto: !!r.topSetBateuTeto }),
    ...(r.tecnica && { tecnica: r.tecnica }),
    ...(r.isDeload && { deload: true as const }),
    ...(obs && { obs }),
  };
}

// ─── Registro → RegistroExercicio ─────────────────────────────────────────────

/** `anterior` é o treino anterior do mesmo exercício na mesma sessão (para a progressão). */
export function deRegistro(reg: Registro, anterior?: Registro): RegistroExercicio {
  const doTipo = (tipo: TipoSerie) => reg.series.filter((s) => s.tipo === tipo);
  const top1 = doTipo("top1")[0];
  const top2 = doTipo("top2")[0];
  const extra = doTipo("serie3")[0] ?? doTipo("backoff")[0];
  const serie4 = doTipo("serie4")[0];
  const blocos = (tipo: TipoSerie) => {
    const lista = doTipo(tipo).map(({ kg, reps }) => ({ kg, reps }));
    return lista.length > 0 ? lista : undefined;
  };
  const topAnterior = anterior?.series.find((s) => s.tipo === "top1");
  const topKg = top1?.kg ?? 0;

  return {
    exercicio: nomeExercicio(reg.exercicio, reg.nome),
    treinoId: reg.sessao,
    data: dataISOparaBR(reg.data),
    dataTs: tsDeISO(reg.data),
    topSetKg: topKg,
    topSetReps: top1?.reps ?? 0,
    topSetFaixaMin: reg.faixa?.[0] ?? 0,
    topSetFaixaMax: reg.faixa?.[1] ?? 0,
    topSetBateuTeto: reg.bateuTeto ?? deduzirTeto(reg.series, reg.faixa, reg.tecnica),
    backoffKg: top2?.kg ?? 0,
    backoffReps: top2?.reps ?? 0,
    backoffFaixaMin: reg.faixaBackoff?.[0] ?? 0,
    backoffFaixaMax: reg.faixaBackoff?.[1] ?? 0,
    seriesValidas: reg.validas ?? deduzirValidas(reg.series),
    extraKg: extra?.kg,
    extraReps: extra?.reps,
    serie4Kg: serie4?.kg,
    serie4Reps: serie4?.reps,
    tecnica: reg.tecnica,
    clusterSeries: blocos("cluster1"),
    clusterSeries2: blocos("cluster2"),
    pesoAnterior: anterior ? (topAnterior?.kg ?? 0) : undefined,
    repsAnterior: anterior ? (topAnterior?.reps ?? 0) : undefined,
    progrediu: anterior ? topKg > (topAnterior?.kg ?? 0) : false,
    isDeload: reg.deload ? true : undefined,
    obs: reg.obs,
  };
}

// ─── Lista ↔ Logbook ──────────────────────────────────────────────────────────

/** Ordem cronológica estável (registros do mesmo dia mantêm a ordem em que foram salvos). */
function cronologico<T>(itens: T[], dataDe: (item: T) => string): T[] {
  return itens
    .map((item, i) => ({ item, i, data: dataDe(item) }))
    .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.i - b.i))
    .map(({ item }) => item);
}

export function registrosParaLogbook(lista: Registro[]): Logbook {
  const convertidos = new Map<Registro, RegistroExercicio>();
  const ultimoDaSessao = new Map<string, Registro>();
  for (const reg of cronologico(lista, (r) => r.data)) {
    const chave = `${reg.exercicio}|${reg.sessao}`;
    convertidos.set(reg, deRegistro(reg, ultimoDaSessao.get(chave)));
    ultimoDaSessao.set(chave, reg);
  }

  const logbook: Logbook = {};
  for (const reg of lista) {
    const ex = convertidos.get(reg)!;
    (logbook[ex.exercicio] ??= []).push(ex);
  }
  return logbook;
}

/** Garante id único dentro da lista (mesmo exercício duas vezes no mesmo treino ganha sufixo). */
export function comIdUnico(reg: Registro, ids: Set<string>): Registro {
  let id = reg.id;
  for (let n = 2; ids.has(id); n++) id = `${reg.id}_${n}`;
  ids.add(id);
  return id === reg.id ? reg : { ...reg, id };
}

export function logbookParaRegistros(logbook: Logbook): Registro[] {
  const todos = Object.entries(logbook).flatMap(([exercicio, registros]) =>
    (Array.isArray(registros) ? registros : [])
      .filter((r) => typeof r === "object" && r !== null && typeof r.data === "string")
      .map((r) => ({ ...r, exercicio: r.exercicio || exercicio })),
  );
  const ids = new Set<string>();
  return cronologico(todos, (r) => dataBRparaISO(r.data)).map((r) => comIdUnico(paraRegistro(r), ids));
}

// ─── Validação (storage e importação) ─────────────────────────────────────────

const TIPOS = new Set<string>(["top1", "top2", "backoff", "serie3", "serie4", "cluster1", "cluster2"]);

function ehSerie(v: unknown): v is Serie {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return TIPOS.has(s.tipo as string) && typeof s.kg === "number" && typeof s.reps === "number";
}

export function ehRegistro(v: unknown): v is Registro {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.data === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(r.data) &&
    typeof r.sessao === "string" &&
    typeof r.exercicio === "string" &&
    Array.isArray(r.series) &&
    r.series.every(ehSerie)
  );
}

/** Mantém só registros válidos e com id único. */
export function sanitizarRegistros(v: unknown): Registro[] {
  if (!Array.isArray(v)) return [];
  const ids = new Set<string>();
  return v.filter(ehRegistro).map((r) => comIdUnico(r, ids));
}

// ─── Exportação CSV (uma linha por série) ─────────────────────────────────────

// Texto começando com = + - @ vira fórmula no Excel; o apóstrofo neutraliza.
const semFormula = (s: string) => (/^[=+\-@\t\r]/.test(s) ? `'${s}` : s);
const entreAspas = (s: string) => `"${s.replace(/"/g, '""')}"`;
const campo = (s: string) => {
  const limpo = semFormula(s);
  return /[",\n\r]/.test(limpo) || limpo !== s ? entreAspas(limpo) : limpo;
};

export function exportarCSV(registros: Registro[]): string {
  const linhas = ["data,sessao,exercicio,serie,tipo,kg,reps,obs"];
  for (const r of registros) {
    const nome = nomeExercicio(r.exercicio, r.nome);
    const obs = entreAspas(semFormula(r.obs ?? ""));
    r.series.forEach((s, i) => {
      linhas.push([r.data, campo(r.sessao), campo(nome), i + 1, s.tipo, s.kg, s.reps, obs].join(","));
    });
  }
  return linhas.join("\n");
}
