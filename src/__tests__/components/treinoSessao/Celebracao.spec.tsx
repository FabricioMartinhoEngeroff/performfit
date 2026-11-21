/**
 * Celebrar as conquistas na aba Treinar (docs/REGRAS_DE_NEGOCIO.md RN-10).
 * Vibração e confete são verificados pelas chamadas a utils/celebrar.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { registrarTreino, type Execucao } from "../../../utils/execucoes";
import { planoDeTeste } from "../../helpers/planoDeTeste";
import { soltarConfete, vibrar } from "../../../utils/celebrar";

vi.mock("../../../utils/celebrar", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../utils/celebrar")>()),
  vibrar: vi.fn(),
  soltarConfete: vi.fn(),
}));

const EMOJI = /\p{Extended_Pictographic}|✓|✅/u;
const series = () => screen.queryAllByRole("checkbox", { name: /^Série \d$/ });
const clicar = (nome: string | RegExp) => fireEvent.click(screen.getByRole("button", { name: nome }));
const comecar = () => clicar(/^(Começar|Continuar)$/);

function marcarTodas() {
  series().forEach((cb) => {
    if (cb.getAttribute("aria-checked") !== "true") fireEvent.click(cb);
  });
}

/** Treino C tem 1 exercício (Agachamento, 3 séries): marca tudo e salva. */
function fazerTreinoCESalvar() {
  clicar("Treino C");
  comecar();
  marcarTodas();
  clicar("Ver Resumo");
  clicar("Confirmar e Salvar Treino");
}

function feito(d: number, m: number, sessaoId: string): Execucao {
  const ts = new Date(2026, m - 1, d, 10).getTime();
  return {
    exercicio: "Leg press", grupo: "Quadríceps", sessao: sessaoId, sessaoId,
    data: new Date(ts).toLocaleDateString("pt-BR"), dataTs: ts, seriesPlanejadas: 3, seriesFeitas: 3,
  };
}

