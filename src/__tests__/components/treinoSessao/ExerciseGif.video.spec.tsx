/**
 * ExerciseGif — bloco de vídeo inline
 * Exercício com vídeo mostra um card compacto (miniatura + play). O play toca
 * o vídeo ali mesmo; "Abrir em tela maior" abre o modal que já existia.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ExerciseGif } from "../../../components/treinoSessao/ExerciseGif";

vi.mock("../../../services/exerciseDbService", () => ({
  fetchExerciseGif: vi.fn(),
}));

vi.mock("../../../data/exerciseVideos", () => ({
  EXERCISE_VIDEOS: {
    "Supino reto barra": "fakeYoutubeId123",
    "Remada baixa": "outroVideo456",
    "Exercicio sem video": "",
  } as Record<string, string>,
}));

const bloco = () => screen.getByRole("region", { name: "Demonstração em vídeo" });
const play = () => screen.getByRole("button", { name: "Reproduzir demonstração" });
const telaMaior = () => screen.getByRole("button", { name: "Abrir em tela maior" });
const iframes = () => document.querySelectorAll("iframe");

describe("ExerciseGif — bloco de vídeo inline", () => {
  it("mostra o bloco com miniatura do vídeo, sem o link antigo", () => {
    render(<ExerciseGif exerciseName="Supino reto barra" />);
    const thumb = within(bloco()).getByAltText("Miniatura: Supino reto barra") as HTMLImageElement;
    expect(thumb.src).toContain("i.ytimg.com/vi/fakeYoutubeId123/");
    expect(screen.queryByText("Ver demonstração")).not.toBeInTheDocument();
  });

  it("não carrega o player antes do play", () => {
    render(<ExerciseGif exerciseName="Supino reto barra" />);
    expect(iframes()).toHaveLength(0);
    expect(play()).toBeInTheDocument();
    expect(telaMaior()).toBeInTheDocument();
  });

  it("play toca o vídeo dentro do bloco, com autoplay e inline", () => {
    render(<ExerciseGif exerciseName="Supino reto barra" />);
    fireEvent.click(play());

    const iframe = within(bloco()).getByTitle("Demonstração: Supino reto barra");
    const src = iframe.getAttribute("src") ?? "";
    expect(src).toContain("https://www.youtube.com/embed/fakeYoutubeId123");
    expect(src).toContain("autoplay=1");
    expect(src).toContain("playsinline=1");
    expect(iframe).toHaveAttribute("allowfullscreen");
    expect(screen.queryByAltText("Miniatura: Supino reto barra")).not.toBeInTheDocument();
  });

  it("'Abrir em tela maior' abre o modal com o vídeo", () => {
    render(<ExerciseGif exerciseName="Supino reto barra" />);
    fireEvent.click(telaMaior());

    const dialog = screen.getByRole("dialog", { name: "Supino reto barra" });
    const iframe = within(dialog).getByTitle("Demonstração: Supino reto barra");
    expect(iframe.getAttribute("src")).toContain("fakeYoutubeId123");
  });

  it("ao abrir em tela maior o player do bloco para (só um vídeo tocando)", () => {
    render(<ExerciseGif exerciseName="Supino reto barra" />);
    fireEvent.click(play());
    fireEvent.click(telaMaior());
    expect(iframes()).toHaveLength(1);
    expect(within(bloco()).queryByTitle("Demonstração: Supino reto barra")).not.toBeInTheDocument();
  });

  it("fechar o modal volta para a miniatura", () => {
    render(<ExerciseGif exerciseName="Supino reto barra" />);
    fireEvent.click(telaMaior());
    fireEvent.click(screen.getByRole("button", { name: "Fechar demonstração" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(bloco()).getByAltText("Miniatura: Supino reto barra")).toBeInTheDocument();
  });

  it("trocar de exercício volta para a miniatura do novo vídeo", () => {
    const { rerender } = render(<ExerciseGif exerciseName="Supino reto barra" />);
    fireEvent.click(play());
    rerender(<ExerciseGif exerciseName="Remada baixa" />);

    expect(iframes()).toHaveLength(0);
    const thumb = screen.getByAltText("Miniatura: Remada baixa") as HTMLImageElement;
    expect(thumb.src).toContain("outroVideo456");
  });

  it("exercício sem vídeo continua com o link 'Ver demonstração' (GIF)", () => {
    render(<ExerciseGif exerciseName="Exercicio sem video" />);
    expect(screen.getByText("Ver demonstração")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Demonstração em vídeo" })).not.toBeInTheDocument();
  });
});
