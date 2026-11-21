/**
 * Um só "Próximo" na aba Treinar (docs/REGRAS_DE_NEGOCIO.md RN-04.16, RN-04.6, RN-03.3).
 * O app já avança sozinho (RN-04.14): sem barra de setas no topo, sem botão Pular.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { planoDeTeste } from "../../helpers/planoDeTeste";

const series = () => screen.queryAllByRole("checkbox", { name: /^Série \d$/ });
const botao = (nome: string) => screen.getByRole("button", { name: nome });
const comecar = () => fireEvent.click(botao("Começar"));
const item = (nome: string) => screen.getByRole("button", { name: new RegExp(`^${nome},`) });

describe("RN-04.16 — um só Próximo", () => {
  beforeEach(() => {
    localStorage.clear();
    planoDeTeste(); // Treino A: Leg press (3), Cadeira flexora (2), Supino máquina, Prancha
  });

  it("só um botão com 'Próximo' e nenhum texto 'Próximo' a mais na tela", () => {
    render(<TreinoSessao />);
    comecar();
    expect(screen.getAllByRole("button", { name: /próximo/i })).toHaveLength(1);
    expect(screen.queryByText(/Próximo da sequência/)).not.toBeInTheDocument();
    expect(screen.queryByText(/›|‹/)).not.toBeInTheDocument();
  });

  it("sem barra de setas no topo nem botão Pular", () => {
    render(<TreinoSessao />);
    comecar();
    expect(screen.queryByRole("button", { name: "Próximo exercício" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Exercício anterior" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pular" })).not.toBeInTheDocument();
    expect(screen.queryByText("1 / 4")).not.toBeInTheDocument();
  });

  it("posição em palavras acima do nome: 'Exercício 1 de 4'", () => {
    render(<TreinoSessao />);
    comecar();
    expect(screen.getByText("Exercício 1 de 4")).toBeInTheDocument();
    fireEvent.click(botao("Próximo"));
    expect(screen.getByText("Exercício 2 de 4")).toBeInTheDocument();
  });

  it("RN-03.3 treino sugerido sem a palavra Próximo", () => {
    render(<TreinoSessao />);
    expect(screen.getByText("Treino sugerido: Treino A")).toBeInTheDocument();
  });

  describe("Voltar", () => {
    it("desativado no primeiro exercício; volta para o anterior", () => {
      render(<TreinoSessao />);
      comecar();
      expect(botao("Voltar")).toBeDisabled();
      fireEvent.click(botao("Próximo"));
      expect(botao("Voltar")).toBeEnabled();
      fireEvent.click(botao("Voltar"));
      expect(screen.getByRole("heading", { name: "Leg press" })).toBeInTheDocument();
    });

    it("alvo de toque grande", () => {
      render(<TreinoSessao />);
      comecar();
      expect(parseInt(getComputedStyle(botao("Voltar")).minHeight, 10)).toBeGreaterThanOrEqual(48);
    });

    it("continua no último exercício, ao lado de Ver Resumo", () => {
      render(<TreinoSessao />);
      fireEvent.click(item("Prancha"));
      expect(botao("Voltar")).toBeEnabled();
      expect(botao("Ver Resumo")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Próximo" })).not.toBeInTheDocument();
    });
  });

  describe("RN-04.6 — Próximo faz o papel do Pular", () => {
    it("sem nenhuma série marcada: marca como pulado e avança", () => {
      render(<TreinoSessao />);
      comecar();
      fireEvent.click(botao("Próximo"));
      expect(screen.getByRole("heading", { name: "Cadeira flexora" })).toBeInTheDocument();
      fireEvent.click(botao("Ver lista do treino"));
      expect(item("Leg press")).toHaveAccessibleName("Leg press, pulado");
    });

    it("com séries marcadas: guarda o parcial, não vira pulado", () => {
      render(<TreinoSessao />);
      comecar();
      fireEvent.click(series()[0]!);
      fireEvent.click(botao("Próximo"));
      fireEvent.click(botao("Ver lista do treino"));
      expect(item("Leg press")).toHaveAccessibleName("Leg press, 1 de 3 séries");
    });

    it("voltar e marcar uma série tira o pulado", () => {
      render(<TreinoSessao />);
      comecar();
      fireEvent.click(botao("Próximo"));
      fireEvent.click(botao("Voltar"));
      expect(screen.getByText("Exercício pulado")).toBeInTheDocument();
      fireEvent.click(series()[0]!);
      expect(screen.queryByText("Exercício pulado")).not.toBeInTheDocument();
      fireEvent.click(botao("Ver lista do treino"));
      expect(within(item("Leg press")).getByText("1/3")).toBeInTheDocument();
    });
  });
});
