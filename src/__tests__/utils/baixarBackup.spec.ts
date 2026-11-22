/**
 * RN-14.3 / RN-14.4 — arquivo de backup usado pelo Perfil e pela tela de erro.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { arquivoDeBackup, baixarBackup, montarBackupPerformfit } from "../../utils/backupPerformfit";

const AGORA = new Date(2026, 10, 22, 10);
const quebrado = (): ReturnType<typeof montarBackupPerformfit> => {
  throw new Error("dados com defeito");
};

describe("arquivoDeBackup", () => {
  beforeEach(() => localStorage.clear());

  it("RN-14.3 normal: o mesmo backup do Perfil", () => {
    const a = arquivoDeBackup(AGORA);
    expect(a.tipo).toBe("backup");
    expect(a.nome).toBe("performfit_backup_2026-11-22.json");
    expect(JSON.parse(a.conteudo)).toMatchObject({ app: "performfit", versao: 2 });
  });

  it("RN-14.4 backup não monta: cópia só dos dados do app (gw:), sem outras chaves", () => {
    localStorage.setItem("gw:u1:registros", '[{"x":1}]');
    localStorage.setItem("gw:u1:planoTreino", "{quebrado");
    localStorage.setItem("outra-coisa", "segredo");
    const a = arquivoDeBackup(AGORA, quebrado);
    expect(a.tipo).toBe("copia");
    expect(a.nome).toBe("performfit_dados_2026-11-22.json");
    const json = JSON.parse(a.conteudo);
    expect(json).toMatchObject({ app: "performfit", tipo: "copia-dos-dados" });
    expect(json.dados).toEqual({ "gw:u1:registros": '[{"x":1}]', "gw:u1:planoTreino": "{quebrado" });
  });
});

describe("baixarBackup", () => {
  let nomes: string[];
  beforeEach(() => {
    nomes = [];
    vi.stubGlobal("URL", { createObjectURL: () => "blob:x", revokeObjectURL: () => {} });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      nomes.push(this.download);
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("baixa o arquivo e diz o que baixou", () => {
    expect(baixarBackup(AGORA)).toBe("backup");
    expect(nomes).toEqual(["performfit_backup_2026-11-22.json"]);
  });

  it("com dados com defeito, baixa a cópia", () => {
    expect(baixarBackup(AGORA, quebrado)).toBe("copia");
    expect(nomes).toEqual(["performfit_dados_2026-11-22.json"]);
  });

  it("se o navegador não deixar baixar, responde 'falhou' sem lançar erro", () => {
    vi.stubGlobal("URL", { createObjectURL: () => { throw new Error("sem blob"); }, revokeObjectURL: () => {} });
    expect(baixarBackup(AGORA)).toBe("falhou");
  });
});
