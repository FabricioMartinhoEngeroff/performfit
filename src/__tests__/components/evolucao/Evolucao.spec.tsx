/**
 * Aba Evolução — sequência, recorde, total de semanas, calendário de semanas
 * e séries por grupo muscular no mês e no ano.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Evolucao from "../../../components/evolucao/Evolucao";
import { registrarTreino, type Execucao } from "../../../utils/execucoes";
import { planoComDias } from "../../helpers/planoDeTeste";

function treino(d: number, m: number, grupos: Record<string, number>, sessaoId = "UA"): Execucao[] {
  const ts = new Date(2026, m - 1, d, 10).getTime();
  return Object.entries(grupos).map(([grupo, feitas]) => ({
    exercicio: `Ex ${grupo}`, grupo, sessao: sessaoId, sessaoId,
    data: new Date(ts).toLocaleDateString("pt-BR"), dataTs: ts, seriesPlanejadas: Math.max(4, feitas), seriesFeitas: feitas,
  }));
}

const valorDe = (titulo: string) => within(screen.getByRole("group", { name: titulo }));

describe("Aba Evolução", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 4, 12)); // quarta 04/11/2026
  });
  afterEach(() => vi.useRealTimers());

  it("sem histórico mostra convite para o primeiro treino", () => {
    render(<Evolucao />);
    expect(screen.getByText("Seu primeiro treino aparece aqui")).toBeInTheDocument();
  });

  it("mostra sequência atual, recorde e total de semanas completas", () => {
    planoComDias(1);
    registrarTreino([
      ...treino(7, 9, { Peitoral: 3 }), ...treino(14, 9, { Peitoral: 3 }), ...treino(21, 9, { Peitoral: 3 }),
      ...treino(19, 10, { Peitoral: 3 }), ...treino(26, 10, { Peitoral: 3 }),
    ]);
    render(<Evolucao />);
    expect(valorDe("Sequência atual").getByText("2")).toBeInTheDocument();
    expect(valorDe("Recorde").getByText("3")).toBeInTheDocument();
    expect(valorDe("Semanas completas").getByText("5")).toBeInTheDocument();
  });

  it("calendário marca cada semana como completa, folga, incompleta ou atual", () => {
    planoComDias(1);
    registrarTreino([...treino(5, 10, { Peitoral: 3 }), ...treino(26, 10, { Peitoral: 3 })]);
    render(<Evolucao />);
    expect(screen.getByLabelText("05/10 – 11/10: completa")).toBeInTheDocument();
    expect(screen.getByLabelText("12/10 – 18/10: folga")).toBeInTheDocument();
    expect(screen.getByLabelText("19/10 – 25/10: incompleta")).toBeInTheDocument();
    expect(screen.getByLabelText("26/10 – 01/11: completa")).toBeInTheDocument();
    expect(screen.getByLabelText("02/11 – 08/11: em andamento")).toBeInTheDocument();
  });

  it("séries por grupo no mês, com navegação de mês e troca para ano", () => {
    registrarTreino([
      ...treino(2, 11, { Costas: 4 }),
      ...treino(20, 10, { Peitoral: 3, Costas: 2 }),
      ...treino(27, 10, { Peitoral: 3 }, "UB"),
      ...treino(10, 3, { Quadríceps: 5 }),
    ]);
    render(<Evolucao />);
    expect(screen.getByText("Novembro 2026")).toBeInTheDocument();
    expect(within(screen.getByRole("listitem", { name: "Costas" })).getByText("4 séries")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Período anterior" }));
    expect(screen.getByText("Outubro 2026")).toBeInTheDocument();
    expect(within(screen.getByRole("listitem", { name: "Peitoral" })).getByText("6 séries")).toBeInTheDocument();
    expect(screen.getByText("2 treinos · 8 séries")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ano" }));
    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("4 treinos · 17 séries")).toBeInTheDocument();
  });
});
