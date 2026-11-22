/**
 * RN-13.5 / RN-13.6 — proteger a saída: botão voltar do celular e fechar a página.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ConfirmacaoProvider } from "../../mensagens/Confirmacao";
import { useSaidaProtegida } from "../../mensagens/useSaidaProtegida";
import { CONFIRMACOES } from "../../mensagens/catalogo";

function Tela({ ativo }: { ativo: boolean }) {
  useSaidaProtegida(ativo, CONFIRMACOES.sairDoTreino);
  return <p>Treinando</p>;
}
const montar = (ativo: boolean) => render(<ConfirmacaoProvider><Tela ativo={ativo} /></ConfirmacaoProvider>);

function fecharPagina() {
  const e = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(e);
  return e;
}
async function voltarDoCelular() {
  await act(async () => window.dispatchEvent(new PopStateEvent("popstate")));
}

describe("useSaidaProtegida", () => {
  beforeEach(() => {
    window.history.replaceState(null, ""); // cada teste começa sem a guarda no histórico
    vi.spyOn(window.history, "pushState");
    vi.spyOn(window.history, "go").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  describe("RN-13.6 fechar ou recarregar", () => {
    it("com treino em andamento, o navegador avisa", () => {
      montar(true);
      expect(fecharPagina().defaultPrevented).toBe(true);
    });

    it("sem treino em andamento, não avisa", () => {
      montar(false);
      expect(fecharPagina().defaultPrevented).toBe(false);
    });

    it("depois que o treino é salvo, para de avisar", () => {
      const { rerender } = montar(true);
      rerender(<ConfirmacaoProvider><Tela ativo={false} /></ConfirmacaoProvider>);
      expect(fecharPagina().defaultPrevented).toBe(false);
    });
  });

  describe("RN-13.5 botão voltar do celular", () => {
    it("sem treino em andamento: não segura o voltar", async () => {
      montar(false);
      expect(window.history.pushState).not.toHaveBeenCalled();
      await voltarDoCelular();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("com treino em andamento: pergunta com a mensagem de sair do treino", async () => {
      montar(true);
      expect(window.history.pushState).toHaveBeenCalled();
      await voltarDoCelular();
      expect(screen.getByRole("alertdialog")).toHaveAccessibleName("Sair do treino?");
    });

    it("Continuar treinando: fica na tela e segura o próximo voltar de novo", async () => {
      montar(true);
      await voltarDoCelular();
      const antes = vi.mocked(window.history.pushState).mock.calls.length;
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Continuar treinando" })));
      expect(window.history.go).not.toHaveBeenCalled();
      expect(vi.mocked(window.history.pushState).mock.calls.length).toBeGreaterThanOrEqual(antes);
      expect(screen.getByText("Treinando")).toBeInTheDocument();
      await voltarDoCelular();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("Sair do treino: deixa voltar", async () => {
      montar(true);
      await voltarDoCelular();
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Sair do treino" })));
      expect(window.history.go).toHaveBeenCalledWith(-2);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });
});
