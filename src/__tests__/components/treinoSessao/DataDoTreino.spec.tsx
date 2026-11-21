/**
 * Data do treino (docs/REGRAS_DE_NEGOCIO.md RN-11).
 * Simples por padrão: "Hoje, quarta-feira, 4 de novembro" + botão "Treinei em outro dia".
 * Só depois de tocar nele aparecem Hoje / Ontem / Outro dia.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { carregarExecucoes } from "../../../utils/execucoes";
import { planoDeTeste } from "../../helpers/planoDeTeste";

const botao = (nome: string) => screen.getByRole("button", { name: nome });
const seletor = () => screen.getByLabelText("Escolher o dia do treino");
const outroDia = () => fireEvent.click(botao("Treinei em outro dia"));

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

  describe("RN-11.1 — simples por padrão", () => {
    it("mostra só a linha de hoje por extenso e o botão Treinei em outro dia", () => {
      render(<TreinoSessao />);
      expect(screen.getByText("Hoje, quarta-feira, 4 de novembro")).toBeInTheDocument();
      expect(botao("Treinei em outro dia")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Hoje" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Ontem" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Outro dia" })).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Escolher o dia do treino")).not.toBeInTheDocument();
      expect(screen.queryByText(/\d{2}\/\d{2}\/\d{4}/)).not.toBeInTheDocument();
    });

    it("sem mexer na data, salva hoje", () => {
      render(<TreinoSessao />);
      fazerTreinoC();
      expect(carregarExecucoes()[0]).toMatchObject({ data: "04/11/2026" });
    });

    it("botões com alvo de toque grande", () => {
      render(<TreinoSessao />);
      expect(parseInt(getComputedStyle(botao("Treinei em outro dia")).minHeight, 10)).toBeGreaterThanOrEqual(48);
      outroDia();
      for (const nome of ["Hoje", "Ontem", "Outro dia"]) {
        expect(parseInt(getComputedStyle(botao(nome)).minHeight, 10)).toBeGreaterThanOrEqual(48);
      }
    });
  });

  describe("RN-11.2 — Treinei em outro dia", () => {
    it("mostra Hoje (marcado), Ontem e Outro dia; some o botão Treinei em outro dia", () => {
      render(<TreinoSessao />);
      outroDia();
      expect(botao("Hoje")).toHaveAttribute("aria-pressed", "true");
      expect(botao("Ontem")).toHaveAttribute("aria-pressed", "false");
      expect(botao("Outro dia")).toHaveAttribute("aria-pressed", "false");
      expect(screen.queryByRole("button", { name: "Treinei em outro dia" })).not.toBeInTheDocument();
    });

    it("Ontem salva o treino no dia anterior", () => {
      render(<TreinoSessao />);
      outroDia();
      fireEvent.click(botao("Ontem"));
      expect(botao("Ontem")).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText("Ontem, terça-feira, 3 de novembro")).toBeInTheDocument();
      fazerTreinoC();
      const [e] = carregarExecucoes();
      expect(e).toMatchObject({ data: "03/11/2026", dataTs: new Date(2026, 10, 3).getTime() });
    });

    it("Outro dia abre o seletor do celular, limitado a hoje, e salva no dia escolhido", () => {
      render(<TreinoSessao />);
      outroDia();
      expect(screen.queryByLabelText("Escolher o dia do treino")).not.toBeInTheDocument();
      fireEvent.click(botao("Outro dia"));
      expect(seletor()).toHaveAttribute("type", "date");
      expect(seletor()).toHaveAttribute("max", "2026-11-04");
      expect(seletor()).toHaveValue("2026-11-04");
      fireEvent.change(seletor(), { target: { value: "2026-10-30" } });
      expect(screen.getByText("Sexta-feira, 30 de outubro")).toBeInTheDocument();
      fazerTreinoC();
      expect(carregarExecucoes()[0]).toMatchObject({ data: "30/10/2026" });
    });

    it("tocar em Hoje volta para a linha simples", () => {
      render(<TreinoSessao />);
      outroDia();
      fireEvent.click(botao("Outro dia"));
      fireEvent.change(seletor(), { target: { value: "2026-10-30" } });
      fireEvent.click(botao("Hoje"));
      expect(screen.getByText("Hoje, quarta-feira, 4 de novembro")).toBeInTheDocument();
      expect(botao("Treinei em outro dia")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Ontem" })).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Escolher o dia do treino")).not.toBeInTheDocument();
    });
  });

  describe("RN-11.4 — data ruim não vira hoje em silêncio", () => {
    it("data no futuro: avisa e não salva", () => {
      render(<TreinoSessao />);
      outroDia();
      fireEvent.click(botao("Outro dia"));
      fireEvent.change(seletor(), { target: { value: "2026-11-10" } });
      expect(screen.getByText("A data do treino não pode ser no futuro.")).toBeInTheDocument();
      fazerTreinoC();
      expect(screen.getByRole("alert")).toHaveTextContent("A data do treino não pode ser no futuro.");
      expect(carregarExecucoes()).toHaveLength(0);
    });

    it("data apagada: pede para escolher e não salva", () => {
      render(<TreinoSessao />);
      outroDia();
      fireEvent.click(botao("Outro dia"));
      fireEvent.change(seletor(), { target: { value: "" } });
      expect(screen.getByText("Escolha o dia do treino.")).toBeInTheDocument();
      fazerTreinoC();
      expect(screen.getByRole("alert")).toHaveTextContent("Escolha o dia do treino.");
      expect(carregarExecucoes()).toHaveLength(0);
    });

    it("corrigir a data permite salvar", () => {
      render(<TreinoSessao />);
      outroDia();
      fireEvent.click(botao("Outro dia"));
      fireEvent.change(seletor(), { target: { value: "2026-11-10" } });
      fireEvent.change(seletor(), { target: { value: "2026-11-02" } });
      expect(screen.queryByText("A data do treino não pode ser no futuro.")).not.toBeInTheDocument();
      fazerTreinoC();
      expect(carregarExecucoes()[0]).toMatchObject({ data: "02/11/2026" });
    });
  });
});
