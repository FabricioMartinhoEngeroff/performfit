import styled from "styled-components";
import { plural } from "../../utils/plural";

// Peças visuais das abas Semana e Evolução — mesmo visual da tela de treino
// (cards brancos, azul #2563eb, verde #16a34a), com texto e alvos de toque grandes.

export const Tela = styled.div`
  width: 100%;
  height: 100%;
  background: #f5f6fa;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
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
  /* RN-06.13: largura fixa — o estilo global de button (width: 100%) esticava as setas. */
  width: 48px;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
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
    color: #6b7280;
    cursor: default;
  }
`;

export function NavPeriodo({
  label,
  titulo,
  rotuloGrupo,
  rotuloAnterior,
  rotuloProximo,
  onAnterior,
  onProximo,
  podeAvancar,
}: {
  label: string;
  /** RN-06.13: "Esta semana" / "Semana passada" acima das datas. */
  titulo?: string;
  rotuloGrupo?: string;
  rotuloAnterior: string;
  rotuloProximo: string;
  onAnterior: () => void;
  onProximo: () => void;
  podeAvancar: boolean;
}) {
  return (
    <div role="group" aria-label={rotuloGrupo} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <SetaBtn type="button" aria-label={rotuloAnterior} onClick={onAnterior}>‹</SetaBtn>
      <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
        {titulo && <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{titulo}</div>}
        <span
          style={{
            display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            fontSize: titulo ? 15 : 17, fontWeight: titulo ? 500 : 600, color: titulo ? "#4b5563" : "#111827",
          }}
        >
          {label}
        </span>
      </div>
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
            <span style={{ fontWeight: 600, color: series > 0 ? "#111827" : "#6b7280" }}>{grupo}</span>
            <span style={{ color: series > 0 ? "#374151" : "#6b7280" }}>{plural(series, "série", "séries")}</span>
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

/** RN-06.11: anel que enche conforme os treinos da semana; cheio e verde ao completar. */
export function AnelProgresso({ feitos, meta, rotulo }: { feitos: number; meta: number; rotulo: string }) {
  const TAM = 132;
  const TRACO = 14;
  const raio = (TAM - TRACO) / 2;
  const circ = 2 * Math.PI * raio;
  const completo = feitos >= meta;
  const fracao = meta > 0 ? Math.min(1, feitos / meta) : 0;
  const cor = completo ? "#16a34a" : "#2563eb";
  return (
    <div
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={meta}
      aria-valuenow={Math.min(feitos, meta)}
      aria-valuetext={`${feitos} de ${plural(meta, "treino", "treinos")}`}
      data-completo={String(completo)}
      style={{ position: "relative", width: TAM, height: TAM, flexShrink: 0 }}
    >
      <svg width={TAM} height={TAM} viewBox={`0 0 ${TAM} ${TAM}`} aria-hidden="true">
        <circle cx={TAM / 2} cy={TAM / 2} r={raio} fill="none" stroke="#e5e7eb" strokeWidth={TRACO} />
        <circle
          cx={TAM / 2}
          cy={TAM / 2}
          r={raio}
          fill="none"
          stroke={cor}
          strokeWidth={TRACO}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - fracao)}
          transform={`rotate(-90 ${TAM / 2} ${TAM / 2})`}
          style={{ transition: "stroke-dashoffset 0.4s" }}
        />
      </svg>
      <div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", lineHeight: 1.1,
        }}
      >
        <span style={{ fontSize: 34, fontWeight: 700, color: completo ? "#16a34a" : "#111827" }}>
          {completo ? "✓" : `${feitos}/${meta}`}
        </span>
        <span style={{ fontSize: 14, color: "#4b5563" }}>treinos</span>
      </div>
    </div>
  );
}
