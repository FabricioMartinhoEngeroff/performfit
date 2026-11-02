/**
 * ExerciseGif — tamanhos para público de mais idade: alvos de toque com pelo
 * menos 48px e texto do botão sem vídeo em 16px ou mais.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExerciseGif } from "../../../components/treinoSessao/ExerciseGif";

vi.mock("../../../services/exerciseDbService", () => ({
  fetchExerciseGif: vi.fn(() => new Promise(() => {})),
}));

vi.mock("../../../data/exerciseVideos", () => ({
  EXERCISE_VIDEOS: { "Supino reto barra": "fakeYoutubeId123", "Exercicio sem video": "" } as Record<string, string>,
}));

const px = (v: string) => parseFloat(v || "0");
const alvo = (el: HTMLElement) => Math.min(
  Math.max(px(el.style.width), px(el.style.minWidth)),
  Math.max(px(el.style.height), px(el.style.minHeight)),
);

describe("ExerciseGif — acessibilidade", () => {
  it("play e tela maior têm alvo de toque ≥ 48px", () => {
    render(<ExerciseGif exerciseName="Supino reto barra" />);
    expect(alvo(screen.getByRole("button", { name: "Reproduzir demonstração" }))).toBeGreaterThanOrEqual(48);
    expect(alvo(screen.getByRole("button", { name: "Abrir em tela maior" }))).toBeGreaterThanOrEqual(48);
  });

  it("miniatura do vídeo ocupa a largura do card", () => {
    render(<ExerciseGif exerciseName="Supino reto barra" />);
    expect(screen.getByAltText("Miniatura: Supino reto barra").style.width).toBe("100%");
  });

  it("botão 'Ver demonstração' é grande (≥ 48px, texto ≥ 16px)", () => {
    render(<ExerciseGif exerciseName="Exercicio sem video" />);
    const btn = screen.getByRole("button", { name: /Ver demonstração/ });
    expect(px(btn.style.minHeight)).toBeGreaterThanOrEqual(48);
    expect(px(btn.style.fontSize)).toBeGreaterThanOrEqual(16);
  });

  it("botão de fechar o modal tem alvo ≥ 48px e texto visível", () => {
    render(<ExerciseGif exerciseName="Supino reto barra" />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir em tela maior" }));
    const fechar = screen.getByRole("button", { name: "Fechar demonstração" });
    expect(alvo(fechar)).toBeGreaterThanOrEqual(48);
    expect(fechar).toHaveTextContent("Fechar");
  });
});
