/**
 * backupJson → utils
 * Exportação completa (v3, histórico como lista de registros) e migração de backup JSON
 * (v3, v2 com "logbook" e legado v1 = dadosTreino cru),
 * mesclando sem apagar dados existentes e permitindo desfazer.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  aplicarBackup,
  desfazerBackup,
  lerBackup,
  montarBackup,
  resumirBackup,
} from "../../utils/backupJson";
import { carregarLogbookCompleto, carregarRegistros, setCurrentUser } from "../../utils/storage";
import { paraRegistro } from "../../utils/registros";
import type { RegistroExercicio } from "../../types/TrainingData";

const LEGADO = {
  Agachamento: {
    C1: { exercicio: "Agachamento", data: "27/03/2026", pesos: ["125", "125", ""], reps: ["4", "4", ""], obs: "Cluster", ciclo: "C1" },
    "Ciclo 1": { data: "25/05/2025", pesos: ["90", "90", "90"], reps: ["12", "12", "12"], obs: "Estava bem.", exercicio: "Agachamento" },
  },
  "Afundo búlgaro livre": {
    LA: { data: "10/10/2026", pesos: ["20", "20"], reps: ["10", "9"], obs: "", exercicio: "Afundo búlgaro livre" },
  },
};

function registro(over: Partial<RegistroExercicio> = {}): RegistroExercicio {
  return {
    exercicio: "Supino reto barra",
    treinoId: "UA",
    data: "01/10/2026",
    dataTs: new Date(2026, 9, 1).getTime(),
    topSetKg: 100,
    topSetReps: 6,
    topSetFaixaMin: 5,
    topSetFaixaMax: 8,
    topSetBateuTeto: false,
    backoffKg: 100,
    backoffReps: 5,
    backoffFaixaMin: 5,
    backoffFaixaMax: 8,
    seriesValidas: 2,
    progrediu: false,
    ...over,
  };
}

const ler = (k: string) => JSON.parse(localStorage.getItem(k) || "{}");

describe("backupJson", () => {
  beforeEach(() => {
    localStorage.clear();
    setCurrentUser(null);
  });
  afterEach(() => setCurrentUser(null));

  describe("lerBackup", () => {
    it("reconhece o backup legado (dadosTreino cru)", () => {
      const b = lerBackup(JSON.stringify(LEGADO));
      expect(b.formato).toBe("legado");
      expect(Object.keys(b.dadosTreino)).toEqual(["Agachamento", "Afundo búlgaro livre"]);
      expect(b.registros).toEqual([]);
      expect(b.planoTreino).toBeNull();
    });

    it("reconhece o backup completo v2", () => {
      const texto = JSON.stringify({
        app: "gymwave",
        versao: 2,
        exportadoEm: "2026-10-16T00:00:00.000Z",
        dadosTreino: LEGADO,
        logbook: { "Supino reto barra": [registro()] },
        planoTreino: { "Upper A": { "Supino reto barra": { ordem: 1, series_validas: 2 } } },
        sessoes_config: { "Upper A": [{ nome: "Supino reto barra" }] },
      });
      const b = lerBackup(texto);
      expect(b.formato).toBe("completo");
      expect(resumirBackup(b)).toEqual({ exercicios: 3, registrosDados: 3, registrosLogbook: 1, temPlano: true });
    });

    it("converte o logbook de um backup v2 para registros", () => {
      const b = lerBackup(JSON.stringify({ app: "gymwave", versao: 2, logbook: { "Supino reto barra": [registro()] } }));
      expect(b.registros).toEqual([paraRegistro(registro())]);
    });

    it("reconhece o backup v3 (lista de registros)", () => {
      const reg = paraRegistro(registro());
      const b = lerBackup(JSON.stringify({ app: "gymwave", versao: 3, registros: [reg, { id: "x", data: "sem data" }] }));
      expect(b.formato).toBe("completo");
      expect(b.registros).toEqual([reg]);
      expect(resumirBackup(b).registrosLogbook).toBe(1);
    });

    it("rejeita texto que não é JSON", () => {
      expect(() => lerBackup("não é json")).toThrow(/JSON válido/);
    });

    it("rejeita JSON com formato desconhecido", () => {
      expect(() => lerBackup(JSON.stringify([1, 2]))).toThrow(/não reconhecido/);
      expect(() => lerBackup(JSON.stringify({ foo: "bar" }))).toThrow(/não reconhecido/);
      expect(() => lerBackup("{}")).toThrow(/não reconhecido/);
    });

    it("descarta registros inválidos e chaves perigosas no v2", () => {
      const texto = `{"app":"gymwave","versao":2,"dadosTreino":{"__proto__":{"C1":{"data":"1/1/2026"}},"Remo":{"C1":{"sem":"data"}}},"logbook":{"X":[{"exercicio":"X"}]}}`;
      const b = lerBackup(texto);
      expect(b.dadosTreino).toEqual({});
      expect(b.registros).toEqual([]);
      expect(({} as Record<string, unknown>).C1).toBeUndefined();
    });
  });

  describe("aplicarBackup", () => {
    it("restaura o backup legado num usuário vazio", () => {
      const r = aplicarBackup(lerBackup(JSON.stringify(LEGADO)));
      expect(r.dadosAdicionados).toBe(3);
      expect(r.dadosPreservados).toBe(0);
      expect(ler("dadosTreino")).toEqual(LEGADO);
    });

    it("grava nas chaves do usuário logado", () => {
      setCurrentUser("uid-123");
      aplicarBackup(lerBackup(JSON.stringify(LEGADO)));
      expect(ler("gw:uid-123:dadosTreino")).toEqual(LEGADO);
      expect(localStorage.getItem("dadosTreino")).toBeNull();
    });

    it("preserva registros que já existem localmente", () => {
      const local = { Agachamento: { C1: { data: "15/10/2026", pesos: ["140"], reps: ["3"], exercicio: "Agachamento" } } };
      localStorage.setItem("dadosTreino", JSON.stringify(local));

      const r = aplicarBackup(lerBackup(JSON.stringify(LEGADO)));

      expect(r.dadosAdicionados).toBe(2);
      expect(r.dadosPreservados).toBe(1);
      const db = ler("dadosTreino");
      expect(db.Agachamento.C1.pesos).toEqual(["140"]);
      expect(db.Agachamento["Ciclo 1"]).toBeDefined();
    });

    it("mescla o logbook sem duplicar e em ordem de data", () => {
      const antigo = registro({ data: "01/09/2026", dataTs: new Date(2026, 8, 1).getTime() });
      const atual = registro();
      localStorage.setItem("logbook", JSON.stringify({ "Supino reto barra": [atual] }));

      const b = lerBackup(JSON.stringify({ app: "gymwave", versao: 2, dadosTreino: {}, logbook: { "Supino reto barra": [atual, antigo] } }));
      const r = aplicarBackup(b);

      expect(r.logbookAdicionados).toBe(1);
      expect(r.logbookDuplicados).toBe(1);
      expect(carregarLogbookCompleto()["Supino reto barra"]!.map((x: RegistroExercicio) => x.data)).toEqual(["01/09/2026", "01/10/2026"]);
    });

    it("restaura plano e sessões só quando ainda não existem", () => {
      const plano = { "Upper A": { "Supino reto barra": { ordem: 1, series_validas: 2 } } };
      const sessoes = { "Upper A": [{ nome: "Supino reto barra" }] };
      const texto = JSON.stringify({ app: "gymwave", versao: 2, dadosTreino: {}, logbook: {}, planoTreino: plano, sessoes_config: sessoes });

      const r1 = aplicarBackup(lerBackup(texto));
      expect(r1.planoRestaurado).toBe(true);
      expect(r1.sessoesRestauradas).toBe(true);
      expect(ler("planoTreino")).toEqual(plano);

      const meuPlano = { "Lower A": { Stiff: { ordem: 1, series_validas: 3 } } };
      localStorage.setItem("planoTreino", JSON.stringify(meuPlano));
      const r2 = aplicarBackup(lerBackup(texto));
      expect(r2.planoRestaurado).toBe(false);
      expect(ler("planoTreino")).toEqual(meuPlano);
    });

    it("desfazerBackup volta ao estado anterior à migração", () => {
      const local = { Remo: { UA: { data: "01/10/2026", pesos: ["60"], reps: ["10"] } } };
      localStorage.setItem("dadosTreino", JSON.stringify(local));

      aplicarBackup(lerBackup(JSON.stringify(LEGADO)));
      desfazerBackup();

      expect(ler("dadosTreino")).toEqual(local);
      expect(carregarRegistros()).toEqual([]);
    });
  });

  describe("montarBackup", () => {
    it("exporta todos os dados do usuário no formato v3", () => {
      localStorage.setItem("dadosTreino", JSON.stringify(LEGADO));
      localStorage.setItem("logbook", JSON.stringify({ "Supino reto barra": [registro()] }));
      localStorage.setItem("planoTreino", JSON.stringify({ "Upper A": {} }));

      const b = montarBackup(new Date("2026-10-16T12:00:00.000Z"));

      expect(b.app).toBe("gymwave");
      expect(b.versao).toBe(3);
      expect(b.exportadoEm).toBe("2026-10-16T12:00:00.000Z");
      expect(b.dadosTreino).toEqual(LEGADO);
      expect(b.registros).toEqual([paraRegistro(registro())]);
      expect(b).not.toHaveProperty("logbook");
      expect(b.sessoes_config).toEqual({});
    });

    it("cada registro exportado traz o nome legível do exercício, inclusive os antigos sem nome", () => {
      localStorage.setItem("registros", JSON.stringify([
        { id: "2026-06-01_UA_supino_reto_barra", data: "2026-06-01", sessao: "UA", exercicio: "supino_reto_barra", series: [{ tipo: "top1", kg: 100, reps: 5 }] },
      ]));
      const [r] = montarBackup().registros;
      expect(r).toMatchObject({ exercicio: "supino_reto_barra", nome: "Supino reto barra" });
    });

    it("ida e volta: exportar e importar em outro usuário reproduz os dados", () => {
      setCurrentUser("antigo");
      localStorage.setItem("gw:antigo:dadosTreino", JSON.stringify(LEGADO));
      localStorage.setItem("gw:antigo:logbook", JSON.stringify({ "Supino reto barra": [registro()] }));
      const texto = JSON.stringify(montarBackup());

      setCurrentUser("novo");
      aplicarBackup(lerBackup(texto));

      expect(ler("gw:novo:dadosTreino")).toEqual(LEGADO);
      expect(carregarLogbookCompleto()["Supino reto barra"]).toHaveLength(1);
    });
  });
});
