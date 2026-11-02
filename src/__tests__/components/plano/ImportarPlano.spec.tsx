/**
 * ImportarPlano — o aluno importa a planilha do professor (RN-01.6, RN-02).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import * as XLSX from "xlsx";
import ImportarPlano from "../../../components/plano/ImportarPlano";
import { carregarPlano } from "../../../utils/planoPerformfit";
import { carregarExecucoes, registrarTreino } from "../../../utils/execucoes";

const CAB = ["Treino", "Ordem", "Exercício", "Grupo muscular", "Séries", "Repetições", "Como fazer"];

function xlsx(linhas: unknown[][], nome = "ficha.xlsx"): File {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhas), "Treino");
  const dados = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new File([dados], nome);
}

function enviar(arquivo: File) {
  fireEvent.change(screen.getByLabelText("Escolher planilha"), { target: { files: [arquivo] } });
}

const FICHA = [
  CAB,
  ["Treino A", 1, "Leg press", "Quadríceps", 3, "10-12", "Desça até 90°"],
  ["Treino A", 2, "Stiff", "Posterior", 3, "10-12", ""],
  ["Treino B", 1, "Supino máquina", "Peitoral", 3, "10-12", ""],
  ["Treino C", 1, "Puxada", "Costas", 3, "10-12", ""],
];

describe("ImportarPlano", () => {
  it("RN-02.3 mostra o resumo e só grava ao confirmar", async () => {
    const onImportado = vi.fn();
    render(<ImportarPlano onImportado={onImportado} />);
    enviar(xlsx(FICHA));
    await screen.findByText("3 treinos · 4 exercícios · 3 dias por semana");
    expect(carregarPlano()).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Usar este treino" }));
    expect(carregarPlano()!.treinos.map((t) => t.nome)).toEqual(["Treino A", "Treino B", "Treino C"]);
    expect(onImportado).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Treino importado!");
  });

  it("RN-02.3 cancelar não grava nada", async () => {
    render(<ImportarPlano />);
    enviar(xlsx(FICHA));
    await screen.findByRole("button", { name: "Usar este treino" });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("button", { name: "Usar este treino" })).not.toBeInTheDocument();
    expect(carregarPlano()).toBeNull();
  });

  it("RN-02.2 com erros lista cada um e não grava", async () => {
    render(<ImportarPlano />);
    enviar(xlsx([CAB, ["Treino A", 1, "Leg press", "", 3], ["Treino A", 2, "Stiff", "Posterior", 9]]));
    const alerta = await screen.findByRole("alert");
    expect(within(alerta).getByText("Linha 2: falta o grupo muscular.")).toBeInTheDocument();
    expect(within(alerta).getByText("Linha 3: o número de séries deve ser de 1 a 6.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Usar este treino" })).not.toBeInTheDocument();
    expect(carregarPlano()).toBeNull();
  });

  it("RN-02.1 aceita CSV com acentos", async () => {
    render(<ImportarPlano />);
    const csv = "Treino,Exercício,Grupo muscular,Séries\nTreino A,Elevação pélvica,Glúteo,3\n";
    enviar(new File([csv], "ficha.csv", { type: "text/csv" }));
    await screen.findByText("1 treino · 1 exercício · 1 dia por semana");
    fireEvent.click(screen.getByRole("button", { name: "Usar este treino" }));
    expect(carregarPlano()!.treinos[0]!.exercicios[0]).toMatchObject({ nome: "Elevação pélvica", grupo: "Glúteo" });
  });

  it("RN-02.4 trocar de ficha mantém o histórico", async () => {
    registrarTreino([{
      exercicio: "Leg press", grupo: "Quadríceps", sessao: "Treino A", sessaoId: "TREINO_A",
      data: "01/10/2026", dataTs: new Date(2026, 9, 1).getTime(), seriesPlanejadas: 3, seriesFeitas: 3, obs: "leve",
    }]);
    render(<ImportarPlano />);
    enviar(xlsx(FICHA));
    fireEvent.click(await screen.findByRole("button", { name: "Usar este treino" }));
    expect(carregarExecucoes()).toHaveLength(1);
  });

  it("RN-01.6 baixar o modelo de planilha", () => {
    const nomes: string[] = [];
    vi.stubGlobal("URL", { createObjectURL: () => "blob:x", revokeObjectURL: () => {} });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      nomes.push(this.download);
    });
    render(<ImportarPlano />);
    fireEvent.click(screen.getByRole("button", { name: "Baixar modelo de planilha" }));
    click.mockRestore();
    vi.unstubAllGlobals();
    expect(nomes).toEqual(["performfit_modelo_planilha.xlsx"]);
  });

  it("arquivo que não é planilha mostra erro amigável", async () => {
    render(<ImportarPlano />);
    enviar(new File([new Uint8Array([0, 1, 2, 3, 255])], "foto.png"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(carregarPlano()).toBeNull();
  });
});
