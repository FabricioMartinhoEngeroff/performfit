import { EXERCISE_VIDEOS } from "./exerciseVideos";

/**
 * Mesmo exercício com outro nome (planilhas de outros protocolos). Vira o nome do
 * catálogo na importação, então herda vídeo, grupo muscular e histórico.
 */
export const MESMO_EXERCICIO: Record<string, string> = {
  "Extensão de pernas": "Cadeira extensora",
  "Flexora sentada": "Cadeira flexora sentada",
  "Flexora deitada": "Mesa flexora",
  "Cadeira abdutora": "Abdutora",
  "Agachamento búlgaro": "Afundo búlgaro livre",
  "Elevação com halteres": "Elevação lateral livre",
  "Desenvolvimento na máquina": "Desenvolvimento máquina",
  "Remada com halteres no banco inclinado": "Remada peito apoiado",
  "Tríceps corda": "Pulley corda",
  "Polia para tríceps": "Tríceps Pulley",
  "Supino na máquina": "Supino máquina",
  "Pec deck": "Voador",
  "Desenvolvimento na smith": "Desenvolvimento na smith machine",
  "Rosca spider com halteres": "Rosca spider",
};

/**
 * Exercício próprio (histórico separado) que usa o vídeo/GIF de um semelhante
 * enquanto não tem demonstração própria.
 */
export const PARECIDO_COM: Record<string, string> = {
  "Crossover": "Crossover braço estendido",
  "Rosca scott no cabo": "Rosca scott",
  "Remada articulada": "Remada articulada aberta com apoio peitoral",
  "Puxador frente pegada neutra": "Puxada triângulo",
  "Puxador frente pegada supinada": "Pull-down",
  "Puxador pela frente pegada aberta": "Pull-down",
  "Remada baixa pegada aberta e pronada": "Remada baixa",
  "Pulldown com corda": "Pulldown inclinado",
  "Elevação lateral na máquina": "Elevação lateral cabo",
  "Extensão de pernas unilateral": "Cadeira extensora",
  "Flexora em pé": "Cadeira flexora unilateral",
  "Tríceps com duas cordas": "Pulley corda",
  "Hiperextensão com barra": "Extensão banco romano",
  "Passada": "Afundo no Smith",
  "Crucifixo": "Supino halteres amplitude",
};

const chave = (nome: string) =>
  nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const porChave = (mapa: Record<string, string>) =>
  new Map(Object.entries(mapa).map(([de, para]) => [chave(de), para]));

const MESMO = porChave(MESMO_EXERCICIO);
const PARECIDO = porChave(PARECIDO_COM);

/** Nome do catálogo para o mesmo exercício; nomes que não são alias voltam sem mudança. */
export function nomeCanonico(nome: string): string {
  return MESMO.get(chave(nome)) ?? nome.trim();
}

/** Exercício semelhante cuja demonstração serve para este (ou undefined). */
export function semelhante(nome: string): string | undefined {
  return PARECIDO.get(chave(nome));
}

/** ID do vídeo do YouTube do exercício, ou do semelhante; "" quando não há. */
export function videoDoExercicio(nome: string): string {
  const canonico = nomeCanonico(nome);
  const parecido = semelhante(canonico);
  return EXERCISE_VIDEOS[canonico] || (parecido ? EXERCISE_VIDEOS[parecido] : "") || "";
}

/** Termo de busca na ExerciseDB (GIF), caindo no semelhante; undefined quando não há. */
export function termoBuscaGif(nome: string, termos: Record<string, string> = TERMOS_GIF): string | undefined {
  const canonico = nomeCanonico(nome);
  const parecido = semelhante(canonico);
  return termos[canonico] ?? (parecido ? termos[parecido] : undefined);
}

// Nomes da ExerciseDB (em inglês) para buscar o GIF quando não há vídeo.
export const TERMOS_GIF: Record<string, string> = {
  "Supino reto barra": "barbell bench press",
  "Supino halteres amplitude": "dumbbell fly",
  "Crossover braço estendido": "cable crossover",
  "Barra fixa pronada": "pull up",
  "Puxada triângulo": "cable pulldown",
  "Pull-around cabo": "cable pullover",
  "Pulldown inclinado": "cable pulldown",
  "Remada peito apoiado": "incline row",
  "Desenvolvimento máquina": "machine shoulder press",
  "Elevação lateral livre": "dumbbell lateral raise",
  "Elevação lateral cabo": "cable lateral raise",
  "Agachamento livre": "barbell squat",
  "Cadeira extensora": "leg extension",
  "Terra sumô": "sumo deadlift",
  "Stiff": "romanian deadlift",
  "Elevação pélvica máquina": "barbell hip thrust",
  "Cadeira flexora sentada": "seated leg curl",
  "Cadeira flexora deitado": "lying leg curl",
  "Adutor máquina": "hip adduction",
  "Panturrilha em pé": "standing calf raise",
  "Panturrilha sentado": "seated calf raise",
  "Panturrilha leg press": "leg press calf raise",
  "Tríceps testa": "dumbbell triceps extension",
  "Tríceps polia barra reta": "cable triceps pushdown",
  "Tríceps polia unilateral": "cable one arm triceps pushdown",
  "Rosca inclinada 45°": "incline dumbbell curl",
  "Rosca scott unilateral": "preacher curl",
  "Rosca polia alta": "cable curl",
  "Rosca inversa": "reverse curl",
  "Rolar barra cabo": "cable crunch",
  "Abdômen cabo ajoelhado": "cable crunch",
  "Abdômen infra pendurado": "hanging leg raise",
  "Abdômen infra banco": "decline crunch",
};
