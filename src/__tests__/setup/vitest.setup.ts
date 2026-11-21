import "@testing-library/jest-dom/vitest";

// Limpa o localStorage entre todos os testes
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

// jsdom não tem ResizeObserver; o ResponsiveContainer do recharts precisa dele.
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// jsdom não desenha em canvas: o confete de verdade (canvas-confetti) vira um stub.
// Os testes de utils/celebrar trocam este mock pelo deles.
vi.mock("canvas-confetti", () => ({ default: vi.fn(() => Promise.resolve()) }));
