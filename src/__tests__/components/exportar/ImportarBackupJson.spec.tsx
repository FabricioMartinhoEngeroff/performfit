/**
 * ImportarBackupJson → components/exportar
 * Seção "Migração dos dados JSON dos treinos" da tela Exportar.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Exportar from "../../../components/exportar/Exportar";

const LEGADO = {
  Agachamento: {
    C1: { exercicio: "Agachamento", data: "27/03/2026", pesos: ["125", "125"], reps: ["4", "4"], obs: "" },
  },
  Stiff: {
    LB: { exercicio: "Stiff", data: "10/10/2026", pesos: ["80", "80"], reps: ["10", "9"], obs: "" },
  },
};

function mockFileReader(texto: string) {
  const instance: {
    onload: ((e: { target: { result: string } }) => void) | null;
    readAsText: ReturnType<typeof vi.fn>;
  } = {
    onload: null,
    readAsText: vi.fn(function () {
      instance.onload?.({ target: { result: texto } });
    }),
  };
  vi.stubGlobal("FileReader", function MockFileReader() { return instance; });
}

function enviar(texto: string, nome = "gymwave_backup_2026-10-16.json") {
  mockFileReader(texto);
  fireEvent.change(screen.getByTestId("json-input"), {
    target: { files: [new File([texto], nome, { type: "application/json" })] },
  });
}

function abrir() {
  render(<Exportar />);
  fireEvent.click(screen.getByText(/migração dos dados json dos treinos/i));
}

describe("ImportarBackupJson", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("botão abre e fecha a seção", () => {
    abrir();
    expect(screen.getByText(/selecione o arquivo de backup/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/fechar migração json/i));
    expect(screen.queryByText(/selecione o arquivo de backup/i)).not.toBeInTheDocument();
  });

  it("confirmar fica desabilitado sem arquivo", () => {
    abrir();
    expect(screen.getByText(/confirmar migração/i)).toBeDisabled();
  });

  it("mostra resumo do backup legado e avisa que não tem histórico completo", () => {
    abrir();
    enviar(JSON.stringify(LEGADO));
    expect(screen.getByText("2 exercícios")).toBeInTheDocument();
    expect(screen.getByText("2 treinos salvos")).toBeInTheDocument();
    expect(screen.getByText(/backup antigo/i)).toBeInTheDocument();
  });

  it("confirmar grava os dados e mostra o resultado", () => {
    abrir();
    enviar(JSON.stringify(LEGADO));
    fireEvent.click(screen.getByText(/confirmar migração/i));

    expect(JSON.parse(localStorage.getItem("dadosTreino") || "{}")).toEqual(LEGADO);
    expect(screen.getByText(/migração concluída — 2 adicionados/i)).toBeInTheDocument();
    expect(screen.getByText(/confirmar migração/i)).toBeDisabled();
  });

  it("desfazer restaura o estado anterior", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    abrir();
    enviar(JSON.stringify(LEGADO));
    fireEvent.click(screen.getByText(/confirmar migração/i));
    fireEvent.click(screen.getByText(/desfazer migração/i));

    expect(JSON.parse(localStorage.getItem("dadosTreino") || "{}")).toEqual({});
    expect(screen.queryByText(/migração concluída/i)).not.toBeInTheDocument();
  });

  it("arquivo inválido mostra erro e não grava nada", () => {
    abrir();
    enviar("isso não é json", "qualquer.json");
    expect(screen.getByRole("alert")).toHaveTextContent(/não é um JSON válido/i);
    expect(screen.getByText(/confirmar migração/i)).toBeDisabled();
    expect(localStorage.getItem("dadosTreino")).toBeNull();
  });
});
