/**
 * Vibração e confete (docs/REGRAS_DE_NEGOCIO.md RN-10.2 a RN-10.5).
 * São extras: sem suporte no aparelho ou com "menos movimento" ligado, nada quebra.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const { confetti } = vi.hoisted(() => ({ confetti: vi.fn() }));
vi.mock("canvas-confetti", () => ({ default: confetti }));

import { soltarConfete, vibrar, VIBRACAO } from "../../utils/celebrar";

function menosMovimento(ligado: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: ligado && q.includes("reduce"), media: q }));
}

describe("RN-10.2 / RN-10.3 / RN-10.5 vibrar", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    // jsdom não tem vibrate: remove o que o teste colocou.
    delete (navigator as { vibrate?: unknown }).vibrate;
  });

  it("padrões: série 30 ms, exercício [40, 60, 40]", () => {
    expect(VIBRACAO.serie).toBe(30);
    expect(VIBRACAO.exercicio).toEqual([40, 60, 40]);
  });

  it("chama navigator.vibrate quando o aparelho tem vibração", () => {
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    vibrar(VIBRACAO.serie);
    expect(vibrate).toHaveBeenCalledWith(30);
  });

  it("aparelho sem vibração (iPhone) não quebra", () => {
    expect("vibrate" in navigator).toBe(false);
    expect(() => vibrar(VIBRACAO.exercicio)).not.toThrow();
  });

  it("vibrate que lança erro não quebra o app", () => {
    Object.defineProperty(navigator, "vibrate", {
      value: () => { throw new Error("bloqueado"); },
      configurable: true,
    });
    expect(() => vibrar(30)).not.toThrow();
  });
});

describe("RN-10.3 / RN-10.4 / RN-10.5 soltarConfete", () => {
  beforeEach(() => confetti.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("exercício < treino < semana em quantidade de confete", () => {
    menosMovimento(false);
    soltarConfete("exercicio");
    soltarConfete("treino");
    soltarConfete("semana");
    const qtd = confetti.mock.calls.map(([op]) => (op as { particleCount: number }).particleCount);
    expect(qtd).toHaveLength(3);
    expect(qtd[0]).toBeLessThan(qtd[1]!);
    expect(qtd[1]).toBeLessThan(qtd[2]!);
  });

  it("respeita 'menos movimento' do celular: sem confete", () => {
    menosMovimento(true);
    soltarConfete("semana");
    expect(confetti).not.toHaveBeenCalled();
  });

  it("navegador sem matchMedia ainda solta confete", () => {
    vi.stubGlobal("matchMedia", undefined);
    soltarConfete("treino");
    expect(confetti).toHaveBeenCalledTimes(1);
  });
});
