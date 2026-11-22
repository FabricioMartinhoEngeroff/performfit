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

// ─── Baixar o backup (Perfil e tela de erro, RN-08.2 / RN-14.3 / RN-14.4) ─────

export interface ArquivoBackup {
  nome: string;
  conteudo: string;
  /** "backup" = o backup normal; "copia" = cópia bruta dos dados, quando o backup não monta. */
  tipo: "backup" | "copia";
}

const diaLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Só as chaves do app (`gw:{usuário}:{chave}`, RN-08.1), cruas, para o suporte recuperar. */
function copiaDosDados(): Record<string, string> {
  const dados: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("gw:")) dados[k] = localStorage.getItem(k) ?? "";
  }
  return dados;
}

export function arquivoDeBackup(agora = new Date(), montar = montarBackupPerformfit): ArquivoBackup {
  try {
    return {
      nome: `performfit_backup_${diaLocal(agora)}.json`,
      conteudo: JSON.stringify(montar(agora), null, 2),
      tipo: "backup",
    };
  } catch {
    return {
      nome: `performfit_dados_${diaLocal(agora)}.json`,
      conteudo: JSON.stringify(
        { app: "performfit", tipo: "copia-dos-dados", exportadoEm: agora.toISOString(), dados: copiaDosDados() },
        null,
        2
      ),
      tipo: "copia",
    };
  }
}

/** Baixa o backup (ou a cópia dos dados). Nunca lança: responde "falhou" se o navegador não deixar. */
export function baixarBackup(agora = new Date(), montar = montarBackupPerformfit): ArquivoBackup["tipo"] | "falhou" {
  try {
    const arquivo = arquivoDeBackup(agora, montar);
    const url = URL.createObjectURL(new Blob([arquivo.conteudo], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = arquivo.nome;
    a.click();
    URL.revokeObjectURL(url);
    return arquivo.tipo;
  } catch {
    return "falhou";
  }
}
