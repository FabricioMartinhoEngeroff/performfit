import type { Execucao } from "./execucoes";
import { inicioDaSemana, resumoSequencia } from "./semanas";
import { plural } from "./plural";

// Celebrar as conquistas — docs/REGRAS_DE_NEGOCIO.md RN-10.6 a RN-10.8.
// Tudo é contado sobre as execuções já guardadas. Treino = sessão + data com série marcada.

export type IdConquista = "primeiro-treino" | "dez-treinos" | "quatro-semanas" | "cem-series";

export interface Conquista {
  id: IdConquista;
  titulo: string;
  atual: number;
  alvo: number;
  ganha: boolean;
  /** Ex.: "7 de 10 treinos" (não passa do alvo). */
  progresso: string;
}

export function totalTreinos(execs: Execucao[]): number {
  const chaves = new Set<string>();
  for (const e of execs) if (e.seriesFeitas > 0) chaves.add(`${e.sessaoId}|${e.data}`);
  return chaves.size;
}

export function totalSeries(execs: Execucao[]): number {
  return execs.reduce((t, e) => t + Math.max(0, e.seriesFeitas), 0);
}

const DEFINICOES: { id: IdConquista; titulo: string; alvo: number; um: string; varios: string }[] = [
  { id: "primeiro-treino", titulo: "Primeiro treino", alvo: 1, um: "treino", varios: "treinos" },
  { id: "dez-treinos", titulo: "10 treinos", alvo: 10, um: "treino", varios: "treinos" },
  { id: "quatro-semanas", titulo: "4 semanas seguidas", alvo: 4, um: "semana seguida", varios: "semanas seguidas" },
  { id: "cem-series", titulo: "100 séries", alvo: 100, um: "série", varios: "séries" },
];

/** RN-10.7: todas as conquistas, na ordem, ganhas ou não. */
export function conquistas(execs: Execucao[], meta: number, hojeTs = Date.now()): Conquista[] {
  const treinos = totalTreinos(execs);
  const valores: Record<IdConquista, number> = {
    "primeiro-treino": treinos,
    "dez-treinos": treinos,
    // Recorde: uma vez ganha, não se perde (RN-06.5).
    "quatro-semanas": resumoSequencia(execs, meta, hojeTs).recorde,
    "cem-series": totalSeries(execs),
  };
  return DEFINICOES.map(({ id, titulo, alvo, um, varios }) => {
    const atual = Math.min(valores[id], alvo);
    return { id, titulo, atual, alvo, ganha: atual >= alvo, progresso: `${atual} de ${plural(alvo, um, varios)}` };
  });
}

/** Conquistas que estavam bloqueadas em `antes` e estão ganhas em `depois`. */
export function novasConquistas(antes: Conquista[], depois: Conquista[]): Conquista[] {
  const jaTinha = new Set(antes.filter((c) => c.ganha).map((c) => c.id));
  return depois.filter((c) => c.ganha && !jaTinha.has(c.id));
}

export interface ContextoFrase {
  fechouSemana: boolean;
  sequencia: number;
  totalTreinos: number;
  treinosNaSemana: number;
  meta: number;
}

/** RN-10.6: frase motivacional ao salvar, escolhida pelo contexto. */
export function fraseMotivacional(c: ContextoFrase): string {
  if (c.fechouSemana) {
    return c.sequencia > 1
      ? `Mais uma semana fechada! ${c.sequencia} semanas seguidas.`
      : "Semana fechada! Sua sequência começou.";
  }
  if (c.totalTreinos === 1) return "Primeiro treino feito! O começo é o passo mais importante.";
  const faltam = Math.max(0, c.meta - c.treinosNaSemana);
  return faltam === 1 ? "Falta 1 treino para fechar a semana." : `Faltam ${faltam} treinos para fechar a semana.`;
}

export interface DiaDaSemana {
  sigla: string;
  nome: string;
  treinou: boolean;
  hoje: boolean;
}

const DIAS = [
  ["Seg", "Segunda"], ["Ter", "Terça"], ["Qua", "Quarta"], ["Qui", "Quinta"],
  ["Sex", "Sexta"], ["Sáb", "Sábado"], ["Dom", "Domingo"],
] as const;

/** RN-10.8: os 7 dias da semana atual (seg a dom), com os dias em que treinou. */
export function diasDaSemana(execs: Execucao[], hojeTs = Date.now()): DiaDaSemana[] {
  const seg = new Date(inicioDaSemana(hojeTs));
  const hoje = new Date(hojeTs);
  return DIAS.map(([sigla, nome], i) => {
    const d = new Date(seg.getFullYear(), seg.getMonth(), seg.getDate() + i);
    const ini = d.getTime();
    const fim = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
    return {
      sigla,
      nome,
      treinou: execs.some((e) => e.seriesFeitas > 0 && e.dataTs >= ini && e.dataTs < fim),
      hoje: d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth() && d.getDate() === hoje.getDate(),
    };
  });
}
