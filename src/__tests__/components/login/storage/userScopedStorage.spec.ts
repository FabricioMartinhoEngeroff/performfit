import { describe, it, expect, beforeEach, vi } from "vitest";
import type { DadosTreino } from "../../../../types/TrainingData";

type StorageModule = typeof import("../../../../utils/storage");

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const LOGBOOK_JSON = '{"supino":[]}';
const SUPINO_RECORD = {
  exercicio: "supino",
  treinoId: "t1",
  data: "2026-01-01",
  dataTs: 1,
  topSetBateuTeto: false,
} as never;

const dados = (weight: string): DadosTreino =>
  ({ supino: { c1: { pesos: [weight], reps: ["5"], obs: "" } } }) as unknown as DadosTreino;
const serialized = (weight: string) => JSON.stringify(dados(weight));
const scopedKey = (userId: string, base: string) => `gw:${userId}:${base}`;

/** O módulo guarda o "usuário atual" em memória: cada teste começa com uma cópia nova. */
async function freshStorage(): Promise<StorageModule> {
  vi.resetModules();
  return import("../../../../utils/storage");
}

let storage: StorageModule;
beforeEach(async () => {
  storage = await freshStorage();
});

describe("G19 — storageKey", () => {
  it("sem usuário → chave base", () => {
    expect(storage.storageKey("logbook")).toBe("logbook");
  });

  it("com usuário → gw:{id}:{base}", () => {
    storage.setCurrentUser(USER_A);
    expect(storage.storageKey("logbook")).toBe(`gw:${USER_A}:logbook`);
  });

  it("o id na chave é o id do usuário, nunca o e-mail", () => {
    localStorage.setItem("email", "ana@example.com");
    storage.setCurrentUser(USER_A);
    expect(storage.storageKey("dadosTreino")).not.toContain("ana@example.com");
    expect(storage.storageKey("dadosTreino")).toContain(USER_A);
  });

  it("ids diferentes nunca colidem (a + b_logbook ≠ a_b + logbook)", () => {
    storage.setCurrentUser("a");
    const first = storage.storageKey("b_logbook");
    storage.setCurrentUser("a_b");
    const second = storage.storageKey("logbook");
    expect(first).not.toBe(second);
  });

  it("não lê a chave legada 'email' para decidir o usuário atual", async () => {
    localStorage.setItem("email", "ana@example.com");
    const fresh = await freshStorage();
    expect(fresh.storageKey("logbook")).toBe("logbook");
  });
});

describe("G19 — isolamento entre usuários e logout", () => {
  it("o usuário A salva, o B não vê", () => {
    storage.setCurrentUser(USER_A);
    storage.salvarDados(dados("100"));
    storage.setCurrentUser(USER_B);
    expect(storage.carregarDados()).toEqual({});
  });

  it("logout (setCurrentUser(null)) → carregarDados devolve {} e os dados de A continuam salvos", () => {
    storage.setCurrentUser(USER_A);
    storage.salvarDados(dados("100"));

    storage.setCurrentUser(null);

    expect(storage.carregarDados()).toEqual({});
    expect(localStorage.getItem(scopedKey(USER_A, "dadosTreino"))).not.toBeNull();
  });

  it("A faz login de novo → os dados voltam", () => {
    storage.setCurrentUser(USER_A);
    storage.salvarDados(dados("100"));
    storage.setCurrentUser(null);

    storage.setCurrentUser(USER_A);

    expect(storage.carregarDados()).toEqual(dados("100"));
  });

  it("o logbook também é isolado por usuário", () => {
    storage.setCurrentUser(USER_A);
    storage.salvarRegistro(SUPINO_RECORD);
    expect(storage.carregarHistorico("supino")).toHaveLength(1);

    storage.setCurrentUser(USER_B);
    expect(storage.carregarHistorico("supino")).toHaveLength(0);

    storage.setCurrentUser(null);
    expect(storage.carregarHistorico("supino")).toHaveLength(0);
  });
});

describe("G19 — migração do legado", () => {
  it("a chave global migra para o primeiro usuário autenticado e a global é removida", () => {
    localStorage.setItem("logbook", LOGBOOK_JSON);
    localStorage.setItem("dadosTreino", serialized("80"));

    storage.setCurrentUser(USER_A);

    expect(localStorage.getItem(scopedKey(USER_A, "logbook"))).toBe(LOGBOOK_JSON);
    expect(localStorage.getItem(scopedKey(USER_A, "dadosTreino"))).toBe(serialized("80"));
    expect(localStorage.getItem("logbook")).toBeNull();
    expect(localStorage.getItem("dadosTreino")).toBeNull();
  });

  it("o segundo usuário não herda os dados globais", () => {
    localStorage.setItem("dadosTreino", serialized("80"));
    storage.setCurrentUser(USER_A);

    storage.setCurrentUser(USER_B);

    expect(storage.carregarDados()).toEqual({});
  });

  it("um destino existente não é sobrescrito", () => {
    localStorage.setItem(scopedKey(USER_A, "dadosTreino"), serialized("DESTINO"));
    localStorage.setItem("dadosTreino", serialized("GLOBAL"));

    storage.setCurrentUser(USER_A);

    expect(localStorage.getItem(scopedKey(USER_A, "dadosTreino"))).toBe(serialized("DESTINO"));
    expect(localStorage.getItem("dadosTreino")).toBeNull();
  });

  it("não migra valores vazios ('{}' e '[]')", () => {
    localStorage.setItem("logbook", "{}");
    storage.setCurrentUser(USER_A);
    expect(localStorage.getItem(scopedKey(USER_A, "logbook"))).toBeNull();
  });

  it("a migração não roda no carregamento do módulo, só em setCurrentUser(id)", async () => {
    localStorage.setItem("logbook", LOGBOOK_JSON);
    localStorage.setItem("email", "ana@example.com");

    const fresh = await freshStorage();
    expect(localStorage.getItem("logbook")).toBe(LOGBOOK_JSON);

    fresh.setCurrentUser(USER_A);
    expect(localStorage.getItem("logbook")).toBeNull();
    expect(localStorage.getItem(scopedKey(USER_A, "logbook"))).toBe(LOGBOOK_JSON);
  });

  it("setCurrentUser(null) não migra nada", () => {
    localStorage.setItem("logbook", LOGBOOK_JSON);
    storage.setCurrentUser(null);
    expect(localStorage.getItem("logbook")).toBe(LOGBOOK_JSON);
  });
});

describe("G19 — JSON corrompido", () => {
  it("carregarDados devolve {} sem lançar", () => {
    storage.setCurrentUser(USER_A);
    localStorage.setItem(scopedKey(USER_A, "dadosTreino"), "{broken");
    expect(() => storage.carregarDados()).not.toThrow();
    expect(storage.carregarDados()).toEqual({});
  });

  it("logbook corrompido devolve {} / [] sem lançar", () => {
    storage.setCurrentUser(USER_A);
    localStorage.setItem(scopedKey(USER_A, "logbook"), "{broken");
    expect(() => storage.carregarLogbookCompleto()).not.toThrow();
    expect(storage.carregarLogbookCompleto()).toEqual({});
    expect(storage.carregarHistorico("supino")).toEqual([]);
  });

  it("JSON válido porém de tipo errado (string/null) também vira {}", () => {
    storage.setCurrentUser(USER_A);
    localStorage.setItem(scopedKey(USER_A, "dadosTreino"), "null");
    expect(storage.carregarDados()).toEqual({});
    localStorage.setItem(scopedKey(USER_A, "logbook"), '"texto"');
    expect(storage.carregarLogbookCompleto()).toEqual({});
  });
});