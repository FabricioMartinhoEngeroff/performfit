import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TextImport from "../../../components/adminImport/TextImport";
import { carregarLogbookCompleto, setCurrentUser } from "../../../utils/storage";

const TREINO_AMANDA = `## Lower A
Elevação pélvica | Glúteo | 8-12 | 10-15 | 60kg | 3
Mesa flexora | Posterior | 8-10 | 10-12 | 30kg

## Upper A
Puxada triângulo | Costas | 8-10 | 10-12 | 40kg
Elevação lateral livre | Ombro | 10-15 | 10-15`;

describe("TextImport", () => {
  beforeEach(() => {
    localStorage.clear();
    setCurrentUser(null);
  });

  it("renderiza titulo e textarea", () => {
    render(<TextImport />);
    expect(screen.getByText("Importar treino via texto")).toBeInTheDocument();
    expect(screen.getByTestId("text-import-input")).toBeInTheDocument();
  });

  it("botao Salvar treino comeca desabilitado com textarea vazio", () => {
    render(<TextImport />);
    const btn = screen.getByText("Salvar treino").closest("button");
    expect(btn).toBeDisabled();
  });

  it("habilita botao ao digitar texto", () => {
    render(<TextImport />);
    const textarea = screen.getByTestId("text-import-input");
    fireEvent.change(textarea, { target: { value: "## Upper A\nSupino | Peitoral" } });
    const btn = screen.getByText("Salvar treino").closest("button");
    expect(btn).not.toBeDisabled();
  });

  it("salva sessoes_config na conta autenticada", () => {
    setCurrentUser("u1");
    render(<TextImport />);

    fireEvent.change(screen.getByTestId("text-import-input"), { target: { value: TREINO_AMANDA } });
    fireEvent.click(screen.getByText("Salvar treino"));

    const config = JSON.parse(localStorage.getItem("gw:u1:sessoes_config") || "{}");
    expect(config["Lower A"]).toBeDefined();
    expect(config["Upper A"]).toBeDefined();
    expect(config["Lower A"]).toHaveLength(2);
    expect(config["Upper A"]).toHaveLength(2);
  });

  it("salva logbook com pesos quando fornecidos", () => {
    setCurrentUser("u1");
    render(<TextImport />);

    fireEvent.change(screen.getByTestId("text-import-input"), { target: { value: TREINO_AMANDA } });
    fireEvent.click(screen.getByText("Salvar treino"));

    const logbook = carregarLogbookCompleto();
    expect(logbook["Elevação pélvica"]).toBeDefined();
    expect(logbook["Elevação pélvica"][0].topSetKg).toBe(60);
    expect(logbook["Mesa flexora"][0].topSetKg).toBe(30);
  });

  it("Top Set 2 espelha o Top Set 1 no plano importado", () => {
    setCurrentUser("u1");
    render(<TextImport />);

    fireEvent.change(screen.getByTestId("text-import-input"), { target: { value: TREINO_AMANDA } });
    fireEvent.click(screen.getByText("Salvar treino"));

    const logbook = carregarLogbookCompleto();
    expect(logbook["Elevação pélvica"][0].backoffKg).toBe(60); // Top Set 2 espelha o Top Set 1 (60)
  });

  it("nao cria logbook entry para exercicios sem peso", () => {
    setCurrentUser("u1");
    render(<TextImport />);

    fireEvent.change(screen.getByTestId("text-import-input"), { target: { value: TREINO_AMANDA } });
    fireEvent.click(screen.getByText("Salvar treino"));

    const logbook = carregarLogbookCompleto();
    expect(logbook["Elevação lateral livre"]).toBeUndefined();
  });

  it("salva planoTreino com ordem e series corretas", () => {
    setCurrentUser("u1");
    render(<TextImport />);

    fireEvent.change(screen.getByTestId("text-import-input"), { target: { value: TREINO_AMANDA } });
    fireEvent.click(screen.getByText("Salvar treino"));

    const plano = JSON.parse(localStorage.getItem("gw:u1:planoTreino") || "{}");
    expect(plano["Lower A"]["Elevação pélvica"].ordem).toBe(1);
    expect(plano["Lower A"]["Elevação pélvica"].series_validas).toBe(3);
    expect(plano["Lower A"]["Mesa flexora"].ordem).toBe(2);
    expect(plano["Lower A"]["Mesa flexora"].series_validas).toBe(2);
  });

  it("exibe resultado apos salvar com sucesso", () => {
    render(<TextImport />);
    fireEvent.change(screen.getByTestId("text-import-input"), { target: { value: TREINO_AMANDA } });
    fireEvent.click(screen.getByText("Salvar treino"));

    expect(screen.getByText(/treino salvo/i)).toBeInTheDocument();
    expect(screen.getByText(/2 sessão/i)).toBeInTheDocument();
    expect(screen.getByText(/4 exercícios/i)).toBeInTheDocument();
  });

  it("exibe erro quando texto nao tem header de sessao", () => {
    render(<TextImport />);
    fireEvent.change(screen.getByTestId("text-import-input"), { target: { value: "Supino | Peitoral" } });
    fireEvent.click(screen.getByText("Salvar treino"));

    expect(screen.getByText(/falta o cabeçalho/i)).toBeInTheDocument();
  });

  it("exibe erro quando texto esta vazio de sessoes", () => {
    render(<TextImport />);
    fireEvent.change(screen.getByTestId("text-import-input"), { target: { value: "    " } });
    const btn = screen.getByText("Salvar treino").closest("button");
    expect(btn).toBeDisabled();
  });

  it("parseia faixas de reps corretamente", () => {
    setCurrentUser("u1");
    render(<TextImport />);

    fireEvent.change(screen.getByTestId("text-import-input"), { target: { value: TREINO_AMANDA } });
    fireEvent.click(screen.getByText("Salvar treino"));

    const config = JSON.parse(localStorage.getItem("gw:u1:sessoes_config") || "{}");
    expect(config["Lower A"][0].faixaTopSet).toEqual([8, 12]);
    expect(config["Lower A"][0].faixaBackoff).toEqual([10, 15]);
  });

  it("salva seriesValidas 3 quando especificado", () => {
    setCurrentUser("u1");
    render(<TextImport />);

    fireEvent.change(screen.getByTestId("text-import-input"), { target: { value: TREINO_AMANDA } });
    fireEvent.click(screen.getByText("Salvar treino"));

    const config = JSON.parse(localStorage.getItem("gw:u1:sessoes_config") || "{}");
    expect(config["Lower A"][0].seriesValidas).toBe(3);
    expect(config["Lower A"][1].seriesValidas).toBe(2);
  });

  it("salva na conta do admin", () => {
    setCurrentUser("u1");
    render(<TextImport />);

    fireEvent.change(screen.getByTestId("text-import-input"), {
      target: { value: "## Lower A\nAgachamento livre | Quadríceps | 5-8 | 8-10 | 120kg" },
    });
    fireEvent.click(screen.getByText("Salvar treino"));

    const config = JSON.parse(localStorage.getItem("gw:u1:sessoes_config") || "{}");
    expect(config["Lower A"]).toBeDefined();
    expect(config["Lower A"][0].nome).toBe("Agachamento livre");
  });

  it("exibe secao de ajuda ao clicar em 'Ver formato esperado'", () => {
    render(<TextImport />);
    const details = screen.getByText("Ver formato esperado");
    fireEvent.click(details);
    expect(screen.getByText(/Formato por linha/i)).toBeInTheDocument();
  });

  it("substitui sessoes_config antigo completamente ao reimportar", () => {
    setCurrentUser("u1");
    localStorage.setItem(
      "gw:u1:sessoes_config",
      JSON.stringify({ "Braço": [{ nome: "Rosca direta", grupo: "Bíceps" }] })
    );
    render(<TextImport />);

    fireEvent.change(screen.getByTestId("text-import-input"), {
      target: { value: "## Lower A\nAgachamento | Quadríceps" },
    });
    fireEvent.click(screen.getByText("Salvar treino"));

    const config = JSON.parse(localStorage.getItem("gw:u1:sessoes_config") || "{}");
    expect(config["Lower A"]).toBeDefined();
    expect(config["Braço"]).toBeUndefined();
  });

  it("substitui planoTreino antigo completamente ao reimportar", () => {
    setCurrentUser("u1");
    localStorage.setItem(
      "gw:u1:planoTreino",
      JSON.stringify({ "Braço": { "Rosca direta": { ordem: 1, series_validas: 2 } } })
    );
    render(<TextImport />);

    fireEvent.change(screen.getByTestId("text-import-input"), {
      target: { value: "## Lower A\nAgachamento | Quadríceps | 5-8 | 8-10" },
    });
    fireEvent.click(screen.getByText("Salvar treino"));

    const plano = JSON.parse(localStorage.getItem("gw:u1:planoTreino") || "{}");
    expect(plano["Lower A"]).toBeDefined();
    expect(plano["Braço"]).toBeUndefined();
  });

  it("mantem logbook existente ao reimportar novo treino", () => {
    setCurrentUser("u1");
    localStorage.setItem(
      "gw:u1:logbook",
      JSON.stringify({ "Rosca direta": [{ topSetKg: 30, data: "01/07/2026" }] })
    );
    render(<TextImport />);

    fireEvent.change(screen.getByTestId("text-import-input"), {
      target: { value: "## Lower A\nAgachamento | Quadríceps | 5-8 | 8-10 | 100kg" },
    });
    fireEvent.click(screen.getByText("Salvar treino"));

    const logbook = carregarLogbookCompleto();
    expect(logbook["Rosca direta"][0].topSetKg).toBe(30);
    expect(logbook["Agachamento"]).toBeDefined();
  });

  it("mantem dadosTreino existente ao reimportar novo treino", () => {
    setCurrentUser("u1");
    localStorage.setItem(
      "gw:u1:dadosTreino",
      JSON.stringify({ "Rosca direta": { C1: { pesos: ["30"] } } })
    );
    render(<TextImport />);

    fireEvent.change(screen.getByTestId("text-import-input"), {
      target: { value: "## Lower A\nAgachamento | Quadríceps | 5-8 | 8-10 | 100kg" },
    });
    fireEvent.click(screen.getByText("Salvar treino"));

    const db = JSON.parse(localStorage.getItem("gw:u1:dadosTreino") || "{}");
    expect(db["Rosca direta"]["C1"].pesos[0]).toBe("30");
    expect(db["Agachamento"]).toBeDefined();
  });
});
