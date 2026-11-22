/**
 * RN-13.1 — catálogo único das mensagens de confirmação.
 */
import { describe, it, expect } from "vitest";
import { CONFIRMACOES } from "../../mensagens/catalogo";

const EMOJI = /\p{Extended_Pictographic}/u;

describe("RN-13.1 catálogo de confirmações", () => {
  it("RN-13.3 sair do treino", () => {
    expect(CONFIRMACOES.sairDoTreino).toEqual({
      titulo: "Sair do treino?",
      texto: "Seu treino ainda não foi salvo. O que você marcou fica guardado e você pode continuar depois.",
      confirmar: "Sair do treino",
      cancelar: "Continuar treinando",
    });
  });

  it("RN-13.4 sair da conta com treino em andamento", () => {
    expect(CONFIRMACOES.sairDaConta).toEqual({
      titulo: "Sair da sua conta?",
      texto:
        "Seu treino ainda não foi salvo. O que você marcou fica guardado neste celular e volta quando você entrar de novo.",
      confirmar: "Sair da conta",
      cancelar: "Continuar treinando",
    });
  });

  it.each(Object.entries(CONFIRMACOES))("%s: todos os campos preenchidos, sem emoji, botões diferentes", (_, m) => {
    for (const campo of [m.titulo, m.texto, m.confirmar, m.cancelar]) {
      expect(campo.trim()).not.toBe("");
      expect(campo).not.toMatch(EMOJI);
    }
    expect(m.confirmar).not.toBe(m.cancelar);
  });
});

describe("RN-14.5 textos da tela de erro no catálogo", () => {
  it("título, texto, botões e aviso de falha no backup", async () => {
    const { TELA_DE_ERRO } = await import("../../mensagens/catalogo");
    expect(TELA_DE_ERRO).toEqual({
      titulo: "Algo deu errado",
      texto: "Seus dados estão salvos neste celular. Toque em Recarregar para voltar ao app.",
      recarregar: "Recarregar",
      baixarBackup: "Baixar backup",
      backupBaixado: "Backup baixado. Guarde o arquivo.",
      backupFalhou: "Não foi possível baixar o backup agora. Seus dados continuam guardados neste celular.",
    });
  });
});
