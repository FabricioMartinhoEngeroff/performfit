/** Maps each exercise name to one of the 8 display muscle groups for volume load grouping. */
export const MUSCLE_MAP: Record<string, string> = {

  // ── Peitoral ──────────────────────────────────────────────────────────────
  "Supino reto barra":                "Peitoral",
  "Supino halteres amplitude":        "Peitoral",
  "Crossover braço estendido":        "Peitoral",
  "Press declinado máquina":          "Peitoral",

  // ── Costas ────────────────────────────────────────────────────────────────
  "Barra fixa":               "Costas",
  "Puxada triângulo":                 "Costas",
  "Pull down":                        "Costas",
  "Pull-around":                      "Costas",
  "Remada peito apoiado":             "Costas",
  "Remada baixa":    "Costas",
  "Remada unilateral apoiada":        "Costas",
  "Remada articulada aberta com apoio peitoral": "Costas",
  "Remada cabo sentado triângulo":    "Costas",
  "Pull-around cabo":                 "Costas",
  "Barra fixa pronada":               "Costas",
  "Extensão banco romano":            "Costas", // lombar/eretores dobrado em Costas

  // ── Ombro ─────────────────────────────────────────────────────────────────
  "Elevação lateral livre":           "Ombro",
  "Elevação lateral cabo":            "Ombro",
  "Desenvolvimento máquina":          "Ombro",

  // ── Quadríceps ────────────────────────────────────────────────────────────
  "Agachamento livre":                "Quadríceps",
  "Cadeira extensora":                "Quadríceps",
  "Afundo no Smith":                  "Quadríceps",
  "Afundo búlgaro livre":             "Quadríceps", // glúteo/quadríceps dobrado em Quadríceps

  // ── Posterior/Glúteo ──────────────────────────────────────────────────────
  "Terra sumô":                       "Posterior/Glúteo",
  "Stiff":                            "Posterior/Glúteo",
  "Stiff perna reta":                 "Posterior/Glúteo",
  "Elevação pélvica":                 "Posterior/Glúteo",
  "Cadeira flexora sentada":          "Posterior/Glúteo",
  "Cadeira flexora deitado":          "Posterior/Glúteo",
  "Mesa flexora":          "Posterior/Glúteo",
  "Cadeira flexora unilateral":       "Posterior/Glúteo",
  "Adutor":                           "Posterior/Glúteo",
  "Adutor máquina":                  "Posterior/Glúteo",
  "Abdutora":                         "Posterior/Glúteo",
  "Coice no cross joelho estendido":  "Posterior/Glúteo",
  "Coice no cross joelho dobrado":    "Posterior/Glúteo",

  // ── Panturrilha ───────────────────────────────────────────────────────────
  "Panturrilha em pé":                "Panturrilha",
  "Panturrilha sentado":              "Panturrilha",
  "Panturrilha leg press":            "Panturrilha",
  "Dorsiflexão cabo":                 "Panturrilha", // canela/tibial dobrado em Panturrilha

  // ── Braço ─────────────────────────────────────────────────────────────────
  // Tríceps
  "Tríceps polia barra reta":         "Braço",
  "Tríceps testa":                    "Braço",
  "Tríceps polia unilateral":         "Braço",
  "Tríceps Francês":                    "Braço",
  "Francês corda":                    "Braço",
  "Pulley barra reta pronada":        "Braço",
  "Tríceps Pulley":                   "Braço",
  "Pulley corda":                     "Braço",
  // Bíceps
  "Rosca Bayesian":                   "Braço",
  "Rosca scott":                      "Braço",
  "Rosca martelo":                    "Braço",
  "Martelo corda":                    "Braço",
  "Rosca inclinada 45°":              "Braço",
  "Rosca scott unilateral":           "Braço",
  "Rosca polia alta":                 "Braço",
  "Rosca direta na polia baixa":      "Braço",
  "Rosca inversa":                    "Braço",
  // Antebraço
  "Antebraço invertido":              "Braço",
  "Antebraço rola palma":             "Braço",
  "Rolar barra cabo":                 "Braço",
  "Rosca punho":                      "Braço",
  "Rosca punho cabo":                 "Braço",
  "Extensão de punho":                "Braço",
  "Flexão de punho":                  "Braço",
  "Extensão de punho no cabo":        "Braço",
  "Flexão de punho no cabo":          "Braço",

  // ── Core ──────────────────────────────────────────────────────────────────
  "Abdômen cabo ajoelhado":           "Core",
  "Abdômen infra pendurado":          "Core",
  "Abdômen infra banco":              "Core",
  "Abdominal pendurado na barra":     "Core",
  "Prancha":                          "Core",

  // ── Protocolo 6 dias ──────────────────────────────────────────────────────
  "Remada curvada":                       "Costas",
  "Remada articulada":                    "Costas",
  "Remada baixa pegada aberta e pronada": "Costas",
  "Puxador frente pegada neutra":         "Costas",
  "Puxador frente pegada supinada":       "Costas",
  "Puxador pela frente pegada aberta":    "Costas",
  "Pulldown com corda":                   "Costas",
  "Hiperextensão com barra":              "Costas", // lombar/eretores, como o banco romano
  "Supino inclinado na smith":            "Peitoral",
  "Supino máquina":                       "Peitoral",
  "Crossover":                            "Peitoral",
  "Crucifixo":                            "Peitoral",
  "Voador":                               "Peitoral",
  "Desenvolvimento na smith machine":     "Ombro",
  "Elevação lateral na máquina":          "Ombro",
  "Voador invertido":                     "Ombro",
  "Agachamento máquina":                  "Quadríceps",
  "Agachamento hack":                     "Quadríceps",
  "Agachamento sissy":                    "Quadríceps",
  "Leg press unilateral":                 "Quadríceps",
  "Leg press horizontal":                 "Quadríceps",
  "Extensão de pernas unilateral":        "Quadríceps",
  "Passada":                              "Quadríceps",
  "Flexora em pé":                        "Posterior/Glúteo",
  "Rack pull":                            "Posterior/Glúteo",
  "Paralela":                             "Braço",
  "Tate press":                           "Braço",
  "Tríceps com duas cordas":              "Braço",
  "Rosca spider":                         "Braço",
  "Rosca alternada":                      "Braço",
  "Rosca scott no cabo":                  "Braço",
};

// Nome sem acento, maiúscula, espaço nem hífen: "Pull down" = "Pull-down",
// "Tríceps francês" = "Tríceps Francês".
const chave = (nome: string) =>
  nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

let porChave: Map<string, string> | null = null;

/** Grupo muscular do exercício, tolerando diferenças de escrita no nome. */
export function grupoMuscular(nome: string): string | undefined {
  const exato = MUSCLE_MAP[nome];
  if (exato) return exato;
  porChave ??= new Map(Object.entries(MUSCLE_MAP).map(([ex, grupo]) => [chave(ex), grupo]));
  return porChave.get(chave(nome));
}
