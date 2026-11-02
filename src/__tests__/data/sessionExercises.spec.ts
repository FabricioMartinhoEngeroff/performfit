
import { describe, it, expect } from "vitest";
import { SESSOES, SESSOES_LABELS } from "../../data/sessionExercises";

describe("SessionExercises — Sessoes Upper / Lower / Braco (Saizen)", () => {
  describe("Estrutura geral", () => {
    it("deve ter exatamente 4 sessoes", () => {
      expect(Object.keys(SESSOES)).toHaveLength(4);
    });

    it("SESSOES_LABELS deve listar todas as 4 sessoes", () => {
      expect(SESSOES_LABELS).toHaveLength(4);
      SESSOES_LABELS.forEach((label) => {
        expect(SESSOES).toHaveProperty(label);
      });
    });

    it("deve conter Upper A, Upper B, Lower A e Lower B", () => {
      const sessoes = ["Upper A", "Upper B", "Lower A", "Lower B"];
      sessoes.forEach((s) => expect(SESSOES).toHaveProperty(s));
    });
  });

  describe("Volume minimo por sessao", () => {
    it("Upper A deve ter pelo menos 6 exercicios", () => {
      expect(SESSOES["Upper A"].length).toBeGreaterThanOrEqual(6);
    });

    it("Lower A deve ter pelo menos 6 exercicios", () => {
      expect(SESSOES["Lower A"].length).toBeGreaterThanOrEqual(6);
    });

    it("Upper B deve ter pelo menos 6 exercicios", () => {
      expect(SESSOES["Upper B"].length).toBeGreaterThanOrEqual(6);
    });

    it("Lower B deve ter pelo menos 6 exercicios", () => {
      expect(SESSOES["Lower B"].length).toBeGreaterThanOrEqual(6);
    });

  });

  describe("Formato ExercicioSessao", () => {
    it("cada exercicio deve ter nome, grupo e cue preenchidos", () => {
      Object.entries(SESSOES).forEach(([sessao, exercicios]) => {
        exercicios.forEach((ex) => {
          expect(ex.nome.trim(), `[${sessao}] nome vazio`).not.toBe("");
          expect(ex.grupo.trim(), `[${sessao}] grupo vazio`).not.toBe("");
          expect(ex.cue.trim(), `[${sessao}] cue vazio`).not.toBe("");
        });
      });
    });

    it("faixaTopSet deve ser [min, max] com min < max", () => {
      Object.values(SESSOES).flat().forEach((ex) => {
        expect(ex.faixaTopSet).toHaveLength(2);
        expect(ex.faixaTopSet[0]).toBeLessThan(ex.faixaTopSet[1]);
      });
    });

    it("faixaBackoff deve ser [min, max] com min < max", () => {
      Object.values(SESSOES).flat().forEach((ex) => {
        expect(ex.faixaBackoff).toHaveLength(2);
        expect(ex.faixaBackoff[0]).toBeLessThan(ex.faixaBackoff[1]);
      });
    });

    it("backoffPct deve ser entre 0 e 1", () => {
      Object.values(SESSOES).flat().forEach((ex) => {
        expect(ex.backoffPct).toBeGreaterThan(0);
        expect(ex.backoffPct).toBeLessThanOrEqual(1);
      });
    });

    it("backoffPct padrao eh 0.9 (90%)", () => {
      Object.values(SESSOES).flat().forEach((ex) => {
        expect(ex.backoffPct).toBe(0.9);
      });
    });
  });

  describe("Separacao Upper / Lower", () => {
    it("Upper A deve conter exercicio de Peitoral", () => {
      const temPeito = SESSOES["Upper A"].some((e) => e.grupo === "Peitoral");
      expect(temPeito).toBe(true);
    });

    it("Lower A deve conter exercicio de Posterior/Gluteo", () => {
      const temPerna = SESSOES["Lower A"].some((e) =>
        e.grupo.match(/Posterior|Quadríceps/)
      );
      expect(temPerna).toBe(true);
    });

    it("Upper B deve conter exercicio de Costas", () => {
      const temCostas = SESSOES["Upper B"].some((e) => e.grupo === "Costas");
      expect(temCostas).toBe(true);
    });

    it("Lower B deve conter exercicio de Quadriceps", () => {
      const temQuad = SESSOES["Lower B"].some((e) => e.grupo === "Quadríceps");
      expect(temQuad).toBe(true);
    });
  });

  describe("Faixas Saizen por categoria", () => {
    it("multiarticulares livres devem ter faixaTopSet [5,8] e faixaBackoff [8,10]", () => {
      const multiarticulares = Object.values(SESSOES).flat().filter(
        (ex) => ex.faixaTopSet[0] === 5 && ex.faixaTopSet[1] === 8
      );
      expect(multiarticulares.length).toBeGreaterThan(0);
      multiarticulares.forEach((ex) => {
        expect(ex.faixaBackoff).toEqual([8, 10]);
      });
    });

    it("maquinas e press pesados devem ter faixaTopSet [8,10] e faixaBackoff [10,12]", () => {
      const maquinas = Object.values(SESSOES).flat().filter(
        (ex) => ex.faixaTopSet[0] === 8 && ex.faixaTopSet[1] === 10
      );
      expect(maquinas.length).toBeGreaterThan(0);
      maquinas.forEach((ex) => {
        expect(ex.faixaBackoff).toEqual([10, 12]);
      });
    });

    it("panturrilha deve ter faixaTopSet [8,10] e faixaBackoff [10,12]", () => {
      const panturrilhas = Object.values(SESSOES).flat().filter(
        (ex) => ex.grupo === "Panturrilha"
      );
      expect(panturrilhas.length).toBeGreaterThan(0);
      panturrilhas.forEach((ex) => {
        expect(ex.faixaTopSet).toEqual([8, 10]);
        expect(ex.faixaBackoff).toEqual([10, 12]);
      });
    });

    it("isoladores e cabos devem ter faixaTopSet [8,10] e faixaBackoff [10,12]", () => {
      const isoladores = Object.values(SESSOES).flat().filter(
        (ex) => ex.grupo !== "Panturrilha" && ex.faixaTopSet[0] === 8 && ex.faixaTopSet[1] === 10
      );
      expect(isoladores.length).toBeGreaterThan(0);
      isoladores.forEach((ex) => {
        expect(ex.faixaBackoff).toEqual([10, 12]);
      });
    });

    it("exercicios de braco devem ter faixaTopSet [8,10] e faixaBackoff [10,12]", () => {
      const bracos = Object.values(SESSOES).flat().filter((ex) => ex.grupo === "Braço");
      expect(bracos.length).toBeGreaterThan(0);
      bracos.forEach((ex) => {
        expect(ex.faixaTopSet, `${ex.nome} faixaTopSet inesperada`).toEqual([8, 10]);
        expect(ex.faixaBackoff, `${ex.nome} faixaBackoff inesperada`).toEqual([10, 12]);
      });
    });
  });
});
