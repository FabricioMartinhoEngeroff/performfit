
import { describe, it, expect } from "vitest";
import {
  normalizarSeriesValidas,
  sugestaoDoUltimoTreino,
  volumeESeriesDoRegistro,
} from "../../utils/seriesValidas";
import type { RegistroExercicio } from "../../types/TrainingData";

function registro(over: Partial<RegistroExercicio> = {}): RegistroExercicio {
  return {
    exercicio: "Supino reto barra",
    treinoId: "UA",
    data: "01/10/2026",
    dataTs: 1000,
    topSetKg: 100,
    topSetReps: 6,
    topSetFaixaMin: 5,
    topSetFaixaMax: 9,
    topSetBateuTeto: false,
    backoffKg: 100,
    backoffReps: 5,
    backoffFaixaMin: 5,
    backoffFaixaMax: 9,
    seriesValidas: 2,
    progrediu: false,
    ...over,
  };
}

describe("normalizarSeriesValidas", () => {
  it.each([
    [1, 1], [2, 2], [3, 3], [4, 4],
    ["1", 1], ["3", 3], ["4", 4], [" 4 ", 4],
    [5, 2], [0, 2], ["", 2], [undefined, 2], [null, 2], ["abc", 2], [3.5, 2],
  ])("%j → %i", (entrada, esperado) => {
    expect(normalizarSeriesValidas(entrada)).toBe(esperado);
  });
});

describe("sugestaoDoUltimoTreino — o campo repete o logbook, nunca é alterado", () => {
  it("Top Set 1 repete peso e reps do último treino, mesmo quando bateu o teto", () => {
    const ultimo = registro({ topSetKg: 100, topSetReps: 9, topSetBateuTeto: true });
    const s = sugestaoDoUltimoTreino(ultimo, 2, 0.9);
    expect(s.topSetKg).toBe("100");
    expect(s.topSetReps).toBe("9");
  });

  it("Top Set 2 repete peso e reps salvos no Top Set 2, não o peso do Top Set 1", () => {
    const ultimo = registro({ topSetKg: 100, backoffKg: 95, backoffReps: 7 });
    const s = sugestaoDoUltimoTreino(ultimo, 2, 0.9);
    expect(s.backoffKg).toBe("95");
    expect(s.backoffReps).toBe("7");
  });

  it("Top Set 2 sem peso salvo usa o peso do Top Set 1", () => {
    const ultimo = registro({ topSetKg: 100, backoffKg: 0, backoffReps: 0 });
    const s = sugestaoDoUltimoTreino(ultimo, 2, 0.9);
    expect(s.backoffKg).toBe("100");
    expect(s.backoffReps).toBe("");
  });

  it("3 válidas: Back-off repete o peso salvo, sem recalcular 10% a menos", () => {
    const ultimo = registro({ seriesValidas: 3, extraKg: 80, extraReps: 12 });
    expect(sugestaoDoUltimoTreino(ultimo, 3, 0.9)).toMatchObject({
      extraKg: "80",
      extraReps: "12",
      serie4Kg: "",
      serie4Reps: "",
    });
  });

  it("3 válidas sem Back-off no último treino: sugere Top Set 1 × backoffPct", () => {
    const ultimo = registro({ seriesValidas: 2, topSetKg: 100 });
    const s = sugestaoDoUltimoTreino(ultimo, 3, 0.9);
    expect(s.extraKg).toBe("90");
    expect(s.extraReps).toBe("");
  });

  it("3 válidas não aproveita a Série 3 de um treino de 4 válidas como Back-off", () => {
    const ultimo = registro({ seriesValidas: 4, topSetKg: 100, extraKg: 100, extraReps: 5 });
    expect(sugestaoDoUltimoTreino(ultimo, 3, 0.9).extraKg).toBe("90");
  });

  it("4 válidas: Série 3 e Série 4 repetem peso e reps do último treino, sem reduzir", () => {
    const ultimo = registro({ seriesValidas: 4, extraKg: 95, extraReps: 5, serie4Kg: 92.5, serie4Reps: 4 });
    expect(sugestaoDoUltimoTreino(ultimo, 4, 0.9)).toMatchObject({
      extraKg: "95",
      extraReps: "5",
      serie4Kg: "92.5",
      serie4Reps: "4",
    });
  });

  it("4 válidas sem série 3/4 no último treino: usa peso e reps do Top Set 1", () => {
    const ultimo = registro({ seriesValidas: 2, topSetKg: 100, topSetReps: 6 });
    expect(sugestaoDoUltimoTreino(ultimo, 4, 0.9)).toMatchObject({
      extraKg: "100",
      extraReps: "6",
      serie4Kg: "100",
      serie4Reps: "6",
    });
  });

  it("4 válidas não aproveita um Back-off antigo (que era ~90%) como peso da Série 3", () => {
    const ultimo = registro({ seriesValidas: 3, extraKg: 90, extraReps: 12 });
    expect(sugestaoDoUltimoTreino(ultimo, 4, 0.9).extraKg).toBe("100");
  });

  it("2 válidas: nenhuma série extra", () => {
    expect(sugestaoDoUltimoTreino(registro(), 2, 0.9)).toMatchObject({
      extraKg: "",
      extraReps: "",
      serie4Kg: "",
      serie4Reps: "",
    });
  });
});

describe("volumeESeriesDoRegistro", () => {
  it("2 válidas: soma TS1 + TS2 e ignora slots extras", () => {
    const r = registro({ seriesValidas: 2, extraKg: 50, extraReps: 10, serie4Kg: 50, serie4Reps: 10 });
    expect(volumeESeriesDoRegistro(r)).toEqual({ volume: 100 * 6 + 100 * 5, series: 2 });
  });

  it("3 válidas: soma o Back-off e ignora a Série 4", () => {
    const r = registro({ seriesValidas: 3, extraKg: 90, extraReps: 10, serie4Kg: 50, serie4Reps: 10 });
    expect(volumeESeriesDoRegistro(r)).toEqual({ volume: 600 + 500 + 900, series: 3 });
  });

  it("4 válidas: soma as 4 séries", () => {
    const r = registro({ seriesValidas: 4, extraKg: 100, extraReps: 5, serie4Kg: 100, serie4Reps: 4 });
    expect(volumeESeriesDoRegistro(r)).toEqual({ volume: 600 + 500 + 500 + 400, series: 4 });
  });

  it("4 válidas com a Série 4 vazia conta só 3 séries", () => {
    const r = registro({ seriesValidas: 4, extraKg: 100, extraReps: 5 });
    expect(volumeESeriesDoRegistro(r)).toEqual({ volume: 1600, series: 3 });
  });
});
