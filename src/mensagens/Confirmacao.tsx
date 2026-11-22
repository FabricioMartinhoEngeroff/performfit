// Caixa de confirmação do próprio app — docs/REGRAS_DE_NEGOCIO.md RN-13.2.
// Uso em qualquer tela:  const confirmar = useConfirmacao();  if (await confirmar(CONFIRMACOES.x)) …
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import styled from "styled-components";
import { CircleAlert } from "lucide-react";
import type { MensagemConfirmacao } from "./catalogo";

type Confirmar = (mensagem: MensagemConfirmacao) => Promise<boolean>;

const ContextoConfirmacao = createContext<Confirmar | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirmacao(): Confirmar {
  const confirmar = useContext(ContextoConfirmacao);
  if (!confirmar) throw new Error("useConfirmacao precisa do <ConfirmacaoProvider>");
  return confirmar;
}

export function ConfirmacaoProvider({ children }: { children: ReactNode }) {
  const [mensagem, setMensagem] = useState<MensagemConfirmacao | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirmar = useCallback<Confirmar>((m) => {
    resolver.current?.(false); // pergunta anterior sem resposta = ficar
    setMensagem(m);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const responder = useCallback((v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setMensagem(null);
  }, []);

  return (
    <ContextoConfirmacao.Provider value={confirmar}>
      {children}
      {mensagem && <CaixaConfirmacao mensagem={mensagem} onResponder={responder} />}
    </ContextoConfirmacao.Provider>
  );
}

function CaixaConfirmacao({
  mensagem,
  onResponder,
}: {
  mensagem: MensagemConfirmacao;
  onResponder: (v: boolean) => void;
}) {
  const id = useId();
  const seguro = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null;
    seguro.current?.focus();
    return () => antes?.focus?.();
  }, []);

  return (
    <Fundo data-testid="fundo-confirmacao" onClick={() => onResponder(false)}>
      <Caixa
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-titulo`}
        aria-describedby={`${id}-texto`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onResponder(false);
        }}
      >
        <Icone aria-hidden="true">
          <CircleAlert size={32} strokeWidth={2.2} />
        </Icone>
        <h2 id={`${id}-titulo`}>{mensagem.titulo}</h2>
        <p id={`${id}-texto`}>{mensagem.texto}</p>
        <Botao ref={seguro} type="button" $principal onClick={() => onResponder(false)}>
          {mensagem.cancelar}
        </Botao>
        <Botao type="button" onClick={() => onResponder(true)}>
          {mensagem.confirmar}
        </Botao>
      </Caixa>
    </Fundo>
  );
}

const Fundo = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(17, 24, 39, 0.55);
`;

const Caixa = styled.div`
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  padding: 24px 20px 20px;
  border-radius: 16px;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);

  h2 {
    margin: 0 0 8px;
    font-size: 21px;
    font-weight: 700;
    color: #111827;
  }
  p {
    margin: 0 0 20px;
    font-size: 17px;
    line-height: 1.45;
    color: #374151;
  }
`;

const Icone = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 10px;
  border-radius: 50%;
  background: #fef3c7;
  color: #b45309;
`;

const Botao = styled.button<{ $principal?: boolean }>`
  display: block;
  width: 100%;
  max-width: none;
  min-height: 56px;
  margin: 0 0 10px;
  padding: 12px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid ${({ $principal }) => ($principal ? "#2563eb" : "#6b7280")};
  background: ${({ $principal }) => ($principal ? "#2563eb" : "#ffffff")};
  color: ${({ $principal }) => ($principal ? "#ffffff" : "#374151")};
  &:last-child {
    margin-bottom: 0;
  }
  &:focus-visible {
    outline: 3px solid #f59e0b;
    outline-offset: 2px;
  }
`;
