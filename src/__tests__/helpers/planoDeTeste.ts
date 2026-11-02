import { lerPlanilha, salvarPlano } from "../../utils/planoPerformfit";

/** Plano usado nos testes de tela: Treino A (4 exercícios), B (2) e C (1). */
export function planoDeTeste() {
  const r = lerPlanilha([
    ["Treino", "Ordem", "Exercício", "Grupo muscular", "Séries", "Repetições", "Como fazer"],
    ["Treino A", 1, "Leg press", "Quadríceps", 3, "10-12", "Desça até 90°"],
    ["Treino A", 2, "Cadeira flexora", "Posterior", 2, "12", ""],
    ["Treino A", 3, "Supino máquina", "Peitoral", 1, "", ""],
    ["Treino A", 4, "Prancha", "Core", 4, "30 segundos", ""],
    ["Treino B", 1, "Puxada", "Costas", 3, "10-12", ""],
    ["Treino B", 2, "Rosca", "Braço", 2, "12", ""],
    ["Treino C", 1, "Agachamento", "Quadríceps", 3, "10", ""],
  ]);
  if (!r.ok) throw new Error(r.erros.join());
  salvarPlano(r.plano);
}

/** Plano com `dias` treinos (Treino 1…N), um exercício cada — dias por semana = `dias` (RN-03.1). */
export function planoComDias(dias: number) {
  const r = lerPlanilha([
    ["Treino", "Exercício", "Grupo muscular", "Séries"],
    ...Array.from({ length: dias }, (_, i) => [`Treino ${i + 1}`, `Exercício ${i + 1}`, "Costas", 3]),
  ]);
  if (!r.ok) throw new Error(r.erros.join());
  salvarPlano(r.plano);
}
