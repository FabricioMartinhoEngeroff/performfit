// Catálogo único das mensagens de confirmação — docs/REGRAS_DE_NEGOCIO.md RN-13.1.
// As telas usam a mensagem pelo nome (CONFIRMACOES.sairDoTreino) e nunca reescrevem o texto.

export interface MensagemConfirmacao {
  titulo: string;
  texto: string;
  /** Botão que faz a ação (sair, apagar…). */
  confirmar: string;
  /** Botão seguro: fica onde está. Vem primeiro e com foco (RN-13.2). */
  cancelar: string;
}

const TREINO_NAO_SALVO = "Seu treino ainda não foi salvo.";

export const CONFIRMACOES = {
  /** RN-13.3 / RN-13.5: trocar de aba ou voltar pelo celular com treino em andamento. */
  sairDoTreino: {
    titulo: "Sair do treino?",
    texto: `${TREINO_NAO_SALVO} O que você marcou fica guardado e você pode continuar depois.`,
    confirmar: "Sair do treino",
    cancelar: "Continuar treinando",
  },
  /** RN-13.4: botão Sair (da conta) com treino em andamento. */
  sairDaConta: {
    titulo: "Sair da sua conta?",
    texto: `${TREINO_NAO_SALVO} O que você marcou fica guardado neste celular e volta quando você entrar de novo.`,
    confirmar: "Sair da conta",
    cancelar: "Continuar treinando",
  },
} satisfies Record<string, MensagemConfirmacao>;

export type NomeConfirmacao = keyof typeof CONFIRMACOES;

/** RN-14: tela de erro amigável (nunca tela branca). */
export const TELA_DE_ERRO = {
  titulo: "Algo deu errado",
  texto: "Seus dados estão salvos neste celular. Toque em Recarregar para voltar ao app.",
  recarregar: "Recarregar",
  baixarBackup: "Baixar backup",
  backupBaixado: "Backup baixado. Guarde o arquivo.",
  backupFalhou: "Não foi possível baixar o backup agora. Seus dados continuam guardados neste celular.",
} as const;
