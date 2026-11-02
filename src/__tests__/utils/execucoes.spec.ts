/**
 * Execuções — registro enxuto do PerformFit: o aluno marca as séries feitas,
 * sem peso. Um item por exercício por treino.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  carregarExecucoes,
  registrarTreino,
  existeTreinoNaData,
  removerTreinoNaData,
  ultimaDataDaSessao,
  type Execucao,
} from "../../utils/execucoes";
import { setCurrentUser } from "../../utils/storage";

function exec(parcial: Partial<Execucao> = {}): Execucao {
  return {
    exercicio: "Supino reto barra",
    grupo: "Peitoral",
    sessao: "Upper A",
    sessaoId: "UA",
    data: "13/10/2026",
    dataTs: new Date(2026, 9, 13).getTime(),
    seriesPlanejadas: 3,
    seriesFeitas: 3,
    ...parcial,
  };
}

describe("execucoes", () => {
  beforeEach(() => setCurrentUser(null));

  it("começa vazio", () => {
    expect(carregarExecucoes()).toEqual([]);
  });

  it("registrarTreino acrescenta as execuções sem apagar as anteriores", () => {
    registrarTreino([exec()]);
    registrarTreino([exec({ exercicio: "Remada baixa", grupo: "Costas", data: "14/10/2026" })]);
    expect(carregarExecucoes().map((e) => e.exercicio)).toEqual(["Supino reto barra", "Remada baixa"]);
  });

  it("não guarda nenhum campo de peso", () => {
    registrarTreino([exec()]);
    const salvo = JSON.parse(localStorage.getItem("execucoes")!)[0];
    expect(Object.keys(salvo).some((k) => /kg/i.test(k))).toBe(false);
  });

  it("grava na chave do usuário logado", () => {
    setCurrentUser("ana");
    registrarTreino([exec()]);
    expect(localStorage.getItem("gw:ana:execucoes")).not.toBeNull();
    expect(localStorage.getItem("execucoes")).toBeNull();
  });

  it("JSON corrompido vira lista vazia", () => {
    localStorage.setItem("execucoes", "{quebrado");
    expect(carregarExecucoes()).toEqual([]);
  });

  it("descarta itens inválidos e limita séries feitas às planejadas", () => {
    localStorage.setItem(
      "execucoes",
      JSON.stringify([exec({ seriesFeitas: 9 }), { exercicio: "x" }, null, exec({ seriesFeitas: -2 })]),
    );
    const lista = carregarExecucoes();
    expect(lista).toHaveLength(2);
    expect(lista[0]!.seriesFeitas).toBe(3);
    expect(lista[1]!.seriesFeitas).toBe(0);
  });

  it("existeTreinoNaData e removerTreinoNaData olham sessão + data", () => {
    registrarTreino([exec(), exec({ sessaoId: "UB", sessao: "Upper B" })]);
    expect(existeTreinoNaData("UA", "13/10/2026")).toBe(true);
    expect(existeTreinoNaData("UA", "14/10/2026")).toBe(false);
    removerTreinoNaData("UA", "13/10/2026");
    expect(carregarExecucoes().map((e) => e.sessaoId)).toEqual(["UB"]);
  });

  it("ultimaDataDaSessao devolve a data mais recente da sessão", () => {
    registrarTreino([
      exec({ data: "01/10/2026", dataTs: new Date(2026, 9, 1).getTime() }),
      exec({ data: "13/10/2026", dataTs: new Date(2026, 9, 13).getTime() }),
      exec({ sessaoId: "UB", data: "20/10/2026", dataTs: new Date(2026, 9, 20).getTime() }),
    ]);
    expect(ultimaDataDaSessao("UA")).toBe("13/10/2026");
    expect(ultimaDataDaSessao("LA")).toBeNull();
  });
});
