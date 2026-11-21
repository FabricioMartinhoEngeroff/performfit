/**
 * RN-12.3 — cartão "Instalar no celular" na aba Perfil.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import Perfil from "../../../components/perfil/Perfil";
import { esquecerPedidoInstalacao, iniciarCapturaInstalacao } from "../../../utils/instalacao";

function pedidoDeInstalacao(outcome: "accepted" | "dismissed" = "accepted") {
  const e = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn(() => Promise.resolve());
  Object.assign(e, { prompt, userChoice: Promise.resolve({ outcome, platform: "web" }) });
  return { e, prompt };
}

const cartao = () => screen.queryByRole("region", { name: "Instalar no celular" });

function userAgent(ua: string) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);
}

describe("RN-12.3 instalar no celular", () => {
  beforeEach(() => {
    esquecerPedidoInstalacao();
    iniciarCapturaInstalacao();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("navegador sem suporte e sem pedido: o cartão não aparece", () => {
    render(<Perfil />);
    expect(cartao()).not.toBeInTheDocument();
  });

  it("Android: o pedido chega depois de abrir o Perfil e mostra o botão", () => {
    render(<Perfil />);
    const { e } = pedidoDeInstalacao();
    act(() => { window.dispatchEvent(e); });
    expect(e.defaultPrevented).toBe(true); // o app decide quando mostrar
    expect(cartao()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Instalar o app" })).toBeInTheDocument();
  });

  it("Android: o pedido chegou antes (ao abrir o app) e o Perfil ainda mostra o botão", () => {
    const { e } = pedidoDeInstalacao();
    window.dispatchEvent(e);
    render(<Perfil />);
    expect(screen.getByRole("button", { name: "Instalar o app" })).toBeInTheDocument();
  });

  it("tocar em Instalar abre o pedido do celular; aceitou → mensagem de sucesso", async () => {
    render(<Perfil />);
    const { e, prompt } = pedidoDeInstalacao("accepted");
    act(() => { window.dispatchEvent(e); });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Instalar o app" })); });
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("App instalado! Procure o PerformFit na tela inicial.");
    expect(screen.queryByRole("button", { name: "Instalar o app" })).not.toBeInTheDocument();
  });

  it("recusou: o botão some (o pedido só vale uma vez)", async () => {
    render(<Perfil />);
    const { e } = pedidoDeInstalacao("dismissed");
    act(() => { window.dispatchEvent(e); });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Instalar o app" })); });
    expect(screen.queryByRole("button", { name: "Instalar o app" })).not.toBeInTheDocument();
  });

  it("iPhone: mostra a instrução do Safari", () => {
    userAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1");
    render(<Perfil />);
    expect(cartao()).toBeInTheDocument();
    expect(screen.getByText('Toque em Compartilhar e depois em "Adicionar à Tela de Início".')).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Instalar o app" })).not.toBeInTheDocument();
  });

  it("já aberto como app instalado: o cartão não aparece", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("standalone"), media: q }));
    userAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1");
    render(<Perfil />);
    const { e } = pedidoDeInstalacao();
    act(() => { window.dispatchEvent(e); });
    expect(cartao()).not.toBeInTheDocument();
  });
});
