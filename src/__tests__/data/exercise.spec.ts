import { describe, it, expect } from "vitest";
import { EXERCICIOS } from "../../data/exercise";

describe("exercise — Lista de exercicios Saizen", () => {
  it("exporta um array nao vazio", () => {
    expect(Array.isArray(EXERCICIOS)).toBe(true);
    expect(EXERCICIOS.length).toBeGreaterThan(0);
  });

  it("todos os itens sao strings nao vazias", () => {
    EXERCICIOS.forEach((ex) => {
      expect(typeof ex).toBe("string");
      expect(ex.trim().length).toBeGreaterThan(0);
    });
  });

  it("nao contem duplicatas", () => {
    const unicos = new Set(EXERCICIOS.map((e) => e.toLowerCase()));
    expect(unicos.size).toBe(EXERCICIOS.length);
  });

  it("contem exercicios compostos principais", () => {
    expect(EXERCICIOS).toContain("Agachamento livre");
    expect(EXERCICIOS).toContain("Terra sumô");
    expect(EXERCICIOS).toContain("Supino reto barra");
  });

  it("contem exercicios de isolamento", () => {
    expect(EXERCICIOS).toContain("Cadeira extensora");
    expect(EXERCICIOS).toContain("Cadeira flexora sentada");
  });

  it("contem exercicios de costas", () => {
    expect(EXERCICIOS).toContain("Barra fixa");
    expect(EXERCICIOS).toContain("Puxada triângulo");
    expect(EXERCICIOS).toContain("Remada peito apoiado");
  });

  it("contem exercicio de core", () => {
    expect(EXERCICIOS).toContain("Abdômen cabo ajoelhado");
  });

  it("contem exercicios de panturrilha", () => {
    const panturrilhas = EXERCICIOS.filter((e) => e.toLowerCase().includes("panturrilha"));
    expect(panturrilhas.length).toBeGreaterThanOrEqual(2);
  });

  it("contem exercicios de braco", () => {
    expect(EXERCICIOS).toContain("Tríceps testa");
    expect(EXERCICIOS).toContain("Rosca inclinada 45°");
    expect(EXERCICIOS).toContain("Rosca scott unilateral");
  });
});
