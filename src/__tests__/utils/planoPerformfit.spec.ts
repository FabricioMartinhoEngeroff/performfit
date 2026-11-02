/**
 * Plano do PerformFit — planilha padrão do professor (docs/REGRAS_DE_NEGOCIO.md RN-01 a RN-03).
 */
import { describe, it, expect } from "vitest";
import {
  lerPlanilha,
  modeloPlanilha,
  salvarPlano,
  carregarPlano,
  diasPorSemana,
  treinoSugerido,
  textoRepeticoes,
  type Plano,
} from "../../utils/planoPerformfit";
import { carregarExecucoes, registrarTreino, type Execucao } from "../../utils/execucoes";

const CAB = ["Treino", "Ordem", "Exercício", "Grupo muscular", "Séries", "Repetições", "Como fazer"];

function planilha(...linhas: unknown[][]): unknown[][] {
  return [CAB, ...linhas];
}

function ok(linhas: unknown[][]): Plano {
  const r = lerPlanilha(linhas);
  if (!r.ok) throw new Error(r.erros.join("\n"));
  return r.plano;
}

function erros(linhas: unknown[][]): string[] {
  const r = lerPlanilha(linhas);
  if (r.ok) throw new Error("esperava erro");
  return r.erros;
}

const exec = (sessao: string, d: number, p: Partial<Execucao> = {}): Execucao => ({
  exercicio: "Leg press", grupo: "Quadríceps", sessao, sessaoId: sessao.toUpperCase(),
  data: `${String(d).padStart(2, "0")}/10/2026`, dataTs: new Date(2026, 9, d).getTime(),
  seriesPlanejadas: 3, seriesFeitas: 3, ...p,
});

describe("RN-01 — leitura da planilha padrão", () => {
  it("RN-01.1 monta treinos e exercícios com séries, repetições e explicação", () => {
    const plano = ok(planilha(
      ["Treino A", 1, "Leg press", "Quadríceps", 3, "10-12", "Desça até 90°"],
      ["Treino A", 2, "Cadeira flexora", "Posterior", 2, "12", ""],
      ["Treino B", 1, "Supino máquina", "Peitoral", 4, "", "Cotovelos abaixo do ombro"],
    ));
    expect(plano.treinos.map((t) => t.nome)).toEqual(["Treino A", "Treino B"]);
    expect(plano.treinos[0]!.exercicios[0]).toEqual({
      nome: "Leg press", grupo: "Quadríceps", series: 3, repeticoes: "10-12", comoFazer: "Desça até 90°",
    });
    expect(plano.treinos[1]!.exercicios[0]!.series).toBe(4);
  });

  it("RN-01.1 nomes de coluna sem acento/maiúscula e em outra ordem também valem", () => {
    const plano = ok([
      ["exercicio", "TREINO", "series", "grupo muscular"],
      ["Remada", "Treino A", "3", "Costas"],
    ]);
    expect(plano.treinos[0]!.exercicios[0]).toMatchObject({ nome: "Remada", grupo: "Costas", series: 3, repeticoes: "", comoFazer: "" });
  });

  it("RN-01.1 ordem da coluna Ordem; sem ordem, vale a ordem das linhas", () => {
    const plano = ok(planilha(
      ["Treino A", 2, "B", "Costas", 3],
      ["Treino A", 1, "A", "Costas", 3],
      ["Treino B", "", "C", "Costas", 3],
      ["Treino B", "", "D", "Costas", 3],
    ));
    expect(plano.treinos[0]!.exercicios.map((e) => e.nome)).toEqual(["A", "B"]);
    expect(plano.treinos[1]!.exercicios.map((e) => e.nome)).toEqual(["C", "D"]);
  });

  it("RN-01.2 acha o cabeçalho abaixo de linhas de título e ignora linhas vazias", () => {
    const plano = ok([
      ["Ficha de treino — Maria"],
      [],
      CAB,
      ["Treino A", 1, "Leg press", "Quadríceps", 3],
      ["", "", "", "", ""],
      ["Treino A", 2, "Stiff", "Posterior", 3],
    ]);
    expect(plano.treinos[0]!.exercicios).toHaveLength(2);
  });

  it("RN-01.5 treinos na ordem em que aparecem", () => {
    const plano = ok(planilha(
      ["Treino C", 1, "X", "Costas", 3],
      ["Treino A", 1, "Y", "Costas", 3],
      ["Treino C", 2, "Z", "Costas", 3],
    ));
    expect(plano.treinos.map((t) => t.nome)).toEqual(["Treino C", "Treino A"]);
  });

  it("RN-01.6 o modelo para baixar é uma planilha válida", () => {
    const plano = ok(modeloPlanilha());
    expect(plano.treinos.length).toBeGreaterThanOrEqual(2);
  });
});

