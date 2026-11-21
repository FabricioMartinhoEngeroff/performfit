/**
 * Semanas — regras de hábito do PerformFit.
 * - Semana (seg–dom) completa = fez pelo menos `meta` treinos (meta = dias da planilha, RN-03.1).
 * - Treino = sessão + data com pelo menos 1 série marcada.
 * - Sequência = semanas completas seguidas. A semana atual ainda em andamento não quebra.
 * - 1 semana de folga por mês: a primeira semana incompleta do mês não quebra a sequência
 *   (também não soma).
 * - Total de semanas completas nunca diminui.
 */
import { describe, it, expect } from "vitest";
import {
  inicioDaSemana,
  treinosNaSemana,
  seriesPorGrupo,
  resumoSequencia,
  periodo,
  ultimasSemanas,
  comparacaoMensal,
  fraseComparacao,
} from "../../utils/semanas";
import type { Execucao } from "../../utils/execucoes";

const dia = (d: number, m: number, a = 2026) => new Date(a, m - 1, d, 10).getTime();

function treino(d: number, m: number, sessaoId = "UA", grupos: Record<string, number> = { Peitoral: 3 }): Execucao[] {
  const ts = dia(d, m);
  const data = new Date(ts).toLocaleDateString("pt-BR");
  return Object.entries(grupos).map(([grupo, feitas], i) => ({
    exercicio: `${grupo} ${i}`, grupo, sessao: sessaoId, sessaoId, data, dataTs: ts,
    seriesPlanejadas: Math.max(feitas, 1), seriesFeitas: feitas,
  }));
}

// Semanas de 2026 (segunda-feira): 05/10, 12/10, 19/10, 26/10, 02/11, 09/11
describe("inicioDaSemana", () => {
  it("segunda 00:00 da semana do dia", () => {
    expect(inicioDaSemana(dia(15, 10))).toBe(new Date(2026, 9, 12).getTime()); // quinta → seg 12
    expect(inicioDaSemana(dia(18, 10))).toBe(new Date(2026, 9, 12).getTime()); // domingo → seg 12
    expect(inicioDaSemana(dia(12, 10))).toBe(new Date(2026, 9, 12).getTime());
  });
});

describe("treinosNaSemana", () => {
  it("conta sessão+data distintas com séries feitas", () => {
    const execs = [
      ...treino(12, 10, "UA", { Peitoral: 3, Costas: 2 }), // 1 treino com 2 exercícios
      ...treino(14, 10, "LA"),
      ...treino(14, 10, "UB"),                             // 2 sessões no mesmo dia = 2 treinos
      ...treino(16, 10, "LB", { Quadríceps: 0 }),          // nada marcado → não conta
      ...treino(20, 10, "UA"),                             // outra semana
    ];
    expect(treinosNaSemana(execs, dia(13, 10))).toBe(3);
  });
});

describe("seriesPorGrupo", () => {
  it("soma séries feitas por grupo no intervalo, maior primeiro", () => {
    const execs = [
      ...treino(12, 10, "UA", { Peitoral: 3, Costas: 2 }),
      ...treino(14, 10, "UB", { Costas: 4 }),
      ...treino(20, 10, "UA", { Peitoral: 9 }),
    ];
    const semana = periodo("semana", dia(13, 10));
    expect(seriesPorGrupo(execs, semana.inicioTs, semana.fimTs)).toEqual([
      { grupo: "Costas", series: 6 },
      { grupo: "Peitoral", series: 3 },
    ]);
  });

  it("inclui grupos pedidos com 0 séries (para ver o que ficou de fora)", () => {
    const semana = periodo("semana", dia(13, 10));
    expect(seriesPorGrupo(treino(12, 10), semana.inicioTs, semana.fimTs, ["Peitoral", "Panturrilha"])).toEqual([
      { grupo: "Peitoral", series: 3 },
      { grupo: "Panturrilha", series: 0 },
    ]);
  });
});

