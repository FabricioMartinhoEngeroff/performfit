/**
 * Migração planilha de treino — exercícios com 4 séries válidas.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Exportar from "../../../components/exportar/Exportar";
import { carregarLogbookCompleto } from "../../../utils/storage";

const ROWS = [
  { sessao: "Upper A", ordem: 1, exercicio: "Supino Reto", musculo_primario: "peitoral", series_validas: 4, rep_min: 5, rep_max: 8, peso_C1_kg: 100 },
  { sessao: "Upper A", ordem: 2, exercicio: "Remada", musculo_primario: "costas", series_validas: 3, rep_min: 8, rep_max: 10, peso_C1_kg: 60 },
];

vi.mock("papaparse", () => ({
  default: { parse: vi.fn(() => ({ data: ROWS, errors: [], meta: {} })) },
}));

function mockFileReader() {
  const instance: {
    onload: ((e: { target: { result: string } }) => void) | null;
    readAsText: ReturnType<typeof vi.fn>;
  } = {
    onload: null,
    readAsText: vi.fn(function () {
      instance.onload?.({ target: { result: "csv" } });
    }),
  };
  vi.stubGlobal("FileReader", function MockFileReader() { return instance; });
}

async function importar() {
  mockFileReader();
  render(<Exportar />);
  fireEvent.click(screen.getByText(/migração planilha de treino/i));
  fireEvent.change(screen.getByTestId("file-input"), {
    target: { files: [new File(["csv"], "treino.csv", { type: "text/csv" })] },
  });
  await waitFor(() => expect(screen.getByText("Confirmar importação").closest("button")).not.toBeDisabled());
  fireEvent.click(screen.getByText("Confirmar importação"));
}

describe("Migração planilha de treino — 4 séries válidas", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("planoTreino guarda series_validas=4", async () => {
    await importar();
    const plano = JSON.parse(localStorage.getItem("planoTreino") || "{}");
    expect(plano["Upper A"]["Supino Reto"].series_validas).toBe(4);
    expect(plano["Upper A"]["Remada"].series_validas).toBe(3);
  });

  it("sessoes_config guarda seriesValidas=4", async () => {
    await importar();
    const config = JSON.parse(localStorage.getItem("sessoes_config") || "{}");
    expect(config["Upper A"][0].seriesValidas).toBe(4);
  });

  it("o peso importado preenche as 4 séries com a mesma carga", async () => {
    await importar();
    const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
    expect(db["Supino Reto"].C1.pesos).toEqual(["100", "100", "100", "100"]);
    const reg = carregarLogbookCompleto()["Supino Reto"][0];
    expect(reg.seriesValidas).toBe(4);
  });
});
