import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, Smartphone } from "lucide-react";
import {
  ehIPhone,
  esquecerPedidoInstalacao,
  estaInstalado,
  iniciarCapturaInstalacao,
  ouvirPedidoInstalacao,
  pedidoInstalacao,
} from "../../utils/instalacao";
import { Cartao, Rotulo, Texto } from "../progresso/ui";

const botao = {
  width: "100%", minHeight: 56, borderRadius: 12, fontSize: 18, fontWeight: 700, cursor: "pointer",
  border: "none", background: "#2563eb", color: "#ffffff", fontFamily: "inherit",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
} as const;

/** RN-12.3: cartão "Instalar no celular" (Android: botão; iPhone: instrução). */
export default function InstalarApp() {
  useEffect(() => iniciarCapturaInstalacao(), []);
  const pedido = useSyncExternalStore(ouvirPedidoInstalacao, pedidoInstalacao);
  const [instalado, setInstalado] = useState(false);
  const [jaInstalado] = useState(estaInstalado);
  const iphone = ehIPhone();

  if (jaInstalado) return null;
  if (!pedido && !iphone && !instalado) return null;

  async function instalar() {
    if (!pedido) return;
    esquecerPedidoInstalacao(); // o pedido só vale uma vez
    await pedido.prompt();
    const { outcome } = await pedido.userChoice;
    if (outcome === "accepted") setInstalado(true);
  }

  return (
    <Cartao aria-label="Instalar no celular">
      <Rotulo>Instalar no celular</Rotulo>
      {instalado ? (
        <p role="status" style={{ fontSize: 17, fontWeight: 600, color: "#166534", margin: 0 }}>
          App instalado! Procure o PerformFit na tela inicial.
        </p>
      ) : pedido ? (
        <>
          <Texto style={{ margin: "0 0 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Smartphone size={22} aria-hidden="true" style={{ flexShrink: 0, color: "#2563eb" }} />
            Coloque o PerformFit na tela inicial: abre mais rápido e funciona sem internet.
          </Texto>
          <button type="button" onClick={instalar} style={botao}>
            <Download size={22} aria-hidden="true" />
            Instalar o app
          </button>
        </>
      ) : (
        <Texto style={{ margin: 0, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Share size={22} aria-hidden="true" style={{ flexShrink: 0, color: "#2563eb" }} />
          <span>Toque em Compartilhar e depois em "Adicionar à Tela de Início".</span>
        </Texto>
      )}
    </Cartao>
  );
}
