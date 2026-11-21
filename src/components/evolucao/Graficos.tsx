import type { CSSProperties } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { PontoSemana } from "../../utils/semanas";
import { plural } from "../../utils/plural";
import { Texto } from "../progresso/ui";

// Gráficos da aba Evolução (RN-06.9, RN-06.10). Cada um traz os mesmos dados numa
// tabela escondida para leitor de tela (RN-06.12).

const AZUL = "#2563eb";
const VERDE = "#16a34a";
const LARANJA = "#c2410c";
const ALTURA = 200;
const TAMANHO_INICIAL = { width: 320, height: ALTURA };
const EIXO = { fontSize: 13, fill: "#4b5563" };

const escondido: CSSProperties = {
  position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
  overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0,
};

function TabelaEscondida({ titulo, coluna, linhas }: { titulo: string; coluna: string; linhas: [string, number][] }) {
  return (
    <table style={escondido}>
      <caption>{titulo}</caption>
      <thead>
        <tr><th scope="col">Semana</th><th scope="col">{coluna}</th></tr>
      </thead>
      <tbody>
        {linhas.map(([semana, valor]) => (
          <tr key={semana}><td>{semana}</td><td>{valor}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

const figura: CSSProperties = { margin: 0, position: "relative" };

/** RN-06.9: barras de treinos por semana com linha tracejada na meta. */
export function GraficoTreinos({ semanas, meta }: { semanas: PontoSemana[]; meta: number }) {
  const topo = Math.max(meta, ...semanas.map((s) => s.treinos)) + 1;
  return (
    <figure aria-label="Gráfico de treinos por semana" style={figura}>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={ALTURA} initialDimension={TAMANHO_INICIAL}>
          <BarChart data={semanas} margin={{ top: 20, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={EIXO} tickLine={false} minTickGap={12} />
            <YAxis allowDecimals={false} domain={[0, topo]} tick={EIXO} tickLine={false} axisLine={false} />
            <ReferenceLine y={meta} stroke={LARANJA} strokeWidth={2} strokeDasharray="6 4" />
            <Bar dataKey="treinos" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {semanas.map((s) => (
                <Cell key={s.inicioTs} fill={s.treinos >= meta ? VERDE : AZUL} />
              ))}
              <LabelList dataKey="treinos" position="top" style={{ fontSize: 13, fontWeight: 600, fill: "#374151" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Texto style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden="true" style={{ width: 22, borderTop: `3px dashed ${LARANJA}`, display: "inline-block" }} />
        Meta: {plural(meta, "treino", "treinos")} por semana
      </Texto>
      <TabelaEscondida
        titulo="Treinos por semana"
        coluna="Treinos"
        linhas={semanas.map((s) => [s.label, s.treinos])}
      />
    </figure>
  );
}

/** RN-06.10: área de séries por semana. */
export function GraficoSeries({ semanas }: { semanas: PontoSemana[] }) {
  return (
    <figure aria-label="Gráfico de séries por semana" style={figura}>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={ALTURA} initialDimension={TAMANHO_INICIAL}>
          <AreaChart data={semanas} margin={{ top: 12, right: 8, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="preenchimentoSeries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={AZUL} stopOpacity={0.35} />
                <stop offset="100%" stopColor={AZUL} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={EIXO} tickLine={false} minTickGap={12} />
            <YAxis allowDecimals={false} tick={EIXO} tickLine={false} axisLine={false} />
            <Area
              type="monotone"
              dataKey="series"
              stroke={AZUL}
              strokeWidth={3}
              fill="url(#preenchimentoSeries)"
              dot={{ r: 4, fill: AZUL, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <TabelaEscondida
        titulo="Séries por semana"
        coluna="Séries"
        linhas={semanas.map((s) => [s.label, s.series])}
      />
    </figure>
  );
}
