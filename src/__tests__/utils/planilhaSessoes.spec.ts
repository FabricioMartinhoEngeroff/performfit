/**
 * planilhaSessoes → utils
 * Sessões vindas da planilha: além das 4 fixas (Upper/Lower A/B), aceita protocolos
 * com várias semanas e dias (uma aba por semana), sem mudar nada para quem usa as 4.
 */
import { describe, it, expect } from "vitest";
import {
  blocosCluster,
  idDaSessao,
  listarSessoes,
  mesclarRepetidos,
  prefixoAba,
  rotuloSessao,
} from "../../utils/planilhaSessoes";
import { nomeCanonico, videoDoExercicio, termoBuscaGif } from "../../data/exerciseAliases";
import { MUSCLE_MAP } from "../../data/muscleMap";
import { EXERCICIOS } from "../../data/exercise";
import { EXERCISE_VIDEOS } from "../../data/exerciseVideos";
import { SESSOES_LABELS } from "../../data/sessionExercises";
import { slugExercicio } from "../../utils/registros";

describe("planilhaSessoes", () => {
  describe("prefixoAba", () => {
    it("abrevia abas de semana", () => {
      expect(prefixoAba("Semana 1")).toBe("S1");
      expect(prefixoAba("Semana 2")).toBe("S2");
      expect(prefixoAba("Semanas 3-4")).toBe("S3-4");
      expect(prefixoAba("semanas 3 e 4")).toBe("S3-4");
    });

    it("aba que não é de semana fica sem prefixo", () => {
      expect(prefixoAba("Logbook")).toBeNull();
      expect(prefixoAba("Guia")).toBeNull();
    });
  });

  describe("rotuloSessao / idDaSessao", () => {
    it("sem prefixo, o rótulo é o próprio treino (planilha de 4 dias não muda)", () => {
      expect(rotuloSessao("Upper A", "UA", null)).toBe("Upper A");
      expect(idDaSessao("Upper A")).toBe("UA");
      expect(idDaSessao("Lower B")).toBe("LB");
    });

    it("com prefixo, junta semana, dia e treino", () => {
      expect(rotuloSessao("Pull", "SEG", "S1")).toBe("S1 Seg · Pull");
      expect(rotuloSessao("Legs Cluster", "TER", "S3-4")).toBe("S3-4 Ter · Legs Cluster");
    });

    it("o id vem da parte antes do ·, sem espaços", () => {
      expect(idDaSessao("S1 Seg · Pull")).toBe("S1SEG");
      expect(idDaSessao("S2 Seg · Pull")).toBe("S2SEG");
      expect(idDaSessao("S3-4 Ter · Legs Cluster")).toBe("S3-4TER");
    });

    it("sessão livre sem · ganha id a partir do nome", () => {
      expect(idDaSessao("Full Body")).toBe("FULL_BODY");
    });

    it("mesmo treino em semanas diferentes não colide", () => {
      expect(idDaSessao(rotuloSessao("Pull", "SEG", "S1"))).not.toBe(idDaSessao(rotuloSessao("Pull", "SEG", "S2")));
    });
  });

  describe("listarSessoes", () => {
    it("sem plano importado, mostra as 4 sessões fixas", () => {
      expect(listarSessoes(null)).toEqual(SESSOES_LABELS);
      expect(listarSessoes({})).toEqual(SESSOES_LABELS);
    });

    it("plano com as 4 sessões padrão continua com os 4 botões de sempre, na mesma ordem", () => {
      expect(listarSessoes({ "Lower A": [], "Upper B": [], "Upper A": [], "Lower B": [] })).toEqual(SESSOES_LABELS);
    });

    it("plano com sessões próprias mostra as sessões do plano, na ordem da planilha", () => {
      expect(listarSessoes({ "S1 Seg · Pull": [], "S1 Ter · Push": [], "S2 Seg · Pull": [] })).toEqual([
        "S1 Seg · Pull",
        "S1 Ter · Push",
        "S2 Seg · Pull",
      ]);
    });
  });

  describe("mesclarRepetidos", () => {
    const linha = (ordem: number, exercicio: string, cue: string, series_validas = 1, sessao = "S1 Seg · Pull") => ({
      sessao, ordem, exercicio, cue, series_validas,
    });

    it("exercício repetido no mesmo dia vira 1 linha com as séries somadas, na posição do primeiro", () => {
      const out = mesclarRepetidos([
        linha(1, "Remada curvada", "Perto da falha · Descanso 2:00"),
        linha(2, "Puxador frente pegada neutra", "Até a falha"),
        linha(3, "Remada curvada", "Até a falha total"),
      ]);
      expect(out.map((r) => r.exercicio)).toEqual(["Remada curvada", "Puxador frente pegada neutra"]);
      expect(out[0]).toMatchObject({
        series_validas: 2,
        cue: "1ª: Perto da falha · Descanso 2:00 | 2ª: Até a falha total",
      });
    });

    it("não mistura sessões diferentes", () => {
      const out = mesclarRepetidos([linha(1, "Remada curvada", "a"), linha(1, "Remada curvada", "b", 1, "S2 Seg · Pull")]);
      expect(out).toHaveLength(2);
    });

    it("limita a 4 séries", () => {
      const out = mesclarRepetidos([linha(1, "X", "", 3), linha(2, "X", "", 3)]);
      expect(out[0]!.series_validas).toBe(4);
    });

    it("sem repetidos, devolve as linhas iguais", () => {
      const linhas = [linha(1, "A", "c1", 3, "Upper A"), linha(2, "B", "c2", 2, "Upper A")];
      expect(mesclarRepetidos(linhas)).toEqual(linhas);
    });
  });

  describe("blocosCluster", () => {
    it("24 reps em blocos de 4 → 6 blocos", () => {
      expect(blocosCluster("Cluster set: 24 reps em blocos de 4 reps com 10 s de descanso")).toBe(6);
      expect(blocosCluster("1 cluster set de 24 repetições divididas em blocos de 4 repetições")).toBe(6);
    });

    it("sem cluster ou sem tamanho do bloco → undefined", () => {
      expect(blocosCluster("Até a falha")).toBeUndefined();
      expect(blocosCluster("Cluster set de 100 repetições")).toBeUndefined();
    });
  });
});

