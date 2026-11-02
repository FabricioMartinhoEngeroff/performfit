/**
 * TreinoSessao — aba Treinar do PerformFit (docs/REGRAS_DE_NEGOCIO.md RN-02.5, RN-03, RN-04, RN-05).
 * O plano vem só da planilha importada. O aluno marca um checkbox por série, sem peso.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import TreinoSessao from "../../../components/treinoSessao/TreinoSessao";
import { carregarExecucoes, registrarTreino, type Execucao } from "../../../utils/execucoes";
import { planoDeTeste } from "../../helpers/planoDeTeste";

const series = () => screen.queryAllByRole("checkbox", { name: /^Série \d$/ });
const botaoProximo = () => screen.getByRole("button", { name: "Próximo" });
const chip = (nome: string) => screen.getByRole("button", { name: nome });

function marcarTodas() {
  series().forEach((cb) => {
    if (cb.getAttribute("aria-checked") !== "true") fireEvent.click(cb);
  });
}

function pular(n: number) {
  for (let i = 0; i < n; i++) fireEvent.click(screen.getByRole("button", { name: "Pular" }));
}

function salvar() {
  fireEvent.click(screen.getByRole("button", { name: "Ver Resumo" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar e Salvar Treino" }));
}

const hoje = () => new Date().toLocaleDateString("pt-BR");

function feito(sessao: string, diasAtras: number, p: Partial<Execucao> = {}): Execucao {
  const ts = Date.now() - diasAtras * 86_400_000;
  return {
    exercicio: "Leg press", grupo: "Quadríceps", sessao, sessaoId: sessao.toUpperCase().replace(/\s+/g, "_"),
    data: new Date(ts).toLocaleDateString("pt-BR"), dataTs: ts, seriesPlanejadas: 3, seriesFeitas: 3, ...p,
  };
}

describe("TreinoSessao — PerformFit", () => {
  beforeEach(() => localStorage.clear());

  describe("RN-02.5 — sem plano importado", () => {
    it("mostra só o convite para importar o treino", () => {
      render(<TreinoSessao />);
      expect(screen.getByText("PerformFit")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Importe seu treino" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Upper A" })).not.toBeInTheDocument();
      expect(series()).toHaveLength(0);
    });
  });

  describe("RN-03 — treinos da planilha e sequência sugerida", () => {
    beforeEach(planoDeTeste);

    it("mostra os treinos da planilha, na ordem", () => {
      render(<TreinoSessao />);
      const nomes = ["Treino A", "Treino B", "Treino C"];
      nomes.forEach((n) => expect(chip(n)).toBeInTheDocument());
    });

    it("RN-03.2 sem histórico, abre direto no primeiro treino", () => {
      render(<TreinoSessao />);
      expect(chip("Treino A")).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText("Próximo da sequência: Treino A")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Leg press" })).toBeInTheDocument();
      expect(screen.getByText("1 / 4")).toBeInTheDocument();
    });

    it("RN-03.2 sugere o próximo depois do último salvo, mesmo com dias de falta", () => {
      registrarTreino([feito("Treino A", 6)]);
      render(<TreinoSessao />);
      expect(chip("Treino B")).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("heading", { name: "Puxada" })).toBeInTheDocument();
    });

    it("RN-03.2 treino em andamento tem prioridade", () => {
      render(<TreinoSessao />);
      fireEvent.click(chip("Treino C"));
      fireEvent.click(series()[0]!);
      cleanup();
      render(<TreinoSessao />);
      expect(chip("Treino C")).toHaveAttribute("aria-pressed", "true");
    });

    it("RN-03.3 o aluno pode escolher outro treino", () => {
      render(<TreinoSessao />);
      fireEvent.click(chip("Treino C"));
      expect(chip("Treino C")).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("heading", { name: "Agachamento" })).toBeInTheDocument();
    });
  });

  describe("RN-04.2 — card do exercício", () => {
    beforeEach(planoDeTeste);

    it("nome, grupo, séries · repetições, explicação e vídeo", () => {
      render(<TreinoSessao />);
      expect(screen.getByText("Quadríceps")).toBeInTheDocument();
      expect(screen.getByText("3 séries · 10–12 repetições")).toBeInTheDocument();
      expect(screen.getByText("Desça até 90°")).toBeInTheDocument();
      expect(
        screen.queryByRole("region", { name: "Demonstração em vídeo" }) ??
          screen.queryByRole("button", { name: /Ver demonstração/ }),
      ).toBeInTheDocument();
    });

    it("repetições em texto livre e sem repetições", () => {
      render(<TreinoSessao />);
      fireEvent.click(botaoProximo());
      fireEvent.click(botaoProximo());
      expect(screen.getByText("1 série")).toBeInTheDocument();
      fireEvent.click(botaoProximo());
      expect(screen.getByText("4 séries · 30 segundos")).toBeInTheDocument();
    });

    it("RN-04.1 não tem campo de peso ou repetições", () => {
      render(<TreinoSessao />);
      expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);
      expect(screen.queryByLabelText(/kg/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Top Set|Back-off/)).not.toBeInTheDocument();
    });
  });

  describe("RN-04.1 / RN-04.3 / RN-04.4 — checkboxes de séries", () => {
    beforeEach(planoDeTeste);

    it("um checkbox por série da planilha (3, 2, 1, 4)", () => {
      render(<TreinoSessao />);
      const contagens: number[] = [];
      for (let i = 0; i < 4; i++) {
        contagens.push(series().length);
        if (i < 3) fireEvent.click(botaoProximo());
      }
      expect(contagens).toEqual([3, 2, 1, 4]);
    });

    it("tocar marca, tocar de novo desmarca, e mostra o progresso", () => {
      render(<TreinoSessao />);
      const [s1] = series();
      expect(s1).toHaveAttribute("aria-checked", "false");
      fireEvent.click(s1!);
      expect(s1).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("1 de 3 séries feitas")).toBeInTheDocument();
      fireEvent.click(s1!);
      expect(s1).toHaveAttribute("aria-checked", "false");
    });

    it("todas marcadas → 'Exercício concluído' e Próximo em destaque", () => {
      render(<TreinoSessao />);
      expect(botaoProximo()).toHaveAttribute("data-destaque", "false");
      marcarTodas();
      expect(screen.getByText("Exercício concluído")).toBeInTheDocument();
      expect(botaoProximo()).toHaveAttribute("data-destaque", "true");
    });

    it("cada exercício guarda as próprias marcações", () => {
      render(<TreinoSessao />);
      marcarTodas();
      fireEvent.click(botaoProximo());
      expect(series().every((cb) => cb.getAttribute("aria-checked") === "false")).toBe(true);
      fireEvent.click(screen.getByRole("button", { name: "Exercício anterior" }));
      expect(series().every((cb) => cb.getAttribute("aria-checked") === "true")).toBe(true);
    });
  });

  describe("RN-04.6 — pulado com séries marcadas", () => {
    beforeEach(planoDeTeste);

    it("pulado sem anotação não grava; séries marcadas antes de pular não contam", () => {
      render(<TreinoSessao />);
      fireEvent.click(series()[0]!);  // marca 1 no Leg press…
      pular(1);                       // …e pula
      fireEvent.click(series()[0]!);  // Cadeira flexora 1/2
      fireEvent.click(botaoProximo());
      pular(1);
      salvar();
      expect(carregarExecucoes().map((e) => e.exercicio)).toEqual(["Cadeira flexora"]);
    });
  });

  describe("RN-04.5 a RN-04.7 — navegação", () => {
    beforeEach(planoDeTeste);

    it("RN-04.5 avança com séries faltando", () => {
      render(<TreinoSessao />);
      fireEvent.click(series()[0]!);
      fireEvent.click(botaoProximo());
      expect(screen.getByText("2 / 4")).toBeInTheDocument();
    });

    it("RN-04.6 Pular avança", () => {
      render(<TreinoSessao />);
      pular(1);
      expect(screen.getByText("2 / 4")).toBeInTheDocument();
    });

    it("setas do topo navegam", () => {
      render(<TreinoSessao />);
      fireEvent.click(screen.getByRole("button", { name: "Próximo exercício" }));
      expect(screen.getByText("2 / 4")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Exercício anterior" }));
      expect(screen.getByText("1 / 4")).toBeInTheDocument();
    });

    it("RN-04.7 último exercício mostra Ver Resumo", () => {
      render(<TreinoSessao />);
      pular(3);
      expect(screen.queryByRole("button", { name: "Próximo" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ver Resumo" })).toBeInTheDocument();
    });

    it("RN-04.7 revisão lista séries feitas, pulados e não marcados", () => {
      render(<TreinoSessao />);
      marcarTodas();                       // Leg press 3/3
      fireEvent.click(botaoProximo());
      fireEvent.click(series()[0]!);       // Cadeira flexora 1/2
      fireEvent.click(botaoProximo());
      pular(1);                            // Supino máquina pulado
      fireEvent.click(screen.getByRole("button", { name: "Ver Resumo" }));
      expect(screen.getByText("3 de 3 séries")).toBeInTheDocument();
      expect(screen.getByText("1 de 2 séries")).toBeInTheDocument();
      expect(screen.getByText("Pulado")).toBeInTheDocument();
      expect(screen.getByText("Nenhuma série marcada")).toBeInTheDocument();
    });
  });

  describe("RN-04.8 / RN-04.9 / RN-05 — salvar, anotações", () => {
    beforeEach(planoDeTeste);

    it("salva só exercícios com séries ou anotação, sem peso", () => {
      render(<TreinoSessao />);
      marcarTodas();
      fireEvent.click(botaoProximo());
      fireEvent.click(series()[0]!);
      fireEvent.click(botaoProximo());
      pular(1);
      salvar();
      const execs = carregarExecucoes();
      expect(execs).toHaveLength(2);
      expect(execs[0]).toMatchObject({
        exercicio: "Leg press", grupo: "Quadríceps", sessao: "Treino A", data: hoje(),
        seriesPlanejadas: 3, seriesFeitas: 3,
      });
      expect(execs[1]).toMatchObject({ exercicio: "Cadeira flexora", seriesPlanejadas: 2, seriesFeitas: 1 });
      expect(screen.getByRole("status")).toHaveTextContent(/Treino salvo/);
      expect(screen.getByText("4 séries em 2 exercícios")).toBeInTheDocument();
    });

    it("RN-04.6 / RN-05.2 anotação é salva mesmo sem série marcada e com o exercício pulado", () => {
      render(<TreinoSessao />);
      fireEvent.change(screen.getByLabelText("Como você estava neste exercício?"), { target: { value: "dor no joelho, parei" } });
      pular(3);
      salvar();
      expect(carregarExecucoes()).toEqual([
        expect.objectContaining({ exercicio: "Leg press", seriesFeitas: 0, obs: "dor no joelho, parei" }),
      ]);
    });

    it("RN-04.9 sem série e sem anotação não salva", () => {
      render(<TreinoSessao />);
      pular(3);
      salvar();
      expect(screen.getByRole("alert")).toHaveTextContent("Marque pelo menos uma série ou escreva uma anotação antes de salvar.");
      expect(carregarExecucoes()).toHaveLength(0);
    });

    it("RN-05.3 mostra a anotação da última vez daquele exercício", () => {
      registrarTreino([
        feito("Treino A", 9, { obs: "estava leve" }),
        feito("Treino A", 2, { obs: "senti o joelho" }),
        feito("Treino C", 1, { exercicio: "Agachamento" }),
      ]);
      render(<TreinoSessao />);
      fireEvent.click(chip("Treino A"));
      expect(screen.getByText("Sua anotação da última vez:")).toBeInTheDocument();
      expect(screen.getByText("senti o joelho")).toBeInTheDocument();
    });

    it("RN-04.8 mesmo treino na mesma data pede para substituir e não duplica", () => {
      registrarTreino([feito("Treino A", 0, { sessaoId: "TREINO_A", seriesFeitas: 1 })]);
      render(<TreinoSessao />);
      fireEvent.click(chip("Treino A"));
      marcarTodas();
      fireEvent.click(botaoProximo());
      pular(2);
      salvar();
      expect(screen.getByText(/Já existe um treino/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Substituir registro do dia" }));
      const execs = carregarExecucoes();
      expect(execs).toHaveLength(1);
      expect(execs[0]!.seriesFeitas).toBe(3);
    });

    it("RN-04.11 avisa o pai sobre alterações não salvas", () => {
      const onUnsaved = vi.fn();
      render(<TreinoSessao onUnsavedChanges={onUnsaved} />);
      expect(onUnsaved).toHaveBeenLastCalledWith(false);
      fireEvent.click(series()[0]!);
      expect(onUnsaved).toHaveBeenLastCalledWith(true);
    });
  });
});
