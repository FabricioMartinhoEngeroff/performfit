import { ROTACAO } from "../data/cycles";
import { SESSOES_LABELS } from "../data/sessionExercises";

// ─── Sessões vindas da planilha ───────────────────────────────────────────────
// A planilha de 4 dias (uma aba, Upper/Lower A/B) segue igual: o nome da sessão é
// o próprio "Treino". Um protocolo com várias semanas tem uma aba por semana; aí a
// sessão ganha o prefixo da aba e o dia ("S1 Seg · Pull"), para a mesma sessão em
// semanas diferentes não se misturar.

const DIAS: Record<string, string> = {
  SEG: "Seg", TER: "Ter", QUA: "Qua", QUI: "Qui", SEX: "Sex", SAB: "Sáb", SÁB: "Sáb", DOM: "Dom",
};

/** "Semana 1" → "S1", "Semanas 3-4" → "S3-4"; abas que não são de semana → null. */
export function prefixoAba(nomeAba: string): string | null {
  const m = nomeAba.match(/semanas?\s*(.+)/i);
  if (!m) return null;
  const numeros = m[1]!.match(/\d+/g);
  return numeros ? `S${numeros.join("-")}` : null;
}

/** Nome da sessão no app. Sem prefixo de aba, é o próprio treino (planilha de 4 dias). */
export function rotuloSessao(treino: string, idPlanilha: string | undefined, prefixo: string | null): string {
  if (!prefixo) return treino;
  const id = (idPlanilha ?? "").trim().toUpperCase();
  const dia = DIAS[id] ?? id;
  return `${prefixo}${dia ? ` ${dia}` : ""} · ${treino}`;
}

/** Id curto da sessão, gravado em cada registro: "Upper A" → "UA", "S1 Seg · Pull" → "S1SEG". */
export function idDaSessao(rotulo: string): string {
  const fixa = ROTACAO.find((r) => r.titulo === rotulo);
  if (fixa) return fixa.id;
  const [antes, depois] = rotulo.split(" · ");
  const base = depois !== undefined ? antes! : rotulo;
  const semEspaco = depois !== undefined ? base.replace(/\s+/g, "") : base.trim().replace(/\s+/g, "_");
  return semEspaco.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
}

/**
 * Botões de sessão da tela de treino. Sem plano próprio — ou com um plano só das
 * 4 sessões padrão — mostra as 4 fixas, como sempre; senão, as sessões do plano.
 */
export function listarSessoes(config: Record<string, unknown> | null | undefined): string[] {
  const nomes = config ? Object.keys(config) : [];
  const padrao = SESSOES_LABELS as readonly string[];
  if (nomes.length === 0 || nomes.every((n) => padrao.includes(n))) return [...SESSOES_LABELS];
  return nomes;
}

/** "24 reps em blocos de 4" → 6 blocos; sem tamanho de bloco → undefined. */
export function blocosCluster(cue: string): number | undefined {
  if (!/cluster/i.test(cue)) return undefined;
  const m = cue.match(/(\d+)\s*rep\w*[^\d]*?blocos?\s*de\s*(\d+)/i);
  if (!m) return undefined;
  const total = Number(m[1]);
  const bloco = Number(m[2]);
  return total > 0 && bloco > 0 ? Math.ceil(total / bloco) : undefined;
}

interface LinhaComSeries {
  sessao: string;
  exercicio: string;
  series_validas: number;
  cue: string;
}

/**
 * Exercício repetido no mesmo dia (ex.: "Remada curvada perto da falha" … "até a
 * falha total") vira uma linha só, na posição do primeiro, com as séries somadas
 * (máx. 4) e o cue de cada vez: "1ª: … | 2ª: …".
 */
export function mesclarRepetidos<T extends LinhaComSeries>(linhas: T[]): T[] {
  const grupos = new Map<string, T[]>();
  for (const l of linhas) {
    const chave = `${l.sessao}|${l.exercicio}`;
    const grupo = grupos.get(chave);
    if (grupo) grupo.push(l);
    else grupos.set(chave, [l]);
  }
  const vistos = new Set<string>();
  const out: T[] = [];
  for (const l of linhas) {
    const chave = `${l.sessao}|${l.exercicio}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    const grupo = grupos.get(chave)!;
    if (grupo.length === 1) {
      out.push(l);
      continue;
    }
    out.push({
      ...l,
      series_validas: Math.min(4, grupo.reduce((n, g) => n + g.series_validas, 0)),
      cue: grupo.map((g, i) => `${i + 1}ª: ${g.cue}`).join(" | "),
    });
  }
  return out;
}
