/**
 * RN-13.3 / RN-13.4 / RN-13.7 — sair do treino sem salvar, pelo App inteiro.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ConfirmacaoProvider } from "../mensagens/Confirmacao";
import { planoDeTeste } from "./helpers/planoDeTeste";

const signOut = vi.fn(async () => {});
vi.mock("../components/login/context/useAuth", () => ({
  useAuth: () => ({ user: { name: "Ana" }, signOut }),
}));

import App from "../App";

const aba = (nome: string) => screen.getByRole("button", { name: new RegExp(`^${nome}`, "i") });
const caixa = () => screen.queryByRole("alertdialog");
const clicar = async (el: HTMLElement) => act(async () => fireEvent.click(el));

function abrirApp() {
  render(<MemoryRouter><ConfirmacaoProvider><App /></ConfirmacaoProvider></MemoryRouter>);
}
/** Começa o Treino A e marca uma série: treino em andamento, não salvo. */
function treinoEmAndamento() {
  fireEvent.click(screen.getByRole("button", { name: "Começar" }));
  fireEvent.click(screen.getAllByRole("checkbox", { name: /^Série \d$/ })[0]!);
}

describe("RN-13 — sair do treino sem salvar", () => {
  beforeEach(() => {
    localStorage.clear();
    planoDeTeste();
    signOut.mockClear();
    vi.spyOn(window, "confirm");
  });
  afterEach(() => {
    expect(window.confirm).not.toHaveBeenCalled(); // RN-13.2: nunca a caixa do navegador
    vi.restoreAllMocks();
  });

  describe("RN-13.3 trocar de aba", () => {
    it("com treino em andamento, pergunta antes de sair", async () => {
      abrirApp();
      treinoEmAndamento();
      await clicar(aba("Semana"));
      expect(caixa()).toHaveAccessibleName("Sair do treino?");
      expect(caixa()).toHaveAccessibleDescription(
        "Seu treino ainda não foi salvo. O que você marcou fica guardado e você pode continuar depois."
      );
    });

    it("Continuar treinando: fica no treino com a série marcada", async () => {
      abrirApp();
      treinoEmAndamento();
      await clicar(aba("Semana"));
      await clicar(screen.getByRole("button", { name: "Continuar treinando" }));
      expect(caixa()).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Leg press" })).toBeInTheDocument();
      expect(screen.getAllByRole("checkbox", { name: /^Série \d$/ })[0]).toHaveAttribute("aria-checked", "true");
    });

    it("Sair do treino: vai para a aba escolhida e o treino fica guardado", async () => {
      abrirApp();
      treinoEmAndamento();
      await clicar(aba("Semana"));
      await clicar(screen.getByRole("button", { name: "Sair do treino" }));
      expect(screen.getByRole("button", { name: "Semana anterior" })).toBeInTheDocument();
      await clicar(aba("Treinar"));
      expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
    });

    it("RN-13.7 sem treino em andamento, troca direto", async () => {
      abrirApp();
      await clicar(aba("Semana"));
      expect(caixa()).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Semana anterior" })).toBeInTheDocument();
    });
  });

  describe("RN-13.4 botão Sair da conta", () => {
    it("com treino em andamento, pergunta; Continuar treinando não sai", async () => {
      abrirApp();
      treinoEmAndamento();
      await clicar(screen.getByRole("button", { name: "Sair" }));
      expect(caixa()).toHaveAccessibleName("Sair da sua conta?");
      await clicar(screen.getByRole("button", { name: "Continuar treinando" }));
      expect(signOut).not.toHaveBeenCalled();
    });

    it("Sair da conta: sai", async () => {
      abrirApp();
      treinoEmAndamento();
      await clicar(screen.getByRole("button", { name: "Sair" }));
      await clicar(screen.getByRole("button", { name: "Sair da conta" }));
      expect(signOut).toHaveBeenCalledTimes(1);
    });

    it("RN-13.7 sem treino em andamento, sai direto", async () => {
      abrirApp();
      await clicar(screen.getByRole("button", { name: "Sair" }));
      expect(caixa()).not.toBeInTheDocument();
      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });
});
