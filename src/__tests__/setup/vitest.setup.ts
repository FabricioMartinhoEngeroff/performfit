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
