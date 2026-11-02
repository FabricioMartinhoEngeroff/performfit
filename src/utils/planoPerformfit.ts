import type { Execucao } from "./execucoes";
import { storageKey } from "./storage";

// ─── Plano do PerformFit ──────────────────────────────────────────────────────
// Montado pelo professor na planilha padrão e importado pelo aluno.
// Regras: docs/REGRAS_DE_NEGOCIO.md (RN-01 a RN-03).

export interface ExercicioPlano {
  nome: string;
  grupo: string;
  series: number;       // séries válidas = checkboxes (1 a 6)
  repeticoes: string;   // texto livre: "10-12", "12", "30 segundos"
  comoFazer: string;
}

export interface TreinoPlano {
  nome: string;
  exercicios: ExercicioPlano[];
}

export interface Plano {
  importadoEm: string;
  treinos: TreinoPlano[];
}

export type LeituraPlanilha = { ok: true; plano: Plano } | { ok: false; erros: string[] };

export const MAX_SERIES = 6;
export const MAX_TREINOS = 7;
export const DIAS_SEM_PLANO = 3;

const CHAVE = "plano";

// ─── Leitura da planilha (RN-01, RN-02.2) ─────────────────────────────────────

type Coluna = "treino" | "ordem" | "exercicio" | "grupo" | "series" | "repeticoes" | "comoFazer";

const normalizar = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

function colunaDe(cabecalho: string): Coluna | null {
  const c = normalizar(cabecalho);
  if (c === "treino" || c === "dia") return "treino";
  if (c.startsWith("ordem") || c === "ord" || c === "ord.") return "ordem";
  if (c.startsWith("exercicio")) return "exercicio";
  if (c.includes("grupo") || c.includes("musculo")) return "grupo";
  if (c.startsWith("serie")) return "series";
  if (c.startsWith("repet") || c === "reps") return "repeticoes";
  if (c.startsWith("como") || c.includes("explica") || c.includes("orienta")) return "comoFazer";
  return null;
}

const texto = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

function mapearCabecalho(linha: unknown[]): Partial<Record<Coluna, number>> {
  const mapa: Partial<Record<Coluna, number>> = {};
  linha.forEach((cel, i) => {
    const col = colunaDe(String(cel ?? ""));
    if (col && mapa[col] === undefined) mapa[col] = i;
  });
  return mapa;
}

/** Lê as linhas da 1ª aba (`sheet_to_json(..., { header: 1 })`) e monta o plano ou a lista de erros. */
export function lerPlanilha(linhas: unknown[][], agora = new Date()): LeituraPlanilha {
  const idxCab = linhas.slice(0, 6).findIndex((l) => {
    const m = mapearCabecalho(l ?? []);
    return m.treino !== undefined && m.exercicio !== undefined;
  });
  if (idxCab < 0) return { ok: false, erros: ["Não encontrei as colunas Treino e Exercício."] };

  const col = mapearCabecalho(linhas[idxCab]!);
  if (col.grupo === undefined) return { ok: false, erros: ["Não encontrei a coluna Grupo muscular."] };
  if (col.series === undefined) return { ok: false, erros: ["Não encontrei a coluna Séries."] };

  const erros: string[] = [];
  const treinos = new Map<string, { nome: string; itens: { ex: ExercicioPlano; ordem: number; pos: number }[] }>();
  const celula = (l: unknown[], c: Coluna) => (col[c] === undefined ? "" : l[col[c]!]);

  linhas.slice(idxCab + 1).forEach((linha, i) => {
    const l = linha ?? [];
    if (l.every((c) => texto(c) === "")) return;
    const numLinha = idxCab + i + 2; // linha na planilha (1 = primeira)

    const treino = texto(celula(l, "treino"));
    const nome = texto(celula(l, "exercicio"));
    const grupo = texto(celula(l, "grupo"));
    const seriesTxt = texto(celula(l, "series"));
    const series = Number(seriesTxt);

    if (!treino) erros.push(`Linha ${numLinha}: falta o nome do treino.`);
    if (!nome) erros.push(`Linha ${numLinha}: falta o exercício.`);
    if (!grupo) erros.push(`Linha ${numLinha}: falta o grupo muscular.`);
    if (!seriesTxt || !Number.isInteger(series) || series < 1 || series > MAX_SERIES) {
      erros.push(`Linha ${numLinha}: o número de séries deve ser de 1 a ${MAX_SERIES}.`);
    }
    if (!treino || !nome || !grupo || !Number.isInteger(series) || series < 1 || series > MAX_SERIES) return;

    const chaveTreino = normalizar(treino);
    let t = treinos.get(chaveTreino);
    if (!t) treinos.set(chaveTreino, (t = { nome: treino, itens: [] }));
    if (t.itens.some((it) => normalizar(it.ex.nome) === normalizar(nome))) {
      erros.push(`Linha ${numLinha}: "${nome}" aparece duas vezes no ${t.nome}.`);
      return;
    }
    const ordemTxt = texto(celula(l, "ordem"));
    const ordem = ordemTxt !== "" && Number.isFinite(Number(ordemTxt)) ? Number(ordemTxt) : Infinity;
    t.itens.push({
      ex: { nome, grupo, series, repeticoes: texto(celula(l, "repeticoes")), comoFazer: texto(celula(l, "comoFazer")) },
      ordem,
      pos: i,
    });
  });

  if (erros.length > 0) return { ok: false, erros };
  if (treinos.size === 0) return { ok: false, erros: ["A planilha não tem nenhum exercício."] };
  if (treinos.size > MAX_TREINOS) {
    return { ok: false, erros: [`A planilha tem ${treinos.size} treinos; o máximo é ${MAX_TREINOS}.`] };
  }

  return {
    ok: true,
    plano: {
      importadoEm: agora.toISOString(),
      treinos: [...treinos.values()].map((t) => ({
        nome: t.nome,
        exercicios: [...t.itens].sort((a, b) => a.ordem - b.ordem || a.pos - b.pos).map((it) => it.ex),
      })),
    },
  };
}

