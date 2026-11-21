/**
 * Aba Evolução — sequência, recorde, total de semanas, calendário de semanas
 * e séries por grupo muscular no mês e no ano.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Evolucao from "../../../components/evolucao/Evolucao";
import { registrarTreino, type Execucao } from "../../../utils/execucoes";
import { planoComDias, planoDeTeste } from "../../helpers/planoDeTeste";

function treino(d: number, m: number, grupos: Record<string, number>, sessaoId = "UA"): Execucao[] {
  const ts = new Date(2026, m - 1, d, 10).getTime();
  return Object.entries(grupos).map(([grupo, feitas]) => ({
    exercicio: `Ex ${grupo}`, grupo, sessao: sessaoId, sessaoId,
    data: new Date(ts).toLocaleDateString("pt-BR"), dataTs: ts, seriesPlanejadas: Math.max(4, feitas), seriesFeitas: feitas,
  }));
}

const valorDe = (titulo: string) => within(screen.getByRole("group", { name: titulo }));

describe("Aba Evolução", () => {
  // Os gráficos são carregados sob demanda (React.lazy). Pré-carrega o recharts uma vez
  // para o primeiro findBy não estourar o tempo quando a suíte inteira roda junta.
  beforeAll(async () => {
    await import("../../../components/evolucao/Graficos");
  }, 30_000);

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
    expect(screen.getByLabelText("5 a 11 de outubro: completa")).toBeInTheDocument();
    expect(screen.getByLabelText("12 a 18 de outubro: folga")).toBeInTheDocument();
    expect(screen.getByLabelText("19 a 25 de outubro: incompleta")).toBeInTheDocument();
    expect(screen.getByLabelText("26 de outubro a 1 de novembro: completa")).toBeInTheDocument();
    expect(screen.getByLabelText("2 a 8 de novembro: em andamento")).toBeInTheDocument();
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

  describe("RN-06.9 / RN-06.12 — gráfico de treinos por semana", () => {
    // Os gráficos carregam sob demanda (React.lazy): esperar com findBy.
    const linhas = async (nome: string) =>
      within(await screen.findByRole("table", { name: nome }))
        .getAllByRole("row")
        .slice(1)
        .map((r) => within(r).getAllByRole("cell").map((c) => c.textContent));

    it("mostra o gráfico e as últimas 12 semanas em texto, com zero onde não treinou", async () => {
      planoDeTeste();
      registrarTreino([...treino(27, 10, { Peitoral: 3 }), ...treino(2, 11, { Costas: 2 }), ...treino(3, 11, { Costas: 1 }, "UB")]);
      render(<Evolucao />);
      expect(await screen.findByRole("figure", { name: "Gráfico de treinos por semana" })).toBeInTheDocument();
      const l = await linhas("Treinos por semana");
      expect(l).toHaveLength(12);
      expect(l[0]).toEqual(["17/08", "0"]);
      expect(l.slice(-2)).toEqual([["26/10", "1"], ["02/11", "2"]]);
    });

    it("linha tracejada na meta = dias por semana do plano", async () => {
      planoDeTeste();
      registrarTreino(treino(2, 11, { Costas: 2 }));
      render(<Evolucao />);
      expect(await screen.findByText("Meta: 3 treinos por semana")).toBeInTheDocument();
    });
  });

  describe("RN-06.10 / RN-06.12 — séries por semana e comparação com o mês passado", () => {
    it("mostra o gráfico de séries e a soma de cada semana em texto", async () => {
      registrarTreino([...treino(27, 10, { Peitoral: 3 }), ...treino(2, 11, { Costas: 2, Peitoral: 4 })]);
      render(<Evolucao />);
      expect(await screen.findByRole("figure", { name: "Gráfico de séries por semana" })).toBeInTheDocument();
      const tabela = within(await screen.findByRole("table", { name: "Séries por semana" }));
      const ultimas = tabela.getAllByRole("row").slice(-2).map((r) => within(r).getAllByRole("cell").map((c) => c.textContent));
      expect(ultimas).toEqual([["26/10", "3"], ["02/11", "6"]]);
    });

    it("compara o mês até hoje com o mesmo período do mês passado", () => {
      registrarTreino([...treino(2, 11, { Costas: 6 }), ...treino(3, 10, { Costas: 5 }), ...treino(20, 10, { Costas: 9 })]);
      render(<Evolucao />);
      expect(screen.getByText("Você fez 20% mais séries que no mesmo período do mês passado.")).toBeInTheDocument();
    });

    it("sem séries no mês passado não mostra comparação", () => {
      registrarTreino(treino(2, 11, { Costas: 6 }));
      render(<Evolucao />);
      expect(screen.queryByText(/mesmo período do mês passado/)).not.toBeInTheDocument();
    });
  });
});
