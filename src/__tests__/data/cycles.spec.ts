/**
 * CyclesTest -> data
 * Valida integridade da rotacao de treinos Saizen.
 * UA/UB (Upper), LA/LB (Lower), BR (Braco).
 */
import { describe, it, expect } from "vitest";
import { ROTACAO, ROTACAO_LABELS } from "../../data/cycles";

describe("CyclesData — Rotacao de treinos Saizen", () => {
  describe("Quantidade e identificadores", () => {
    it("deve ter exatamente 4 treinos na rotacao", () => {
      expect(ROTACAO).toHaveLength(4);
    });

    it("ids devem ser UA, UB, LA, LB", () => {
      expect(ROTACAO.map((r) => r.id)).toEqual(["UA", "UB", "LA", "LB"]);
    });

    it("ids devem ser unicos", () => {
      const ids = ROTACAO.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("Campos obrigatorios", () => {
    it("todos os treinos devem ter titulo, tipo e dia preenchidos", () => {
      ROTACAO.forEach((r) => {
        expect(r.titulo.trim()).not.toBe("");
        expect(r.tipo.trim()).not.toBe("");
        expect(r.dia.trim()).not.toBe("");
      });
    });
  });

  describe("Tipos de treino", () => {
    it("UA e UB devem ser tipo upper", () => {
      expect(ROTACAO.find((r) => r.id === "UA")!.tipo).toBe("upper");
      expect(ROTACAO.find((r) => r.id === "UB")!.tipo).toBe("upper");
    });

    it("LA e LB devem ser tipo lower", () => {
      expect(ROTACAO.find((r) => r.id === "LA")!.tipo).toBe("lower");
      expect(ROTACAO.find((r) => r.id === "LB")!.tipo).toBe("lower");
    });
  });

  describe("ROTACAO_LABELS", () => {
    it("deve ter 4 labels", () => {
      expect(ROTACAO_LABELS).toHaveLength(4);
    });

    it("labels correspondem aos titulos da ROTACAO", () => {
      expect(ROTACAO_LABELS).toEqual(ROTACAO.map((r) => r.titulo));
    });
  });

  describe("Dias da semana", () => {
    it("cada treino tem um dia atribuido", () => {
      ROTACAO.forEach((r) => {
        expect(r.dia.length).toBeGreaterThan(0);
      });
    });
  });
});
