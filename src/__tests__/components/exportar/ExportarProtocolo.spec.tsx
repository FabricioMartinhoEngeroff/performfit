/**
 * Migração planilha de treino — protocolo com várias semanas (uma aba por semana).
 * Usa um .xlsx de verdade no layout do Logbook (título, seções, cabeçalho ID | Treino | Ord. | …).
 * A planilha de 4 dias (uma aba, Upper/Lower A/B) tem que continuar igual.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as XLSX from "xlsx";
import Exportar from "../../../components/exportar/Exportar";

const CABECALHO = [
  "ID", "Treino", "Ord.", "Exercício", "Grupo Muscular", "Tipo", "Séries Válidas",
  "Top Mín", "Top Máx", "B-off Mín", "B-off Máx", "TOP SET Kg", "BACK-OFF Kg", "Cue / foco", "Obs",
];

type Linha = [id: string, treino: string, ordem: number, exercicio: string, grupo: string, series: number, min: number | "", max: number | "", cue: string];

function aba(titulo: string, linhas: (Linha | string)[]): XLSX.WorkSheet {
  return XLSX.utils.aoa_to_sheet([
    [titulo],
    ["Azul = dia Lower/Pull"],
    // nota antes do cabeçalho que cita "exercício" (não pode ser tomada como cabeçalho)
    ["⚡  Antes do 1º exercício de cada músculo, fazer 2 séries de aquecimento"],
    CABECALHO,
    ...linhas.map((l) =>
      typeof l === "string"
        ? [l]
        : [l[0], l[1], l[2], l[3], l[4], "composto", l[5], l[6], l[7], "", "", "", "", l[8], ""],
    ),
  ]);
}

function planilha(abas: [string, XLSX.WorkSheet][]): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  abas.forEach(([nome, ws]) => XLSX.utils.book_append_sheet(wb, ws, nome));
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

const PROTOCOLO = planilha([
  ["Semana 1", aba("GymWave — Logbook · SEMANA 1", [
    "  Pull — Segunda-feira  |  Foco: Costas",
    ["SEG", "Pull", 1, "Remada curvada", "Costas", 1, 6, 12, "Perto da falha · Descanso 2:00"],
    ["SEG", "Pull", 2, "Puxador frente pegada neutra", "Costas", 1, 6, 12, "Até a falha"],
    ["SEG", "Pull", 3, "Remada curvada", "Costas", 1, 6, 12, "Até a falha total"],
    "  Upper Cluster — Sexta-feira",
    ["SEX", "Upper Cluster", 1, "Remada articulada", "Costas", 1, 24, 24, "Cluster set: 24 reps em blocos de 4 reps com 10 s"],
    ["SEX", "Upper Cluster", 2, "Extensão de pernas", "Quadríceps", 1, 24, 24, "Cluster set: 24 reps em blocos de 4 reps com 10 s"],
  ])],
  ["Semana 2", aba("GymWave — Logbook · SEMANA 2", [
    ["SEG", "Pull", 1, "Remada com halteres no banco inclinado", "Costas", 1, 6, 12, "Perto da falha"],
  ])],
  ["Guia", XLSX.utils.aoa_to_sheet([["Item", "Como fazer"], ["GER 7", "4-6 reps na reserva"]])],
]);

const QUATRO_DIAS = planilha([
  ["Logbook", aba("GymWave — Logbook", [
    "  Upper A — Terça-feira",
    ["UA", "Upper A", 1, "Supino reto barra", "Peitoral", 3, 5, 8, "FOCO PRINCIPAL"],
    ["UA", "Upper A", 2, "Pull down", "Costas", 4, "", "", "Alongar bem"],
    "  Lower A — Segunda-feira",
    ["LA", "Lower A", 1, "Terra sumô", "Posterior/Glúteo", 3, 5, 8, "PR work"],
  ])],
]);

function mockFileReader(resultado: ArrayBuffer) {
  const instance: {
    onload: ((e: { target: { result: ArrayBuffer } }) => void) | null;
    readAsArrayBuffer: ReturnType<typeof vi.fn>;
  } = {
    onload: null,
    readAsArrayBuffer: vi.fn(function () {
      instance.onload?.({ target: { result: resultado } });
    }),
  };
  vi.stubGlobal("FileReader", function MockFileReader() { return instance; });
}

async function importar(arquivo: ArrayBuffer) {
  mockFileReader(arquivo);
  render(<Exportar />);
  fireEvent.click(screen.getByText(/migração planilha de treino/i));
  fireEvent.change(screen.getByTestId("file-input"), {
    target: { files: [new File(["x"], "treino.xlsx")] },
  });
  await waitFor(() => expect(screen.getByText("Confirmar importação").closest("button")).not.toBeDisabled());
  fireEvent.click(screen.getByText("Confirmar importação"));
}

const ler = (k: string) => JSON.parse(localStorage.getItem(k) || "{}");

describe("Migração planilha — protocolo com várias semanas", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("lê todas as abas de semana e cria uma sessão por semana e dia", async () => {
    await importar(PROTOCOLO);
    expect(Object.keys(ler("sessoes_config"))).toEqual(["S1 Seg · Pull", "S1 Sex · Upper Cluster", "S2 Seg · Pull"]);
    expect(Object.keys(ler("planoTreino"))).toEqual(["S1 Seg · Pull", "S1 Sex · Upper Cluster", "S2 Seg · Pull"]);
  });

  it("ignora a aba Guia (sem cabeçalho de exercícios)", async () => {
    await importar(PROTOCOLO);
    expect(JSON.stringify(ler("sessoes_config"))).not.toContain("GER 7");
  });

  it("exercício repetido no mesmo dia vira 1 exercício com 2 séries, cue de cada uma", async () => {
    await importar(PROTOCOLO);
    const pull = ler("sessoes_config")["S1 Seg · Pull"];
    expect(pull.map((e: { nome: string }) => e.nome)).toEqual(["Remada curvada", "Puxador frente pegada neutra"]);
    expect(pull[0]).toMatchObject({
      seriesValidas: 2,
      cue: "1ª: Perto da falha · Descanso 2:00 | 2ª: Até a falha total",
    });
    expect(pull[1]).toMatchObject({ seriesValidas: 1, cue: "Até a falha", faixaTopSet: [6, 12] });
    expect(ler("planoTreino")["S1 Seg · Pull"]["Puxador frente pegada neutra"].series_validas).toBe(1);
  });

  it("cluster de 24 reps em blocos de 4 guarda 6 blocos", async () => {
    await importar(PROTOCOLO);
    const cluster = ler("sessoes_config")["S1 Sex · Upper Cluster"];
    expect(cluster[0]).toMatchObject({ nome: "Remada articulada", clusterBlocos: 6 });
  });

  it("nome igual a um exercício do catálogo vira o nome do catálogo", async () => {
    await importar(PROTOCOLO);
    const nomes = Object.values(ler("sessoes_config")).flat().map((e) => (e as { nome: string }).nome);
    expect(nomes).toContain("Cadeira extensora");
    expect(nomes).toContain("Remada peito apoiado");
    expect(nomes).not.toContain("Extensão de pernas");
  });

  describe("planilha de 4 dias (a sua) continua igual", () => {
    it("sessões com o nome do treino, sem prefixo de semana", async () => {
      await importar(QUATRO_DIAS);
      expect(Object.keys(ler("sessoes_config"))).toEqual(["Upper A", "Lower A"]);
    });

    it("mantém nomes, séries válidas e importa o cue", async () => {
      await importar(QUATRO_DIAS);
      const upper = ler("sessoes_config")["Upper A"];
      expect(upper.map((e: { nome: string }) => e.nome)).toEqual(["Supino reto barra", "Pull down"]);
      expect(upper[0]).toMatchObject({ seriesValidas: 3, cue: "FOCO PRINCIPAL" });
      expect(upper[0]).not.toHaveProperty("clusterBlocos");
      expect(ler("planoTreino")["Upper A"]["Pull down"].series_validas).toBe(4);
    });
  });
});
