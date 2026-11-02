/**
 * Aba Perfil — treino atual, trocar de ficha (RN-02.4) e backup (RN-08.2).
 * Não existe meta manual: os dias por semana vêm da planilha (RN-03.1).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Perfil from "../../../components/perfil/Perfil";
import { carregarExecucoes } from "../../../utils/execucoes";
import { carregarPlano } from "../../../utils/planoPerformfit";
import { planoDeTeste } from "../../helpers/planoDeTeste";

describe("Aba Perfil", () => {
  it("sem plano: convida a importar", () => {
    render(<Perfil />);
    expect(screen.getByText("Nenhum treino importado ainda.")).toBeInTheDocument();
    expect(screen.getByLabelText("Escolher planilha")).toBeInTheDocument();
  });

  it("mostra o treino atual com os dias por semana da planilha", () => {
    planoDeTeste();
    render(<Perfil />);
    expect(screen.getByText("3 treinos · 7 exercícios · 3 dias por semana")).toBeInTheDocument();
    expect(screen.getByText("Treino A, Treino B, Treino C")).toBeInTheDocument();
  });

  it("não tem mais escolha manual de meta nem ferramentas antigas", () => {
    render(<Perfil />);
    expect(screen.queryByRole("button", { name: /treinos? por semana/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /dados antigos/ })).not.toBeInTheDocument();
  });

  it("exportar backup baixa performfit_backup_<data>.json", () => {
    const nomes: string[] = [];
    vi.stubGlobal("URL", { createObjectURL: () => "blob:x", revokeObjectURL: () => {} });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      nomes.push(this.download);
    });
    render(<Perfil />);
    fireEvent.click(screen.getByRole("button", { name: "Exportar backup" }));
    click.mockRestore();
    vi.unstubAllGlobals();
    expect(nomes[0]).toMatch(/^performfit_backup_\d{4}-\d{2}-\d{2}\.json$/);
  });

  it("RN-08.2 importar backup traz histórico e plano", async () => {
    render(<Perfil />);
    const conteudo = JSON.stringify({
      app: "performfit", versao: 2,
      plano: { importadoEm: "2026-10-01T00:00:00.000Z", treinos: [
        { nome: "Treino A", exercicios: [{ nome: "Leg press", grupo: "Quadríceps", series: 3, repeticoes: "", comoFazer: "" }] },
      ] },
      execucoes: [{
        exercicio: "Leg press", grupo: "Quadríceps", sessao: "Treino A", sessaoId: "TREINO_A",
        data: "13/10/2026", dataTs: new Date(2026, 9, 13).getTime(), seriesPlanejadas: 3, seriesFeitas: 2,
      }],
    });
    const arquivo = new File([conteudo], "performfit_backup.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText("Importar backup"), { target: { files: [arquivo] } });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 registro importado"));
    expect(carregarExecucoes()).toHaveLength(1);
    expect(carregarPlano()!.treinos[0]!.nome).toBe("Treino A");
    expect(screen.getByText("1 treino · 1 exercício · 1 dia por semana")).toBeInTheDocument();
  });
});
