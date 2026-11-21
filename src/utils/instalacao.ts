// Pedido de instalação do Android/Chrome (RN-12.3).
// O Chrome dispara "beforeinstallprompt" logo ao abrir o app — muitas vezes antes de o
// aluno chegar ao Perfil. Por isso o evento é guardado aqui, desde o início (main.tsx).

export interface PedidoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
}

let pedido: PedidoInstalacao | null = null;
let iniciado = false;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

function aoPedir(e: Event) {
  e.preventDefault(); // o app decide quando mostrar (botão no Perfil)
  pedido = e as PedidoInstalacao;
  avisar();
}

function aoInstalar() {
  pedido = null;
  avisar();
}

export function iniciarCapturaInstalacao(): void {
  if (iniciado || typeof window === "undefined") return;
  iniciado = true;
  window.addEventListener("beforeinstallprompt", aoPedir);
  window.addEventListener("appinstalled", aoInstalar);
}

export function pedidoInstalacao(): PedidoInstalacao | null {
  return pedido;
}

/** O pedido só pode ser usado uma vez. */
export function esquecerPedidoInstalacao(): void {
  pedido = null;
  avisar();
}

export function ouvirPedidoInstalacao(f: () => void): () => void {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

/** Já aberto como app instalado (Android ou iPhone). */
export function estaInstalado(): boolean {
  const standalone =
    typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches;
  return standalone || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function ehIPhone(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
