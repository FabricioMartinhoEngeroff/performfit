/**
 * registros → utils
 * Formato v3 do histórico: uma lista plana de registros, um por exercício por treino,
 * nunca sobrescrita. Converte de/para o RegistroExercicio que o resto do app usa.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  dataBRparaISO,
  dataISOparaBR,
  exportarCSV,
  logbookParaRegistros,
  nomeExercicio,
  comNome,
  paraRegistro,
  deRegistro,
  registrosParaLogbook,
  slugExercicio,
  type Registro,
} from "../../utils/registros";
import {
  carregarHistorico,
  carregarLogbookCompleto,
  carregarRegistros,
  existeTreinoNaData,
  removerTreinoNaData,
  salvarRegistro,
  setCurrentUser,
  storageKey,
  ultimoRegistro,
} from "../../utils/storage";
import type { RegistroExercicio } from "../../types/TrainingData";

function exercicio(over: Partial<RegistroExercicio> = {}): RegistroExercicio {
  return {
    exercicio: "Supino reto barra",
    treinoId: "UA",
    data: "13/10/2026",
    dataTs: new Date(2026, 9, 13).getTime(),
    topSetKg: 85,
    topSetReps: 7,
    topSetFaixaMin: 5,
    topSetFaixaMax: 8,
    topSetBateuTeto: false,
    backoffKg: 85,
    backoffReps: 7,
    backoffFaixaMin: 8,
    backoffFaixaMax: 10,
    seriesValidas: 3,
    extraKg: 75,
    extraReps: 10,
    progrediu: false,
    obs: "top tava leve",
    ...over,
  };
}

const salvo = (): unknown => JSON.parse(localStorage.getItem(storageKey("registros")) || "null");

describe("registros — formato v3", () => {
  beforeEach(() => setCurrentUser(null));
  afterEach(() => setCurrentUser(null));

  describe("slugExercicio / nomeExercicio", () => {
    it("gera slug minúsculo, sem acento e com _", () => {
      expect(slugExercicio("Supino reto barra")).toBe("supino_reto_barra");
      expect(slugExercicio("Elevação lateral livre")).toBe("elevacao_lateral_livre");
      expect(slugExercicio("  Tríceps   Francês ")).toBe("triceps_frances");
    });

    it("unifica variações de escrita no slug do catálogo", () => {
      expect(slugExercicio("Pull-down")).toBe("pull_down");
      expect(slugExercicio("Pull down")).toBe("pull_down");
      expect(slugExercicio("Pulldown")).toBe("pull_down");
      expect(slugExercicio("PULL DOWN")).toBe("pull_down");
    });

    it("volta para o nome de exibição do catálogo", () => {
      expect(nomeExercicio("supino_reto_barra")).toBe("Supino reto barra");
      expect(nomeExercicio("elevacao_lateral_livre")).toBe("Elevação lateral livre");
      expect(nomeExercicio("pull_down")).toBe("Pull-down");
    });

    it("exercício fora do catálogo usa o nome guardado", () => {
      expect(nomeExercicio("meu_exercicio_x", "Meu Exercício X")).toBe("Meu Exercício X");
    });
  });

  describe("datas", () => {
    it("converte DD/MM/YYYY ↔ YYYY-MM-DD", () => {
      expect(dataBRparaISO("13/10/2026")).toBe("2026-10-13");
      expect(dataBRparaISO("3/1/2026")).toBe("2026-01-03");
      expect(dataISOparaBR("2026-10-13")).toBe("13/10/2026");
    });
  });

  describe("paraRegistro", () => {
    it("gera exatamente o formato combinado", () => {
      expect(paraRegistro(exercicio())).toEqual({
        id: "2026-10-13_UA_supino_reto_barra",
        data: "2026-10-13",
        sessao: "UA",
        exercicio: "supino_reto_barra",
        nome: "Supino reto barra",
        series: [
          { tipo: "top1", kg: 85, reps: 7 },
          { tipo: "top2", kg: 85, reps: 7 },
          { tipo: "backoff", kg: 75, reps: 10 },
        ],
        faixa: [5, 8],
        faixaBackoff: [8, 10],
        obs: "top tava leve",
      });
    });

    it("kg e reps são números", () => {
      const r = paraRegistro(exercicio({ topSetKg: 82.5 }));
      expect(r.series[0]).toEqual({ tipo: "top1", kg: 82.5, reps: 7 });
      r.series.forEach((s) => {
        expect(typeof s.kg).toBe("number");
        expect(typeof s.reps).toBe("number");
      });
    });

    it("série não feita não existe (sem 0 nem string vazia)", () => {
      const r = paraRegistro(exercicio({ seriesValidas: 2, backoffKg: 0, backoffReps: 0, extraKg: undefined, extraReps: undefined }));
      expect(r.series).toEqual([{ tipo: "top1", kg: 85, reps: 7 }]);
    });

    it("mantém série só de reps (peso corporal)", () => {
      const r = paraRegistro(exercicio({ exercicio: "Barra fixa", topSetKg: 0, topSetReps: 8, seriesValidas: 2, backoffKg: 0, backoffReps: 7, extraKg: undefined, extraReps: undefined }));
      expect(r.series).toEqual([
        { tipo: "top1", kg: 0, reps: 8 },
        { tipo: "top2", kg: 0, reps: 7 },
      ]);
    });

    it("com 4 válidas, o slot extra vira serie3 e há serie4", () => {
      const r = paraRegistro(exercicio({ seriesValidas: 4, extraKg: 85, extraReps: 6, serie4Kg: 85, serie4Reps: 5 }));
      expect(r.series.map((s) => s.tipo)).toEqual(["top1", "top2", "serie3", "serie4"]);
      expect(r.validas).toBeUndefined();
    });

    it("cluster vira séries cluster1/cluster2 e mantém a técnica", () => {
      const r = paraRegistro(
        exercicio({
          seriesValidas: 2,
          topSetKg: 0,
          topSetReps: 0,
          backoffKg: 0,
          backoffReps: 0,
          extraKg: undefined,
          extraReps: undefined,
          tecnica: "RP",
          clusterSeries: [{ kg: 60, reps: 8 }, { kg: 60, reps: 4 }],
          clusterSeries2: [{ kg: 60, reps: 6 }],
        }),
      );
      expect(r.series).toEqual([
        { tipo: "cluster1", kg: 60, reps: 8 },
        { tipo: "cluster1", kg: 60, reps: 4 },
        { tipo: "cluster2", kg: 60, reps: 6 },
      ]);
      expect(r.tecnica).toBe("RP");
    });

    it("campos opcionais só aparecem quando existem", () => {
      const r = paraRegistro(exercicio({ obs: undefined, tecnica: null, isDeload: false }));
      expect(r).not.toHaveProperty("obs");
      expect(r).not.toHaveProperty("tecnica");
      expect(r).not.toHaveProperty("deload");
      expect(r).not.toHaveProperty("validas");
      expect(r).not.toHaveProperty("bateuTeto");
      expect(paraRegistro(exercicio({ isDeload: true })).deload).toBe(true);
    });

    it("não guarda campos deriváveis (dataTs, progrediu, pesoAnterior…)", () => {
      const r = paraRegistro(exercicio({ pesoAnterior: 80, repsAnterior: 8, progrediu: true }));
      for (const campo of ["dataTs", "progrediu", "pesoAnterior", "repsAnterior", "topSetKg", "treinoId"]) {
        expect(r).not.toHaveProperty(campo);
      }
    });

    it("guarda validas só quando não dá para deduzir das séries", () => {
      const r = paraRegistro(exercicio({ seriesValidas: 3, extraKg: undefined, extraReps: undefined }));
      expect(r.validas).toBe(3);
    });

    it("exercício fora do catálogo guarda o nome original", () => {
      const r = paraRegistro(exercicio({ exercicio: "Meu Exercício X" }));
      expect(r.exercicio).toBe("meu_exercicio_x");
      expect(r.nome).toBe("Meu Exercício X");
    });

    it("normaliza o nome para o catálogo", () => {
      const r = paraRegistro(exercicio({ exercicio: "Pulldown" }));
      expect(r.exercicio).toBe("pull_down");
      expect(r.nome).toBe("Pull-down");
    });

    it("sempre guarda o nome legível do exercício, logo depois do slug", () => {
      const r = paraRegistro(exercicio({ exercicio: "Elevação lateral livre" }));
      expect(r.nome).toBe("Elevação lateral livre");
      expect(Object.keys(r).slice(0, 5)).toEqual(["id", "data", "sessao", "exercicio", "nome"]);
    });

    it("outro nome do mesmo exercício guarda o nome do catálogo", () => {
      const r = paraRegistro(exercicio({ exercicio: "Extensão de pernas" }));
      expect(r).toMatchObject({ exercicio: "cadeira_extensora", nome: "Cadeira extensora" });
    });
  });

  describe("comNome (registros gravados antes do nome sempre presente)", () => {
    it("registro sem nome ganha o nome do catálogo", () => {
      const antigo = { id: "2026-06-01_UA_supino_reto_barra", data: "2026-06-01", sessao: "UA", exercicio: "supino_reto_barra", series: [] };
      expect(comNome(antigo)).toEqual({ ...antigo, nome: "Supino reto barra" });
    });

    it("registro que já tem nome fica igual", () => {
      const r = { id: "x", data: "2026-06-01", sessao: "UA", exercicio: "meu_exercicio_x", nome: "Meu Exercício X", series: [] };
      expect(comNome(r)).toBe(r);
    });
  });

  describe("deRegistro (volta para o formato do app)", () => {
    it("reconstrói o RegistroExercicio com os campos deduzidos", () => {
      const original = exercicio();
      const volta = deRegistro(paraRegistro(original));
      expect(volta).toMatchObject({
        exercicio: "Supino reto barra",
        treinoId: "UA",
        data: "13/10/2026",
        dataTs: new Date(2026, 9, 13).getTime(),
        topSetKg: 85,
        topSetReps: 7,
        topSetFaixaMin: 5,
        topSetFaixaMax: 8,
        topSetBateuTeto: false,
        backoffKg: 85,
        backoffReps: 7,
        backoffFaixaMin: 8,
        backoffFaixaMax: 10,
        seriesValidas: 3,
        extraKg: 75,
        extraReps: 10,
        obs: "top tava leve",
      });
    });

    it("bateu o teto quando as reps do Top Set 1 chegam ao máximo da faixa", () => {
      const volta = deRegistro(paraRegistro(exercicio({ topSetReps: 8, topSetBateuTeto: true })));
      expect(volta.topSetBateuTeto).toBe(true);
    });

    it("preserva bateuTeto importado que difere da regra", () => {
      const r = paraRegistro(exercicio({ topSetReps: 8, topSetBateuTeto: false }));
      expect(r.bateuTeto).toBe(false);
      expect(deRegistro(r).topSetBateuTeto).toBe(false);
    });

    it("ida e volta mantém cluster, 4 válidas, deload e técnica", () => {
      const casos = [
        exercicio({ seriesValidas: 4, extraKg: 85, extraReps: 6, serie4Kg: 80, serie4Reps: 8 }),
        exercicio({ isDeload: true, tecnica: "RP", clusterSeries: [{ kg: 60, reps: 8 }], clusterSeries2: [{ kg: 60, reps: 5 }] }),
        exercicio({ seriesValidas: 2, extraKg: undefined, extraReps: undefined }),
      ];
      for (const c of casos) {
        const volta = deRegistro(paraRegistro(c));
        expect(volta.seriesValidas).toBe(c.seriesValidas);
        expect(volta.extraKg).toBe(c.extraKg);
        expect(volta.serie4Kg).toBe(c.serie4Kg);
        expect(volta.clusterSeries).toEqual(c.clusterSeries);
        expect(volta.clusterSeries2).toEqual(c.clusterSeries2);
        expect(!!volta.isDeload).toBe(!!c.isDeload);
        expect(volta.tecnica ?? null).toBe(c.tecnica ?? null);
      }
    });
  });

  describe("registrosParaLogbook / logbookParaRegistros", () => {
    it("agrupa por nome de exibição e calcula progressão pelo treino anterior da mesma sessão", () => {
      const lista: Registro[] = [
        paraRegistro(exercicio({ data: "06/10/2026", topSetKg: 80 })),
        paraRegistro(exercicio({ data: "13/10/2026", topSetKg: 85 })),
        paraRegistro(exercicio({ treinoId: "UB", data: "15/10/2026", topSetKg: 70 })),
      ];
      const lb = registrosParaLogbook(lista);
      const hist = lb["Supino reto barra"]!;
      expect(hist).toHaveLength(3);
      expect(hist[0]).toMatchObject({ progrediu: false, pesoAnterior: undefined });
      expect(hist[1]).toMatchObject({ progrediu: true, pesoAnterior: 80, repsAnterior: 7 });
      expect(hist[2]).toMatchObject({ treinoId: "UB", progrediu: false, pesoAnterior: undefined });
    });

    it("converte um logbook antigo inteiro, em ordem cronológica e com ids únicos", () => {
      const lista = logbookParaRegistros({
        "Supino reto barra": [exercicio({ data: "13/10/2026" }), exercicio({ data: "06/10/2026", dataTs: new Date(2026, 9, 6).getTime() })],
        "Pull down": [exercicio({ exercicio: "Pull down", data: "13/10/2026" }), exercicio({ exercicio: "Pull down", data: "13/10/2026" })],
      });
      expect(lista.map((r) => r.data)).toEqual(["2026-10-06", "2026-10-13", "2026-10-13", "2026-10-13"]);
      expect(new Set(lista.map((r) => r.id)).size).toBe(4);
      expect(lista.filter((r) => r.exercicio === "pull_down")).toHaveLength(2);
    });
  });

  describe("persistência (storage.ts)", () => {
    it("salvarRegistro grava na chave registros, no formato novo", () => {
      salvarRegistro(exercicio());
      expect(salvo()).toEqual([paraRegistro(exercicio())]);
      expect(localStorage.getItem(storageKey("logbook"))).toBeNull();
    });

    it("cada treino salvo vira um registro novo — nunca sobrescreve o anterior", () => {
      salvarRegistro(exercicio({ data: "06/10/2026", topSetKg: 80 }));
      salvarRegistro(exercicio({ data: "13/10/2026", topSetKg: 85 }));
      salvarRegistro(exercicio({ data: "20/10/2026", topSetKg: 82.5 }));
      const lista = salvo() as Registro[];
      expect(lista.map((r) => r.series[0]!.kg)).toEqual([80, 85, 82.5]);
      expect(carregarHistorico("Supino reto barra").map((r) => r.topSetKg)).toEqual([80, 85, 82.5]);
    });

    it("mesmo exercício em outra sessão no mesmo dia não colide", () => {
      salvarRegistro(exercicio({ treinoId: "UA" }));
      salvarRegistro(exercicio({ treinoId: "UB" }));
      const ids = (salvo() as Registro[]).map((r) => r.id);
      expect(ids).toEqual(["2026-10-13_UA_supino_reto_barra", "2026-10-13_UB_supino_reto_barra"]);
    });

    it("ultimoRegistro, existeTreinoNaData e removerTreinoNaData usam a lista nova", () => {
      salvarRegistro(exercicio({ data: "06/10/2026", topSetKg: 80 }));
      salvarRegistro(exercicio({ data: "13/10/2026", topSetKg: 85 }));
      expect(ultimoRegistro("Supino reto barra", "UA")?.topSetKg).toBe(85);
      expect(existeTreinoNaData("UA", "13/10/2026")).toBe(true);
      removerTreinoNaData("UA", "13/10/2026");
      expect(existeTreinoNaData("UA", "13/10/2026")).toBe(false);
      expect(carregarRegistros()).toHaveLength(1);
    });

    it("dados ficam separados por usuário", () => {
      setCurrentUser("u1");
      salvarRegistro(exercicio());
      expect(localStorage.getItem("gw:u1:registros")).not.toBeNull();
      setCurrentUser("u2");
      expect(carregarRegistros()).toEqual([]);
    });

    it("JSON corrompido vira lista vazia", () => {
      localStorage.setItem(storageKey("registros"), "{quebrado");
      expect(carregarRegistros()).toEqual([]);
    });
  });

  describe("migração do logbook antigo", () => {
    it("converte o logbook na primeira leitura e guarda o original como backup", () => {
      const antigo = { "Supino reto barra": [exercicio({ data: "06/10/2026", topSetKg: 80 }), exercicio()] };
      localStorage.setItem(storageKey("logbook"), JSON.stringify(antigo));

      const lista = carregarRegistros();

      expect(lista).toHaveLength(2);
      expect(salvo()).toEqual(lista);
      expect(localStorage.getItem(storageKey("logbook"))).toBeNull();
      expect(JSON.parse(localStorage.getItem(storageKey("logbook_v1_backup"))!)).toEqual(antigo);
      expect(carregarLogbookCompleto()["Supino reto barra"]!.map((r) => r.topSetKg)).toEqual([80, 85]);
    });

    it("não migra de novo se a lista nova já existe", () => {
      salvarRegistro(exercicio());
      localStorage.setItem(storageKey("logbook"), JSON.stringify({ "Supino reto barra": [exercicio({ data: "01/01/2026" })] }));
      expect(carregarRegistros()).toHaveLength(1);
    });
  });

  describe("exportarCSV", () => {
    it("gera uma linha por série, fácil de abrir em planilha", () => {
      const csv = exportarCSV([paraRegistro(exercicio({ obs: 'disse "leve"' }))]);
      expect(csv.split("\n")).toEqual([
        "data,sessao,exercicio,serie,tipo,kg,reps,obs",
        '2026-10-13,UA,Supino reto barra,1,top1,85,7,"disse ""leve"""',
        '2026-10-13,UA,Supino reto barra,2,top2,85,7,"disse ""leve"""',
        '2026-10-13,UA,Supino reto barra,3,backoff,75,10,"disse ""leve"""',
      ]);
    });

    it("protege contra injeção de fórmula no Excel", () => {
      const csv = exportarCSV([paraRegistro(exercicio({ obs: "=HYPERLINK(1)" }))]);
      expect(csv).toContain(`"'=HYPERLINK(1)"`);
    });
  });
});