describe("periodo", () => {
  it("semana, mês e ano com rótulo e deslocamento", () => {
    expect(periodo("semana", dia(15, 10)).label).toBe("12/10 – 18/10");
    expect(periodo("semana", dia(15, 10), -1).label).toBe("05/10 – 11/10");
    expect(periodo("mes", dia(15, 10)).label).toBe("Outubro 2026");
    expect(periodo("mes", dia(15, 1), -1).label).toBe("Dezembro 2025");
    expect(periodo("ano", dia(15, 10)).label).toBe("2026");
    const out = periodo("mes", dia(15, 10));
    expect(out.inicioTs).toBe(new Date(2026, 9, 1).getTime());
    expect(out.fimTs).toBe(new Date(2026, 10, 1).getTime());
  });
});

describe("resumoSequencia", () => {
  const hoje = dia(4, 11); // quarta, semana de 02/11

  it("sem histórico: tudo zero", () => {
    const r = resumoSequencia([], 3, hoje);
    expect(r).toMatchObject({ atual: 0, recorde: 0, total: 0 });
    expect(r.semanaAtual).toEqual({ treinos: 0, meta: 3, completa: false });
  });

  it("semanas completas seguidas formam a sequência; semana atual incompleta não quebra", () => {
    const execs = [
      ...treino(12, 10), ...treino(14, 10),
      ...treino(19, 10), ...treino(21, 10),
      ...treino(26, 10), ...treino(28, 10),
      ...treino(3, 11),                     // semana atual: 1 de 2
    ];
    const r = resumoSequencia(execs, 2, hoje);
    expect(r.atual).toBe(3);
    expect(r.total).toBe(3);
    expect(r.semanaAtual).toEqual({ treinos: 1, meta: 2, completa: false });
    expect(r.semanas.at(-1)!.status).toBe("atual");
  });

  it("semana atual completa já soma", () => {
    const execs = [...treino(26, 10), ...treino(2, 11)];
    const r = resumoSequencia(execs, 1, hoje);
    expect(r.atual).toBe(2);
    expect(r.semanaAtual.completa).toBe(true);
    expect(r.semanas.at(-1)!.status).toBe("completa");
  });

  it("1ª semana incompleta do mês vira folga: não quebra nem soma", () => {
    const execs = [
      ...treino(5, 10),   // completa
      ...treino(12, 10),  // completa
      //                     semana 19/10 vazia → folga de outubro
      ...treino(26, 10),  // completa
    ];
    const r = resumoSequencia(execs, 1, hoje);
    expect(r.semanas.map((s) => s.status)).toEqual(["completa", "completa", "folga", "completa", "atual"]);
    expect(r.atual).toBe(3);
  });

  it("2ª semana incompleta no mesmo mês quebra a sequência", () => {
    const execs = [
      ...treino(5, 10),
      //                     12/10 vazia → folga
      //                     19/10 vazia → quebra
      ...treino(26, 10),
    ];
    const r = resumoSequencia(execs, 1, hoje);
    expect(r.semanas.map((s) => s.status)).toEqual(["completa", "folga", "incompleta", "completa", "atual"]);
    expect(r.atual).toBe(1);
    expect(r.recorde).toBe(1);
    expect(r.total).toBe(2);
  });

  it("recorde guarda a maior sequência já feita", () => {
    const execs = [
      ...treino(7, 9), ...treino(14, 9), ...treino(21, 9),    // 3 seguidas em setembro
      //                                                         28/09 vazia → folga de setembro
      //                                                         05/10 vazia → folga de outubro
      //                                                         12/10 vazia → quebra
      ...treino(19, 10), ...treino(26, 10),
    ];
    const r = resumoSequencia(execs, 1, hoje);
    expect(r.recorde).toBe(3);
    expect(r.atual).toBe(2);
    expect(r.total).toBe(5);
  });
});

// ─── Gráficos da aba Evolução (RN-06.9, RN-06.10) ────────────────────────────

