/**
 * Conquistas, frase motivacional e faixa "Esta semana" (docs/REGRAS_DE_NEGOCIO.md RN-10.6 a RN-10.8).
 * Tudo é contado sobre as execuções já guardadas.
 */
import { describe, it, expect } from "vitest";
import { conquistas, diasDaSemana, fraseMotivacional, novasConquistas } from "../../utils/conquistas";
import type { Execucao } from "../../utils/execucoes";

const dia = (d: number, m: number) => new Date(2026, m - 1, d, 10).getTime();
const HOJE = dia(4, 11); // quarta 04/11/2026 — semana 02/11 a 08/11

function treino(d: number, m: number, sessaoId = "A", series = 3, exercicios = 1): Execucao[] {
  const ts = dia(d, m);
  return Array.from({ length: exercicios }, (_, i) => ({
    exercicio: `Ex ${i}`, grupo: "Peitoral", sessao: sessaoId, sessaoId,
    data: new Date(ts).toLocaleDateString("pt-BR"), dataTs: ts, seriesPlanejadas: Math.max(series, 1), seriesFeitas: series,
  }));
}

const porId = (lista: ReturnType<typeof conquistas>) => Object.fromEntries(lista.map((c) => [c.id, c]));

describe("RN-10.7 conquistas", () => {
  it("sem histórico: todas bloqueadas, na ordem, com quanto falta", () => {
    const c = conquistas([], 3, HOJE);
    expect(c.map((x) => [x.id, x.titulo, x.ganha, x.progresso])).toEqual([
      ["primeiro-treino", "Primeiro treino", false, "0 de 1 treino"],
      ["dez-treinos", "10 treinos", false, "0 de 10 treinos"],
      ["quatro-semanas", "4 semanas seguidas", false, "0 de 4 semanas seguidas"],
      ["cem-series", "100 séries", false, "0 de 100 séries"],
    ]);
  });

  it("primeiro treino: 1 treino com série marcada; só anotação (0 séries) não conta", () => {
    expect(porId(conquistas(treino(2, 11, "A", 0), 3, HOJE))["primeiro-treino"]!.ganha).toBe(false);
    expect(porId(conquistas(treino(2, 11), 3, HOJE))["primeiro-treino"]!.ganha).toBe(true);
  });

  it("10 treinos conta sessão + data (vários exercícios no mesmo treino = 1)", () => {
    const nove = Array.from({ length: 9 }, (_, i) => treino(i + 1, 10, "A", 3, 4)).flat();
    const c9 = porId(conquistas(nove, 3, HOJE))["dez-treinos"]!;
    expect(c9.ganha).toBe(false);
    expect(c9.progresso).toBe("9 de 10 treinos");
    expect(porId(conquistas([...nove, ...treino(20, 10)], 3, HOJE))["dez-treinos"]!.ganha).toBe(true);
  });

  it("4 semanas seguidas usa o recorde: uma vez ganha, não se perde", () => {
    // 4 semanas completas em setembro (meta 1), depois nada até novembro.
    const execs = [...treino(7, 9), ...treino(14, 9), ...treino(21, 9), ...treino(28, 9)];
    const c = porId(conquistas(execs, 1, HOJE))["quatro-semanas"]!;
    expect(c.ganha).toBe(true);
    expect(c.progresso).toBe("4 de 4 semanas seguidas");
  });

  it("100 séries soma as séries marcadas; o progresso não passa do alvo", () => {
    const execs = [...treino(1, 10, "A", 6, 10), ...treino(2, 10, "B", 5, 9)]; // 60 + 45
    const c = porId(conquistas(execs, 3, HOJE))["cem-series"]!;
    expect(c.ganha).toBe(true);
    expect(c.progresso).toBe("100 de 100 séries");
    expect(porId(conquistas(treino(1, 10, "A", 6, 7), 3, HOJE))["cem-series"]!.progresso).toBe("42 de 100 séries");
  });

  it("novasConquistas: só as que viraram ganhas agora", () => {
    const antes = conquistas([], 3, HOJE);
    const depois = conquistas(treino(4, 11), 3, HOJE);
    expect(novasConquistas(antes, depois).map((c) => c.titulo)).toEqual(["Primeiro treino"]);
    expect(novasConquistas(depois, depois)).toEqual([]);
  });
});

describe("RN-10.6 fraseMotivacional", () => {
  const base = { fechouSemana: false, sequencia: 0, totalTreinos: 5, treinosNaSemana: 1, meta: 3 };

  it("fechou a semana com sequência > 1", () => {
    expect(fraseMotivacional({ ...base, fechouSemana: true, sequencia: 4, treinosNaSemana: 3 })).toBe(
      "Mais uma semana fechada! 4 semanas seguidas.",
    );
  });

  it("fechou a semana e a sequência começou", () => {
    expect(fraseMotivacional({ ...base, fechouSemana: true, sequencia: 1, treinosNaSemana: 3 })).toBe(
      "Semana fechada! Sua sequência começou.",
    );
  });

  it("primeiro treino (sem fechar a semana)", () => {
    expect(fraseMotivacional({ ...base, totalTreinos: 1 })).toBe(
      "Primeiro treino feito! O começo é o passo mais importante.",
    );
  });

  it("fechar a semana vale mais que primeiro treino (plano de 1 dia)", () => {
    expect(fraseMotivacional({ ...base, fechouSemana: true, sequencia: 1, totalTreinos: 1, treinosNaSemana: 1, meta: 1 })).toBe(
      "Semana fechada! Sua sequência começou.",
    );
  });

  it("senão, quanto falta para fechar a semana (singular e plural)", () => {
    expect(fraseMotivacional({ ...base, treinosNaSemana: 2 })).toBe("Falta 1 treino para fechar a semana.");
    expect(fraseMotivacional({ ...base, treinosNaSemana: 1 })).toBe("Faltam 2 treinos para fechar a semana.");
  });

  it("nunca usa emoji", () => {
    const frases = [
      fraseMotivacional({ ...base, fechouSemana: true, sequencia: 4 }),
      fraseMotivacional({ ...base, fechouSemana: true, sequencia: 1 }),
      fraseMotivacional({ ...base, totalTreinos: 1 }),
      fraseMotivacional(base),
    ];
    frases.forEach((f) => expect(f).not.toMatch(/\p{Extended_Pictographic}/u));
  });
});

describe("RN-10.8 diasDaSemana", () => {
  it("7 dias de segunda a domingo, marcando os dias com treino e hoje", () => {
    const execs = [...treino(2, 11), ...treino(4, 11, "B"), ...treino(3, 11, "C", 0), ...treino(1, 11)];
    expect(diasDaSemana(execs, HOJE)).toEqual([
      { sigla: "Seg", nome: "Segunda", treinou: true, hoje: false },
      { sigla: "Ter", nome: "Terça", treinou: false, hoje: false }, // só anotação: não conta
      { sigla: "Qua", nome: "Quarta", treinou: true, hoje: true },
      { sigla: "Qui", nome: "Quinta", treinou: false, hoje: false },
      { sigla: "Sex", nome: "Sexta", treinou: false, hoje: false },
      { sigla: "Sáb", nome: "Sábado", treinou: false, hoje: false },
      { sigla: "Dom", nome: "Domingo", treinou: false, hoje: false }, // 01/11 é da semana passada
    ]);
  });
});
