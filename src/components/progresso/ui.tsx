import styled from "styled-components";
import { plural } from "../../utils/plural";

// Peças visuais das abas Semana e Evolução — mesmo visual da tela de treino
// (cards brancos, azul #2563eb, verde #16a34a), com texto e alvos de toque grandes.

export const Tela = styled.div`
  width: 100%;
  height: 100%;
  background: #f5f6fa;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
`;

export const Topo = styled.div`
  background: #ffffff;
  padding: 14px 16px 12px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
`;

export const Titulo = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

export const Conteudo = styled.div`
  padding: 12px 14px 24px;
`;

export const Cartao = styled.section`
  background: #ffffff;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
`;

export const Rotulo = styled.h2`
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

export const Destaque = styled.p<{ $cor?: string }>`
  font-size: 22px;
  font-weight: 700;
  color: ${(p) => p.$cor ?? "#111827"};
  margin: 0 0 4px;
`;

export const Texto = styled.p`
  font-size: 16px;
  color: #4b5563;
  margin: 4px 0 0;
`;

const SetaBtn = styled.button`
  min-width: 48px;
  min-height: 48px;
  border-radius: 10px;
  border: 1.5px solid #2563eb;
  background: #eff6ff;
  color: #2563eb;
  font-size: 22px;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    border-color: #e5e7eb;
    background: #f9fafb;
    color: #d1d5db;
    cursor: default;
  }
`;

export function NavPeriodo({
  label,
  rotuloAnterior,
  rotuloProximo,
  onAnterior,
  onProximo,
  podeAvancar,
}: {
  label: string;
  rotuloAnterior: string;
  rotuloProximo: string;
  onAnterior: () => void;
  onProximo: () => void;
  podeAvancar: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <SetaBtn type="button" aria-label={rotuloAnterior} onClick={onAnterior}>‹</SetaBtn>
      <span style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: 600, color: "#111827" }}>{label}</span>
      <SetaBtn type="button" aria-label={rotuloProximo} onClick={onProximo} disabled={!podeAvancar}>›</SetaBtn>
    </div>
  );
}

/** Barras horizontais de séries por grupo muscular. */
export function GruposBarras({ grupos }: { grupos: { grupo: string; series: number }[] }) {
  const max = Math.max(1, ...grupos.map((g) => g.series));
  if (grupos.length === 0) return <Texto>Nenhuma série registrada.</Texto>;
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {grupos.map(({ grupo, series }) => (
        <li key={grupo} aria-label={grupo}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: series > 0 ? "#111827" : "#9ca3af" }}>{grupo}</span>
            <span style={{ color: series > 0 ? "#374151" : "#9ca3af" }}>{plural(series, "série", "séries")}</span>
          </div>
          <div style={{ height: 12, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
            <div
              style={{
                width: `${(series / max) * 100}%`,
                height: "100%",
                background: "#2563eb",
                borderRadius: 6,
                transition: "width 0.2s",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