describe("RN-02.2 — erros em português com o número da linha", () => {
  it("campos obrigatórios e séries fora de 1 a 6", () => {
    expect(erros(planilha(
      ["", 1, "Leg press", "Quadríceps", 3],
      ["Treino A", 1, "", "Quadríceps", 3],
      ["Treino A", 2, "Stiff", "", 3],
      ["Treino A", 3, "Remada", "Costas", ""],
      ["Treino A", 4, "Puxada", "Costas", 7],
      ["Treino A", 5, "Rosca", "Braço", "três"],
    ))).toEqual([
      "Linha 2: falta o nome do treino.",
      "Linha 3: falta o exercício.",
      "Linha 4: falta o grupo muscular.",
      "Linha 5: o número de séries deve ser de 1 a 6.",
      "Linha 6: o número de séries deve ser de 1 a 6.",
      "Linha 7: o número de séries deve ser de 1 a 6.",
    ]);
  });

  it("RN-01.4 exercício repetido no mesmo treino", () => {
    expect(erros(planilha(
      ["Treino A", 1, "Leg press", "Quadríceps", 3],
      ["Treino B", 1, "Leg press", "Quadríceps", 3],
      ["Treino A", 2, "leg press", "Quadríceps", 3],
    ))).toEqual(['Linha 4: "leg press" aparece duas vezes no Treino A.']);
  });

  it("RN-01.3 no máximo 7 treinos", () => {
    const linhas = Array.from({ length: 8 }, (_, i) => [`Treino ${i + 1}`, 1, "X", "Costas", 3]);
    expect(erros(planilha(...linhas))).toEqual(["A planilha tem 8 treinos; o máximo é 7."]);
  });

  it("sem colunas obrigatórias ou sem exercícios", () => {
    expect(erros([["Nome", "Idade"], ["Maria", 60]])).toEqual(["Não encontrei as colunas Treino e Exercício."]);
    expect(erros([["Treino", "Exercício", "Séries"], ["Treino A", "X", 3]])).toEqual(["Não encontrei a coluna Grupo muscular."]);
    expect(erros([["Treino", "Exercício", "Grupo muscular"], ["Treino A", "X", "Costas"]])).toEqual(["Não encontrei a coluna Séries."]);
    expect(erros(planilha())).toEqual(["A planilha não tem nenhum exercício."]);
  });
});

describe("RN-02.4 / RN-03.1 — plano salvo", () => {
  const plano = ok(planilha(
    ["Treino A", 1, "Leg press", "Quadríceps", 3],
    ["Treino B", 1, "Supino", "Peitoral", 3],
    ["Treino C", 1, "Remada", "Costas", 3],
  ));

  it("sem plano: carregarPlano é null e a semana vale 3 dias", () => {
    expect(carregarPlano()).toBeNull();
    expect(diasPorSemana()).toBe(3);
  });

  it("dias por semana = número de treinos da planilha", () => {
    salvarPlano(ok(planilha(["Treino A", 1, "X", "Costas", 3], ["Treino B", 1, "Y", "Costas", 3])));
    expect(diasPorSemana()).toBe(2);
    salvarPlano(plano);
    expect(diasPorSemana()).toBe(3);
    expect(carregarPlano()!.treinos.map((t) => t.nome)).toEqual(["Treino A", "Treino B", "Treino C"]);
  });

  it("trocar de ficha mantém o histórico e descarta rascunhos", () => {
    registrarTreino([exec("Treino A", 1)]);
    localStorage.setItem("rascunho_treino", JSON.stringify({ "Treino A": { states: {}, currentIdx: 0 } }));
    salvarPlano(plano);
    expect(carregarExecucoes()).toHaveLength(1);
    expect(localStorage.getItem("rascunho_treino")).toBeNull();
  });

  it("plano corrompido no storage vira null", () => {
    localStorage.setItem("plano", "{quebrado");
    expect(carregarPlano()).toBeNull();
    localStorage.setItem("plano", JSON.stringify({ treinos: "x" }));
    expect(carregarPlano()).toBeNull();
  });
});

describe("RN-03.2 — treino sugerido", () => {
  const plano = ok(planilha(
    ["Treino A", 1, "Leg press", "Quadríceps", 3],
    ["Treino B", 1, "Supino", "Peitoral", 3],
    ["Treino C", 1, "Remada", "Costas", 3],
  ));

  it("sem histórico: primeiro treino", () => {
    expect(treinoSugerido(plano, [], [])).toBe("Treino A");
  });

  it("próximo da sequência depois do último salvo, mesmo com dias de falta", () => {
    expect(treinoSugerido(plano, [exec("Treino A", 1)], [])).toBe("Treino B");
    expect(treinoSugerido(plano, [exec("Treino A", 1), exec("Treino B", 20)], [])).toBe("Treino C");
  });

  it("depois do último treino volta ao primeiro", () => {
    expect(treinoSugerido(plano, [exec("Treino C", 5)], [])).toBe("Treino A");
  });

  it("usa a data, não a ordem de gravação", () => {
    expect(treinoSugerido(plano, [exec("Treino B", 20), exec("Treino A", 1)], [])).toBe("Treino C");
  });

  it("treino em andamento tem prioridade", () => {
    expect(treinoSugerido(plano, [exec("Treino A", 1)], ["Treino C"])).toBe("Treino C");
  });

  it("RN-03.4 último treino fora do plano atual → primeiro", () => {
    expect(treinoSugerido(plano, [exec("Upper A", 1)], [])).toBe("Treino A");
  });
});

describe("textoRepeticoes", () => {
  it("números ganham 'repetições'; texto livre fica como está", () => {
    expect(textoRepeticoes("10-12")).toBe("10–12 repetições");
    expect(textoRepeticoes("12")).toBe("12 repetições");
    expect(textoRepeticoes("10 a 12")).toBe("10 a 12 repetições");
    expect(textoRepeticoes("30 segundos")).toBe("30 segundos");
    expect(textoRepeticoes("")).toBe("");
  });
});
