/**
 * Data do treino por botões Hoje / Ontem / Outro dia (docs/REGRAS_DE_NEGOCIO.md RN-11).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { carregarExecucoes } from "../../../utils/execucoes";
import { planoDeTeste } from "../../helpers/planoDeTeste";

const botao = (nome: string) => screen.getByRole("button", { name: nome });
const seletor = () => screen.getByLabelText("Escolher o dia do treino");

/** Treino C: 1 exercício de 3 séries — marca tudo e tenta salvar. */
function fazerTreinoC() {
  fireEvent.click(botao("Treino C"));
  fireEvent.click(botao("Começar"));
  screen.getAllByRole("checkbox", { name: /^Série \d$/ }).forEach((cb) => fireEvent.click(cb));
  fireEvent.click(botao("Ver Resumo"));
  fireEvent.click(botao("Confirmar e Salvar Treino"));
}

describe("RN-11 — data do treino", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 4, 12)); // quarta 04/11/2026
    localStorage.clear();
    planoDeTeste();
  });
  afterEach(() => vi.useRealTimers());

  it("RN-11.1 / RN-11.3 começa em Hoje, mostrando o dia por extenso; não tem campo de digitar", () => {
    render(<TreinoSessao />);
    expect(botao("Hoje")).toHaveAttribute("aria-pressed", "true");
    expect(botao("Ontem")).toHaveAttribute("aria-pressed", "false");
    expect(botao("Outro dia")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Quarta-feira, 04/11/2026")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Data do treino" })).not.toBeInTheDocument();
  });

  it("RN-11.1 botões de data com alvo de toque grande", () => {
    render(<TreinoSessao />);
    for (const nome of ["Hoje", "Ontem", "Outro dia"]) {
      expect(parseInt(getComputedStyle(botao(nome)).minHeight, 10)).toBeGreaterThanOrEqual(48);
    }
  });

  it("Ontem salva o treino no dia anterior", () => {
    render(<TreinoSessao />);
    fireEvent.click(botao("Ontem"));
    expect(botao("Ontem")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Terça-feira, 03/11/2026")).toBeInTheDocument();
    fazerTreinoC();
    const [e] = carregarExecucoes();
    expect(e).toMatchObject({ data: "03/11/2026", dataTs: new Date(2026, 10, 3).getTime() });
  });

  it("RN-11.2 Outro dia abre o seletor do celular, limitado a hoje, e salva no dia escolhido", () => {
    render(<TreinoSessao />);
    expect(screen.queryByLabelText("Escolher o dia do treino")).not.toBeInTheDocument();
    fireEvent.click(botao("Outro dia"));
    expect(seletor()).toHaveAttribute("type", "date");
    expect(seletor()).toHaveAttribute("max", "2026-11-04");
    expect(seletor()).toHaveValue("2026-11-04");
    fireEvent.change(seletor(), { target: { value: "2026-10-30" } });
    expect(screen.getByText("Sexta-feira, 30/10/2026")).toBeInTheDocument();
    fazerTreinoC();
    expect(carregarExecucoes()[0]).toMatchObject({ data: "30/10/2026" });
  });

  it("voltar para Hoje depois de escolher outro dia", () => {
    render(<TreinoSessao />);
    fireEvent.click(botao("Outro dia"));
    fireEvent.change(seletor(), { target: { value: "2026-10-30" } });
    fireEvent.click(botao("Hoje"));
    expect(screen.getByText("Quarta-feira, 04/11/2026")).toBeInTheDocument();
    expect(screen.queryByLabelText("Escolher o dia do treino")).not.toBeInTheDocument();
  });

  it("RN-11.4 data no futuro: avisa e não salva", () => {
    render(<TreinoSessao />);
    fireEvent.click(botao("Outro dia"));
    fireEvent.change(seletor(), { target: { value: "2026-11-10" } });
    expect(screen.getByText("A data do treino não pode ser no futuro.")).toBeInTheDocument();
    fazerTreinoC();
    expect(screen.getByRole("alert")).toHaveTextContent("A data do treino não pode ser no futuro.");
    expect(carregarExecucoes()).toHaveLength(0);
  });

  it("RN-11.4 data apagada: pede para escolher e não salva (nunca usa hoje em silêncio)", () => {
    render(<TreinoSessao />);
    fireEvent.click(botao("Outro dia"));
    fireEvent.change(seletor(), { target: { value: "" } });
    expect(screen.getByText("Escolha o dia do treino.")).toBeInTheDocument();
    fazerTreinoC();
    expect(screen.getByRole("alert")).toHaveTextContent("Escolha o dia do treino.");
    expect(carregarExecucoes()).toHaveLength(0);
  });

  it("corrigir a data permite salvar", () => {
    render(<TreinoSessao />);
    fireEvent.click(botao("Outro dia"));
    fireEvent.change(seletor(), { target: { value: "2026-11-10" } });
    fireEvent.change(seletor(), { target: { value: "2026-11-02" } });
    expect(screen.queryByText("A data do treino não pode ser no futuro.")).not.toBeInTheDocument();
    fazerTreinoC();
    expect(carregarExecucoes()[0]).toMatchObject({ data: "02/11/2026" });
  });
});
