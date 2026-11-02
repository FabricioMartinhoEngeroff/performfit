export interface TreinoRotacao {
  id: string; // "UA", "UB", "LA", "LB"
  titulo: string; // "Upper A", "Upper B"...
  tipo: "upper" | "lower";
  dia: string; // "Terça", "Sexta"...
}

export const ROTACAO: TreinoRotacao[] = [
  { id: "UA", titulo: "Upper A", tipo: "upper", dia: "Terça" },
  { id: "UB", titulo: "Upper B", tipo: "upper", dia: "Sexta" },
  { id: "LA", titulo: "Lower A", tipo: "lower", dia: "Segunda" },
  { id: "LB", titulo: "Lower B", tipo: "lower", dia: "Quinta" },
];

export const ROTACAO_LABELS = ROTACAO.map((r) => r.titulo);
