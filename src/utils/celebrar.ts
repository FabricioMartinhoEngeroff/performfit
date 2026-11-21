import confetti from "canvas-confetti";

// Vibração e confete — docs/REGRAS_DE_NEGOCIO.md RN-10.2 a RN-10.5.
// São extras: nunca podem quebrar o app.

export const VIBRACAO = {
  serie: 30,
  exercicio: [40, 60, 40],
} as const;

export function vibrar(padrao: number | readonly number[]): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(padrao as number | number[]);
    }
  } catch {
    // Alguns navegadores bloqueiam vibração sem toque recente: ignorar.
  }
}

export type TipoConfete = "exercicio" | "treino" | "semana";

const CORES = ["#2563eb", "#16a34a", "#f59e0b", "#ec4899"];

const CONFETE: Record<TipoConfete, confetti.Options> = {
  exercicio: { particleCount: 40, spread: 55, startVelocity: 30, origin: { y: 0.7 } },
  treino: { particleCount: 110, spread: 80, origin: { y: 0.6 } },
  semana: { particleCount: 220, spread: 120, startVelocity: 50, origin: { y: 0.55 } },
};

function prefereMenosMovimento(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function soltarConfete(tipo: TipoConfete): void {
  if (prefereMenosMovimento()) return;
  try {
    void confetti({ ...CONFETE[tipo], colors: CORES, disableForReducedMotion: true });
  } catch {
    // Sem canvas (navegador antigo): só não mostra.
  }
}