describe("RN-06.9 / RN-06.10 ultimasSemanas", () => {
  const hoje = dia(4, 11); // quarta 04/11/2026 — semana atual começa 02/11

  it("devolve sempre N semanas terminando na atual, com 0 nas semanas sem treino", () => {
    const r = ultimasSemanas([], 12, hoje);
    expect(r).toHaveLength(12);
    expect(r[11]).toEqual({ inicioTs: new Date(2026, 10, 2).getTime(), label: "02/11", treinos: 0, series: 0 });
    expect(r[0]!.label).toBe("17/08");
    expect(r.every((s) => s.treinos === 0 && s.series === 0)).toBe(true);
  });

  it("conta treinos (sessão + data) e soma séries de cada semana", () => {
    const r = ultimasSemanas(
      [
        ...treino(2, 11, "UA", { Peitoral: 3, Costas: 2 }),
        ...treino(3, 11, "LA", { Quadríceps: 4 }),
        ...treino(27, 10, "UA", { Peitoral: 1 }),
      ],
      3,
      hoje,
    );
    expect(r.map((s) => [s.label, s.treinos, s.series])).toEqual([
      ["19/10", 0, 0],
      ["26/10", 1, 1],
      ["02/11", 2, 9],
    ]);
  });

  it("ignora execuções sem série (só anotação) e semanas fora da janela", () => {
    const r = ultimasSemanas(
      [...treino(2, 11, "UA", { Peitoral: 0 }), ...treino(1, 6, "UA", { Peitoral: 5 })],
      12,
      hoje,
    );
    expect(r.reduce((t, s) => t + s.treinos + s.series, 0)).toBe(0);
  });
});

describe("RN-06.10 comparacaoMensal", () => {
  it("mês atual até hoje contra o mês passado até o mesmo dia", () => {
    const execs = [
      ...treino(2, 11, "UA", { Peitoral: 10 }),
      ...treino(4, 11, "UA", { Peitoral: 8 }),   // hoje: entra
      ...treino(5, 11, "UA", { Peitoral: 50 }),  // depois de hoje: não entra
      ...treino(3, 10, "UA", { Peitoral: 15 }),
      ...treino(4, 10, "UA", { Peitoral: 0 }),
      ...treino(20, 10, "UA", { Peitoral: 40 }), // depois do dia 4 em outubro: não entra
    ];
    expect(comparacaoMensal(execs, dia(4, 11))).toEqual({ atual: 18, anterior: 15, variacao: 20 });
  });

  it("arredonda a porcentagem para inteiro e aceita queda", () => {
    const execs = [...treino(1, 11, "UA", { Peitoral: 2 }), ...treino(1, 10, "UA", { Peitoral: 3 })];
    expect(comparacaoMensal(execs, dia(4, 11)).variacao).toBe(-33);
  });

  it("mês passado sem séries no período: variação nula", () => {
    const execs = treino(1, 11, "UA", { Peitoral: 2 });
    expect(comparacaoMensal(execs, dia(4, 11))).toEqual({ atual: 2, anterior: 0, variacao: null });
  });

  it("dia 31 compara com o mês passado inteiro quando ele é mais curto", () => {
    const execs = [...treino(30, 9, "UA", { Peitoral: 4 }), ...treino(31, 10, "UA", { Peitoral: 4 })];
    expect(comparacaoMensal(execs, dia(31, 10))).toEqual({ atual: 4, anterior: 4, variacao: 0 });
  });
});

describe("RN-06.10 fraseComparacao", () => {
  it("mais, menos, igual e sem base", () => {
    expect(fraseComparacao({ atual: 18, anterior: 15, variacao: 18 })).toBe(
      "Você fez 18% mais séries que no mesmo período do mês passado.",
    );
    expect(fraseComparacao({ atual: 2, anterior: 3, variacao: -12 })).toBe(
      "Você fez 12% menos séries que no mesmo período do mês passado.",
    );
    expect(fraseComparacao({ atual: 4, anterior: 4, variacao: 0 })).toBe(
      "Você fez o mesmo número de séries que no mesmo período do mês passado.",
    );
    expect(fraseComparacao({ atual: 4, anterior: 0, variacao: null })).toBeNull();
  });
});
