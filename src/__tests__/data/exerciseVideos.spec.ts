import { describe, it, expect } from "vitest";
import { EXERCISE_VIDEOS } from "../../data/exerciseVideos";

describe("exerciseVideos", () => {
  it("exporta um objeto nao vazio", () => {
    expect(Object.keys(EXERCISE_VIDEOS).length).toBeGreaterThan(0);
  });

  it("todos os valores sao strings", () => {
    Object.entries(EXERCISE_VIDEOS).forEach(([, id]) => {
      expect(typeof id).toBe("string");
    });
  });

  it("IDs preenchidos nao contem URL completa (apenas o ID do video)", () => {
    Object.entries(EXERCISE_VIDEOS).forEach(([, id]) => {
      if (id) {
        expect(id).not.toContain("youtube.com");
        expect(id).not.toContain("http");
      }
    });
  });

  it("contem exercicios principais do app", () => {
    expect(EXERCISE_VIDEOS).toHaveProperty("Supino reto barra");
    expect(EXERCISE_VIDEOS).toHaveProperty("Agachamento livre");
    expect(EXERCISE_VIDEOS).toHaveProperty("Barra fixa");
  });

  it("nao tem chaves duplicadas (nomes canonicos unicos)", () => {
    const keys = Object.keys(EXERCISE_VIDEOS);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});
