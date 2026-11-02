/**
 * AdminImportTest -> components/adminImport
 * Testa a tela de importacao de dados Saizen via xlsx/csv.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminImport from "../../../components/adminImport/AdminImport";
import { carregarLogbookCompleto, salvarRegistro } from "../../../utils/storage";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ROWS = [
  {
    treino_id: "UA",
    treino: "Upper A",
    ordem: 1,
    exercicio: "Supino reto barra",
    grupo: "Peitoral",
    tipo: "composto",
    faixa_top_min: 5,
    faixa_top_max: 9,
    faixa_backoff_min: 9,
    faixa_backoff_max: 15,
    top_set_kg: 100,
    backoff_kg: 85,
    series_validas: 3,
  },
  {
    treino_id: "LA",
    treino: "Lower A",
    ordem: 1,
    exercicio: "Terra sumô",
    grupo: "Posterior/Glúteo",
    tipo: "composto",
    faixa_top_min: 5,
    faixa_top_max: 9,
    faixa_backoff_min: 9,
    faixa_backoff_max: 15,
    top_set_kg: 160,
    backoff_kg: "",
    series_validas: 2,
  },
];

// ─── Module mocks ─────────────────────────────────────────────────────────────

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
        // Simula estrutura v4: 3 linhas de título/info antes do cabeçalho real
        // A linha 2 contém "treino" numa frase (falso-positivo antigo)
        return [
          ["GymWave — Logbook · Back-off livre"],
          ["Verde = 3 válidas · Branco = 2 válidas"],
          ["Bateu teto do Top Set → sobe peso no próximo ciclo deste treino."],
          // Cabeçalho real com "Exercício" (row 3)
          ["treino_id", "Treino", "Ord.", "Exercício", "Grupo", "Tipo", "Séries\nVálidas", "Top\nMín", "Top\nMáx", "B-off\nMín", "B-off\nMáx", "TOP SET\nKg", "BACK-OFF\nKg"],
          ...MOCK_ROWS.map((r) => [r.treino_id, r.treino, r.ordem, r.exercicio, r.grupo, r.tipo, r.series_validas, r.faixa_top_min, r.faixa_top_max, r.faixa_backoff_min, r.faixa_backoff_max, r.top_set_kg, r.backoff_kg]),
        ];
      }
      return MOCK_ROWS;
    }),
  },
}));

// ─── FileReader mock ──────────────────────────────────────────────────────────

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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AdminImport — Importacao Saizen xlsx/csv", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Renderizacao inicial", () => {
    it("exibe titulo e subtitulo", () => {
      render(<AdminImport />);
      expect(screen.getByText("Importar dados")).toBeInTheDocument();
      expect(screen.getByText(/popular o histórico/i)).toBeInTheDocument();
    });

    it("exibe a drop zone", () => {
      render(<AdminImport />);
      expect(
        screen.getByText(/arraste e solte/i)
      ).toBeInTheDocument();
    });

    it("botao Confirmar importacao comeca desabilitado", () => {
      render(<AdminImport />);
      const btn = screen.getByText("Confirmar importação").closest("button");
      expect(btn).toBeDisabled();
    });

    it("botao Limpar tudo esta sempre habilitado", () => {
      render(<AdminImport />);
      const btn = screen.getByText("Limpar tudo").closest("button");
      expect(btn).not.toBeDisabled();
    });

    it("input aceita apenas .xlsx e .csv", () => {
      render(<AdminImport />);
      const input = screen.getByTestId("file-input") as HTMLInputElement;
      expect(input.accept).toBe(".xlsx,.csv");
    });
  });

  describe("Carregamento de CSV", () => {
    it("exibe preview apos carregar arquivo CSV", async () => {
      mockFileReader("mock csv content");
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        expect(screen.getByText(/pré-visualização.*2 exercícios/i)).toBeInTheDocument();
      });
    });

    it("exibe exercicios na tabela de preview", async () => {
      mockFileReader("mock csv content");
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        expect(screen.getByText("Supino reto barra")).toBeInTheDocument();
        expect(screen.getByText("Terra sumô")).toBeInTheDocument();
      });
    });

    it("habilita botao Confirmar apos carregar arquivo", async () => {
      mockFileReader("mock csv content");
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        const btn = screen.getByText("Confirmar importação").closest("button");
        expect(btn).not.toBeDisabled();
      });
    });

    it("exibe cabecalhos Top Set, Back-off e Séries Válidas na tabela", async () => {
      mockFileReader("mock csv content");
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        expect(screen.getByText("Top Set kg")).toBeInTheDocument();
        expect(screen.getByText("B-off kg")).toBeInTheDocument();
        expect(screen.getByText("Séries Válidas")).toBeInTheDocument();
      });
    });
  });

  describe("Confirmacao de importacao", () => {
    async function loadAndConfirm() {
      mockFileReader("mock csv content");
      render(<AdminImport />);

      const input = screen.getByTestId("file-input");
      fireEvent.change(input, {
        target: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        expect(screen.getByText("Confirmar importação").closest("button")).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText("Confirmar importação"));
    }

    it("salva dados no logbook apos confirmar", async () => {
      await loadAndConfirm();

      const logbook = carregarLogbookCompleto();
      expect(logbook["Supino reto barra"]).toBeDefined();
      expect(logbook["Supino reto barra"][0].topSetKg).toBe(100);
    });

    it("salva dados no dadosTreino (compatibilidade) apos confirmar", async () => {
      await loadAndConfirm();

      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Supino reto barra"]).toBeDefined();
      expect(db["Supino reto barra"]["UA"]).toBeDefined();
    });

    it("Top Set 2 espelha o Top Set 1 quando backoff nao fornecido", async () => {
      await loadAndConfirm();

      const logbook = carregarLogbookCompleto();
      // Terra sumo: top_set_kg=160, backoff_kg vazio -> Top Set 2 espelha = 160
      expect(logbook["Terra sumô"][0].backoffKg).toBe(160);
    });

    it("salva seriesValidas=3 no logbook quando series_validas=3 na planilha", async () => {
      await loadAndConfirm();

      const logbook = carregarLogbookCompleto();
      expect(logbook["Supino reto barra"][0].seriesValidas).toBe(3);
    });

    it("salva seriesValidas=2 no logbook quando series_validas=2 na planilha", async () => {
      await loadAndConfirm();

      const logbook = carregarLogbookCompleto();
      expect(logbook["Terra sumô"][0].seriesValidas).toBe(2);
    });

    it("exibe resultado com total de registros salvos", async () => {
      await loadAndConfirm();
      expect(screen.getByText(/importação concluída/i)).toBeInTheDocument();
      expect(screen.getByText(/2 registros salvos/i)).toBeInTheDocument();
    });

    it("exibe feedback por treino", async () => {
      await loadAndConfirm();
      expect(screen.getByText(/Upper A: 1 exercício/)).toBeInTheDocument();
      expect(screen.getByText(/Lower A: 1 exercício/)).toBeInTheDocument();
    });

    it("reseta preview apos confirmar", async () => {
      await loadAndConfirm();
      expect(screen.queryByText("Pré-visualização")).not.toBeInTheDocument();
    });
  });

  // ── planoTreino ──────────────────────────────────────────────────────────────

  describe("Plano de treino (planoTreino)", () => {
    async function loadAndConfirm() {
      mockFileReader("mock csv content");
      render(<AdminImport />);
      fireEvent.change(screen.getByTestId("file-input"), {
        target: { files: [makeFile("treinos.csv")] },
      });
      await waitFor(() => {
        expect(screen.getByText("Confirmar importação").closest("button")).not.toBeDisabled();
      });
      fireEvent.click(screen.getByText("Confirmar importação"));
    }

    it("salva planoTreino no localStorage após confirmar", async () => {
      await loadAndConfirm();
      expect(localStorage.getItem("planoTreino")).not.toBeNull();
    });

    it("planoTreino contém ordem correta por sessão", async () => {
      await loadAndConfirm();
      const plano = JSON.parse(localStorage.getItem("planoTreino") || "{}");
      expect(plano["Upper A"]["Supino reto barra"].ordem).toBe(1);
      expect(plano["Lower A"]["Terra sumô"].ordem).toBe(1);
    });

    it("planoTreino contém series_validas correto por sessão", async () => {
      await loadAndConfirm();
      const plano = JSON.parse(localStorage.getItem("planoTreino") || "{}");
      expect(plano["Upper A"]["Supino reto barra"].series_validas).toBe(3);
      expect(plano["Lower A"]["Terra sumô"].series_validas).toBe(2);
    });

    it("salva backup de planoTreino antes de importar", async () => {
      localStorage.setItem("planoTreino", JSON.stringify({ "Upper A": {} }));
      await loadAndConfirm();
      expect(localStorage.getItem("planoTreino_backup")).not.toBeNull();
    });
  });

  // ── Substituicao do treino ao reimportar ─────────────────────────────────────

  describe("Reimportacao substitui treino mas mantem historico", () => {
    async function loadAndConfirm() {
      mockFileReader("mock csv content");
      render(<AdminImport />);
      fireEvent.change(screen.getByTestId("file-input"), {
        target: { files: [makeFile("treinos.csv")] },
      });
      await waitFor(() => {
        expect(screen.getByText("Confirmar importação").closest("button")).not.toBeDisabled();
      });
      fireEvent.click(screen.getByText("Confirmar importação"));
    }

    it("sessoes_config substitui o treino antigo completamente", async () => {
      localStorage.setItem("sessoes_config", JSON.stringify({
        "Braço": [{ nome: "Rosca direta", grupo: "Bíceps" }],
        "Upper A": [{ nome: "Exercicio antigo", grupo: "Peitoral" }],
      }));

      await loadAndConfirm();

      const config = JSON.parse(localStorage.getItem("sessoes_config") || "{}");
      expect(config["Braço"]).toBeUndefined();
      expect(config["Upper A"][0].nome).toBe("Supino reto barra");
    });

    it("planoTreino substitui sessoes antigas e nao faz merge", async () => {
      localStorage.setItem("planoTreino", JSON.stringify({
        "Braço": { "Rosca direta": { ordem: 1, series_validas: 2 } },
        "Upper A": { "Exercicio antigo": { ordem: 1, series_validas: 3 } },
      }));

      await loadAndConfirm();

      const plano = JSON.parse(localStorage.getItem("planoTreino") || "{}");
      expect(plano["Braço"]).toBeUndefined();
      expect(plano["Upper A"]["Exercicio antigo"]).toBeUndefined();
      expect(plano["Upper A"]["Supino reto barra"]).toBeDefined();
    });

    it("mantem logbook existente apos reimportacao", async () => {
      localStorage.setItem("logbook", JSON.stringify({
        "Rosca direta": [{ topSetKg: 30, data: "01/07/2026", dataTs: 1000 }],
      }));

      await loadAndConfirm();

      const logbook = carregarLogbookCompleto();
      expect(logbook["Rosca direta"]).toBeDefined();
      expect(logbook["Rosca direta"][0].topSetKg).toBe(30);
      expect(logbook["Supino reto barra"]).toBeDefined();
    });

    it("mantem dadosTreino existente apos reimportacao", async () => {
      localStorage.setItem("dadosTreino", JSON.stringify({
        "Rosca direta": { C1: { pesos: ["30"], reps: ["10"], data: "01/07/2026" } },
      }));

      await loadAndConfirm();

      const db = JSON.parse(localStorage.getItem("dadosTreino") || "{}");
      expect(db["Rosca direta"]).toBeDefined();
      expect(db["Rosca direta"]["C1"].pesos[0]).toBe("30");
      expect(db["Supino reto barra"]).toBeDefined();
    });

    it("atualiza series_validas e ordem ao reimportar", async () => {
      localStorage.setItem("planoTreino", JSON.stringify({
        "Upper A": { "Supino reto barra": { ordem: 5, series_validas: 2 } },
      }));

      await loadAndConfirm();

      const plano = JSON.parse(localStorage.getItem("planoTreino") || "{}");
      expect(plano["Upper A"]["Supino reto barra"].ordem).toBe(1);
      expect(plano["Upper A"]["Supino reto barra"].series_validas).toBe(3);
    });

    it("backup contem o treino antigo para possivel desfazer", async () => {
      const treinoAntigo = { "Braço": [{ nome: "Rosca direta", grupo: "Bíceps" }] };
      localStorage.setItem("sessoes_config", JSON.stringify(treinoAntigo));

      await loadAndConfirm();

      const backup = JSON.parse(localStorage.getItem("sessoes_config_backup") || "{}");
      expect(backup["Braço"]).toBeDefined();
      expect(backup["Braço"][0].nome).toBe("Rosca direta");
    });
  });

  describe("Desfazer importacao", () => {
    async function importarDados() {
      mockFileReader("mock csv content");
      render(<AdminImport />);
      fireEvent.change(screen.getByTestId("file-input"), {
        target: { files: [makeFile("treinos.csv")] },
      });
      await waitFor(() => {
        expect(screen.getByText("Confirmar importação").closest("button")).not.toBeDisabled();
      });
      fireEvent.click(screen.getByText("Confirmar importação"));
    }

    it("salva backup antes de importar", async () => {
      salvarRegistro({
        exercicio: "Agachamento livre", treinoId: "LA", data: "01/09/2026", dataTs: 0,
        topSetKg: 120, topSetReps: 5, topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: false,
        backoffKg: 120, backoffReps: 5, backoffFaixaMin: 8, backoffFaixaMax: 10,
        seriesValidas: 2, progrediu: false,
      });
      await importarDados();
      const backup = JSON.parse(localStorage.getItem("registros_backup") || "[]");
      expect(backup.map((r: { exercicio: string }) => r.exercicio)).toEqual(["agachamento_livre"]);
    });

    it("exibe botao Desfazer importacao apos confirmar", async () => {
      await importarDados();
      expect(screen.getByText(/desfazer importação/i)).toBeInTheDocument();
    });

    it("restaura dados do backup ao clicar em desfazer", async () => {
      salvarRegistro({
        exercicio: "Agachamento livre", treinoId: "LA", data: "01/09/2026", dataTs: 0,
        topSetKg: 120, topSetReps: 5, topSetFaixaMin: 5, topSetFaixaMax: 8, topSetBateuTeto: false,
        backoffKg: 120, backoffReps: 5, backoffFaixaMin: 8, backoffFaixaMax: 10,
        seriesValidas: 2, progrediu: false,
      });
      localStorage.setItem("dadosTreino", JSON.stringify({ "Agachamento livre": {} }));
      localStorage.setItem("planoTreino", JSON.stringify({ "Upper A": { "Agachamento livre": { ordem: 1, series_validas: 2 } } }));
      await importarDados();
      vi.spyOn(window, "confirm").mockReturnValue(true);
      fireEvent.click(screen.getByText(/desfazer importação/i));
      const logbook = carregarLogbookCompleto();
      expect(logbook).toHaveProperty("Agachamento livre");
      const plano = JSON.parse(localStorage.getItem("planoTreino") || "{}");
      expect(plano["Upper A"]["Agachamento livre"]).toBeDefined();
    });
  });

  describe("Limpar tudo", () => {
    it("abre confirm antes de limpar", () => {
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<AdminImport />);
      fireEvent.click(screen.getByText("Limpar tudo"));
      expect(confirmSpy).toHaveBeenCalledOnce();
    });

    it("limpa logbook e dadosTreino se o usuario confirmar", () => {
      localStorage.setItem("logbook", JSON.stringify({ x: [] }));
      localStorage.setItem("dadosTreino", JSON.stringify({ x: {} }));
      vi.spyOn(window, "confirm").mockReturnValue(true);
      render(<AdminImport />);
      fireEvent.click(screen.getByText("Limpar tudo"));
      expect(localStorage.getItem("logbook")).toBeNull();
      expect(localStorage.getItem("registros")).toBeNull();
      expect(localStorage.getItem("dadosTreino")).toBeNull();
    });
  });

  // ── sessoes_config ──────────────────────────────────────────────────────────

  describe("sessoes_config na importacao", () => {
    async function loadAndConfirm() {
      mockFileReader("mock csv content");
      render(<AdminImport />);
      fireEvent.change(screen.getByTestId("file-input"), {
        target: { files: [makeFile("treinos.csv")] },
      });
      await waitFor(() => {
        expect(screen.getByText("Confirmar importação").closest("button")).not.toBeDisabled();
      });
      fireEvent.click(screen.getByText("Confirmar importação"));
    }

    it("salva sessoes_config no localStorage apos confirmar", async () => {
      await loadAndConfirm();
      expect(localStorage.getItem("sessoes_config")).not.toBeNull();
    });

    it("sessoes_config contem exercicios agrupados por sessao", async () => {
      await loadAndConfirm();
      const config = JSON.parse(localStorage.getItem("sessoes_config") || "{}");
      expect(config["Upper A"]).toBeDefined();
      expect(config["Lower A"]).toBeDefined();
      expect(config["Upper A"][0].nome).toBe("Supino reto barra");
      expect(config["Lower A"][0].nome).toBe("Terra sumô");
    });

    it("sessoes_config contem faixas de reps corretas", async () => {
      await loadAndConfirm();
      const config = JSON.parse(localStorage.getItem("sessoes_config") || "{}");
      expect(config["Upper A"][0].faixaTopSet).toEqual([5, 9]);
      expect(config["Upper A"][0].faixaBackoff).toEqual([9, 15]);
    });

    it("sessoes_config contem seriesValidas correto", async () => {
      await loadAndConfirm();
      const config = JSON.parse(localStorage.getItem("sessoes_config") || "{}");
      expect(config["Upper A"][0].seriesValidas).toBe(3);
      expect(config["Lower A"][0].seriesValidas).toBe(2);
    });
  });

  // ── Drag and drop ──────────────────────────────────────────────────────────

  describe("Drag and drop", () => {
    it("muda estilo ao arrastar arquivo sobre a drop zone", () => {
      render(<AdminImport />);
      const dropZone = screen.getByRole("button", { name: /área de upload/i });

      fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });
      fireEvent.dragLeave(dropZone);
    });

    it("carrega arquivo ao soltar na drop zone", async () => {
      mockFileReader("mock csv content");
      render(<AdminImport />);
      const dropZone = screen.getByRole("button", { name: /área de upload/i });

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [makeFile("treinos.csv")] },
      });

      await waitFor(() => {
        expect(screen.getByText(/pré-visualização.*2 exercícios/i)).toBeInTheDocument();
      });
    });

    it("abre file picker ao clicar na drop zone", () => {
      render(<AdminImport />);
      const dropZone = screen.getByRole("button", { name: /área de upload/i });
      const input = screen.getByTestId("file-input") as HTMLInputElement;
      const clickSpy = vi.spyOn(input, "click");

      fireEvent.click(dropZone);
      expect(clickSpy).toHaveBeenCalled();
    });

    it("abre file picker ao pressionar Enter na drop zone", () => {
      render(<AdminImport />);
      const dropZone = screen.getByRole("button", { name: /área de upload/i });
      const input = screen.getByTestId("file-input") as HTMLInputElement;
      const clickSpy = vi.spyOn(input, "click");

      fireEvent.keyDown(dropZone, { key: "Enter" });
      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