/** Modelo para o professor preencher (RN-01.6). */
export function modeloPlanilha(): string[][] {
  return [
    ["Treino", "Ordem", "Exercício", "Grupo muscular", "Séries", "Repetições", "Como fazer"],
    ["Treino A", "1", "Leg press", "Quadríceps", "3", "10-12", "Pés na largura do quadril, desça até 90°"],
    ["Treino A", "2", "Cadeira flexora", "Posterior", "3", "10-12", "Suba controlando, sem tirar o quadril do banco"],
    ["Treino A", "3", "Panturrilha em pé", "Panturrilha", "3", "12-15", "Suba na ponta dos pés e desça devagar"],
    ["Treino B", "1", "Supino máquina", "Peitoral", "3", "10-12", "Cotovelos um pouco abaixo da linha do ombro"],
    ["Treino B", "2", "Elevação lateral", "Ombro", "2", "12", "Suba até a altura do ombro, sem balançar"],
    ["Treino C", "1", "Puxada frente", "Costas", "3", "10-12", "Puxe até o queixo, peito aberto"],
    ["Treino C", "2", "Prancha", "Core", "3", "30 segundos", "Corpo reto, sem deixar o quadril cair"],
  ];
}

// ─── Armazenamento (RN-02.4, RN-03.1) ─────────────────────────────────────────

function ehPlano(v: unknown): v is Plano {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Partial<Plano>;
  return (
    Array.isArray(p.treinos) &&
    p.treinos.length > 0 &&
    p.treinos.every(
      (t) =>
        typeof t?.nome === "string" &&
        Array.isArray(t.exercicios) &&
        t.exercicios.every(
          (e) => typeof e?.nome === "string" && typeof e.grupo === "string" && Number.isInteger(e.series) && e.series >= 1,
        ),
    )
  );
}

/** Plano válido vindo de storage ou de backup; qualquer outra coisa vira null. */
export function sanitizarPlano(v: unknown): Plano | null {
  if (!ehPlano(v)) return null;
  return {
    importadoEm: typeof v.importadoEm === "string" ? v.importadoEm : "",
    treinos: v.treinos.map((t) => ({
      nome: t.nome,
      exercicios: t.exercicios.map((e) => ({
        nome: e.nome,
        grupo: e.grupo,
        series: Math.min(MAX_SERIES, e.series),
        repeticoes: typeof e.repeticoes === "string" ? e.repeticoes : "",
        comoFazer: typeof e.comoFazer === "string" ? e.comoFazer : "",
      })),
    })),
  };
}

export function carregarPlano(): Plano | null {
  try {
    return sanitizarPlano(JSON.parse(localStorage.getItem(storageKey(CHAVE)) ?? "null"));
  } catch {
    return null;
  }
}

/** Troca a ficha: grava o plano novo e descarta treinos em andamento. O histórico fica. */
export function salvarPlano(plano: Plano): void {
  localStorage.setItem(storageKey(CHAVE), JSON.stringify(plano));
  localStorage.removeItem(storageKey("rascunho_treino"));
}

export function diasPorSemana(plano: Plano | null = carregarPlano()): number {
  return plano ? plano.treinos.length : DIAS_SEM_PLANO;
}

export function resumoPlano(plano: Plano): string {
  const n = plano.treinos.length;
  const ex = plano.treinos.reduce((t, tr) => t + tr.exercicios.length, 0);
  const p = (q: number, um: string, varios: string) => `${q} ${q === 1 ? um : varios}`;
  return `${p(n, "treino", "treinos")} · ${p(ex, "exercício", "exercícios")} · ${p(n, "dia", "dias")} por semana`;
}

// ─── Sequência (RN-03.2 a RN-03.4) ────────────────────────────────────────────

export function treinoSugerido(plano: Plano, execs: Execucao[], emAndamento: string[]): string {
  const nomes = plano.treinos.map((t) => t.nome);
  const andamento = nomes.find((n) => emAndamento.includes(n));
  if (andamento) return andamento;

  let ultima: Execucao | null = null;
  for (const e of execs) if (!ultima || e.dataTs >= ultima.dataTs) ultima = e;
  const idx = ultima ? nomes.indexOf(ultima.sessao) : -1;
  return idx < 0 ? nomes[0]! : nomes[(idx + 1) % nomes.length]!;
}

export function textoRepeticoes(rep: string): string {
  const r = rep.trim();
  if (!r) return "";
  if (/^\d+\s*[-–]\s*\d+$/.test(r)) return `${r.replace(/\s*[-–]\s*/, "–")} repetições`;
  if (/^\d+(\s+a\s+\d+)?$/.test(r)) return `${r} repetições`;
  return r;
}
