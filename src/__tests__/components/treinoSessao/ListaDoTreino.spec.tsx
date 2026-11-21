/**
 * Ver o treino inteiro e o que falta (docs/REGRAS_DE_NEGOCIO.md RN-04.12 a RN-04.15).
 * Lista do treino do dia, barra de progresso, avanço automático e fim dos pontinhos de 14px.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { planoDeTeste } from "../../helpers/planoDeTeste";

const lista = () => screen.getByRole("list", { name: "Exercícios do treino" });
const itens = () => within(lista()).getAllByRole("button");
const item = (nome: string) => within(lista()).getByRole("button", { name: new RegExp(`^${nome}`) });
const series = () => screen.queryAllByRole("checkbox", { name: /^Série \d$/ });
const progresso = () => screen.getByRole("progressbar", { name: "Progresso do treino" });
const verLista = () => fireEvent.click(screen.getByRole("button", { name: "Ver lista do treino" }));

function marcarTodas() {
  series().forEach((cb) => {
    if (cb.getAttribute("aria-checked") !== "true") fireEvent.click(cb);
  });
}

describe("Ver o treino inteiro e o que falta", () => {
  beforeEach(() => {
    localStorage.clear();
    planoDeTeste();
  });

  describe("RN-04.12 — lista do treino do dia", () => {
    it("ao abrir, mostra todos os exercícios do treino em ordem, antes do primeiro exercício", () => {
      render(<TreinoSessao />);
      expect(itens().map((b) => b.getAttribute("aria-label"))).toEqual([
        "Leg press, não começado",
        "Cadeira flexora, não começado",
        "Supino máquina, não começado",
        "Prancha, não começado",
      ]);
      expect(series()).toHaveLength(0);
    });

    it("sem nada marcado o botão é Começar e abre o primeiro exercício", () => {
      render(<TreinoSessao />);
      expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Começar" }));
      expect(screen.getByRole("heading", { name: "Leg press" })).toBeInTheDocument();
      expect(screen.getByText("1 / 4")).toBeInTheDocument();
    });

    it("tocar num exercício da lista abre aquele exercício", () => {
      render(<TreinoSessao />);
      fireEvent.click(item("Supino máquina"));
      expect(screen.getByRole("heading", { name: "Supino máquina" })).toBeInTheDocument();
      expect(screen.getByText("3 / 4")).toBeInTheDocument();
    });

    it("mostra ✓ nos concluídos, 2/3 nos parciais e Pulado nos pulados", () => {
      render(<TreinoSessao />);
      fireEvent.click(screen.getByRole("button", { name: "Começar" }));
      fireEvent.click(series()[0]!);
      fireEvent.click(series()[1]!);                                  // Leg press 2/3
      fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
      marcarTodas();                                                  // Cadeira flexora 2/2 (avança)
      fireEvent.click(screen.getByRole("button", { name: "Pular" })); // Supino pulado
      verLista();

      expect(item("Leg press")).toHaveAccessibleName("Leg press, 2 de 3 séries");
      expect(within(item("Leg press")).getByText("2/3")).toBeInTheDocument();
      expect(item("Cadeira flexora")).toHaveAccessibleName("Cadeira flexora, concluído");
      expect(within(item("Cadeira flexora")).getByText("✓")).toBeInTheDocument();
      expect(item("Supino máquina")).toHaveAccessibleName("Supino máquina, pulado");
      expect(within(item("Supino máquina")).getByText("Pulado")).toBeInTheDocument();
      expect(item("Prancha")).toHaveAccessibleName("Prancha, não começado");
    });

    it("com treino em andamento o botão é Continuar e volta para onde o aluno parou", () => {
      render(<TreinoSessao />);
      fireEvent.click(screen.getByRole("button", { name: "Começar" }));
      fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
      fireEvent.click(series()[0]!);                                  // parou na Cadeira flexora
      cleanup();
      render(<TreinoSessao />);
      expect(screen.queryByRole("button", { name: "Começar" })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
      expect(screen.getByRole("heading", { name: "Cadeira flexora" })).toBeInTheDocument();
    });

    it("trocar de treino mostra a lista do novo treino", () => {
      render(<TreinoSessao />);
      fireEvent.click(screen.getByRole("button", { name: "Começar" }));
      fireEvent.click(screen.getByRole("button", { name: "Treino B" }));
      expect(itens().map((b) => b.getAttribute("aria-label"))).toEqual([
        "Puxada, não começado",
        "Rosca, não começado",
      ]);
    });
  });

  describe("RN-04.13 — barra de progresso do treino", () => {
    it("começa em 0 de N exercícios", () => {
      render(<TreinoSessao />);
      expect(progresso()).toHaveAttribute("aria-valuenow", "0");
      expect(progresso()).toHaveAttribute("aria-valuemax", "4");
      expect(screen.getByText("0 de 4 exercícios")).toBeInTheDocument();
    });

    it("conta concluídos e pulados, não conta parciais, e aparece também no exercício", () => {
      render(<TreinoSessao />);
      fireEvent.click(screen.getByRole("button", { name: "Começar" }));
      marcarTodas();                                                  // Leg press concluído
      fireEvent.click(series()[0]!);                                  // Cadeira flexora 1/2
      fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
      fireEvent.click(screen.getByRole("button", { name: "Pular" })); // Supino pulado
      expect(progresso()).toHaveAttribute("aria-valuenow", "2");
      expect(screen.getByText("2 de 4 exercícios")).toBeInTheDocument();
      verLista();
      expect(screen.getByText("2 de 4 exercícios")).toBeInTheDocument();
    });

    it("treino de um exercício usa o singular", () => {
      render(<TreinoSessao />);
      fireEvent.click(screen.getByRole("button", { name: "Treino C" }));
      expect(screen.getByText("0 de 1 exercício")).toBeInTheDocument();
    });
  });

  describe("RN-04.14 — avança sozinho ao marcar a última série", () => {
    it("vai para o próximo e oferece voltar", () => {
      render(<TreinoSessao />);
      fireEvent.click(screen.getByRole("button", { name: "Começar" }));
      marcarTodas();
      expect(screen.getByRole("heading", { name: "Cadeira flexora" })).toBeInTheDocument();
      expect(screen.getByText("✓ Leg press concluído")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Voltar para Leg press" }));
      expect(screen.getByRole("heading", { name: "Leg press" })).toBeInTheDocument();
      expect(series().every((cb) => cb.getAttribute("aria-checked") === "true")).toBe(true);
      expect(screen.queryByText("✓ Leg press concluído")).not.toBeInTheDocument();
    });

    it("não avança enquanto falta série nem ao desmarcar", () => {
      render(<TreinoSessao />);
      fireEvent.click(screen.getByRole("button", { name: "Começar" }));
      fireEvent.click(series()[0]!);
      fireEvent.click(series()[1]!);
      expect(screen.getByRole("heading", { name: "Leg press" })).toBeInTheDocument();
    });

    it("o aviso some ao navegar para outro exercício", () => {
      render(<TreinoSessao />);
      fireEvent.click(screen.getByRole("button", { name: "Começar" }));
      marcarTodas();
      fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
      expect(screen.queryByText(/concluído$/)).not.toBeInTheDocument();
    });

    it("no último exercício não avança: fica em Ver Resumo, em destaque", () => {
      render(<TreinoSessao />);
      fireEvent.click(item("Prancha"));
      marcarTodas();
      expect(screen.getByRole("heading", { name: "Prancha" })).toBeInTheDocument();
      expect(screen.getByText("Exercício concluído")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ver Resumo" })).toHaveAttribute("data-destaque", "true");
    });
  });

  describe("RN-04.15 — sem pontinhos de 14px", () => {
    it("navegação por botão Ver lista do treino, com alvo de toque grande", () => {
      const { container } = render(<TreinoSessao />);
      fireEvent.click(screen.getByRole("button", { name: "Começar" }));
      expect(container.querySelectorAll("div[title]")).toHaveLength(0);
      const botao = screen.getByRole("button", { name: "Ver lista do treino" });
      expect(parseInt(getComputedStyle(botao).minHeight, 10)).toBeGreaterThanOrEqual(48);
      verLista();
      expect(lista()).toBeInTheDocument();
    });

    it("itens da lista têm pelo menos 56px", () => {
      render(<TreinoSessao />);
      itens().forEach((b) => expect(parseInt(getComputedStyle(b).minHeight, 10)).toBeGreaterThanOrEqual(56));
    });
  });
});
