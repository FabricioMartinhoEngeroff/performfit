import { carregarExecucoes, salvarExecucoes, sanitizarExecucoes, type Execucao } from "./execucoes";
import { carregarPlano, salvarPlano, sanitizarPlano, type Plano } from "./planoPerformfit";

// Backup do PerformFit (RN-08.2, RN-08.3): plano importado + histórico de execuções.
// v1 tinha meta semanal e não tinha plano: continua aceito, a meta é ignorada.
// Independente do backup do GymWave (app "gymwave", histórico em kg).

export interface BackupPerformfit {
  app: "performfit";
  versao: 2;
  exportadoEm: string;
  plano: Plano | null;
  execucoes: Execucao[];
}

export function montarBackupPerformfit(agora = new Date()): BackupPerformfit {
  return {
    app: "performfit",
    versao: 2,
    exportadoEm: agora.toISOString(),
    plano: carregarPlano(),
    execucoes: carregarExecucoes(),
  };
}

const chave = (e: Execucao) => `${e.sessaoId}|${e.data}|${e.exercicio}`;

export type ResultadoImportacao = { ok: true; novos: number } | { ok: false; erro: string };

/** Mescla o histórico (o mesmo exercício no mesmo treino e data não entra duas vezes) e restaura o plano. */
export function importarBackupPerformfit(texto: string): ResultadoImportacao {
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    return { ok: false, erro: "Arquivo inválido." };
  }
  const b = json as Partial<BackupPerformfit> | null;
  if (!b || b.app !== "performfit" || !Array.isArray(b.execucoes)) {
    return { ok: false, erro: "Este arquivo não é um backup do PerformFit." };
  }

  const atuais = carregarExecucoes();
  const vistos = new Set(atuais.map(chave));
  const novos = sanitizarExecucoes(b.execucoes).filter((e) => {
    if (vistos.has(chave(e))) return false;
    vistos.add(chave(e));
    return true;
  });
  salvarExecucoes([...atuais, ...novos]);

  const plano = sanitizarPlano(b.plano);
  if (plano) salvarPlano(plano);
  return { ok: true, novos: novos.length };
}
