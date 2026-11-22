// Protege a saída enquanto há trabalho não salvo — docs/REGRAS_DE_NEGOCIO.md RN-13.5 / RN-13.6.
import { useEffect, useRef } from "react";
import type { MensagemConfirmacao } from "./catalogo";
import { useConfirmacao } from "./Confirmacao";

const GUARDA = "performfitGuarda";

const temGuarda = () => (window.history.state as Record<string, unknown> | null)?.[GUARDA] === true;
const armarGuarda = () => window.history.pushState({ ...(window.history.state ?? {}), [GUARDA]: true }, "");

/**
 * Com `ativo`:
 * - fechar/recarregar a página mostra o aviso do navegador (RN-13.6);
 * - o botão voltar do celular pergunta `mensagem` antes de sair (RN-13.5).
 */
export function useSaidaProtegida(ativo: boolean, mensagem: MensagemConfirmacao) {
  const confirmar = useConfirmacao();
  const msg = useRef(mensagem);
  useEffect(() => {
    msg.current = mensagem;
  }, [mensagem]);

  useEffect(() => {
    if (!ativo) return;

    const aoFechar = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    // Uma entrada extra no histórico: o voltar do celular cai nela em vez de sair do app.
    if (!temGuarda()) armarGuarda();
    let saindo = false;
    const aoVoltar = async () => {
      if (saindo) return;
      armarGuarda(); // segura um segundo toque no voltar enquanto a pergunta está aberta
      if (await confirmar(msg.current)) {
        saindo = true;
        window.history.go(-2); // sai da guarda e da página
      }
    };

    window.addEventListener("beforeunload", aoFechar);
    window.addEventListener("popstate", aoVoltar);
    return () => {
      window.removeEventListener("beforeunload", aoFechar);
      window.removeEventListener("popstate", aoVoltar);
    };
  }, [ativo, confirmar]);
}
