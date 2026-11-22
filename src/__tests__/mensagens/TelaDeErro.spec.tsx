/**
 * RN-14 — tela de erro amigável: nunca tela branca.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErroBoundary, TelaDeErro } from "../../mensagens/TelaDeErro";

function Quebra(): never {
  throw new Error("Cannot read properties of undefined (reading 'nome')");
}

describe("RN-14 tela de erro", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  describe("RN-14.1 ErroBoundary", () => {
    it("sem erro, mostra a tela normal", () => {
      render(<ErroBoundary><p>Tudo certo</p></ErroBoundary>);
      expect(screen.getByText("Tudo certo")).toBeInTheDocument();
      expect(screen.queryByText("Algo deu errado")).not.toBeInTheDocument();
    });

    it("se algo quebrar, mostra a tela de erro no lugar da tela branca", () => {
      render(<ErroBoundary><Quebra /></ErroBoundary>);
      expect(screen.getByRole("heading", { name: "Algo deu errado" })).toBeInTheDocument();
    });

    it("RN-14.2 o erro vai para o console, mas não aparece para o aluno", () => {
      render(<ErroBoundary><Quebra /></ErroBoundary>);
      expect(console.error).toHaveBeenCalled();
      expect(screen.queryByText(/Cannot read properties/)).not.toBeInTheDocument();
    });
  });

  describe("RN-14.2 / RN-14.3 TelaDeErro", () => {
    it("ícone, título e texto tranquilizador", () => {
      render(<TelaDeErro />);
      const tela = screen.getByRole("alert");
      expect(tela).toHaveTextContent("Algo deu errado");
      expect(tela).toHaveTextContent("Seus dados estão salvos neste celular. Toque em Recarregar para voltar ao app.");
      expect(tela.querySelector("svg")).not.toBeNull();
    });

    it("Recarregar vem primeiro, com foco; os dois botões com 56px", () => {
      render(<TelaDeErro />);
      const botoes = screen.getAllByRole("button");
      expect(botoes.map((b) => b.textContent)).toEqual(["Recarregar", "Baixar backup"]);
      expect(botoes[0]).toHaveFocus();
      for (const b of botoes) expect(parseInt(getComputedStyle(b).minHeight, 10)).toBeGreaterThanOrEqual(56);
    });

    it("Recarregar recarrega a página", () => {
      const recarregar = vi.fn();
      render(<TelaDeErro recarregar={recarregar} />);
      fireEvent.click(screen.getByRole("button", { name: "Recarregar" }));
      expect(recarregar).toHaveBeenCalledTimes(1);
    });

    it("Baixar backup baixa e confirma", () => {
      const baixar = vi.fn(() => "backup" as const);
      render(<TelaDeErro baixar={baixar} />);
      fireEvent.click(screen.getByRole("button", { name: "Baixar backup" }));
      expect(baixar).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("status")).toHaveTextContent("Backup baixado. Guarde o arquivo.");
    });

    it("RN-14.4 cópia dos dados também confirma", () => {
      render(<TelaDeErro baixar={() => "copia"} />);
      fireEvent.click(screen.getByRole("button", { name: "Baixar backup" }));
      expect(screen.getByRole("status")).toHaveTextContent("Backup baixado. Guarde o arquivo.");
    });

    it("RN-14.4 se não der para baixar, avisa que os dados continuam no celular", () => {
      render(<TelaDeErro baixar={() => "falhou"} />);
      fireEvent.click(screen.getByRole("button", { name: "Baixar backup" }));
      expect(screen.getByRole("status")).toHaveTextContent(
        "Não foi possível baixar o backup agora. Seus dados continuam guardados neste celular."
      );
    });
  });
});
