/**
 * RN-13.2 — caixa de confirmação do próprio app, usada por qualquer tela via useConfirmacao().
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ConfirmacaoProvider, useConfirmacao } from "../../mensagens/Confirmacao";
import type { MensagemConfirmacao } from "../../mensagens/catalogo";

const MSG: MensagemConfirmacao = {
  titulo: "Sair do treino?",
  texto: "Seu treino ainda não foi salvo.",
  confirmar: "Sair do treino",
  cancelar: "Continuar treinando",
};

/** Tela de exemplo: pergunta e mostra a resposta. */
function Exemplo() {
  const confirmar = useConfirmacao();
  return (
    <button type="button" onClick={async () => document.body.setAttribute("data-resposta", String(await confirmar(MSG)))}>
      Perguntar
    </button>
  );
}

async function abrir() {
  render(<ConfirmacaoProvider><Exemplo /></ConfirmacaoProvider>);
  document.body.removeAttribute("data-resposta");
  fireEvent.click(screen.getByRole("button", { name: "Perguntar" }));
  return screen.findByRole("alertdialog");
}
const resposta = () => document.body.getAttribute("data-resposta");

describe("RN-13.2 caixa de confirmação", () => {
  it("nada aparece antes de perguntar", () => {
    render(<ConfirmacaoProvider><Exemplo /></ConfirmacaoProvider>);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("mostra título, texto e ícone, acessível como alertdialog", async () => {
    const caixa = await abrir();
    expect(caixa).toHaveAccessibleName("Sair do treino?");
    expect(caixa).toHaveAccessibleDescription("Seu treino ainda não foi salvo.");
    expect(caixa).toHaveAttribute("aria-modal", "true");
    expect(caixa.querySelector("svg")).not.toBeNull();
  });

  it("botão seguro vem primeiro, com foco; os dois com 56px", async () => {
    await abrir();
    const [primeiro, segundo] = screen.getAllByRole("button", { name: /Continuar treinando|Sair do treino/ });
    expect(primeiro).toHaveTextContent("Continuar treinando");
    expect(segundo).toHaveTextContent("Sair do treino");
    expect(primeiro).toHaveFocus();
    for (const b of [primeiro!, segundo!]) {
      expect(parseInt(getComputedStyle(b).minHeight, 10)).toBeGreaterThanOrEqual(56);
    }
  });

  it("confirmar responde true e fecha", async () => {
    await abrir();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Sair do treino" })));
    expect(resposta()).toBe("true");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("ficar responde false e fecha", async () => {
    await abrir();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Continuar treinando" })));
    expect(resposta()).toBe("false");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("Esc = ficar", async () => {
    const caixa = await abrir();
    await act(async () => fireEvent.keyDown(caixa, { key: "Escape" }));
    expect(resposta()).toBe("false");
  });

  it("toque fora da caixa = ficar; toque dentro não fecha", async () => {
    const caixa = await abrir();
    fireEvent.click(caixa);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByTestId("fundo-confirmacao")));
    expect(resposta()).toBe("false");
  });

  it("sem o ConfirmacaoProvider, avisa com erro claro", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Exemplo />)).toThrow("useConfirmacao precisa do <ConfirmacaoProvider>");
    vi.mocked(console.error).mockRestore();
  });
});
