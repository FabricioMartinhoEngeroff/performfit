import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExerciseGif } from "../../../components/treinoSessao/ExerciseGif";

vi.mock("../../../services/exerciseDbService", () => ({
  fetchExerciseGif: vi.fn(),
}));

vi.mock("../../../data/exerciseVideos", () => ({
  EXERCISE_VIDEOS: {
    "Supino reto barra": "fakeYoutubeId123",
    "Exercicio sem video": "",
  } as Record<string, string>,
}));

import { fetchExerciseGif } from "../../../services/exerciseDbService";

describe("ExerciseGif", () => {
  beforeEach(() => {
    vi.mocked(fetchExerciseGif).mockReset();
    vi.mocked(fetchExerciseGif).mockReturnValue(new Promise(() => {}));
  });

  // Exercício com vídeo usa o bloco inline — ver ExerciseGif.video.spec.tsx.

  it("renderiza botao 'Ver demonstracao' para exercicio sem video", () => {
    render(<ExerciseGif exerciseName="Exercicio sem video" />);
    expect(screen.getByText("Ver demonstração")).toBeInTheDocument();
  });

  it("nao exibe modal antes de clicar", () => {
    render(<ExerciseGif exerciseName="Exercicio sem video" />);
    expect(screen.queryByText("Exercicio sem video")).not.toBeInTheDocument();
  });

  it("abre modal ao clicar em Ver demonstracao", () => {
    render(<ExerciseGif exerciseName="Exercicio sem video" />);
    fireEvent.click(screen.getByText("Ver demonstração"));
    expect(screen.getByText("Exercicio sem video")).toBeInTheDocument();
  });

  it("carrega GIF da API quando exercicio nao tem video", async () => {
    vi.mocked(fetchExerciseGif).mockResolvedValue("https://gif.example.com/exercicio.gif");
    render(<ExerciseGif exerciseName="Exercicio sem video" />);
    fireEvent.click(screen.getByText("Ver demonstração"));

    await waitFor(() => {
      const img = screen.getByAltText("Demonstração: Exercicio sem video");
      expect(img).toBeInTheDocument();
      expect(img.getAttribute("src")).toBe("https://gif.example.com/exercicio.gif");
    });
  });

  it("exibe mensagem de erro quando GIF nao esta disponivel", async () => {
    vi.mocked(fetchExerciseGif).mockResolvedValue(null);
    render(<ExerciseGif exerciseName="Exercicio sem video" />);
    fireEvent.click(screen.getByText("Ver demonstração"));

    await waitFor(() => {
      expect(screen.getByText("Demonstração não disponível")).toBeInTheDocument();
    });
  });

  it("exibe 'Carregando...' enquanto busca o GIF", () => {
    vi.mocked(fetchExerciseGif).mockReturnValue(new Promise(() => {}));
    render(<ExerciseGif exerciseName="Exercicio sem video" />);
    fireEvent.click(screen.getByText("Ver demonstração"));
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("fecha o modal ao clicar no overlay", () => {
    render(<ExerciseGif exerciseName="Exercicio sem video" />);
    fireEvent.click(screen.getByText("Ver demonstração"));
    expect(screen.getByText("Exercicio sem video")).toBeInTheDocument();

    const overlay = screen.getByText("Toque fora para fechar").closest("div[style]")!.parentElement!;
    fireEvent.click(overlay);
    expect(screen.queryByText("Toque fora para fechar")).not.toBeInTheDocument();
  });

  it("fecha o modal ao clicar no botao X", () => {
    render(<ExerciseGif exerciseName="Exercicio sem video" />);
    fireEvent.click(screen.getByText("Ver demonstração"));
    fireEvent.click(screen.getByText("✕"));
    expect(screen.queryByText("Toque fora para fechar")).not.toBeInTheDocument();
  });

  it("trata erro da API graciosamente", async () => {
    vi.mocked(fetchExerciseGif).mockRejectedValue(new Error("Network error"));
    render(<ExerciseGif exerciseName="Exercicio sem video" />);
    fireEvent.click(screen.getByText("Ver demonstração"));

    await waitFor(() => {
      expect(screen.getByText("Demonstração não disponível")).toBeInTheDocument();
    });
  });
});
