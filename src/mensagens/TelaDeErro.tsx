// Tela de erro amigável — docs/REGRAS_DE_NEGOCIO.md RN-14. Nunca tela branca.
import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import styled from "styled-components";
import { TriangleAlert } from "lucide-react";
import { baixarBackup } from "../utils/backupPerformfit";
import { TELA_DE_ERRO } from "./catalogo";

interface TelaDeErroProps {
  recarregar?: () => void;
  baixar?: () => ReturnType<typeof baixarBackup>;
}

/** RN-14.2 / RN-14.3: título, texto tranquilizador, Recarregar e Baixar backup. Sem detalhe técnico. */
export function TelaDeErro({
  recarregar = () => window.location.reload(),
  baixar = () => baixarBackup(),
}: TelaDeErroProps) {
  const [aviso, setAviso] = useState<string | null>(null);
  const principal = useRef<HTMLButtonElement>(null);

  useEffect(() => principal.current?.focus(), []);

  return (
    <Fundo>
      <Caixa role="alert">
        <Icone aria-hidden="true">
          <TriangleAlert size={36} strokeWidth={2.2} />
        </Icone>
        <h1>{TELA_DE_ERRO.titulo}</h1>
        <p>{TELA_DE_ERRO.texto}</p>
        <Botao ref={principal} type="button" $principal onClick={recarregar}>
          {TELA_DE_ERRO.recarregar}
        </Botao>
        <Botao
          type="button"
          onClick={() => setAviso(baixar() === "falhou" ? TELA_DE_ERRO.backupFalhou : TELA_DE_ERRO.backupBaixado)}
        >
          {TELA_DE_ERRO.baixarBackup}
        </Botao>
        <Aviso role="status">{aviso}</Aviso>
      </Caixa>
    </Fundo>
  );
}

/** RN-14.1: pega erros de qualquer tela dentro dele e mostra a TelaDeErro. */
export class ErroBoundary extends Component<{ children: ReactNode }, { quebrou: boolean }> {
  state = { quebrou: false };

  static getDerivedStateFromError() {
    return { quebrou: true };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console -- RN-14.2: o erro vai para o console, não para o aluno
    console.error("[PerformFit] Tela quebrou:", erro, info.componentStack);
  }

  render() {
    return this.state.quebrou ? <TelaDeErro /> : this.props.children;
  }
}

/** RN-14.1: errorElement das rotas (o React Router pega o erro antes do ErroBoundary). */
export function ErroDeRota() {
  return <TelaDeErro />;
}

const Fundo = styled.main`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #f5f6fa;
  overflow-y: auto;
`;

const Caixa = styled.div`
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  padding: 28px 20px 20px;
  border-radius: 16px;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  h1 {
    margin: 0 0 10px;
    font-size: 24px;
    font-weight: 700;
    color: #111827;
  }
  p {
    margin: 0 0 22px;
    font-size: 17px;
    line-height: 1.5;
    color: #374151;
  }
`;

const Icone = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 12px;
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
  border: 2px solid #2563eb;
  background: ${({ $principal }) => ($principal ? "#2563eb" : "#ffffff")};
  color: ${({ $principal }) => ($principal ? "#ffffff" : "#2563eb")};
  &:focus-visible {
    outline: 3px solid #f59e0b;
    outline-offset: 2px;
  }
`;

const Aviso = styled.p`
  && {
    min-height: 1.5em;
    margin: 6px 0 0;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
  }
`;