describe("RN-10 — celebrar as conquistas", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 4, 12)); // quarta 04/11/2026
    localStorage.clear();
    planoDeTeste(); // 3 treinos = 3 dias por semana
    vi.mocked(vibrar).mockClear();
    vi.mocked(soltarConfete).mockClear();
  });
  afterEach(() => vi.useRealTimers());

  describe("RN-10.1 / RN-10.2 — marcar série", () => {
    it("vibra curto (30 ms) ao marcar e não vibra ao desmarcar", () => {
      render(<TreinoSessao />);
      comecar();
      fireEvent.click(series()[0]!);
      expect(vibrar).toHaveBeenCalledTimes(1);
      expect(vibrar).toHaveBeenLastCalledWith(30);
      fireEvent.click(series()[0]!);
      expect(vibrar).toHaveBeenCalledTimes(1);
    });

    it("série marcada mostra ícone de check animado, sem caractere especial", () => {
      render(<TreinoSessao />);
      comecar();
      fireEvent.click(series()[0]!);
      const marcada = series()[0]!;
      expect(marcada.querySelector("svg")).not.toBeNull();
      expect(marcada).toHaveAttribute("data-animar", "true");
      expect(marcada.textContent).not.toMatch(EMOJI);
      expect(series()[1]!.querySelector("svg")).toBeNull();
    });
  });

  describe("RN-10.3 — concluir exercício", () => {
    it("confete pequeno e vibração dupla ao marcar a última série", () => {
      render(<TreinoSessao />);
      comecar();
      fireEvent.click(series()[0]!);
      fireEvent.click(series()[1]!);
      expect(soltarConfete).not.toHaveBeenCalled();
      fireEvent.click(series()[2]!);
      expect(soltarConfete).toHaveBeenCalledWith("exercicio");
      expect(vibrar).toHaveBeenLastCalledWith([40, 60, 40]);
    });

    it("também no último exercício do treino (onde não avança sozinho)", () => {
      render(<TreinoSessao />);
      clicar("Treino C");
      comecar();
      marcarTodas();
      expect(soltarConfete).toHaveBeenCalledWith("exercicio");
    });
  });

  describe("RN-10.4 / RN-10.6 / RN-10.7 — salvar treino", () => {
    it("primeiro treino: confete, frase, nova conquista e aviso sem emoji", () => {
      render(<TreinoSessao />);
      fazerTreinoCESalvar();
      expect(soltarConfete).toHaveBeenLastCalledWith("treino");
      const aviso = screen.getByRole("status");
      expect(aviso).toHaveTextContent("Treino salvo!");
      expect(aviso).toHaveTextContent("Primeiro treino feito! O começo é o passo mais importante.");
      expect(aviso.textContent).not.toMatch(EMOJI);
      expect(aviso.querySelector("svg")).not.toBeNull();
      expect(screen.getByText("Nova conquista: Primeiro treino")).toBeInTheDocument();
    });

    it("sem fechar a semana: diz quanto falta e não repete conquista", () => {
      registrarTreino([feito(2, 11, "TREINO_A")]);
      render(<TreinoSessao />);
      fazerTreinoCESalvar();
      expect(screen.getByRole("status")).toHaveTextContent("Falta 1 treino para fechar a semana.");
      expect(screen.queryByText(/^Nova conquista/)).not.toBeInTheDocument();
    });

    it("treino que fecha a semana: confete grande e frase de semana fechada", () => {
      registrarTreino([feito(2, 11, "TREINO_A"), feito(3, 11, "TREINO_B")]);
      render(<TreinoSessao />);
      fazerTreinoCESalvar();
      expect(soltarConfete).toHaveBeenLastCalledWith("semana");
      expect(screen.getByRole("status")).toHaveTextContent("Semana fechada! Sua sequência começou.");
    });

    it("semana fechada com sequência: 'Mais uma semana fechada! 2 semanas seguidas.'", () => {
      registrarTreino([
        feito(26, 10, "TREINO_A"), feito(27, 10, "TREINO_B"), feito(28, 10, "TREINO_C"),
        feito(2, 11, "TREINO_A"), feito(3, 11, "TREINO_B"),
      ]);
      render(<TreinoSessao />);
      fazerTreinoCESalvar();
      expect(screen.getByRole("status")).toHaveTextContent("Mais uma semana fechada! 2 semanas seguidas.");
    });

    it("várias conquistas novas de uma vez aparecem todas", () => {
      // 9 treinos e 97 séries antes (9 × 10 + 7): este treino (3 séries) completa 10 treinos e 100 séries.
      const dez = (e: Execucao) => ({ ...e, seriesPlanejadas: 10, seriesFeitas: 10 });
      const antigos = Array.from({ length: 9 }, (_, i) => dez(feito(i + 1, 9, `S${i}`)));
      registrarTreino([...antigos, { ...feito(1, 9, "S0"), exercicio: "Supino", seriesPlanejadas: 7, seriesFeitas: 7 }]);
      render(<TreinoSessao />);
      fazerTreinoCESalvar();
      expect(screen.getByText("Nova conquista: 10 treinos")).toBeInTheDocument();
      expect(screen.getByText("Nova conquista: 100 séries")).toBeInTheDocument();
    });
  });

  describe("RN-10.8 — faixa 'Esta semana' na aba Treinar", () => {
    const faixa = () => screen.getByRole("list", { name: "Esta semana" });

    it("7 dias, check nos dias com treino e hoje destacado, sem caractere especial", () => {
      registrarTreino([feito(2, 11, "TREINO_A")]);
      render(<TreinoSessao />);
      const dias = within(faixa()).getAllByRole("listitem");
      expect(dias.map((d) => d.getAttribute("aria-label"))).toEqual([
        "Segunda: treinou", "Terça: não treinou", "Quarta: não treinou", "Quinta: não treinou",
        "Sexta: não treinou", "Sábado: não treinou", "Domingo: não treinou",
      ]);
      expect(dias.map((d) => d.textContent)).toEqual(["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]);
      expect(dias[2]).toHaveAttribute("aria-current", "date");
      expect(dias.every((d) => d.querySelector("svg"))).toBe(true);
    });

    it("atualiza depois de salvar o treino de hoje", () => {
      render(<TreinoSessao />);
      fazerTreinoCESalvar();
      expect(within(faixa()).getByRole("listitem", { name: "Quarta: treinou" })).toBeInTheDocument();
    });
  });
});
