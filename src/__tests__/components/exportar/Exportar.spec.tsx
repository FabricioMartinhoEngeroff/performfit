/**
 * ExportarTest → components/exportar
 * Testa a tela de exportação (CSV/JSON) e a seção de importação inline
 * de planilha (.xlsx/.csv) — toggle, upload, preview, confirmação e limpeza.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as XLSX from "xlsx";
import Exportar from "../../../components/exportar/Exportar";
import { salvarRegistro } from "../../../utils/storage";

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_ROWS = [
  {
    sessao: "Upper A",
    ordem: 1,
    exercicio: "Supino Reto",
    musculo_primario: "peitoral",
    series_validas: 3,
    rep_min: 6,
    rep_max: 10,
    peso_C1_kg: 60,
    peso_C2_kg: 70,
    peso_C3_kg: 80,
    peso_C4_kg: "",
  },
  {
    sessao: "Lower A",
    ordem: 1,
    exercicio: "Agachamento",
    musculo_primario: "quadríceps",
    series_validas: 3,
    rep_min: 6,
    rep_max: 10,
    peso_C1_kg: 80,
    peso_C2_kg: "",
    peso_C3_kg: "",
    peso_C4_kg: "",
  },
];

// ─── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("papaparse", () => ({
  default: {
    parse: vi.fn(() => ({ data: MOCK_ROWS, errors: [], meta: {} })),
  },
}));

vi.mock("xlsx", () => ({
  read: vi.fn(() => ({ Sheets: { Sheet1: {} }, SheetNames: ["Sheet1"] })),
  utils: {
    sheet_to_json: vi.fn((_ws: unknown, opts?: { header?: number }) => {
      if (opts?.header === 1) {
        return [
          ["sessao", "ordem", "exercicio", "musculo_primario", "series_validas", "rep_min", "rep_max", "peso_C1_kg", "peso_C2_kg", "peso_C3_kg", "peso_C4_kg"],
          ...MOCK_ROWS.map((r) => [r.sessao, r.ordem, r.exercicio, r.musculo_primario, r.series_validas, r.rep_min, r.rep_max, r.peso_C1_kg, r.peso_C2_kg, r.peso_C3_kg, r.peso_C4_kg]),
        ];
      }
      return MOCK_ROWS;
    }),
  },
}));

// ─── Helpers ───────────────────────────────────────────────────────────────────

function mockFileReader(resultValue: string | ArrayBuffer) {
  const instance: {
    onload: ((e: { target: { result: string | ArrayBuffer } }) => void) | null;
    readAsText: ReturnType<typeof vi.fn>;
    readAsArrayBuffer: ReturnType<typeof vi.fn>;
  } = {
    onload: null,
    readAsText: vi.fn(function () {
      instance.onload?.({ target: { result: resultValue } });
    }),
    readAsArrayBuffer: vi.fn(function () {
      instance.onload?.({ target: { result: resultValue } });
    }),
  };
  vi.stubGlobal("FileReader", function MockFileReader() { return instance; });
  return instance;
}

function makeFile(name: string, type = "text/csv"): File {
  return new File(["mock"], name, { type });
}

function openImportSection() {
  fireEvent.click(screen.getByText(/migração planilha de treino/i));
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("Exportar — Tela de exportação e importação inline", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // ── 1. Renderização ──────────────────────────────────────────────────────────

  describe("Renderização", () => {
    it("exibe o título da tela", () => {
      render(<Exportar />);
      expect(screen.getByText("Exportar dados")).toBeInTheDocument();
    });

    it("exibe subtítulo de backup", () => {
      render(<Exportar />);
      expect(screen.getByText(/backup/i)).toBeInTheDocument();
    });

    it("exibe botão de exportar CSV", () => {
      render(<Exportar />);
      expect(screen.getByText(/exportar como csv/i)).toBeInTheDocument();
    });

    it("exibe botão de exportar JSON", () => {
      render(<Exportar />);
      expect(screen.getByText(/exportar como json/i)).toBeInTheDocument();
    });

    it("exibe botão de migração da planilha de treino", () => {
      render(<Exportar />);
      expect(screen.getByText(/migração planilha de treino/i)).toBeInTheDocument();
    });

    it("não exibe a drop zone antes de abrir o import", () => {
      render(<Exportar />);
      expect(screen.queryByText(/arraste e solte/i)).not.toBeInTheDocument();
    });
  });

  // ── 2. Contagem de registros ─────────────────────────────────────────────────

  describe("Contagem de registros", () => {
    it("exibe '0 treinos' quando não há dados no localStorage", () => {
      render(<Exportar />);
      expect(screen.getByText(/0 treinos/i)).toBeInTheDocument();
    });

    it("exibe contagem correta quando há dados", () => {
      localStorage.setItem(
        "dadosTreino",
        JSON.stringify({
          "Supino Reto": {
            C1: { data: "10/06/2026", pesos: ["100"], reps: ["5"] },
            C2: { data: "15/06/2026", pesos: ["90"], reps: ["8"] },
          },
          Agachamento: {
            C1: { data: "10/06/2026", pesos: ["130"], reps: ["5"] },
          },
        })
      );
      render(<Exportar />);
      expect(screen.getByText(/3 treinos/i)).toBeInTheDocument();
    });
  });

  // ── 3. Download ──────────────────────────────────────────────────────────────

  describe("Download", () => {
    it("botão CSV dispara download sem erro", () => {
      render(<Exportar />);
      expect(() =>
        fireEvent.click(screen.getByText(/exportar como csv/i))
      ).not.toThrow();
    });

    it("botão JSON dispara download sem erro", () => {
      render(<Exportar />);
      expect(() =>
        fireEvent.click(screen.getByText(/exportar como json/i))
      ).not.toThrow();
    });
  });

  // ── 4. Toggle de importação ──────────────────────────────────────────────────

  describe("Toggle de importação", () => {
    it("clicar em 'Migração planilha de treino' exibe a drop zone", () => {
      render(<Exportar />);
      openImportSection();
      expect(screen.getByText(/arraste e solte/i)).toBeInTheDocument();
    });

    it("clicar novamente oculta a seção de importação", () => {
      render(<Exportar />);
      openImportSection();
      fireEvent.click(screen.getByText(/fechar importação/i));
      expect(screen.queryByText(/arraste e solte/i)).not.toBeInTheDocument();
    });

    it("botão altera texto para 'Fechar importação' após abrir", () => {
      render(<Exportar />);
      openImportSection();
      expect(screen.getByText(/fechar importação/i)).toBeInTheDocument();
    });

    it("botão Confirmar importação começa desabilitado", () => {
      render(<Exportar />);
      openImportSection();
      const btn = screen.getByText("Confirmar importação").closest("button");
      expect(btn).toBeDisabled();
    });

    it("input de arquivo aceita apenas .xlsx e .csv", () => {
      render(<Exportar />);
      openImportSection();
      const input = screen.getByTestId("file-input") as HTMLInputElement;
      expect(input.accept).toBe(".xlsx,.csv");
    });
  });

  // ── 5. Upload CSV ────────────────────────────────────────────────────────────

  describe("Upload CSV", () => {
    async function carregarCSV() {
      mockFileReader("mock csv content");
      render(<Exportar />);
      openImportSection();
      fireEvent.change(screen.getByTestId("file-input"), {
        target: { files: [makeFile("treinos.csv")] },
      });
    }

    it("exibe preview após carregar arquivo CSV", async () => {
      await carregarCSV();
      await waitFor(() => {
        expect(screen.getByText("Pré-visualização (2 linhas)")).toBeInTheDocument();
      });
    });

    it("exibe exercícios na tabela de preview", async () => {
      await carregarCSV();
      await waitFor(() => {
        expect(screen.getByText("Supino Reto")).toBeInTheDocument();
        expect(screen.getByText("Agachamento")).toBeInTheDocument();
      });
    });

    it("habilita botão Confirmar após carregar arquivo", async () => {
      await carregarCSV();
      await waitFor(() => {
        expect(
          screen.getByText("Confirmar importação").closest("button")
        ).not.toBeDisabled();
      });
    });

    it("exibe cabeçalhos de ciclo na tabela", async () => {
      await carregarCSV();
      await waitFor(() => {
        expect(screen.getByText("C1 kg")).toBeInTheDocument();
        expect(screen.getByText("C2 kg")).toBeInTheDocument();
        expect(screen.getByText("C3 kg")).toBeInTheDocument();
        expect(screen.getByText("C4 kg")).toBeInTheDocument();
      });
    });
  });

  // ── 6. Upload XLSX ───────────────────────────────────────────────────────────

  describe("Upload XLSX", () => {
    it("exibe preview após carregar arquivo .xlsx", async () => {
      mockFileReader(new ArrayBuffer(0));
      render(<Exportar />);
      openImportSection();
      fireEvent.change(screen.getByTestId("file-input"), {
        target: {
          files: [
            makeFile(
              "treinos.xlsx",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ),
          ],
        },
      });
      await waitFor(() => {
        expect(screen.getByText("Pré-visualização (2 linhas)")).toBeInTheDocument();
      });
    });

    it("mapeia Top Mín/Máx e TOP SET/BACK-OFF Kg mesmo com quebras \\r\\n reais do Excel nos cabeçalhos (logbook v4)", async () => {
      // Cabeçalhos de células com texto quebrado no Excel chegam como "Top\r\nMín"
      // (CR+LF), não só "\n". O mapColumns precisa normalizar os dois.
      vi.mocked(XLSX.utils.sheet_to_json).mockImplementationOnce(() => [
        [
          "ID", "Treino", "Ord.", "Exercício", "Grupo\r\nMuscular", "Tipo",
          "Séries\r\nVálidas", "Top\r\nMín", "Top\r\nMáx", "B-off\r\nMín", "B-off\r\nMáx",
          "TOP SET\r\nKg", "BACK-OFF\r\nKg", "Cue / foco", "Obs",
        ],
        [
          "UB", "Upper B", 1, "Remada peito apoiado halteres (livre)", "Costas", "composto",
          3, 8, 10, 10, 12, 45, 38, "cue", "obs",
        ],
      ]);
      mockFileReader(new ArrayBuffer(0));
      render(<Exportar />);
      openImportSection();
      fireEvent.change(screen.getByTestId("file-input"), {
        target: {
          files: [
            makeFile(
              "logbook_v4.xlsx",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ),
          ],
        },
      });
      await waitFor(() => {
        expect(screen.getByText("Pré-visualização (1 linhas)")).toBeInTheDocument();
      });
      expect(screen.getByText("8–10")).toBeInTheDocument();
      expect(screen.getByText("45 kg")).toBeInTheDocument();
      expect(screen.getByText("38 kg")).toBeInTheDocument();
    });
  });

  // ── 7. Confirmação de importação ─────────────────────────────────────────────

  describe("Confirmação de importação", () => {
    async function carregarEConfirmar() {
      mockFileReader("mock csv content");
      render(<Exportar />);
      openImportSection();
      fireEvent.change(screen.getByTestId("file-input"), {
        target: { files: [makeFile("treinos.csv")] },
      });
      await waitFor(() => {
        expect(
          screen.getByText("Confirmar importação").closest("button")
        ).not.toBeDisabled();
      });
      fireEvent.click(screen.getByText("Confirmar importação"));
    }

    it("salva dados no localStorage após confirmar", async () => {
      await carregarEConfirmar();
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino Reto"]).toBeDefined();
      expect(db["Supino Reto"]["C1"]).toBeDefined();
      expect(db["Supino Reto"]["C1"].pesos[0]).toBe("60");
    });

    it("salva múltiplos ciclos para o mesmo exercício", async () => {
      await carregarEConfirmar();
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino Reto"]["C1"]).toBeDefined();
      expect(db["Supino Reto"]["C2"]).toBeDefined();
      expect(db["Supino Reto"]["C3"]).toBeDefined();
      expect(db["Supino Reto"]["C4"]).toBeUndefined();
    });

    it("pesos sem valor não são salvos", async () => {
      await carregarEConfirmar();
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Agachamento"]["C1"]).toBeDefined();
      expect(db["Agachamento"]["C2"]).toBeUndefined();
    });

    it("exibe resultado com total de adicionados e preservados", async () => {
      await carregarEConfirmar();
      expect(screen.getByText(/migração concluída/i)).toBeInTheDocument();
      expect(screen.getByText(/4 adicionados/i)).toBeInTheDocument();
      expect(screen.getByText(/0 preservados/i)).toBeInTheDocument();
    });

    it("exibe feedback por sessão", async () => {
      await carregarEConfirmar();
      expect(screen.getByText(/Upper A/)).toBeInTheDocument();
      expect(screen.getByText(/Lower A/)).toBeInTheDocument();
    });

    it("reseta preview após confirmar", async () => {
      await carregarEConfirmar();
      expect(screen.queryByText(/pré-visualização/i)).not.toBeInTheDocument();
    });

    it("reps são salvas vazias (usuário preenche no treino)", async () => {
      await carregarEConfirmar();
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino Reto"]["C1"].reps[0]).toBe("");
    });

    it("repete pesos para todas as séries válidas", async () => {
      await carregarEConfirmar();
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      const pesos = db["Supino Reto"]["C1"].pesos;
      expect(pesos).toHaveLength(3);
      expect(pesos.every((p: string) => p === "60")).toBe(true);
    });
  });

  // ── 8. Plano de treino (planoTreino) ─────────────────────────────────────────

  describe("Plano de treino (planoTreino)", () => {
    async function importarPlanilha() {
      mockFileReader("mock csv content");
      render(<Exportar />);
      openImportSection();
      fireEvent.change(screen.getByTestId("file-input"), {
        target: { files: [makeFile("treinos.csv")] },
      });
      await waitFor(() => {
        expect(
          screen.getByText("Confirmar importação").closest("button")
        ).not.toBeDisabled();
      });
      fireEvent.click(screen.getByText("Confirmar importação"));
    }

    it("salva planoTreino no localStorage após confirmar", async () => {
      await importarPlanilha();
      expect(localStorage.getItem("planoTreino")).not.toBeNull();
    });

    it("planoTreino contém a ordem correta de cada exercício por sessão", async () => {
      await importarPlanilha();
      const plano = JSON.parse(localStorage.getItem("planoTreino") || "{}");
      expect(plano["Upper A"]["Supino Reto"].ordem).toBe(1);
      expect(plano["Lower A"]["Agachamento"].ordem).toBe(1);
    });

    it("planoTreino contém series_validas correto de cada exercício por sessão", async () => {
      await importarPlanilha();
      const plano = JSON.parse(localStorage.getItem("planoTreino") || "{}");
      expect(plano["Upper A"]["Supino Reto"].series_validas).toBe(3);
      expect(plano["Lower A"]["Agachamento"].series_validas).toBe(3);
    });
  });

  // ── 9. Migração inteligente ──────────────────────────────────────────────────

  describe("Migração inteligente", () => {
    async function carregarEConfirmarComBanco(
      banco: Record<string, unknown>
    ) {
      localStorage.setItem("dadosTreino", JSON.stringify(banco));
      mockFileReader("mock csv content");
      render(<Exportar />);
      openImportSection();
      fireEvent.change(screen.getByTestId("file-input"), {
        target: { files: [makeFile("treinos.csv")] },
      });
      await waitFor(() => {
        expect(
          screen.getByText("Confirmar importação").closest("button")
        ).not.toBeDisabled();
      });
      fireEvent.click(screen.getByText("Confirmar importação"));
    }

    it("exercício novo é adicionado normalmente ao banco", async () => {
      await carregarEConfirmarComBanco({});
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino Reto"]["C1"]).toBeDefined();
      expect(db["Agachamento"]["C1"]).toBeDefined();
    });

    it("ciclo existente é preservado e não sobrescrito", async () => {
      const dadosAnteriores = {
        "Supino Reto": {
          C1: { data: "01/01/2026", pesos: ["120"], reps: ["5"], obs: "PR", exercicio: "Supino Reto" },
        },
      };
      await carregarEConfirmarComBanco(dadosAnteriores);
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino Reto"]["C1"].data).toBe("01/01/2026");
      expect(db["Supino Reto"]["C1"].pesos[0]).toBe("120");
      expect(db["Supino Reto"]["C1"].obs).toBe("PR");
    });

    it("ciclo novo em exercício existente é adicionado, outros ciclos preservados", async () => {
      const dadosAnteriores = {
        "Supino Reto": {
          C1: { data: "01/01/2026", pesos: ["120"], reps: ["5"], obs: "", exercicio: "Supino Reto" },
        },
      };
      await carregarEConfirmarComBanco(dadosAnteriores);
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      // C1 preservado
      expect(db["Supino Reto"]["C1"].data).toBe("01/01/2026");
      // C2 e C3 adicionados (estão na planilha)
      expect(db["Supino Reto"]["C2"]).toBeDefined();
      expect(db["Supino Reto"]["C3"]).toBeDefined();
    });

    it("resultado exibe adicionados e 0 preservados quando banco está vazio", async () => {
      await carregarEConfirmarComBanco({});
      expect(screen.getByText(/migração concluída/i)).toBeInTheDocument();
      expect(screen.getByText(/4 adicionados/i)).toBeInTheDocument();
      expect(screen.getByText(/0 preservados/i)).toBeInTheDocument();
    });

    it("resultado exibe preservados quando exercício já existia no banco", async () => {
      const dadosAnteriores = {
        "Supino Reto": {
          C1: { data: "01/01/2026", pesos: ["120"], reps: ["5"], obs: "", exercicio: "Supino Reto" },
          C2: { data: "01/01/2026", pesos: ["110"], reps: ["8"], obs: "", exercicio: "Supino Reto" },
          C3: { data: "01/01/2026", pesos: ["100"], reps: ["10"], obs: "", exercicio: "Supino Reto" },
        },
      };
      await carregarEConfirmarComBanco(dadosAnteriores);
      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      // C1, C2, C3 do Supino preservados; C1 do Agachamento adicionado
      expect(db["Supino Reto"]["C1"].pesos[0]).toBe("120");
      expect(screen.getByText(/1 adicionado/i)).toBeInTheDocument();
      expect(screen.getByText(/3 preservados/i)).toBeInTheDocument();
    });
  });

  describe("Exportação didática", () => {
    function capturarDownload(acao: () => void): { conteudo: string; nome: string } {
      const capturado = { conteudo: "", nome: "" };
      vi.stubGlobal("Blob", class {
        constructor(partes: string[]) { capturado.conteudo = partes.join(""); }
      });
      vi.stubGlobal("URL", { createObjectURL: () => "blob:x", revokeObjectURL: () => {} });
      const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
        capturado.nome = this.download;
      });
      try {
        acao();
      } finally {
        click.mockRestore();
        vi.unstubAllGlobals();
      }
      return capturado;
    }

    beforeEach(() => {
      salvarRegistro({
        exercicio: "Supino reto barra", treinoId: "UA", data: "13/10/2026", dataTs: 0,
        topSetKg: 85, topSetReps: 7, topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: false,
        backoffKg: 85, backoffReps: 7, backoffFaixaMin: 8, backoffFaixaMax: 10,
        seriesValidas: 3, extraKg: 75, extraReps: 10, progrediu: false, obs: "top tava leve",
      });
    });

    it("CSV tem uma linha por série", () => {
      render(<Exportar />);
      const { conteudo, nome } = capturarDownload(() => fireEvent.click(screen.getByText("Exportar como CSV")));
      expect(nome).toMatch(/^performfit_.*\.csv$/);
      expect(conteudo.split("\n")).toEqual([
        "data,sessao,exercicio,serie,tipo,kg,reps,obs",
        '2026-10-13,UA,Supino reto barra,1,top1,85,7,"top tava leve"',
        '2026-10-13,UA,Supino reto barra,2,top2,85,7,"top tava leve"',
        '2026-10-13,UA,Supino reto barra,3,backoff,75,10,"top tava leve"',
      ]);
    });

    it("JSON traz a lista de registros no formato v3", () => {
      render(<Exportar />);
      const { conteudo } = capturarDownload(() => fireEvent.click(screen.getByText("Exportar como JSON")));
      const backup = JSON.parse(conteudo);
      expect(backup.versao).toBe(3);
      expect(backup.registros).toEqual([
        {
          id: "2026-10-13_UA_supino_reto_barra",
          data: "2026-10-13",
          sessao: "UA",
          exercicio: "supino_reto_barra",
          nome: "Supino reto barra",
          series: [
            { tipo: "top1", kg: 85, reps: 7 },
            { tipo: "top2", kg: 85, reps: 7 },
            { tipo: "backoff", kg: 75, reps: 10 },
          ],
          faixa: [5, 8],
          faixaBackoff: [8, 10],
          obs: "top tava leve",
        },
      ]);
    });
  });
});
