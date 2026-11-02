import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchExerciseGif } from "../../services/exerciseDbService";

describe("exerciseDbService — fetchExerciseGif", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("VITE_RAPIDAPI_KEY", "test-api-key");
  });

  it("retorna null para exercicio sem mapeamento de nome", async () => {
    const result = await fetchExerciseGif("Exercicio inventado");
    expect(result).toBeNull();
  });

  it("retorna null quando RAPIDAPI_KEY nao esta definida", async () => {
    vi.stubEnv("VITE_RAPIDAPI_KEY", "");
    const { fetchExerciseGif: freshFetch } = await import("../../services/exerciseDbService");
    const result = await freshFetch("Supino reto barra");
    expect(result).toBeNull();
  });

  it("retorna gifUrl da API quando disponivel", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ gifUrl: "https://cdn.example.com/bench.gif" }]),
    }));

    const result = await fetchExerciseGif("Agachamento livre");
    expect(result).toBe("https://cdn.example.com/bench.gif");
  });

  it("retorna null quando API retorna resposta nao-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    }));

    const result = await fetchExerciseGif("Cadeira extensora");
    expect(result).toBeNull();
  });

  it("retorna null quando API retorna array vazio", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }));

    const result = await fetchExerciseGif("Terra sumô");
    expect(result).toBeNull();
  });

  it("retorna null quando exercicio nao tem gifUrl na resposta", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: "123", name: "sumo deadlift" }]),
    }));

    const result = await fetchExerciseGif("Terra sumô");
    expect(result).toBeNull();
  });

  it("lida com formato de resposta aninhado { data: [...] }", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ gifUrl: "https://cdn.example.com/squat.gif" }] }),
    }));

    const result = await fetchExerciseGif("Stiff");
    expect(result).toBe("https://cdn.example.com/squat.gif");
  });
});