describe("exerciseAliases", () => {
  it("mesmo exercício com outro nome vira o nome do catálogo", () => {
    expect(nomeCanonico("Extensão de pernas")).toBe("Cadeira extensora");
    expect(nomeCanonico("Flexora sentada")).toBe("Cadeira flexora sentada");
    expect(nomeCanonico("Flexora deitada")).toBe("Mesa flexora");
    expect(nomeCanonico("Agachamento búlgaro")).toBe("Afundo búlgaro livre");
    expect(nomeCanonico("Remada com halteres no banco inclinado")).toBe("Remada peito apoiado");
    expect(nomeCanonico("Supino na máquina")).toBe("Supino máquina");
    expect(nomeCanonico("Pec deck")).toBe("Voador");
    expect(nomeCanonico("Tríceps corda")).toBe("Pulley corda");
    expect(nomeCanonico("Polia para tríceps")).toBe("Tríceps Pulley");
  });

  it("ignora maiúsculas, acentos e espaços nas pontas", () => {
    expect(nomeCanonico("  extensao DE pernas ")).toBe("Cadeira extensora");
  });

  it("nomes que você já usa não mudam", () => {
    for (const nome of ["Cadeira extensora", "Supino reto barra", "Pull down", "Afundo búlgaro livre", "Mesa flexora"]) {
      expect(nomeCanonico(nome)).toBe(nome);
    }
  });

  it("exercício novo parecido usa o vídeo do semelhante", () => {
    expect(videoDoExercicio("Rosca scott no cabo")).toBe(EXERCISE_VIDEOS["Rosca scott"]);
    expect(videoDoExercicio("Remada articulada")).toBe(EXERCISE_VIDEOS["Remada articulada aberta com apoio peitoral"]);
    expect(videoDoExercicio("Supino reto barra")).toBe(EXERCISE_VIDEOS["Supino reto barra"]);
    expect(videoDoExercicio("Exercício inexistente")).toBe("");
  });

  it("busca de GIF também cai no semelhante", () => {
    expect(termoBuscaGif("Crucifixo")).toBe("dumbbell fly");
    expect(termoBuscaGif("Supino reto barra")).toBe("barbell bench press");
  });

  it("o slug do registro unifica os nomes iguais (histórico não se parte)", () => {
    expect(slugExercicio("Extensão de pernas")).toBe(slugExercicio("Cadeira extensora"));
    expect(slugExercicio("Rosca spider com halteres")).toBe(slugExercicio("Rosca spider"));
  });

  describe("todos os exercícios do protocolo de 6 dias têm grupo muscular e estão no catálogo", () => {
    const PROTOCOLO = [
      "Remada curvada", "Puxador frente pegada neutra", "Remada baixa", "Pulldown com corda", "Rosca martelo",
      "Rosca spider", "Supino inclinado na smith", "Crossover", "Crucifixo", "Desenvolvimento na smith",
      "Elevação com halteres", "Voador invertido", "Paralela", "Tríceps corda", "Elevação pélvica",
      "Cadeira abdutora", "Agachamento livre", "Extensão de pernas", "Agachamento máquina", "Agachamento sissy",
      "Stiff", "Flexora em pé", "Agachamento búlgaro", "Panturrilha em pé", "Remada articulada",
      "Puxador pela frente pegada aberta", "Supino máquina", "Voador", "Desenvolvimento na smith machine",
      "Polia para tríceps", "Leg press unilateral", "Rosca scott no cabo",
      "Remada com halteres no banco inclinado", "Puxador frente pegada supinada", "Rosca alternada",
      "Supino na máquina", "Pec deck", "Desenvolvimento na máquina", "Elevação lateral na máquina", "Tate press",
      "Agachamento hack", "Extensão de pernas unilateral", "Passada", "Rack pull", "Flexora sentada",
      "Remada baixa pegada aberta e pronada", "Tríceps com duas cordas", "Hiperextensão com barra",
      "Rosca spider com halteres", "Leg press horizontal", "Flexora deitada", "Panturrilha sentado",
    ];

    it.each(PROTOCOLO)("%s", (nome) => {
      const canonico = nomeCanonico(nome);
      expect(MUSCLE_MAP[canonico], `grupo de ${canonico}`).toBeDefined();
      expect(EXERCICIOS as readonly string[]).toContain(canonico);
    });
  });
});
