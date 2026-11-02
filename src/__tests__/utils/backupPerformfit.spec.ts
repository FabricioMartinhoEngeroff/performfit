/**
 * Backup do PerformFit (RN-08.2, RN-08.3): plano + histórico.
 */
import { describe, it, expect } from "vitest";
import { montarBackupPerformfit, importarBackupPerformfit } from "../../utils/backupPerformfit";
import { carregarExecucoes, registrarTreino, type Execucao } from "../../utils/execucoes";
import { carregarPlano } from "../../utils/planoPerformfit";
import { planoDeTeste } from "../helpers/planoDeTeste";

const exec = (p: Partial<Execucao> = {}): Execucao => ({
  exercicio: "Leg press", grupo: "Quadríceps", sessao: "Treino A", sessaoId: "TREINO_A",
  data: "13/10/2026", dataTs: new Date(2026, 9, 13).getTime(), seriesPlanejadas: 3, seriesFeitas: 3, ...p,
});

describe("backup PerformFit", () => {
  it("montar leva plano e histórico (v2)", () => {
    planoDeTeste();
    registrarTreino([exec()]);
    const b = montarBackupPerformfit(new Date(2026, 10, 1));
    expect(b).toMatchObject({ app: "performfit", versao: 2 });
    expect(b.plano!.treinos).toHaveLength(3);
    expect(b.execucoes).toHaveLength(1);
  });

  it("RN-08.2 importar mescla o histórico sem duplicar e restaura o plano", () => {
    registrarTreino([exec()]);
    planoDeTeste();
    const backup = montarBackupPerformfit();
    localStorage.clear();
    registrarTreino([exec()]);
    const texto = JSON.stringify({
      ...backup,
      execucoes: [exec(), exec({ data: "14/10/2026", dataTs: new Date(2026, 9, 14).getTime() })],
    });
    expect(importarBackupPerformfit(texto)).toEqual({ ok: true, novos: 1 });
    expect(carregarExecucoes()).toHaveLength(2);
    expect(carregarPlano()!.treinos).toHaveLength(3);
  });

  it("RN-08.3 backup v1 (com meta, sem plano) continua sendo aceito", () => {
    const texto = JSON.stringify({ app: "performfit", versao: 1, metaSemanal: 5, execucoes: [exec()] });
    expect(importarBackupPerformfit(texto)).toEqual({ ok: true, novos: 1 });
    expect(carregarPlano()).toBeNull();
    expect(localStorage.getItem("meta_semanal")).toBeNull();
  });

  it("recusa arquivo que não é backup do PerformFit", () => {
    expect(importarBackupPerformfit("{nada")).toEqual({ ok: false, erro: "Arquivo inválido." });
    expect(importarBackupPerformfit(JSON.stringify({ app: "gymwave", versao: 3 }))).toEqual({
      ok: false, erro: "Este arquivo não é um backup do PerformFit.",
    });
  });
});
