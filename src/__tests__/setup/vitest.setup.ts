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
