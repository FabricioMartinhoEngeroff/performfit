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
const series = () => screen.getAllByRole("checkbox", { name: /^Série \d$/ });
const draft = () => {
  const raw = localStorage.getItem(DRAFT_KEY);
  return raw ? JSON.parse(raw) : null;
};
function reabrir() {
  cleanup();
  render(<TreinoSessao />);
}

describe("RN-04.10 — rascunho do treino", () => {
  beforeEach(() => {
    localStorage.clear();
    planoDeTeste();
  });

  it("marcar uma série grava o rascunho do treino", () => {
    render(<TreinoSessao />);
    fireEvent.click(series()[0]!);
    expect(draft()?.["Treino A"]).toBeDefined();
  });

  it("sem nada marcado não grava rascunho", () => {
    render(<TreinoSessao />);
    expect(draft()).toBeNull();
  });

  it("restaura marcações, anotação e exercício atual ao reabrir", () => {
    render(<TreinoSessao />);
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
    fireEvent.click(screen.getByRole("button", { name: "Pular" }));
    reabrir();
    fireEvent.click(screen.getByRole("button", { name: "Exercício anterior" }));
    expect(screen.getByText("Exercício pulado")).toBeInTheDocument();
  });

  it("rascunhos de treinos diferentes não se misturam", () => {
    render(<TreinoSessao />);
    fireEvent.click(series()[0]!);
    fireEvent.click(chip("Treino B"));
    expect(series().every((cb) => cb.getAttribute("aria-checked") === "false")).toBe(true);
    fireEvent.click(chip("Treino A"));
    expect(series()[0]).toHaveAttribute("aria-checked", "true");
  });

  it("salvar remove o rascunho só do treino salvo", () => {
    render(<TreinoSessao />);
    fireEvent.click(chip("Treino B"));
    fireEvent.click(series()[0]!);
    fireEvent.click(chip("Treino C"));
    series().forEach((cb) => fireEvent.click(cb));
    fireEvent.click(screen.getByRole("button", { name: "Ver Resumo" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar e Salvar Treino" }));
    expect(draft()?.["Treino C"]).toBeUndefined();
    expect(draft()?.["Treino B"]).toBeDefined();
  });

  it("ignora rascunho corrompido", () => {
    localStorage.setItem(DRAFT_KEY, "{quebrado");
    render(<TreinoSessao />);
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
  });

  it("ignora rascunho de formato antigo (Top Set) sem quebrar", () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      "Treino A": { states: { "Leg press": { topSetKg: "100", topSetConfirmed: true } }, currentIdx: 99 },
    }));
    render(<TreinoSessao />);
    expect(series().every((cb) => cb.getAttribute("aria-checked") === "false")).toBe(true);
    expect(screen.getByText("4 / 4")).toBeInTheDocument();
  });
});
