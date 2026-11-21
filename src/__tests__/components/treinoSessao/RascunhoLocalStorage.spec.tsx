/**
 * Rascunho do treino em andamento (RN-04.10): marcações e anotações ficam em
 * localStorage("rascunho_treino") e voltam ao reabrir o app. Só somem ao salvar.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { planoDeTeste } from "../../helpers/planoDeTeste";

const DRAFT_KEY = "rascunho_treino";

const chip = (nome: string) => screen.getByRole("button", { name: nome });
/** RN-04.12: o treino abre na lista; Começar/Continuar entra no exercício. */
const comecar = () => fireEvent.click(screen.getByRole("button", { name: /^(Começar|Continuar)$/ }));
const series = () => screen.getAllByRole("checkbox", { name: /^Série \d$/ });
const draft = () => {
  const raw = localStorage.getItem(DRAFT_KEY);
  return raw ? JSON.parse(raw) : null;
};
function reabrir() {
  cleanup();
  render(<TreinoSessao />);
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

describe("RN-04.10 — rascunho do treino", () => {
  beforeEach(() => {
    localStorage.clear();
    planoDeTeste();
  });

  it("marcar uma série grava o rascunho do treino", () => {
    render(<TreinoSessao />);
    comecar();
    fireEvent.click(series()[0]!);
    expect(draft()?.["Treino A"]).toBeDefined();
  });

  it("sem nada marcado não grava rascunho", () => {
    render(<TreinoSessao />);
    comecar();
    expect(draft()).toBeNull();
  });

  it("restaura marcações, anotação e exercício atual ao reabrir", () => {
    render(<TreinoSessao />);
    comecar();
    fireEvent.click(series()[0]!);
    fireEvent.change(screen.getByLabelText("Como você estava neste exercício?"), { target: { value: "bem disposto" } });
    fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    fireEvent.click(series()[1]!);

    reabrir();
    expect(screen.getByText("2 / 4")).toBeInTheDocument();
    expect(series()[1]).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("button", { name: "Exercício anterior" }));
    expect(series()[0]).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Como você estava neste exercício?")).toHaveValue("bem disposto");
  });

  it("restaura exercício pulado", () => {
    render(<TreinoSessao />);
    comecar();
    fireEvent.click(screen.getByRole("button", { name: "Pular" }));
    reabrir();
    fireEvent.click(screen.getByRole("button", { name: "Exercício anterior" }));
    expect(screen.getByText("Exercício pulado")).toBeInTheDocument();
  });

  it("rascunhos de treinos diferentes não se misturam", () => {
    render(<TreinoSessao />);
    comecar();
    fireEvent.click(series()[0]!);
    fireEvent.click(chip("Treino B"));
    comecar();
    expect(series().every((cb) => cb.getAttribute("aria-checked") === "false")).toBe(true);
    fireEvent.click(chip("Treino A"));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
    comecar();
    expect(series()[0]).toHaveAttribute("aria-checked", "true");
  });

  it("salvar remove o rascunho só do treino salvo", () => {
    render(<TreinoSessao />);
    fireEvent.click(chip("Treino B"));
    comecar();
    fireEvent.click(series()[0]!);
    fireEvent.click(chip("Treino C"));
    comecar();
    series().forEach((cb) => fireEvent.click(cb));
    fireEvent.click(screen.getByRole("button", { name: "Ver Resumo" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar e Salvar Treino" }));
    expect(draft()?.["Treino C"]).toBeUndefined();
    expect(draft()?.["Treino B"]).toBeDefined();
  });

  it("ignora rascunho corrompido", () => {
    localStorage.setItem(DRAFT_KEY, "{quebrado");
    render(<TreinoSessao />);
    comecar();
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
  });

  it("ignora rascunho de formato antigo (Top Set) sem quebrar", () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      "Treino A": { states: { "Leg press": { topSetKg: "100", topSetConfirmed: true } }, currentIdx: 99 },
    }));
    render(<TreinoSessao />);
    // Sem progresso válido o rascunho não conta: o botão é Começar e o treino abre do início.
    expect(screen.getByRole("button", { name: "Começar" })).toBeInTheDocument();
    comecar();
    expect(series().every((cb) => cb.getAttribute("aria-checked") === "false")).toBe(true);
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
  });
});
