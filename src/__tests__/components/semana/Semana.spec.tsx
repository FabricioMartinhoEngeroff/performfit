/**
 * Aba Semana — treinos da semana contra a meta e séries por grupo muscular.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Semana from "../../../components/semana/Semana";
import { registrarTreino, type Execucao } from "../../../utils/execucoes";
import { planoComDias, planoDeTeste } from "../../helpers/planoDeTeste";

function treino(d: number, m: number, sessaoId: string, grupos: Record<string, number>): Execucao[] {
  const ts = new Date(2026, m - 1, d, 10).getTime();
  return Object.entries(grupos).map(([grupo, feitas]) => ({
    exercicio: `Ex ${grupo}`, grupo, sessao: sessaoId, sessaoId,
    data: new Date(ts).toLocaleDateString("pt-BR"), dataTs: ts, seriesPlanejadas: Math.max(4, feitas), seriesFeitas: feitas,
  }));
}

const barra = (grupo: string) => screen.getByRole("listitem", { name: grupo });

describe("Aba Semana", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 4, 12)); // quarta 04/11/2026 — semana 02/11–08/11
  });
  afterEach(() => vi.useRealTimers());

  it("RN-03.1 sem treino: 0 de 3 (planilha com 3 treinos) e incentivo", () => {
    planoDeTeste();
    render(<Semana />);
    expect(screen.getByText("02/11 – 08/11")).toBeInTheDocument();
    expect(screen.getByText("0 de 3 treinos")).toBeInTheDocument();
    expect(screen.getByText("Faltam 3 treinos para fechar a semana")).toBeInTheDocument();
  });

  it("RN-06.7 conta treinos da semana contra os dias da planilha", () => {
    planoDeTeste();
    registrarTreino([...treino(2, 11, "UA", { Peitoral: 3 }), ...treino(3, 11, "LA", { Quadríceps: 3 })]);
    render(<Semana />);
    expect(screen.getByText("2 de 3 treinos")).toBeInTheDocument();
    expect(screen.getByText("Falta 1 treino para fechar a semana")).toBeInTheDocument();
  });

  it("RN-06.2 dias da planilha cumpridos: semana completa", () => {
    planoComDias(2);
    registrarTreino([...treino(2, 11, "UA", { Peitoral: 3 }), ...treino(3, 11, "LA", { Quadríceps: 3 })]);
    render(<Semana />);
    expect(screen.getByText("Semana completa!")).toBeInTheDocument();
  });

  it("mostra a sequência de semanas completas", () => {
    planoComDias(1);
    registrarTreino([...treino(27, 10, "UA", { Peitoral: 3 }), ...treino(2, 11, "UA", { Peitoral: 3 })]);
    render(<Semana />);
    expect(screen.getByText("2 semanas seguidas")).toBeInTheDocument();
  });

  it("RN-06.6 séries por grupo muscular, incluindo grupos do plano com 0", () => {
    planoDeTeste();
    registrarTreino([
      ...treino(2, 11, "UA", { Peitoral: 3, Costas: 2 }),
      ...treino(4, 11, "UB", { Costas: 4 }),
      ...treino(28, 10, "UA", { Peitoral: 9 }), // semana passada: não entra
    ]);
    render(<Semana />);
    expect(within(barra("Costas")).getByText("6 séries")).toBeInTheDocument();
    expect(within(barra("Peitoral")).getByText("3 séries")).toBeInTheDocument();
    expect(within(barra("Core")).getByText("0 séries")).toBeInTheDocument(); // grupo do plano sem séries
    expect(screen.getByText("9 séries no total")).toBeInTheDocument();
  });

  it("navega para semanas anteriores e volta; não passa da atual", () => {
    registrarTreino(treino(28, 10, "UA", { Peitoral: 9 }));
    render(<Semana />);
    expect(screen.getByRole("button", { name: "Próxima semana" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Semana anterior" }));
    expect(screen.getByText("26/10 – 01/11")).toBeInTheDocument();
    expect(within(barra("Peitoral")).getByText("9 séries")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Próxima semana" }));
    expect(screen.getByText("02/11 – 08/11")).toBeInTheDocument();
  });
});
